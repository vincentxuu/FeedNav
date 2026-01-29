// Mobile app constants

// Districts in Taipei
export const DISTRICTS = [
  '大安區',
  '信義區',
  '中山區',
  '松山區',
  '中正區',
  '萬華區',
  '大同區',
  '內湖區',
  '南港區',
  '士林區',
  '北投區',
  '文山區',
] as const

// Cuisine types
export const CUISINES = [
  '台灣料理',
  '日本料理',
  '韓國料理',
  '中式料理',
  '義式料理',
  '美式料理',
  '東南亞料理',
  '港式料理',
  '早午餐',
  '咖啡廳',
  '甜點',
  '火鍋',
  '燒烤',
  '素食',
] as const

// Price levels
export const PRICE_LEVELS = [
  { label: '$', value: 1 },
  { label: '$$', value: 2 },
  { label: '$$$', value: 3 },
  { label: '$$$$', value: 4 },
] as const

// Semantic colors used across the app
export const SEMANTIC_COLORS = {
  HEART_RED: '#ef4444',
  STAR_GOLD: '#fbbf24',
  PRIMARY_ORANGE: '#f97316',
} as const

// Validation patterns
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
} as const

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  SHORT: 24 * 60 * 60 * 1000, // 24 hours
  MEDIUM: 7 * 24 * 60 * 60 * 1000, // 7 days
  LONG: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const

// Location settings
export const LOCATION_CONFIG = {
  DEFAULT_LATITUDE: 25.033,
  DEFAULT_LONGITUDE: 121.5654,
  WATCH_INTERVAL_MS: 10000,
  WATCH_DISTANCE_METERS: 50,
} as const

export type District = (typeof DISTRICTS)[number]
export type Cuisine = (typeof CUISINES)[number]
export type PriceLevel = (typeof PRICE_LEVELS)[number]
