import React, { Component, ErrorInfo, ReactNode } from 'react'
import { YStack, Text } from 'tamagui'
import { AlertTriangle, RefreshCw } from '@tamagui/lucide-icons'

import { Button } from '@/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding="$6"
          backgroundColor="$background"
          gap="$4"
        >
          <YStack
            width={80}
            height={80}
            borderRadius={40}
            backgroundColor="$error"
            opacity={0.1}
            position="absolute"
          />
          <AlertTriangle size={40} color="$error" />
          <YStack alignItems="center" gap="$2">
            <Text fontSize={18} fontWeight="600" color="$color" textAlign="center">
              發生錯誤
            </Text>
            <Text color="$textMuted" textAlign="center" lineHeight={22}>
              很抱歉，發生了一些問題。請重試或稍後再試。
            </Text>
          </YStack>
          <Button variant="primary" onPress={this.handleRetry}>
            <RefreshCw size={18} color="white" />
            <Text color="white" fontWeight="600">
              重試
            </Text>
          </Button>
          {__DEV__ && this.state.error && (
            <YStack
              backgroundColor="$backgroundPress"
              padding="$3"
              borderRadius="$3"
              marginTop="$4"
              width="100%"
            >
              <Text fontSize={12} color="$error" fontFamily="$mono">
                {this.state.error.message}
              </Text>
            </YStack>
          )}
        </YStack>
      )
    }

    return this.props.children
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Error caught:', error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const throwError = React.useCallback((error: Error) => {
    throw error
  }, [])

  return {
    error,
    handleError,
    clearError,
    throwError,
  }
}
