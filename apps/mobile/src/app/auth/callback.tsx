import { useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { YStack, Text, Spinner } from 'tamagui'
import * as SecureStore from 'expo-secure-store'

import { useAuth } from '@/lib/auth-context'

export default function OAuthCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ token?: string; refreshToken?: string; error?: string }>()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      if (params.error) {
        // OAuth failed
        router.replace('/auth/login')
        return
      }

      if (params.token) {
        // Save tokens
        await SecureStore.setItemAsync('auth_token', params.token)
        if (params.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', params.refreshToken)
        }

        // Refresh user data
        await refreshUser()

        // Navigate to home
        router.replace('/(tabs)')
      } else {
        // No token received
        router.replace('/auth/login')
      }
    }

    handleCallback()
  }, [params, router, refreshUser])

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
      <Spinner size="large" color="$primary" />
      <Text color="$textMuted">正在登入...</Text>
    </YStack>
  )
}
