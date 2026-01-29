import { useState, useCallback, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { Sheet, YStack, XStack, Text, Separator } from 'tamagui'
import { X, Check } from '@tamagui/lucide-icons'

import { Button, Badge } from '@feednav/ui'
import { useTags } from '@/lib/queries'

export interface FilterState {
  district?: string
  cuisine?: string
  priceRange?: [number, number]
  tags?: string[]
}

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onApply: (filters: FilterState) => void
}

const DISTRICTS = [
  '大安區',
  '信義區',
  '中山區',
  '松山區',
  '中正區',
  '萬華區',
  '大同區',
  '內湖區',
  '南港區',
  '士林區',
  '北投區',
  '文山區',
]

const CUISINES = [
  '台灣料理',
  '日本料理',
  '韓國料理',
  '中式料理',
  '義式料理',
  '美式料理',
  '東南亞料理',
  '港式料理',
  '早午餐',
  '咖啡廳',
  '甜點',
  '火鍋',
  '燒烤',
  '素食',
]

const PRICE_LEVELS = [
  { label: '$', value: 1 },
  { label: '$$', value: 2 },
  { label: '$$$', value: 3 },
  { label: '$$$$', value: 4 },
]

export function FilterSheet({ open, onOpenChange, filters, onApply }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const { data: tagsData } = useTags()

  const tags = useMemo(() => tagsData?.data?.tags ?? [], [tagsData])

  const handleReset = useCallback(() => {
    setLocalFilters({})
  }, [])

  const handleApply = useCallback(() => {
    onApply(localFilters)
    onOpenChange(false)
  }, [localFilters, onApply, onOpenChange])

  const toggleDistrict = useCallback((district: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      district: prev.district === district ? undefined : district,
    }))
  }, [])

  const toggleCuisine = useCallback((cuisine: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      cuisine: prev.cuisine === cuisine ? undefined : cuisine,
    }))
  }, [])

  const togglePriceLevel = useCallback((level: number) => {
    setLocalFilters((prev) => {
      const current = prev.priceRange
      if (!current) {
        return { ...prev, priceRange: [level, level] as [number, number] }
      }
      if (current[0] === level && current[1] === level) {
        return { ...prev, priceRange: undefined }
      }
      return { ...prev, priceRange: [Math.min(current[0], level), Math.max(current[1], level)] as [number, number] }
    })
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setLocalFilters((prev) => {
      const currentTags = prev.tags ?? []
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter((t) => t !== tag) }
      }
      return { ...prev, tags: [...currentTags, tag] }
    })
  }, [])

  const isPriceSelected = useCallback(
    (level: number) => {
      const range = localFilters.priceRange
      if (!range) return false
      return level >= range[0] && level <= range[1]
    },
    [localFilters.priceRange]
  )

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame>
        <Sheet.Handle />

        {/* Header */}
        <XStack
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
            <X size={24} />
          </Button>
          <Text fontSize={18} fontWeight="600">
            篩選條件
          </Text>
          <Button variant="ghost" size="sm" onPress={handleReset}>
            <Text color="$primary">重置</Text>
          </Button>
        </XStack>

        {/* Filters */}
        <ScrollView style={{ flex: 1 }}>
          <YStack padding="$4" gap="$6">
            {/* District */}
            <YStack gap="$3">
              <Text fontSize={16} fontWeight="600" color="$color">
                區域
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {DISTRICTS.map((district) => (
                  <Badge
                    key={district}
                    variant={localFilters.district === district ? 'primary' : 'outline'}
                    size="lg"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => toggleDistrict(district)}
                  >
                    {district}
                  </Badge>
                ))}
              </XStack>
            </YStack>

            <Separator />

            {/* Cuisine */}
            <YStack gap="$3">
              <Text fontSize={16} fontWeight="600" color="$color">
                料理類型
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {CUISINES.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant={localFilters.cuisine === cuisine ? 'primary' : 'outline'}
                    size="lg"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => toggleCuisine(cuisine)}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </XStack>
            </YStack>

            <Separator />

            {/* Price Level */}
            <YStack gap="$3">
              <Text fontSize={16} fontWeight="600" color="$color">
                價位
              </Text>
              <XStack gap="$3">
                {PRICE_LEVELS.map(({ label, value }) => (
                  <Button
                    key={value}
                    flex={1}
                    variant={isPriceSelected(value) ? 'primary' : 'outline'}
                    onPress={() => togglePriceLevel(value)}
                  >
                    {label}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <Separator />

            {/* Tags */}
            {tags.length > 0 && (
              <YStack gap="$3">
                <Text fontSize={16} fontWeight="600" color="$color">
                  標籤
                </Text>
                <XStack flexWrap="wrap" gap="$2">
                  {tags.slice(0, 20).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={localFilters.tags?.includes(tag.name) ? 'primary' : 'outline'}
                      size="lg"
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </XStack>
              </YStack>
            )}
          </YStack>
        </ScrollView>

        {/* Apply Button */}
        <YStack padding="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <Button variant="primary" fullWidth onPress={handleApply}>
            <Check size={20} />
            <Text color="white" fontWeight="600">
              套用篩選
            </Text>
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
