import { useState, useCallback, useEffect } from 'react'
import { FlatList, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Spinner, Separator } from 'tamagui'
import { MapPin, Navigation, RefreshCw, ChevronRight } from '@tamagui/lucide-icons'

import { RestaurantCard, Button, Card } from '@/ui'
import { useNearbyRestaurants } from '@/lib/queries'
import { useLocation } from '@/lib/useLocation'

export default function NearbyScreen() {
  const router = useRouter()
  const {
    location,
    isLoading: isLocationLoading,
    hasPermission,
    requestPermission,
    refreshLocation,
    error: locationError,
  } = useLocation()

  const [radius, setRadius] = useState(2) // km

  const {
    data,
    isLoading: isRestaurantsLoading,
    refetch,
    isRefetching,
  } = useNearbyRestaurants(
    location?.latitude ?? 0,
    location?.longitude ?? 0,
    radius,
    20
  )

  const restaurants = data?.data?.restaurants ?? []
  const isLoading = isLocationLoading || isRestaurantsLoading

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission()
    if (!granted) {
      Alert.alert(
        '需要位置權限',
        '請在設定中開啟位置權限以使用附近搜尋功能',
        [{ text: '確定' }]
      )
    }
  }, [requestPermission])

  const handleRefresh = useCallback(async () => {
    await refreshLocation()
    refetch()
  }, [refreshLocation, refetch])

  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius)
  }, [])

  // Show permission request if not granted
  if (hasPermission === false) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} backgroundColor="$background" padding="$6">
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
            <YStack
              width={100}
              height={100}
              borderRadius={50}
              backgroundColor="$backgroundPress"
              alignItems="center"
              justifyContent="center"
            >
              <MapPin size={48} color="$textMuted" />
            </YStack>
            <Text fontSize={20} fontWeight="600" color="$color" textAlign="center">
              開啟位置權限
            </Text>
            <Text color="$textMuted" textAlign="center" lineHeight={22}>
              我們需要您的位置來搜尋附近的餐廳。您的位置資料不會被儲存或分享。
            </Text>
            <Button variant="primary" onPress={handleRequestPermission}>
              <Navigation size={18} color="white" />
              <Text color="white" fontWeight="600">
                開啟位置權限
              </Text>
            </Button>
          </YStack>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4" gap="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={28} fontWeight="700" color="$color">
              附近餐廳
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="$primary" />
              ) : (
                <RefreshCw size={20} color="$primary" />
              )}
            </Button>
          </XStack>

          {/* Location Info */}
          {location && (
            <Card padding="sm">
              <XStack alignItems="center" gap="$3">
                <YStack
                  width={40}
                  height={40}
                  borderRadius={20}
                  backgroundColor="$primary"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Navigation size={20} color="white" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={14} color="$textMuted">
                    目前位置
                  </Text>
                  <Text fontSize={12} color="$textSecondary">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </YStack>
                <Text fontSize={14} fontWeight="600" color="$primary">
                  {restaurants.length} 間餐廳
                </Text>
              </XStack>
            </Card>
          )}

          {/* Radius Selector */}
          <YStack gap="$2">
            <Text fontSize={14} color="$textMuted">
              搜尋範圍
            </Text>
            <XStack gap="$2">
              {[1, 2, 5, 10].map((r) => (
                <Button
                  key={r}
                  flex={1}
                  size="sm"
                  variant={radius === r ? 'primary' : 'outline'}
                  onPress={() => handleRadiusChange(r)}
                >
                  <Text
                    color={radius === r ? 'white' : '$color'}
                    fontWeight="600"
                  >
                    {r} km
                  </Text>
                </Button>
              ))}
            </XStack>
          </YStack>
        </YStack>

        <Separator />

        {/* Restaurant List */}
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              showDistance
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$8" gap="$3">
              {isLoading ? (
                <>
                  <Spinner size="large" color="$primary" />
                  <Text color="$textMuted">搜尋附近餐廳中...</Text>
                </>
              ) : (
                <>
                  <MapPin size={48} color="$textMuted" />
                  <Text color="$textMuted" textAlign="center">
                    附近沒有找到餐廳
                  </Text>
                  <Text fontSize={14} color="$textMuted" textAlign="center">
                    試著擴大搜尋範圍
                  </Text>
                </>
              )}
            </YStack>
          }
        />
      </YStack>
    </SafeAreaView>
  )
}
