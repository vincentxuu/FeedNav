import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import * as SecureStore from 'expo-secure-store'
import type { User } from '@feednav/shared'
import api from './api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Helper to validate and transform user response
function parseUserResponse(data: unknown): User | null {
  if (!data || typeof data !== 'object') return null

  const userData = data as Record<string, unknown>
  const user = userData.user as Record<string, unknown> | undefined

  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: typeof user.name === 'string' ? user.name : '',
    avatar_url: typeof user.avatar === 'string' ? user.avatar : null,
    created_at: typeof user.created_at === 'string' ? user.created_at : '',
    is_email_verified: user.is_email_verified === 1,
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useRef(true)
  const isInitialized = useRef(false)

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (!token) {
        if (isMounted.current) {
          setUser(null)
        }
        return
      }

      const response = await api.getCurrentUser()
      if (isMounted.current) {
        if (response.success && response.data) {
          const parsedUser = parseUserResponse(response.data)
          setUser(parsedUser)
        } else {
          setUser(null)
        }
      }
    } catch {
      if (isMounted.current) {
        setUser(null)
      }
    }
  }, [])

  // Initialize auth state only once on mount
  useEffect(() => {
    isMounted.current = true

    // Prevent double initialization in StrictMode
    if (isInitialized.current) return
    isInitialized.current = true

    const initAuth = async () => {
      setIsLoading(true)
      try {
        const token = await SecureStore.getItemAsync('auth_token')
        if (!token) {
          setUser(null)
          return
        }

        const response = await api.getCurrentUser()
        if (isMounted.current && response.success && response.data) {
          const parsedUser = parseUserResponse(response.data)
          setUser(parsedUser)
        }
      } catch {
        if (isMounted.current) {
          setUser(null)
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted.current = false
    }
  }, []) // Empty dependency array - only run once

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      if (response.success && response.data) {
        const parsedUser = parseUserResponse(response.data)
        if (parsedUser && isMounted.current) {
          setUser(parsedUser)
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.register(email, password)
      return response.success
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      if (isMounted.current) {
        setUser(null)
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
