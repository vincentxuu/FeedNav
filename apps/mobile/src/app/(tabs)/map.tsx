import { useState, useRef, useCallback, useEffect } from 'react'
import { StyleSheet, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps'
import { YStack, XStack, Text, Spinner } from 'tamagui'
import { MapPin, Navigation, RefreshCw } from '@tamagui/lucide-icons'

import { MAP_CONFIG } from '@feednav/shared'
import { useNearbyRestaurants } from '@/lib/queries'
import { useLocation } from '@/lib/useLocation'
import { RestaurantCard, Button } from '@feednav/ui'
import type { Restaurant } from '@feednav/shared'
import { SEMANTIC_COLORS } from '@/lib/constants'

const { width } = Dimensions.get('window')

export default function MapScreen() {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const {
    location,
    isLoading: isLocationLoading,
    hasPermission,
    requestPermission,
    refreshLocation,
  } = useLocation()

  const [region, setRegion] = useState<Region>({
    latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
    longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  })

  // Update region when location changes
  useEffect(() => {
    if (location) {
      setRegion((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }))
    }
  }, [location])

  const { data, isLoading: isRestaurantsLoading, refetch } = useNearbyRestaurants(
    region.latitude,
    region.longitude
  )
  const restaurants = data?.data?.restaurants ?? []

  const handleMarkerPress = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }, [])

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion)
  }, [])

  const centerOnUser = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert(
          '需要位置權限',
          '請在設定中開啟位置權限以使用此功能',
          [{ text: '確定' }]
        )
        return
      }
    }

    await refreshLocation()

    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    }
  }, [hasPermission, requestPermission, refreshLocation, location])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  if (isLocationLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Spinner size="large" color="$primary" />
          <Text color="$textMuted">取得位置中...</Text>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation={hasPermission ?? false}
          showsMyLocationButton={false}
        >
          {restaurants.map((restaurant) => {
            if (!restaurant.latitude || !restaurant.longitude) return null
            return (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                }}
                onPress={() => handleMarkerPress(restaurant)}
              >
                <YStack
                  backgroundColor={
                    selectedRestaurant?.id === restaurant.id ? '$primary' : '$surface'
                  }
                  padding="$2"
                  borderRadius="$full"
                  borderWidth={2}
                  borderColor="$primary"
                  shadowColor="black"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.2}
                  shadowRadius={4}
                >
                  <MapPin
                    size={20}
                    color={selectedRestaurant?.id === restaurant.id ? 'white' : SEMANTIC_COLORS.PRIMARY_ORANGE}
                  />
                </YStack>
              </Marker>
            )
          })}
        </MapView>

        {/* Loading Indicator */}
        {isRestaurantsLoading && (
          <YStack
            position="absolute"
            top={60}
            left={0}
            right={0}
            alignItems="center"
          >
            <XStack
              backgroundColor="$surface"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius="$full"
              alignItems="center"
              gap="$2"
              shadowColor="black"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
            >
              <Spinner size="small" color="$primary" />
              <Text fontSize={14} color="$textMuted">
                搜尋附近餐廳...
              </Text>
            </XStack>
          </YStack>
        )}

        {/* Map Controls */}
        <YStack
          position="absolute"
          right={16}
          top={60}
          gap="$2"
        >
          <Button
            variant="outline"
            size="md"
            backgroundColor="$surface"
            borderRadius="$full"
            width={48}
            height={48}
            onPress={centerOnUser}
            shadowColor="black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={4}
          >
            <Navigation size={20} color="$primary" />
          </Button>
          <Button
            variant="outline"
            size="md"
            backgroundColor="$surface"
            borderRadius="$full"
            width={48}
            height={48}
            onPress={handleRefresh}
            shadowColor="black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={4}
          >
            <RefreshCw size={20} color="$primary" />
          </Button>
        </YStack>

        {/* Restaurant Count */}
        <YStack
          position="absolute"
          left={16}
          top={60}
        >
          <XStack
            backgroundColor="$surface"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$full"
            alignItems="center"
            gap="$2"
            shadowColor="black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={4}
          >
            <MapPin size={16} color="$primary" />
            <Text fontSize={14} fontWeight="600" color="$color">
              {restaurants.length} 間餐廳
            </Text>
          </XStack>
        </YStack>

        {/* Selected Restaurant Card */}
        {selectedRestaurant && (
          <YStack
            position="absolute"
            bottom={20}
            left={16}
            right={16}
          >
            <RestaurantCard
              restaurant={selectedRestaurant}
              variant="compact"
              onPress={() => router.push(`/restaurant/${selectedRestaurant.id}`)}
            />
          </YStack>
        )}
      </YStack>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
})
