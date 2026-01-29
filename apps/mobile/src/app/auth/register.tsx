import { useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Link } from 'expo-router'
import { YStack, XStack, Text, Separator } from 'tamagui'
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from '@tamagui/lucide-icons'

import { Button, Input } from '@feednav/ui'
import { useAuth } from '@/lib/auth-context'
import { VALIDATION } from '@/lib/constants'

export default function RegisterScreen() {
  const router = useRouter()
  const { register, login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('請填寫所有必填欄位')
      return
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      setError('請輸入有效的電子郵件')
      return
    }

    if (password !== confirmPassword) {
      setError('密碼不一致')
      return
    }

    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      setError(`密碼長度至少 ${VALIDATION.MIN_PASSWORD_LENGTH} 個字元`)
      return
    }

    setIsLoading(true)
    setError('')

    const success = await register(email, password)

    if (success) {
      // Auto login after registration
      const loginSuccess = await login(email, password)
      if (loginSuccess) {
        router.replace('/(tabs)')
      } else {
        router.replace('/auth/login')
      }
    } else {
      setError('註冊失敗，請稍後再試')
    }

    setIsLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1} padding="$6" gap="$6">
          {/* Back Button */}
          <XStack>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <ArrowLeft size={24} />
            </Button>
          </XStack>

          {/* Header */}
          <YStack gap="$2">
            <Text fontSize={28} fontWeight="700" color="$color">
              建立帳號
            </Text>
            <Text fontSize={16} color="$textMuted">
              加入 FeedNav，開始探索美食
            </Text>
          </YStack>

          {/* Register Form */}
          <YStack gap="$4" flex={1}>
            {error && (
              <Text color="$error" textAlign="center">
                {error}
              </Text>
            )}

            <YStack gap="$3">
              <XStack
                backgroundColor="$backgroundPress"
                borderRadius="$4"
                paddingHorizontal="$3"
                alignItems="center"
                gap="$2"
              >
                <User size={20} color="$textMuted" />
                <Input
                  flex={1}
                  placeholder="名稱（選填）"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
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
                  placeholder="密碼（至少 8 個字元）"
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
                  placeholder="確認密碼"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  borderWidth={0}
                  backgroundColor="transparent"
                />
              </XStack>
            </YStack>

            <Button
              variant="primary"
              fullWidth
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? '註冊中...' : '註冊'}
            </Button>

            <Text fontSize={12} color="$textMuted" textAlign="center">
              註冊即表示您同意我們的服務條款和隱私政策
            </Text>
          </YStack>

          {/* Login Link */}
          <XStack justifyContent="center" gap="$2">
            <Text color="$textMuted">已經有帳號？</Text>
            <Link href="/auth/login" asChild>
              <Text color="$primary" fontWeight="600">
                登入
              </Text>
            </Link>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
