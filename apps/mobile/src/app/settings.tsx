import { useState } from 'react'
import { Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Switch, Separator } from 'tamagui'
import {
  ArrowLeft,
  Bell,
  MapPin,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Trash2,
} from '@tamagui/lucide-icons'

import { Button, Card } from '@feednav/ui'
import { useAuth } from '@/lib/auth-context'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleDeleteAccount = () => {
    Alert.alert(
      '刪除帳號',
      '確定要刪除帳號嗎？此操作無法復原，所有資料將被永久刪除。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion API
            await logout()
            router.replace('/(tabs)')
          },
        },
      ]
    )
  }

  const handleLogout = () => {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        onPress: async () => {
          await logout()
          router.replace('/(tabs)')
        },
      },
    ])
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://feednav.cc/privacy')
  }

  const openTerms = () => {
    Linking.openURL('https://feednav.cc/terms')
  }

  const openHelp = () => {
    Linking.openURL('https://feednav.cc/help')
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
            設定
          </Text>
        </XStack>

        <YStack flex={1} padding="$4" gap="$6">
          {/* Preferences */}
          <YStack gap="$3">
            <Text fontSize={14} fontWeight="600" color="$textMuted" paddingLeft="$2">
              偏好設定
            </Text>
            <Card padding="none">
              <SettingRow
                icon={<Bell size={20} color="$textSecondary" />}
                label="推播通知"
                description="接收餐廳推薦和更新通知"
                right={
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                }
              />
              <Separator />
              <SettingRow
                icon={<MapPin size={20} color="$textSecondary" />}
                label="位置服務"
                description="允許 App 使用您的位置"
                right={
                  <Switch
                    checked={locationEnabled}
                    onCheckedChange={setLocationEnabled}
                  />
                }
              />
              <Separator />
              <SettingRow
                icon={<Moon size={20} color="$textSecondary" />}
                label="深色模式"
                description="使用深色主題"
                right={
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                }
              />
              <Separator />
              <SettingRow
                icon={<Globe size={20} color="$textSecondary" />}
                label="語言"
                description="繁體中文"
                right={<ChevronRight size={20} color="$textMuted" />}
                onPress={() => {}}
              />
            </Card>
          </YStack>

          {/* Support */}
          <YStack gap="$3">
            <Text fontSize={14} fontWeight="600" color="$textMuted" paddingLeft="$2">
              支援
            </Text>
            <Card padding="none">
              <SettingRow
                icon={<HelpCircle size={20} color="$textSecondary" />}
                label="幫助中心"
                right={<ChevronRight size={20} color="$textMuted" />}
                onPress={openHelp}
              />
              <Separator />
              <SettingRow
                icon={<Shield size={20} color="$textSecondary" />}
                label="隱私政策"
                right={<ChevronRight size={20} color="$textMuted" />}
                onPress={openPrivacyPolicy}
              />
              <Separator />
              <SettingRow
                icon={<Info size={20} color="$textSecondary" />}
                label="服務條款"
                right={<ChevronRight size={20} color="$textMuted" />}
                onPress={openTerms}
              />
            </Card>
          </YStack>

          {/* Account */}
          {isAuthenticated && (
            <YStack gap="$3">
              <Text fontSize={14} fontWeight="600" color="$textMuted" paddingLeft="$2">
                帳號
              </Text>
              <Card padding="none">
                <SettingRow
                  icon={<Trash2 size={20} color="$error" />}
                  label="刪除帳號"
                  labelColor="$error"
                  right={<ChevronRight size={20} color="$textMuted" />}
                  onPress={handleDeleteAccount}
                />
              </Card>
            </YStack>
          )}

          {/* Version Info */}
          <YStack alignItems="center" gap="$2" paddingTop="$4">
            <Text fontSize={14} color="$textMuted">
              FeedNav v1.0.0
            </Text>
            <Text fontSize={12} color="$textDisabled">
              Made with love in Taipei
            </Text>
          </YStack>

          {/* Logout Button */}
          {isAuthenticated && (
            <YStack flex={1} justifyContent="flex-end">
              <Button variant="outline" fullWidth onPress={handleLogout}>
                登出
              </Button>
            </YStack>
          )}
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}

function SettingRow({
  icon,
  label,
  labelColor = '$color',
  description,
  right,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  labelColor?: string
  description?: string
  right?: React.ReactNode
  onPress?: () => void
}) {
  return (
    <XStack
      padding="$4"
      alignItems="center"
      gap="$3"
      pressStyle={onPress ? { backgroundColor: '$backgroundPress' } : undefined}
      onPress={onPress}
    >
      {icon}
      <YStack flex={1}>
        <Text fontSize={16} color={labelColor}>
          {label}
        </Text>
        {description && (
          <Text fontSize={13} color="$textMuted">
            {description}
          </Text>
        )}
      </YStack>
      {right}
    </XStack>
  )
}
