import { useState, useCallback, useMemo, memo } from 'react'
import { FlatList, RefreshControl, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text } from 'tamagui'
import { Search, Filter, X, Dice5 } from '@tamagui/lucide-icons'

import { RestaurantCard, Button, Badge, Input } from '@/ui'
import { useRestaurants } from '@/lib/queries'
import { FilterSheet, type FilterState } from '@/components/FilterSheet'
import { RandomPicker } from '@/components/RandomPicker'
import type { Restaurant } from '@feednav/shared'

// Memoized restaurant list item for better FlatList performance
const RestaurantListItem = memo(function RestaurantListItem({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant
  onPress: () => void
}) {
  return <RestaurantCard restaurant={restaurant} onPress={onPress} />
})

export default function HomeScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showRandomPicker, setShowRandomPicker] = useState(false)

  const queryFilters = useMemo(
    () => ({
      searchTerm,
      district: filters.district,
      cuisine: filters.cuisine,
      priceRange: filters.priceRange,
      tags: filters.tags,
    }),
    [searchTerm, filters]
  )

  const { data, isLoading, refetch, isRefetching } = useRestaurants(queryFilters)
  const restaurants = data?.data?.restaurants ?? []

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.district) count++
    if (filters.cuisine) count++
    if (filters.priceRange) count++
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length
    return count
  }, [filters])

  const handleApplyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const clearFilter = useCallback((key: keyof FilterState, value?: string) => {
    setFilters((prev) => {
      if (key === 'tags' && value) {
        return {
          ...prev,
          tags: prev.tags?.filter((t) => t !== value),
        }
      }
      return {
        ...prev,
        [key]: undefined,
      }
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
  }, [])

  const renderRestaurantItem = useCallback(
    ({ item }: { item: Restaurant }) => (
      <RestaurantListItem
        restaurant={item}
        onPress={() => router.push(`/restaurant/${item.id}`)}
      />
    ),
    [router]
  )

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4" gap="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={28} fontWeight="700" color="$color">
              探索美食
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowRandomPicker(true)}
              borderRadius="$full"
            >
              <Dice5 size={20} color="$primary" />
            </Button>
          </XStack>
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
              {searchTerm && (
                <Button variant="ghost" size="sm" onPress={() => setSearchTerm('')}>
                  <X size={16} color="$textMuted" />
                </Button>
              )}
            </XStack>
            <Button
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
              size="md"
              onPress={() => setShowFilters(true)}
            >
              <Filter size={20} />
              {activeFilterCount > 0 && (
                <Text color="white" fontSize={12} fontWeight="600">
                  {activeFilterCount}
                </Text>
              )}
            </Button>
          </XStack>

          {/* Active Filters - 橫向滾動 */}
          {activeFilterCount > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <XStack gap="$2">
                {filters.district && (
                  <Badge
                    variant="primary"
                    size="md"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => clearFilter('district')}
                  >
                    {filters.district} <X size={12} />
                  </Badge>
                )}
                {filters.cuisine && (
                  <Badge
                    variant="primary"
                    size="md"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => clearFilter('cuisine')}
                  >
                    {filters.cuisine} <X size={12} />
                  </Badge>
                )}
                {filters.priceRange && (
                  <Badge
                    variant="primary"
                    size="md"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => clearFilter('priceRange')}
                  >
                    {'$'.repeat(filters.priceRange[0])}-{'$'.repeat(filters.priceRange[1])}{' '}
                    <X size={12} />
                  </Badge>
                )}
                {filters.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="primary"
                    size="md"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => clearFilter('tags', tag)}
                  >
                    {tag} <X size={12} />
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  size="md"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={clearAllFilters}
                >
                  清除全部
                </Badge>
              </XStack>
            </ScrollView>
          )}
        </YStack>

        {/* Restaurant List */}
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={renderRestaurantItem}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
              <Text color="$textMuted">
                {isLoading ? '載入中...' : '沒有找到餐廳'}
              </Text>
            </YStack>
          }
        />
      </YStack>

      {/* Filter Sheet */}
      <FilterSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Random Picker */}
      <RandomPicker
        open={showRandomPicker}
        onOpenChange={setShowRandomPicker}
      />
    </SafeAreaView>
  )
}
