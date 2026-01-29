import { FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Separator } from 'tamagui'
import { ArrowLeft, MapPin, TrendingUp } from '@tamagui/lucide-icons'

import { RestaurantCard, Button, Card } from '@feednav/ui'
import { useVisits, useVisitStats } from '@/lib/queries'
import { useAuth } from '@/lib/auth-context'

export default function VisitsScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data, isLoading, refetch, isRefetching } = useVisits()
  const { data: statsData } = useVisitStats()

  const visits = data?.data?.items ?? []
  const stats = statsData?.data?.stats

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$4">
          <MapPin size={64} color="$textMuted" />
          <Text fontSize={18} fontWeight="600" color="$color" textAlign="center">
            登入以查看造訪紀錄
          </Text>
          <Text color="$textMuted" textAlign="center">
            追蹤你的美食足跡
          </Text>
          <Button variant="primary" onPress={() => router.push('/auth/login')}>
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
        <XStack padding="$4" alignItems="center" gap="$3">
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </Button>
          <Text fontSize={20} fontWeight="700" color="$color" flex={1}>
            造訪紀錄
          </Text>
        </XStack>

        {/* Stats Card */}
        {stats && (
          <YStack paddingHorizontal="$4" paddingBottom="$4">
            <Card elevated padding="md">
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2">
                  <TrendingUp size={20} color="$primary" />
                  <Text fontSize={16} fontWeight="600" color="$color">
                    美食統計
                  </Text>
                </XStack>
                <Separator />
                <XStack justifyContent="space-around">
                  <YStack alignItems="center">
                    <Text fontSize={24} fontWeight="700" color="$primary">
                      {stats.total_visited}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      總造訪
                    </Text>
                  </YStack>
                  <YStack alignItems="center">
                    <Text fontSize={24} fontWeight="700" color="$primary">
                      {stats.districts_visited}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      探索區域
                    </Text>
                  </YStack>
                  <YStack alignItems="center">
                    <Text fontSize={24} fontWeight="700" color="$primary">
                      {stats.cuisines_tried}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      料理類型
                    </Text>
                  </YStack>
                  <YStack alignItems="center">
                    <Text fontSize={24} fontWeight="700" color="$primary">
                      {stats.avg_rating.toFixed(1)}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      平均評分
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
          </YStack>
        )}

        {/* Visits List */}
        <FlatList
          data={visits}
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
              <MapPin size={48} color="$textMuted" />
              <Text color="$textMuted" textAlign="center">
                {isLoading ? '載入中...' : '還沒有造訪紀錄'}
              </Text>
              <Text fontSize={14} color="$textMuted" textAlign="center">
                探索餐廳後，標記為已訪即可記錄
              </Text>
            </YStack>
          }
        />
      </YStack>
    </SafeAreaView>
  )
}
