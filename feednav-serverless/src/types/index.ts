// 環境變數類型
export interface Env {
  DB: D1Database
  KV: KVNamespace
  R2?: R2Bucket
  ACCESS_LOGS?: AnalyticsEngineDataset
  JWT_SECRET: string
  JWT_ISSUER?: string
  BCRYPT_ROUNDS?: string
  CORS_ORIGIN?: string
  ENVIRONMENT?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  DISCORD_CLIENT_ID?: string
  DISCORD_CLIENT_SECRET?: string
  FRONTEND_URL?: string
  // Index signature for Hono compatibility
  [key: string]: unknown
}

// Hono Context 變數類型
export interface Variables {
  userId: string
  userEmail: string
  user: JWTPayload
  // Index signature for Hono compatibility
  [key: string]: unknown
}

// 完整的 App 類型
export type AppEnv = {
  Bindings: Env
  Variables: Variables
}

// API 響應類型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 使用者類型
export interface User {
  id: string
  email: string
  password_hash: string
  name?: string
  avatar?: string
  is_email_verified?: number
  created_at: string
  updated_at: string
}

// 餐廳類型
export interface Restaurant {
  id: number
  name: string
  district: string | null
  cuisine_type: string | null
  rating: number | null
  price_level: number | null
  photos: string[]
  address: string | null
  phone: string | null
  website: string | null
  opening_hours: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
  tags?: Tag[]
  is_favorited?: boolean
  is_visited?: boolean
}

export interface Tag {
  id: number
  name: string
  category: string | null
  color: string | null
  is_positive: boolean
}

export interface RestaurantFilters {
  page?: number
  limit?: number
  searchTerm?: string
  cuisineType?: string
  district?: string
  priceLevel?: number
  priceRange?: [number, number]
  tags?: string[]
  sortBy?: 'default' | 'rating_desc' | 'price_asc' | 'price_desc'
}

// 搜尋相關類型
export interface SearchFilters {
  searchTerm?: string
  sortBy?: 'default' | 'rating_desc' | 'price_asc' | 'price_desc'
  district?: string
  cuisine?: string
  priceRange?: [number, number]
  tags?: string[]
  page?: number
  limit?: number
}

export interface SearchResponse {
  restaurants: Restaurant[]
  pagination: PaginationInfo
}

// 收藏類型
export interface UserFavorite {
  id: number
  user_id: string
  restaurant_id: number
  created_at: string
}

// 造訪記錄類型
export interface UserVisited {
  id: number
  user_id: string
  restaurant_id: number
  created_at: string
}

// 評論類型
export interface Review {
  id: number
  restaurant_id: number
  user_id: string
  rating: number
  comment: string
  helpful_count: number
  created_at: string
}

// JWT Payload 類型
export interface JWTPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

// OAuth 相關類型
export interface OAuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'discord'
  provider_id: string
}

export interface SocialAccount {
  id: number
  user_id: string
  provider: 'google' | 'discord'
  provider_id: string
  provider_email: string
  provider_name: string
  provider_avatar?: string
  created_at: string
  updated_at: string
}

export interface GoogleTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export interface DiscordTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  email: string
  verified: boolean
  avatar?: string
  global_name?: string
}
