import { styled, XStack, YStack, Text, Image, GetProps } from 'tamagui'
import { Star, MapPin } from '@tamagui/lucide-icons'
import type { Restaurant } from '@feednav/shared'

const CardContainer = styled(YStack, {
  name: 'RestaurantCard',
  backgroundColor: '$surface',
  borderRadius: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$surfaceHover',
    borderColor: '$borderColorHover',
  },

  pressStyle: {
    scale: 0.98,
    backgroundColor: '$surfacePress',
  },

  variants: {
    variant: {
      default: {},
      compact: {
        flexDirection: 'row',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

const RestaurantImage = styled(Image, {
  name: 'RestaurantImage',
  width: '100%',
  height: 160,
  objectFit: 'cover',

  variants: {
    variant: {
      default: {
        width: '100%',
        height: 160,
      },
      compact: {
        width: 100,
        height: 100,
        borderRadius: '$3',
      },
    },
  } as const,
})

interface RestaurantCardProps {
  restaurant: Restaurant
  onPress?: () => void
  variant?: 'default' | 'compact'
}

export function RestaurantCard({
  restaurant,
  onPress,
  variant = 'default',
}: RestaurantCardProps) {
  const content = (
    <>
      {restaurant.image_url && (
        <RestaurantImage
          source={{ uri: restaurant.image_url }}
          variant={variant}
          alt={restaurant.name}
        />
      )}
      <YStack padding="$3" gap="$2" flex={1}>
        <Text fontSize={16} fontWeight="600" color="$color" numberOfLines={1}>
          {restaurant.name}
        </Text>

        <XStack alignItems="center" gap="$2">
          <XStack alignItems="center" gap="$1">
            <Star size={14} color="$rating" fill="$rating" />
            <Text fontSize={14} color="$textSecondary">
              {restaurant.rating?.toFixed(1) || 'N/A'}
            </Text>
          </XStack>
          <Text fontSize={14} color="$textMuted">
            ·
          </Text>
          <Text fontSize={14} color="$textSecondary">
            {restaurant.cuisine}
          </Text>
          <Text fontSize={14} color="$textMuted">
            ·
          </Text>
          <Text fontSize={14} color="$textSecondary">
            {'$'.repeat(restaurant.price_level || 1)}
          </Text>
        </XStack>

        {restaurant.address && (
          <XStack alignItems="center" gap="$1.5">
            <MapPin size={14} color="$textMuted" />
            <Text fontSize={12} color="$textMuted" numberOfLines={1} flex={1}>
              {restaurant.address}
            </Text>
          </XStack>
        )}

        {restaurant.tags && restaurant.tags.length > 0 && (
          <XStack gap="$1.5" flexWrap="wrap">
            {restaurant.tags.slice(0, 3).map((tag) => (
              <Text
                key={tag}
                fontSize={11}
                color="$primary"
                backgroundColor="$primaryLight"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                {tag}
              </Text>
            ))}
          </XStack>
        )}
      </YStack>
    </>
  )

  if (variant === 'compact') {
    return (
      <CardContainer
        variant="compact"
        onPress={onPress}
        flexDirection="row"
        padding="$3"
        gap="$3"
      >
        {content}
      </CardContainer>
    )
  }

  return (
    <CardContainer variant="default" onPress={onPress}>
      {content}
    </CardContainer>
  )
}

export type RestaurantCardProps = GetProps<typeof CardContainer> & {
  restaurant: Restaurant
  onPress?: () => void
}
