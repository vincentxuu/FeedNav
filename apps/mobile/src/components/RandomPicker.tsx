import { useState, useCallback, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { Sheet, YStack, XStack, Text, Spinner } from 'tamagui'
import { Dice5, RefreshCw, Navigation } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

import { Button } from '@feednav/ui'
import { useRestaurants } from '@/lib/queries'
import type { Restaurant } from '@feednav/shared'

interface RandomPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RandomPicker({ open, onOpenChange }: RandomPickerProps) {
  const router = useRouter()
  const { data } = useRestaurants({ limit: 100 })
  const restaurants = data?.data?.restaurants ?? []

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  const spinAnimation = useRef(new Animated.Value(0)).current

  const spin = useCallback(() => {
    if (restaurants.length === 0) return

    setIsSpinning(true)
    setSelectedRestaurant(null)

    // Reset and start spin animation
    spinAnimation.setValue(0)
    Animated.timing(spinAnimation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Pick random restaurant
      const randomIndex = Math.floor(Math.random() * restaurants.length)
      setSelectedRestaurant(restaurants[randomIndex])
      setIsSpinning(false)
    })
  }, [restaurants, spinAnimation])

  const handleViewRestaurant = useCallback(() => {
    if (selectedRestaurant) {
      onOpenChange(false)
      router.push(`/restaurant/${selectedRestaurant.id}`)
    }
  }, [selectedRestaurant, onOpenChange, router])

  // Auto spin when opened
  useEffect(() => {
    if (open && restaurants.length > 0 && !selectedRestaurant) {
      spin()
    }
  }, [open, restaurants.length, selectedRestaurant, spin])

  const spinRotation = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  })

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame>
        <Sheet.Handle />

        <YStack flex={1} padding="$6" alignItems="center" justifyContent="center" gap="$6">
          {/* Spinning Dice */}
          <Animated.View
            style={{
              transform: [{ rotate: isSpinning ? spinRotation : '0deg' }],
            }}
          >
            <YStack
              width={120}
              height={120}
              borderRadius={60}
              backgroundColor={isSpinning ? '$primary' : '$backgroundPress'}
              alignItems="center"
              justifyContent="center"
            >
              {isSpinning ? (
                <Spinner size="large" color="white" />
              ) : (
                <Dice5 size={48} color={selectedRestaurant ? '$primary' : '$textMuted'} />
              )}
            </YStack>
          </Animated.View>

          {/* Result */}
          {selectedRestaurant ? (
            <YStack alignItems="center" gap="$3">
              <Text fontSize={14} color="$textMuted">
                今天吃這間！
              </Text>
              <Text fontSize={24} fontWeight="700" color="$color" textAlign="center">
                {selectedRestaurant.name}
              </Text>
              <XStack gap="$2" alignItems="center">
                <Text color="$textSecondary">{selectedRestaurant.cuisine}</Text>
                <Text color="$textMuted">·</Text>
                <Text color="$textSecondary">
                  {'$'.repeat(selectedRestaurant.price_level || 1)}
                </Text>
                {selectedRestaurant.district && (
                  <>
                    <Text color="$textMuted">·</Text>
                    <Text color="$textSecondary">{selectedRestaurant.district}</Text>
                  </>
                )}
              </XStack>
            </YStack>
          ) : !isSpinning ? (
            <YStack alignItems="center" gap="$2">
              <Text fontSize={18} fontWeight="600" color="$color">
                不知道吃什麼？
              </Text>
              <Text color="$textMuted">讓我來幫你決定！</Text>
            </YStack>
          ) : (
            <Text fontSize={18} fontWeight="600" color="$color">
              選擇中...
            </Text>
          )}

          {/* Actions */}
          <XStack gap="$3" width="100%">
            <Button
              flex={1}
              variant="outline"
              onPress={spin}
              disabled={isSpinning || restaurants.length === 0}
            >
              <RefreshCw size={18} />
              <Text>再選一次</Text>
            </Button>
            {selectedRestaurant && (
              <Button flex={1} variant="primary" onPress={handleViewRestaurant}>
                <Navigation size={18} color="white" />
                <Text color="white">查看詳情</Text>
              </Button>
            )}
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
