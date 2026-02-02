import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Image, Separator } from 'tamagui'
import {
  User,
  Heart,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
} from '@tamagui/lucide-icons'

import { Button, Card } from '@/ui'
import { useAuth } from '@/lib/auth-context'
import { useVisitStats } from '@/lib/queries'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { data: statsData } = useVisitStats()

  const stats = statsData?.data?.stats

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$4">
          <User size={64} color="$textMuted" />
          <Text fontSize={18} fontWeight="600" color="$color" textAlign="center">
            登入以使用更多功能
          </Text>
          <Text color="$textMuted" textAlign="center">
            追蹤你的美食足跡，收藏喜愛的餐廳
          </Text>
          <Button variant="primary" onPress={() => router.push('/auth/login')}>
            登入 / 註冊
          </Button>
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
        {/* Profile Header */}
        <XStack gap="$4" alignItems="center">
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              width={80}
              height={80}
              borderRadius={40}
            />
          ) : (
            <YStack
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="$primary"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={32} color="white" fontWeight="600">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </YStack>
          )}
          <YStack flex={1}>
            <Text fontSize={20} fontWeight="600" color="$color">
              {user?.name || '使用者'}
            </Text>
            <Text fontSize={14} color="$textMuted">
              {user?.email}
            </Text>
          </YStack>
        </XStack>

        {/* Stats */}
        {stats && (
          <Card elevated padding="md">
            <XStack justifyContent="space-around">
              <YStack alignItems="center">
                <Text fontSize={24} fontWeight="700" color="$primary">
                  {stats.total_visited}
                </Text>
                <Text fontSize={12} color="$textMuted">
                  造訪餐廳
                </Text>
              </YStack>
              <Separator vertical />
              <YStack alignItems="center">
                <Text fontSize={24} fontWeight="700" color="$primary">
                  {stats.districts_visited}
                </Text>
                <Text fontSize={12} color="$textMuted">
                  探索區域
                </Text>
              </YStack>
              <Separator vertical />
              <YStack alignItems="center">
                <Text fontSize={24} fontWeight="700" color="$primary">
                  {stats.cuisines_tried}
                </Text>
                <Text fontSize={12} color="$textMuted">
                  料理類型
                </Text>
              </YStack>
            </XStack>
          </Card>
        )}

        {/* Menu Items */}
        <YStack gap="$2">
          <MenuItem
            icon={<Heart size={20} color="$textSecondary" />}
            label="我的收藏"
            onPress={() => router.push('/(tabs)/favorites')}
          />
          <MenuItem
            icon={<MapPin size={20} color="$textSecondary" />}
            label="造訪紀錄"
            onPress={() => router.push('/visits')}
          />
          <MenuItem
            icon={<Settings size={20} color="$textSecondary" />}
            label="設定"
            onPress={() => router.push('/settings')}
          />
        </YStack>

        {/* Logout Button */}
        <YStack flex={1} justifyContent="flex-end">
          <Button
            variant="outline"
            onPress={logout}
            fullWidth
          >
            <LogOut size={18} />
            <Text>登出</Text>
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <XStack
      backgroundColor="$surface"
      padding="$4"
      borderRadius="$4"
      alignItems="center"
      gap="$3"
      pressStyle={{ backgroundColor: '$surfacePress' }}
      onPress={onPress}
    >
      {icon}
      <Text flex={1} fontSize={16} color="$color">
        {label}
      </Text>
      <ChevronRight size={20} color="$textMuted" />
    </XStack>
  )
}
