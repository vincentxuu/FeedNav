import { API_ENDPOINTS, RETRY_CONFIG } from '../constants'
import type {
  ApiResponse,
  PaginatedResponse,
  Restaurant,
  RestaurantTag,
  RestaurantSearchFilters,
  VisitStats,
  OAuthAccount,
} from '../types'

export interface ApiClientConfig {
  baseURL: string
  getToken: () => Promise<string | null> | string | null
  setToken: (token: string) => void | Promise<void>
  getRefreshToken: () => Promise<string | null> | string | null
  setRefreshToken: (token: string) => void | Promise<void>
  clearTokens: () => void | Promise<void>
  onUnauthorized: () => void
}

interface UserData {
  id: string
  email: string
  name?: string
  avatar?: string
  is_email_verified?: number
  created_at?: string
}

interface AuthTokens {
  token: string
  refreshToken: string
}

interface AuthResponse extends AuthTokens {
  user: UserData
}

export function createApiClient(config: ApiClientConfig) {
  let isRefreshing = false
  let refreshSubscribers: ((_token: string) => void)[] = []

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const handleTokenRefresh = async (): Promise<string | null> => {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push(resolve)
      })
    }

    isRefreshing = true
    const refreshToken = await config.getRefreshToken()

    if (!refreshToken) {
      isRefreshing = false
      await config.clearTokens()
      return null
    }

    try {
      const response = await fetch(`${config.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = (await response.json()) as {
        data?: { token?: string; refreshToken?: string }
      }
      const newToken = data.data?.token

      if (newToken) {
        await config.setToken(newToken)
        if (data.data?.refreshToken) {
          await config.setRefreshToken(data.data.refreshToken)
        }

        refreshSubscribers.forEach((callback) => callback(newToken))
        refreshSubscribers = []

        return newToken
      }

      throw new Error('No token in refresh response')
    } catch {
      await config.clearTokens()
      config.onUnauthorized()
      return null
    } finally {
      isRefreshing = false
    }
  }

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> => {
    const url = `${config.baseURL}${endpoint}`
    const token = await config.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 401 errors
      if (response.status === 401) {
        const newToken = await handleTokenRefresh()
        if (newToken) {
          return request<T>(endpoint, options)
        }
        throw new Error('Authentication failed')
      }

      // Handle retryable errors
      if (
        RETRY_CONFIG.RETRYABLE_STATUSES.includes(response.status) &&
        retryCount < RETRY_CONFIG.MAX_RETRIES
      ) {
        await delay(RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount))
        return request<T>(endpoint, options, retryCount + 1)
      }

      const data = (await response.json()) as ApiResponse<T> & { message?: string }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data as ApiResponse<T>
    } catch (error) {
      // Network error retry
      if (error instanceof TypeError && retryCount < RETRY_CONFIG.MAX_RETRIES) {
        await delay(RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount))
        return request<T>(endpoint, options, retryCount + 1)
      }
      throw error
    }
  }

  return {
    request,

    // Authentication methods
    async register(email: string, password: string) {
      return request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },

    async login(email: string, password: string) {
      const result = await request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (result.success && result.data) {
        await config.setToken(result.data.token)
        if (result.data.refreshToken) {
          await config.setRefreshToken(result.data.refreshToken)
        }
      }

      return result
    },

    async logout() {
      const refreshToken = await config.getRefreshToken()
      if (refreshToken) {
        await request(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      }
      await config.clearTokens()
    },

    async getCurrentUser() {
      return request<{ user: UserData }>(API_ENDPOINTS.AUTH.ME)
    },

    // Restaurant methods
    async searchRestaurants(filters: RestaurantSearchFilters) {
      return request<{
        restaurants: Restaurant[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>(API_ENDPOINTS.RESTAURANTS.SEARCH, {
        method: 'POST',
        body: JSON.stringify(filters),
      })
    },

    async getRestaurant(id: string) {
      return request<Restaurant>(API_ENDPOINTS.RESTAURANTS.DETAIL(id))
    },

    async getNearbyRestaurants(lat: number, lng: number, radius = 5, limit = 10) {
      return request<{ restaurants: Restaurant[] }>(
        `${API_ENDPOINTS.RESTAURANTS.NEARBY}?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
      )
    },

    async getTags() {
      return request<{ tags: RestaurantTag[] }>(API_ENDPOINTS.RESTAURANTS.TAGS)
    },

    // Favorites methods
    async getFavorites(page = 1, limit = 20) {
      return request<PaginatedResponse<Restaurant>>(
        `${API_ENDPOINTS.FAVORITES.LIST}?page=${page}&limit=${limit}`
      )
    },

    async addFavorite(restaurantId: number) {
      return request(API_ENDPOINTS.FAVORITES.ADD, {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurantId }),
      })
    },

    async removeFavorite(restaurantId: number) {
      return request(API_ENDPOINTS.FAVORITES.REMOVE(restaurantId), {
        method: 'DELETE',
      })
    },

    async checkFavoriteStatus(restaurantId: number) {
      return request<{
        is_favorited: boolean
        favorited_at?: string
      }>(API_ENDPOINTS.FAVORITES.CHECK(restaurantId))
    },

    // Visits methods
    async getVisits(page = 1, limit = 20) {
      return request<PaginatedResponse<Restaurant>>(
        `${API_ENDPOINTS.VISITS.LIST}?page=${page}&limit=${limit}`
      )
    },

    async addVisit(restaurantId: number) {
      return request(API_ENDPOINTS.VISITS.ADD, {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurantId }),
      })
    },

    async removeVisit(restaurantId: number) {
      return request(API_ENDPOINTS.VISITS.REMOVE(restaurantId), {
        method: 'DELETE',
      })
    },

    async checkVisitStatus(restaurantId: number) {
      return request<{
        is_visited: boolean
        visited_at?: string
      }>(API_ENDPOINTS.VISITS.CHECK(restaurantId))
    },

    async getVisitStats() {
      return request<{
        stats: VisitStats
        recent_visits: Restaurant[]
      }>(API_ENDPOINTS.VISITS.STATS)
    },

    // OAuth methods
    getGoogleOAuthUrl() {
      return `${config.baseURL}${API_ENDPOINTS.AUTH.GOOGLE}`
    },

    getDiscordOAuthUrl() {
      return `${config.baseURL}${API_ENDPOINTS.AUTH.DISCORD}`
    },

    async getOAuthAccounts() {
      return request<{ accounts: OAuthAccount[] }>(API_ENDPOINTS.OAUTH.ACCOUNTS)
    },

    async removeOAuthAccount(provider: string) {
      return request(API_ENDPOINTS.OAUTH.REMOVE(provider), {
        method: 'DELETE',
      })
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
