import { useState, useCallback } from 'react'
import { KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack, Text, Image, Spinner } from 'tamagui'
import { ArrowLeft, Camera, User } from '@tamagui/lucide-icons'
import * as ImagePicker from 'expo-image-picker'

import { Button, Input } from '@/ui'
import { useAuth } from '@/lib/auth-context'

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '')
  const [isLoading, setIsLoading] = useState(false)

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      Alert.alert('需要權限', '請允許存取相簿以更換頭像')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入名稱')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement profile update API
      // await api.updateProfile({ name, avatar: avatarUri })
      await refreshUser()
      Alert.alert('成功', '個人資料已更新', [
        { text: '確定', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('錯誤', '更新失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }, [name, avatarUri, refreshUser, router])

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <XStack
            padding="$4"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <ArrowLeft size={24} />
            </Button>
            <Text fontSize={18} fontWeight="600" color="$color">
              編輯個人資料
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="$primary" />
              ) : (
                <Text color="$primary" fontWeight="600">
                  儲存
                </Text>
              )}
            </Button>
          </XStack>

          <YStack flex={1} padding="$6" gap="$6">
            {/* Avatar */}
            <YStack alignItems="center" gap="$3">
              <YStack position="relative">
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    width={120}
                    height={120}
                    borderRadius={60}
                  />
                ) : (
                  <YStack
                    width={120}
                    height={120}
                    borderRadius={60}
                    backgroundColor="$primary"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <User size={48} color="white" />
                  </YStack>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  borderRadius="$full"
                  position="absolute"
                  bottom={0}
                  right={0}
                  width={36}
                  height={36}
                  onPress={handlePickImage}
                >
                  <Camera size={18} color="white" />
                </Button>
              </YStack>
              <Text fontSize={14} color="$textMuted">
                點擊更換頭像
              </Text>
            </YStack>

            {/* Form */}
            <YStack gap="$4">
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="600" color="$color">
                  名稱
                </Text>
                <Input
                  placeholder="輸入您的名稱"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize={14} fontWeight="600" color="$color">
                  電子郵件
                </Text>
                <Input
                  value={user?.email || ''}
                  disabled
                  backgroundColor="$backgroundPress"
                />
                <Text fontSize={12} color="$textMuted">
                  電子郵件無法更改
                </Text>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
