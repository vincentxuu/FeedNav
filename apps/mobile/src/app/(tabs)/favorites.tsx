import { FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, Text } from 'tamagui'
import { Heart } from '@tamagui/lucide-icons'

import { RestaurantCard, Button } from '@feednav/ui'
import { useFavorites } from '@/lib/queries'
import { useAuth } from '@/lib/auth-context'

export default function FavoritesScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, refetch, isRefetching } = useFavorites()

  const favorites = data?.data?.items ?? []

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$4">
          <Heart size={64} color="$textMuted" />
          <Text fontSize={18} fontWeight="600" color="$color" textAlign="center">
            登入以查看收藏
          </Text>
          <Text color="$textMuted" textAlign="center">
            登入後即可收藏喜愛的餐廳
          </Text>
          <Button
            variant="primary"
            onPress={() => router.push('/auth/login')}
          >
            前往登入
          </Button>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4">
          <Text fontSize={28} fontWeight="700" color="$color">
            我的收藏
          </Text>
        </YStack>

        {/* Favorites List */}
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$8" gap="$3">
              <Heart size={48} color="$textMuted" />
              <Text color="$textMuted" textAlign="center">
                {isLoading ? '載入中...' : '還沒有收藏任何餐廳'}
              </Text>
            </YStack>
          }
        />
      </YStack>
    </SafeAreaView>
  )
}
