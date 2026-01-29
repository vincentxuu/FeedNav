import { useState } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Input } from 'tamagui'
import { Search, Filter } from '@tamagui/lucide-icons'

import { RestaurantCard, Button } from '@feednav/ui'
import { useRestaurants } from '@/lib/queries'

export default function HomeScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, refetch, isRefetching } = useRestaurants({ searchTerm })

  const restaurants = data?.data?.restaurants ?? []

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4" gap="$3">
          <Text fontSize={28} fontWeight="700" color="$color">
            探索美食
          </Text>
          <XStack gap="$2">
            <XStack
              flex={1}
              backgroundColor="$backgroundPress"
              borderRadius="$4"
              paddingHorizontal="$3"
              alignItems="center"
              gap="$2"
            >
              <Search size={20} color="$textMuted" />
              <Input
                flex={1}
                placeholder="搜尋餐廳..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                borderWidth={0}
                backgroundColor="transparent"
                placeholderTextColor="$textMuted"
              />
            </XStack>
            <Button variant="outline" size="md">
              <Filter size={20} />
            </Button>
          </XStack>
        </YStack>

        {/* Restaurant List */}
        <FlatList
          data={restaurants}
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
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
              <Text color="$textMuted">
                {isLoading ? '載入中...' : '沒有找到餐廳'}
              </Text>
            </YStack>
          }
        />
      </YStack>
    </SafeAreaView>
  )
}
