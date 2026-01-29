import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { createApiClient } from '@feednav/shared'

const API_BASE_URL = 'https://api.feednav.cc'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const api = createApiClient({
  baseURL: API_BASE_URL,
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY)
    } catch {
      return null
    }
  },
  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  },
  getRefreshToken: async () => {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  },
  setRefreshToken: async (token: string) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
  },
  clearTokens: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
  },
  onUnauthorized: () => {
    router.replace('/auth/login')
  },
})

export default api
