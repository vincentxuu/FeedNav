'use client'

/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { getToken, clearToken, setToken, setRefreshToken } from '@/lib/utils/tokenStorage'
import type { Session } from '@/types'

interface AuthResult {
  success: boolean
  error?: string
}

interface UseAuthSessionReturn {
  session: Session | null
  user: Session['user'] | undefined
  isLoading: boolean
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthResult>
  register: (email: string, password: string) => Promise<AuthResult>
  refreshSession: () => Promise<void>
}

export function useAuthSession(): UseAuthSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setSession(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.getCurrentUser()
      if (response.success && response.data?.user) {
        setSession({
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            avatar: response.data.user.avatar,
          },
        })
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
      clearToken()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
    } finally {
      setSession(null)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await apiClient.login(email, password)
      if (response.success && response.data) {
        setToken(response.data.token)
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken)
        }
        setSession({
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            avatar: response.data.user.avatar,
          },
        })
        return { success: true }
      }
      return { success: false, error: response.message || response.error }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '登入失敗' }
    }
  }, [])

  const register = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await apiClient.register(email, password)
      if (response.success && response.data) {
        setToken(response.data.token)
        if (response.data.refreshToken) {
          setRefreshToken(response.data.refreshToken)
        }
        setSession({
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name,
            avatar: response.data.user.avatar,
          },
        })
        return { success: true }
      }
      return { success: false, error: response.message || response.error }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '註冊失敗' }
    }
  }, [])

  const refreshSession = useCallback(async () => {
    await fetchCurrentUser()
  }, [fetchCurrentUser])

  return {
    session,
    user: session?.user,
    isLoading,
    logout,
    login,
    register,
    refreshSession,
  }
}

export default useAuthSession
