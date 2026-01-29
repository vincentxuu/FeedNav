import { useState, useEffect, useCallback } from 'react'
import { ScrollView, Linking, Dimensions, Share, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { YStack, XStack, Text, Image, Separator, Spinner } from 'tamagui'
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Heart,
  Navigation,
  Share2,
  Check,
  CheckCircle,
} from '@tamagui/lucide-icons'

import { Button, Badge } from '@feednav/ui'
import {
  useRestaurant,
  useAddFavorite,
  useRemoveFavorite,
  useAddVisit,
  useRemoveVisit,
} from '@/lib/queries'
import { useAuth } from '@/lib/auth-context'

const { width } = Dimensions.get('window')

// Semantic color constants
const COLORS = {
  HEART_RED: '#ef4444',
  STAR_GOLD: '#fbbf24',
} as const

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, refetch } = useRestaurant(id)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const addVisit = useAddVisit()
  const removeVisit = useRemoveVisit()

  const restaurant = data?.data

  const [isFavorited, setIsFavorited] = useState(false)
  const [isVisited, setIsVisited] = useState(false)

  // Sync state with restaurant data
  useEffect(() => {
    if (restaurant) {
      setIsFavorited(restaurant.is_favorited ?? false)
      setIsVisited(restaurant.is_visited ?? false)
    }
  }, [restaurant])

  const isFavoriteLoading = addFavorite.isPending || removeFavorite.isPending

  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!restaurant) return

    try {
      const restaurantId = parseInt(restaurant.id, 10)
      if (isFavorited) {
        await removeFavorite.mutateAsync(restaurantId)
        setIsFavorited(false)
      } else {
        await addFavorite.mutateAsync(restaurantId)
        setIsFavorited(true)
      }
    } catch {
      Alert.alert('錯誤', '操作失敗，請稍後再試')
    }
  }, [isAuthenticated, restaurant, isFavorited, router, addFavorite, removeFavorite])

  const isVisitLoading = addVisit.isPending || removeVisit.isPending

  const handleToggleVisit = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!restaurant) return

    try {
      const restaurantId = parseInt(restaurant.id, 10)
      if (isVisited) {
        await removeVisit.mutateAsync(restaurantId)
        setIsVisited(false)
      } else {
        await addVisit.mutateAsync(restaurantId)
        setIsVisited(true)
      }
    } catch {
      Alert.alert('錯誤', '操作失敗，請稍後再試')
    }
  }, [isAuthenticated, restaurant, isVisited, router, addVisit, removeVisit])

  const handleNavigate = useCallback(() => {
    if (restaurant?.latitude && restaurant?.longitude) {
      const url = `https://maps.google.com/?daddr=${restaurant.latitude},${restaurant.longitude}`
      Linking.openURL(url)
    }
  }, [restaurant])

  const handleCall = useCallback(() => {
    if (restaurant?.phone) {
      Linking.openURL(`tel:${restaurant.phone}`)
    }
  }, [restaurant])

  const handleWebsite = useCallback(() => {
    if (restaurant?.website) {
      Linking.openURL(restaurant.website)
    }
  }, [restaurant])

  const handleShare = useCallback(async () => {
    if (!restaurant) return

    try {
      await Share.share({
        title: restaurant.name,
        message: `來看看這間餐廳：${restaurant.name}\n${restaurant.address || ''}\nhttps://feednav.cc/restaurant/${restaurant.id}`,
      })
    } catch {
      // User cancelled or error occurred
    }
  }, [restaurant])

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Spinner size="large" color="$primary" />
          <Text color="$textMuted">載入中...</Text>
        </YStack>
      </SafeAreaView>
    )
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6">
          <Text fontSize={18} fontWeight="600" color="$color">
            找不到餐廳
          </Text>
          <Text color="$textMuted" textAlign="center">
            此餐廳可能已被移除或不存在
          </Text>
          <Button variant="primary" onPress={() => router.back()}>
            返回
          </Button>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <XStack
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={10}
        >
          <Button
            variant="ghost"
            size="sm"
            backgroundColor="$background"
            borderRadius="$full"
            onPress={() => router.back()}
            shadowColor="black"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={0.1}
            shadowRadius={2}
          >
            <ArrowLeft size={24} />
          </Button>
          <XStack gap="$2">
            <Button
              variant="ghost"
              size="sm"
              backgroundColor="$background"
              borderRadius="$full"
              onPress={handleToggleFavorite}
              disabled={isFavoriteLoading}
              shadowColor="black"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
            >
              {isFavoriteLoading ? (
                <Spinner size="small" color="$primary" />
              ) : (
                <Heart
                  size={24}
                  color={isFavorited ? COLORS.HEART_RED : '$color'}
                  fill={isFavorited ? COLORS.HEART_RED : 'transparent'}
                />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              backgroundColor="$background"
              borderRadius="$full"
              onPress={handleShare}
              shadowColor="black"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
            >
              <Share2 size={24} />
            </Button>
          </XStack>
        </XStack>

        <ScrollView>
          {/* Image */}
          {restaurant.image_url ? (
            <Image
              source={{ uri: restaurant.image_url }}
              width={width}
              height={250}
              objectFit="cover"
            />
          ) : (
            <YStack
              width={width}
              height={250}
              backgroundColor="$backgroundPress"
              alignItems="center"
              justifyContent="center"
            >
              <MapPin size={48} color="$textMuted" />
            </YStack>
          )}

          <YStack padding="$4" gap="$4">
            {/* Title & Rating */}
            <YStack gap="$2">
              <XStack alignItems="center" gap="$2">
                <Text fontSize={24} fontWeight="700" color="$color" flex={1}>
                  {restaurant.name}
                </Text>
                {isVisited && (
                  <XStack
                    backgroundColor="$success"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$full"
                    alignItems="center"
                    gap="$1"
                  >
                    <CheckCircle size={14} color="white" />
                    <Text fontSize={12} color="white" fontWeight="600">
                      已訪
                    </Text>
                  </XStack>
                )}
              </XStack>
              <XStack alignItems="center" gap="$3" flexWrap="wrap">
                <XStack alignItems="center" gap="$1">
                  <Star size={18} color={COLORS.STAR_GOLD} fill={COLORS.STAR_GOLD} />
                  <Text fontSize={16} fontWeight="600" color="$color">
                    {restaurant.rating?.toFixed(1) || 'N/A'}
                  </Text>
                </XStack>
                <Text color="$textMuted">·</Text>
                <Text color="$textSecondary">{restaurant.cuisine}</Text>
                <Text color="$textMuted">·</Text>
                <Text color="$textSecondary">
                  {'$'.repeat(restaurant.price_level || 1)}
                </Text>
                {restaurant.district && (
                  <>
                    <Text color="$textMuted">·</Text>
                    <Text color="$textSecondary">{restaurant.district}</Text>
                  </>
                )}
              </XStack>
            </YStack>

            {/* Tags */}
            {restaurant.tags && restaurant.tags.length > 0 && (
              <XStack gap="$2" flexWrap="wrap">
                {restaurant.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="md">
                    {tag}
                  </Badge>
                ))}
              </XStack>
            )}

            {/* Action Buttons */}
            <XStack gap="$3">
              <Button flex={1} variant="primary" onPress={handleNavigate}>
                <Navigation size={18} color="white" />
                <Text color="white" fontWeight="600">
                  導航
                </Text>
              </Button>
              <Button
                flex={1}
                variant={isVisited ? 'secondary' : 'outline'}
                onPress={handleToggleVisit}
                disabled={isVisitLoading}
              >
                {isVisitLoading ? (
                  <Spinner size="small" color="$primary" />
                ) : isVisited ? (
                  <>
                    <Check size={18} color="white" />
                    <Text color="white" fontWeight="600">
                      已訪
                    </Text>
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    <Text fontWeight="600">標記已訪</Text>
                  </>
                )}
              </Button>
            </XStack>

            <Separator />

            {/* Details */}
            <YStack gap="$3">
              {restaurant.address && (
                <XStack
                  alignItems="flex-start"
                  gap="$3"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={handleNavigate}
                >
                  <MapPin size={20} color="$textMuted" />
                  <Text flex={1} color="$primary">
                    {restaurant.address}
                  </Text>
                </XStack>
              )}

              {restaurant.phone && (
                <XStack
                  alignItems="center"
                  gap="$3"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={handleCall}
                >
                  <Phone size={20} color="$textMuted" />
                  <Text color="$primary">{restaurant.phone}</Text>
                </XStack>
              )}

              {restaurant.website && (
                <XStack
                  alignItems="center"
                  gap="$3"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={handleWebsite}
                >
                  <Globe size={20} color="$textMuted" />
                  <Text color="$primary" numberOfLines={1} flex={1}>
                    {restaurant.website}
                  </Text>
                </XStack>
              )}

              {restaurant.opening_hours && (
                <XStack alignItems="flex-start" gap="$3">
                  <Clock size={20} color="$textMuted" />
                  <YStack flex={1}>
                    <Text color="$color">{restaurant.opening_hours}</Text>
                    {restaurant.is_open_now !== undefined && (
                      <Text
                        color={restaurant.is_open_now ? '$success' : '$error'}
                        fontWeight="600"
                        marginTop="$1"
                      >
                        {restaurant.is_open_now ? '營業中' : '已打烊'}
                      </Text>
                    )}
                  </YStack>
                </XStack>
              )}
            </YStack>

            {/* Description */}
            {restaurant.description && (
              <>
                <Separator />
                <YStack gap="$2">
                  <Text fontSize={16} fontWeight="600" color="$color">
                    關於
                  </Text>
                  <Text color="$textSecondary" lineHeight={22}>
                    {restaurant.description}
                  </Text>
                </YStack>
              </>
            )}

            {/* Bottom Spacing */}
            <YStack height={20} />
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}
