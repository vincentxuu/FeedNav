import { useState, useRef, useCallback } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps'
import { YStack, Text } from 'tamagui'
import { MapPin } from '@tamagui/lucide-icons'

import { MAP_CONFIG } from '@feednav/shared'
import { useNearbyRestaurants } from '@/lib/queries'
import { RestaurantCard } from '@feednav/ui'
import type { Restaurant } from '@feednav/shared'

const { width } = Dimensions.get('window')

export default function MapScreen() {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [region, setRegion] = useState<Region>({
    latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
    longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  })

  const { data } = useNearbyRestaurants(region.latitude, region.longitude)
  const restaurants = data?.data?.restaurants ?? []

  const handleMarkerPress = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }, [])

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion)
  }, [])

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation
          showsMyLocationButton
        >
          {restaurants.map((restaurant) => (
            <Marker
              key={restaurant.id}
              coordinate={{
                latitude: restaurant.latitude ?? 0,
                longitude: restaurant.longitude ?? 0,
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
              >
                <MapPin
                  size={20}
                  color={selectedRestaurant?.id === restaurant.id ? 'white' : '$primary'}
                />
              </YStack>
            </Marker>
          ))}
        </MapView>

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
