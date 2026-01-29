// API Response types
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

// Restaurant Tag type
export interface RestaurantTag {
  id: string
  name: string
  category: string | null
  color: string | null
  is_positive: boolean
}

// Restaurant type
export interface Restaurant {
  id: string
  name: string
  district: string
  cuisine: string
  rating: number
  price_level: number
  image_url: string
  tags: string[]
  // Tracking favorite/visited status
  is_favorited?: boolean
  is_visited?: boolean
  // Detailed information
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

// User Favorite type
export interface UserFavorite {
  id: number
  user_id: string
  restaurant_id: number
  created_at?: string
}

// User Visited Restaurant type
export interface UserVisitedRestaurant {
  id: number
  user_id: string
  restaurant_id: number
  visited_at?: string
}

// User type
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  is_email_verified?: boolean
}

// Auth types
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

// Session type
export interface Session {
  user?: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
}

// Geolocation type
export interface Coordinates {
  latitude: number
  longitude: number
}

// Visit Stats type
export interface VisitStats {
  total_visited: number
  districts_visited: number
  cuisines_tried: number
  avg_rating: number
  budget_friendly: number
  high_end: number
}

// OAuth Account type
export interface OAuthAccount {
  provider: string
  provider_id: string
  linked_at: string
}

// Restaurant Search Filters
export interface RestaurantSearchFilters {
  searchTerm?: string
  sortBy?: string
  district?: string
  cuisine?: string
  priceRange?: [number, number]
  tags?: string[]
  page?: number
  limit?: number
}
