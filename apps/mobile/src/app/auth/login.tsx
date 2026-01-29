import { useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Link } from 'expo-router'
import { YStack, XStack, Text, Separator } from 'tamagui'
import { Mail, Lock, Eye, EyeOff } from '@tamagui/lucide-icons'

import { Button, Input } from '@feednav/ui'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import * as WebBrowser from 'expo-web-browser'
import { VALIDATION } from '@/lib/constants'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('請填寫所有欄位')
      return
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      setError('請輸入有效的電子郵件')
      return
    }

    setIsLoading(true)
    setError('')

    const success = await login(email, password)

    if (success) {
      router.replace('/(tabs)')
    } else {
      setError('登入失敗，請檢查帳號密碼')
    }

    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    const url = api.getGoogleOAuthUrl()
    await WebBrowser.openAuthSessionAsync(url, 'feednav://')
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1} padding="$6" justifyContent="center" gap="$6">
          {/* Header */}
          <YStack alignItems="center" gap="$2">
            <Text fontSize={32} fontWeight="700" color="$primary">
              FeedNav
            </Text>
            <Text fontSize={16} color="$textMuted">
              探索台北美食
            </Text>
          </YStack>

          {/* Login Form */}
          <YStack gap="$4">
            {error && (
              <Text color="$error" textAlign="center">
                {error}
              </Text>
            )}

            <YStack gap="$2">
              <XStack
                backgroundColor="$backgroundPress"
                borderRadius="$4"
                paddingHorizontal="$3"
                alignItems="center"
                gap="$2"
              >
                <Mail size={20} color="$textMuted" />
                <Input
                  flex={1}
                  placeholder="電子郵件"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  borderWidth={0}
                  backgroundColor="transparent"
                />
              </XStack>

              <XStack
                backgroundColor="$backgroundPress"
                borderRadius="$4"
                paddingHorizontal="$3"
                alignItems="center"
                gap="$2"
              >
                <Lock size={20} color="$textMuted" />
                <Input
                  flex={1}
                  placeholder="密碼"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  borderWidth={0}
                  backgroundColor="transparent"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="$textMuted" />
                  ) : (
                    <Eye size={20} color="$textMuted" />
                  )}
                </Button>
              </XStack>
            </YStack>

            <Button
              variant="primary"
              fullWidth
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? '登入中...' : '登入'}
            </Button>

            <XStack alignItems="center" gap="$3">
              <Separator flex={1} />
              <Text color="$textMuted">或</Text>
              <Separator flex={1} />
            </XStack>

            <Button variant="outline" fullWidth onPress={handleGoogleLogin}>
              使用 Google 登入
            </Button>
          </YStack>

          {/* Register Link */}
          <XStack justifyContent="center" gap="$2">
            <Text color="$textMuted">還沒有帳號？</Text>
            <Link href="/auth/register" asChild>
              <Text color="$primary" fontWeight="600">
                註冊
              </Text>
            </Link>
          </XStack>

          {/* Skip */}
          <Button
            variant="ghost"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text color="$textMuted">先逛逛</Text>
          </Button>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
