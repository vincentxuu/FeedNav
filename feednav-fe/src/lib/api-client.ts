import {
  getToken,
  setToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
} from './utils/tokenStorage'
import { API_ENDPOINTS, RETRY_CONFIG } from './constants'
import type { Restaurant } from '@/types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://your-worker.your-subdomain.workers.dev'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
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

interface RestaurantSearchFilters {
  searchTerm?: string
  sortBy?: string
  district?: string
  cuisine?: string
  priceRange?: [number, number]
  tags?: string[]
  page?: number
  limit?: number
}

interface RestaurantTag {
  id: string
  name: string
  category?: string
  color?: string
}

interface VisitStats {
  total_visited: number
  districts_visited: number
  cuisines_tried: number
  avg_rating: number
  budget_friendly: number
  high_end: number
}

interface OAuthAccount {
  provider: string
  provider_id: string
  linked_at: string
}

class ApiClient {
  private isRefreshing = false
  private refreshSubscribers: ((_token: string) => void)[] = []

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = getToken()

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

      // 處理 401 錯誤
      if (response.status === 401) {
        const newToken = await this.handleTokenRefresh()
        if (newToken) {
          return this.request<T>(endpoint, options)
        }
        throw new Error('Authentication failed')
      }

      // 處理可重試的錯誤
      if (
        RETRY_CONFIG.RETRYABLE_STATUSES.includes(response.status) &&
        retryCount < RETRY_CONFIG.MAX_RETRIES
      ) {
        await this.delay(RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount))
        return this.request<T>(endpoint, options, retryCount + 1)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      // 網路錯誤重試
      if (error instanceof TypeError && retryCount < RETRY_CONFIG.MAX_RETRIES) {
        await this.delay(RETRY_CONFIG.RETRY_DELAY * Math.pow(2, retryCount))
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      console.error(`API Error for ${endpoint}:`, error)
      throw error
    }
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve)
      })
    }

    this.isRefreshing = true
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      this.isRefreshing = false
      clearToken()
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      const newToken = data.data?.token

      if (newToken) {
        setToken(newToken)
        if (data.data?.refreshToken) {
          setRefreshToken(data.data.refreshToken)
        }

        this.refreshSubscribers.forEach((callback) => callback(newToken))
        this.refreshSubscribers = []

        return newToken
      }

      throw new Error('No token in refresh response')
    } catch {
      clearToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Token management (for backward compatibility)
  setToken(token: string | null) {
    if (token) {
      setToken(token)
    } else {
      clearToken()
    }
  }

  getToken(): string | null {
    return getToken() || null
  }

  // Authentication methods
  async register(email: string, password: string) {
    return this.request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string) {
    const result = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (result.success && result.data) {
      setToken(result.data.token)
      if (result.data.refreshToken) {
        setRefreshToken(result.data.refreshToken)
      }
    }

    return result
  }

  async logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    }
    clearToken()
  }

  async getCurrentUser() {
    return this.request<{ user: UserData }>(API_ENDPOINTS.AUTH.ME)
  }

  async refreshTokenRequest() {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const result = await this.request<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (result.success && result.data) {
      setToken(result.data.token)
      setRefreshToken(result.data.refreshToken)
    }

    return result
  }

  // Restaurant methods
  async searchRestaurants(filters: RestaurantSearchFilters) {
    return this.request<{
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
  }

  async getRestaurant(id: string) {
    return this.request<Restaurant>(API_ENDPOINTS.RESTAURANTS.DETAIL(id))
  }

  async getNearbyRestaurants(lat: number, lng: number, radius = 5, limit = 10) {
    return this.request<{ restaurants: Restaurant[] }>(
      `${API_ENDPOINTS.RESTAURANTS.NEARBY}?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
    )
  }

  async getTags() {
    return this.request<{ tags: RestaurantTag[] }>(API_ENDPOINTS.RESTAURANTS.TAGS)
  }

  // Favorites methods
  async getFavorites(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Restaurant>>(
      `${API_ENDPOINTS.FAVORITES.LIST}?page=${page}&limit=${limit}`
    )
  }

  async addFavorite(restaurantId: number) {
    return this.request(API_ENDPOINTS.FAVORITES.ADD, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    })
  }

  async removeFavorite(restaurantId: number) {
    return this.request(API_ENDPOINTS.FAVORITES.REMOVE(restaurantId), {
      method: 'DELETE',
    })
  }

  async checkFavoriteStatus(restaurantId: number) {
    return this.request<{
      is_favorited: boolean
      favorited_at?: string
    }>(API_ENDPOINTS.FAVORITES.CHECK(restaurantId))
  }

  // Visits methods
  async getVisits(page = 1, limit = 20) {
    return this.request<PaginatedResponse<Restaurant>>(
      `${API_ENDPOINTS.VISITS.LIST}?page=${page}&limit=${limit}`
    )
  }

  async addVisit(restaurantId: number) {
    return this.request(API_ENDPOINTS.VISITS.ADD, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    })
  }

  async removeVisit(restaurantId: number) {
    return this.request(API_ENDPOINTS.VISITS.REMOVE(restaurantId), {
      method: 'DELETE',
    })
  }

  async checkVisitStatus(restaurantId: number) {
    return this.request<{
      is_visited: boolean
      visited_at?: string
    }>(API_ENDPOINTS.VISITS.CHECK(restaurantId))
  }

  async getVisitStats() {
    return this.request<{
      stats: VisitStats
      recent_visits: Restaurant[]
    }>(API_ENDPOINTS.VISITS.STATS)
  }

  // OAuth methods
  loginWithGoogle() {
    if (typeof window !== 'undefined') {
      window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`
    }
  }

  loginWithDiscord() {
    if (typeof window !== 'undefined') {
      window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.DISCORD}`
    }
  }

  async getOAuthAccounts() {
    return this.request<{ accounts: OAuthAccount[] }>(API_ENDPOINTS.OAUTH.ACCOUNTS)
  }

  async removeOAuthAccount(provider: string) {
    return this.request(API_ENDPOINTS.OAUTH.REMOVE(provider), {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
