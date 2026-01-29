import { useState } from 'react'
import { ScrollView, Linking, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { YStack, XStack, Text, Image, Separator } from 'tamagui'
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
} from '@tamagui/lucide-icons'

import { Button, Badge, Card } from '@feednav/ui'
import { useRestaurant, useAddFavorite, useRemoveFavorite, useAddVisit } from '@/lib/queries'
import { useAuth } from '@/lib/auth-context'

const { width } = Dimensions.get('window')

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data, isLoading } = useRestaurant(id)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const addVisit = useAddVisit()

  const restaurant = data?.data

  const [isFavorited, setIsFavorited] = useState(restaurant?.is_favorited ?? false)

  if (isLoading || !restaurant) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color="$textMuted">載入中...</Text>
        </YStack>
      </SafeAreaView>
    )
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const restaurantId = parseInt(restaurant.id, 10)
    if (isFavorited) {
      await removeFavorite.mutateAsync(restaurantId)
    } else {
      await addFavorite.mutateAsync(restaurantId)
    }
    setIsFavorited(!isFavorited)
  }

  const handleMarkVisited = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    await addVisit.mutateAsync(parseInt(restaurant.id, 10))
  }

  const handleNavigate = () => {
    if (restaurant.latitude && restaurant.longitude) {
      const url = `https://maps.google.com/?daddr=${restaurant.latitude},${restaurant.longitude}`
      Linking.openURL(url)
    }
  }

  const handleCall = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`)
    }
  }

  const handleWebsite = () => {
    if (restaurant.website) {
      Linking.openURL(restaurant.website)
    }
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
            >
              <Heart
                size={24}
                color={isFavorited ? '$error' : '$color'}
                fill={isFavorited ? '$error' : 'transparent'}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              backgroundColor="$background"
              borderRadius="$full"
            >
              <Share2 size={24} />
            </Button>
          </XStack>
        </XStack>

        <ScrollView>
          {/* Image */}
          {restaurant.image_url && (
            <Image
              source={{ uri: restaurant.image_url }}
              width={width}
              height={250}
              objectFit="cover"
            />
          )}

          <YStack padding="$4" gap="$4">
            {/* Title & Rating */}
            <YStack gap="$2">
              <Text fontSize={24} fontWeight="700" color="$color">
                {restaurant.name}
              </Text>
              <XStack alignItems="center" gap="$3">
                <XStack alignItems="center" gap="$1">
                  <Star size={18} color="$rating" fill="$rating" />
                  <Text fontSize={16} fontWeight="600">
                    {restaurant.rating?.toFixed(1) || 'N/A'}
                  </Text>
                </XStack>
                <Text color="$textMuted">·</Text>
                <Text color="$textSecondary">{restaurant.cuisine}</Text>
                <Text color="$textMuted">·</Text>
                <Text color="$textSecondary">
                  {'$'.repeat(restaurant.price_level || 1)}
                </Text>
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
                <Navigation size={18} />
                <Text color="white">導航</Text>
              </Button>
              <Button flex={1} variant="outline" onPress={handleMarkVisited}>
                <MapPin size={18} />
                <Text>標記已訪</Text>
              </Button>
            </XStack>

            <Separator />

            {/* Details */}
            <YStack gap="$3">
              {restaurant.address && (
                <XStack alignItems="flex-start" gap="$3">
                  <MapPin size={20} color="$textMuted" />
                  <Text flex={1} color="$color">
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
                  <Text color="$primary" numberOfLines={1}>
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
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}
