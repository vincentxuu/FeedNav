import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (!token) {
        setUser(null)
        return
      }

      const response = await api.getCurrentUser()
      if (response.success && response.data?.user) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || '',
          avatar_url: response.data.user.avatar || null,
          created_at: response.data.user.created_at || '',
          is_email_verified: response.data.user.is_email_verified === 1,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      if (response.success && response.data?.user) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name || '',
          avatar_url: response.data.user.avatar || null,
          created_at: response.data.user.created_at || '',
          is_email_verified: response.data.user.is_email_verified === 1,
        })
        return true
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
      setUser(null)
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
