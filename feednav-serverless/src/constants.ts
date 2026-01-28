// JWT 配置
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 60 * 60, // 1 小時
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 天
} as const

// 分頁配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// 速率限制配置
export const RATE_LIMIT = {
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15 分鐘
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 60 * 1000, // 1 分鐘
    MAX_REQUESTS: 100,
  },
} as const

// 資料庫配置
export const DB_CONFIG = {
  BCRYPT_ROUNDS: 10,
  MAX_PRICE_LEVEL: 5,
} as const

// 驗證配置
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
} as const

// 地理位置配置
export const GEO_CONFIG = {
  DEFAULT_RADIUS_KM: 5,
  MAX_RADIUS_KM: 50,
  DEFAULT_NEARBY_LIMIT: 20,
  MAX_NEARBY_LIMIT: 50,
} as const
