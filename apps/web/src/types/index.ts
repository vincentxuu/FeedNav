// API 響應類型
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

// 餐廳標籤類型
export interface RestaurantTag {
  id: string
  name: string
  category: string | null
  color: string | null
  is_positive: boolean
}

// 餐廳類型
export interface Restaurant {
  id: string
  name: string
  district: string
  cuisine_type: string
  rating: number
  price_level: number
  photos: string[]
  tags: RestaurantTag[]
  // 用於追蹤收藏狀態
  is_favorited?: boolean
  is_visited?: boolean
  // 詳細資訊
  address?: string
  phone?: string
  website?: string
  opening_hours?: string
  description?: string
  latitude?: number
  longitude?: number
  is_open_now?: boolean
  detailed_tags?: RestaurantTag[]
}

// 使用者收藏類型
export interface UserFavorite {
  id: number
  user_id: string
  restaurant_id: number
  created_at?: string
}

// 使用者造訪紀錄類型
export interface UserVisitedRestaurant {
  id: number
  user_id: string
  restaurant_id: number
  visited_at?: string
}

// 使用者類型
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  is_email_verified?: boolean
}

// 認證類型
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  name: string
}

// Session 類型 (用於取代 Supabase Session)
export interface Session {
  user?: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
}

// 地理位置類型
export interface Coordinates {
  latitude: number
  longitude: number
}

// 造訪統計類型
export interface VisitStats {
  total_visited: number
  districts_visited: number
  cuisines_tried: number
  avg_rating: number
  budget_friendly: number
  high_end: number
}

// OAuth 帳號類型
export interface OAuthAccount {
  provider: string
  provider_id: string
  linked_at: string
}
