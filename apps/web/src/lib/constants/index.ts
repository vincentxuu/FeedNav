export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    GOOGLE: '/api/oauth/google',
    DISCORD: '/api/oauth/discord',
  },
  RESTAURANTS: {
    SEARCH: '/api/restaurants/search',
    BOUNDS: '/api/restaurants/bounds',
    NEARBY: '/api/restaurants/nearby',
    TAGS: '/api/restaurants/tags',
    DETAIL: (id: string) => `/api/restaurants/${id}`,
  },
  FAVORITES: {
    LIST: '/api/favorites',
    ADD: '/api/favorites',
    REMOVE: (id: number) => `/api/favorites/${id}`,
    CHECK: (id: number) => `/api/favorites/check/${id}`,
  },
  VISITS: {
    LIST: '/api/visits',
    ADD: '/api/visits',
    REMOVE: (id: number) => `/api/visits/${id}`,
    CHECK: (id: number) => `/api/visits/check/${id}`,
    STATS: '/api/visits/stats',
  },
  OAUTH: {
    ACCOUNTS: '/api/oauth/accounts',
    REMOVE: (provider: string) => `/api/oauth/accounts/${provider}`,
  },
} as const

export const LIMITS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_DEBOUNCE_MS: 300,
} as const

export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 25.033, lng: 121.5654 }, // 台北
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
} as const

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRYABLE_STATUSES: [408, 500, 502, 503, 504] as number[],
} as const
