# FeedNav 前端修正指南

本文件詳細說明 `feednav-fe` 專案需要進行的修正。

---

## 1. 配置文件修正

### 1.1 移除錯誤忽略配置

**檔案:** `next.config.ts`

**修改前:**
```typescript
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ...
}
```

**修改後:**
```typescript
const nextConfig: NextConfig = {
  // 移除 eslint.ignoreDuringBuilds
  // 移除 typescript.ignoreBuildErrors
  images: {
    remotePatterns: [
      // 保留現有配置
    ],
  },
}
```

### 1.2 添加 Prettier 配置

**創建:** `.prettierrc.json`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**創建:** `.prettierignore`
```
node_modules
.next
dist
build
.wrangler
coverage
*.min.js
```

**安裝依賴:**
```bash
npm install --save-dev prettier prettier-plugin-tailwindcss
```

### 1.3 更新 ESLint 配置

**修改:** `eslint.config.mjs` 或創建 `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

### 1.4 更新 package.json 腳本

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 2. ESLint 錯誤修正

### 2.1 修正 `@typescript-eslint/no-explicit-any`

**檔案:** `src/components/map/Map.tsx`

**修改前:**
```typescript
const handleMapClick = (e: any) => { ... }
const handleMarkerClick = (restaurant: any) => { ... }
```

**修改後:**
```typescript
import type { LeafletMouseEvent } from 'leaflet'
import type { Restaurant } from '@/types'

const handleMapClick = (e: LeafletMouseEvent) => { ... }
const handleMarkerClick = (restaurant: Restaurant) => { ... }
```

**檔案:** `src/components/restaurant/RestaurantMap.tsx`

為所有 `any` 類型定義適當的介面:

```typescript
interface MapEvent {
  target: L.Map
  latlng: L.LatLng
}

interface MarkerEvent {
  target: L.Marker
}
```

**檔案:** `src/hooks/useFavorites.ts`

```typescript
// 修改前
const toggleFavorite = async (restaurant: any) => { ... }

// 修改後
import type { Restaurant } from '@/types'
const toggleFavorite = async (restaurant: Restaurant) => { ... }
```

### 2.2 修正未使用變數

**檔案:** `src/components/layout/UserNav.tsx`

```typescript
// 修改前
const { favorites, visited, ... } = useAuthSession()

// 修改後 (如果真的不需要這些變數)
const { /* favorites, visited, */ ...rest } = useAuthSession()

// 或者使用底線前綴表示刻意不使用
const { favorites: _favorites, visited: _visited, ... } = useAuthSession()
```

**檔案:** `src/hooks/useHomePageData.ts`

```typescript
// 修改前
const [showOpenOnly, setShowOpenOnly] = useState(false)

// 修改後 (如果確實需要但尚未實現)
const [_showOpenOnly, setShowOpenOnly] = useState(false)

// 或者直接移除未使用的狀態
```

**檔案:** `src/hooks/use-toast.ts`

```typescript
// 修改前
const actionTypes = { ... }

// 修改後 (如果僅作為類型使用)
type ActionTypes = typeof actionTypes
```

### 2.3 修正空接口

**檔案:** `src/components/ui/command.tsx`

```typescript
// 修改前
interface CommandDialogProps extends DialogProps {}

// 修改後
type CommandDialogProps = DialogProps
```

**檔案:** `src/components/ui/textarea.tsx`

```typescript
// 修改前
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// 修改後
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
```

---

## 3. Next.js 最佳實踐修正

### 3.1 替換 `<img>` 為 `<Image />`

**檔案:** `src/components/restaurant/RestaurantCard.tsx`

**修改前:**
```tsx
<img
  src={restaurant.image_url || '/placeholder-restaurant.jpg'}
  alt={restaurant.name}
  className="w-full h-48 object-cover"
/>
```

**修改後:**
```tsx
import Image from 'next/image'

<Image
  src={restaurant.image_url || '/placeholder-restaurant.jpg'}
  alt={restaurant.name}
  width={400}
  height={192}
  className="w-full h-48 object-cover"
  priority={false}
/>
```

### 3.2 修正 React Hooks 依賴

**檔案:** `src/components/map/Map.tsx` (第 76 行)

```typescript
// 修改前
const memoizedCenter = useMemo(() => mapCenter, [])

// 修改後
const memoizedCenter = useMemo(() => mapCenter, [mapCenter])
```

---

## 4. API 客戶端改進

### 4.1 增強 Token 管理

**創建:** `src/lib/utils/tokenStorage.ts`

```typescript
import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getToken(): string | undefined {
  // 優先從 Cookie 取得
  const cookieToken = Cookies.get(TOKEN_KEY)
  if (cookieToken) return cookieToken

  // 備援從 localStorage 取得
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) || undefined
  }
  return undefined
}

export function setToken(token: string, expiresInDays = 1): void {
  // 同時存儲到 Cookie 和 localStorage
  Cookies.set(TOKEN_KEY, token, {
    expires: expiresInDays,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken(): void {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY) ||
    (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) || undefined : undefined)
}

export function setRefreshToken(token: string, expiresInDays = 30): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, {
    expires: expiresInDays,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}
```

**安裝依賴:**
```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

### 4.2 改進 API 客戶端

**修改:** `src/lib/api-client.ts`

```typescript
import { getToken, setToken, clearToken, getRefreshToken, setRefreshToken } from './utils/tokenStorage'

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 500, 502, 503, 504],
}

class ApiClient {
  private baseUrl: string
  private isRefreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const token = getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
        RETRY_CONFIG.retryableStatuses.includes(response.status) &&
        retryCount < RETRY_CONFIG.maxRetries
      ) {
        await this.delay(RETRY_CONFIG.retryDelay * Math.pow(2, retryCount))
        return this.request<T>(endpoint, options, retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      // 網路錯誤重試
      if (
        error instanceof TypeError &&
        retryCount < RETRY_CONFIG.maxRetries
      ) {
        await this.delay(RETRY_CONFIG.retryDelay * Math.pow(2, retryCount))
        return this.request<T>(endpoint, options, retryCount + 1)
      }
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
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      const newToken = data.data.accessToken

      setToken(newToken)
      if (data.data.refreshToken) {
        setRefreshToken(data.data.refreshToken)
      }

      this.refreshSubscribers.forEach((callback) => callback(newToken))
      this.refreshSubscribers = []

      return newToken
    } catch {
      clearToken()
      window.location.href = '/auth'
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Public methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
```

---

## 5. 清理舊依賴

### 5.1 移除 Supabase 依賴

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

**刪除目錄:**
```
src/integrations/supabase/
```

### 5.2 移除舊 Pages Router

如果已完全遷移到 App Router，可考慮移除 `src/pages/` 目錄或將其內容整合到 `src/app/`。

---

## 6. 類型定義改進

### 6.1 擴展類型定義

**修改:** `src/types/index.ts`

```typescript
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

// 餐廳類型
export interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  price_level: number | null
  cuisine_type: string | null
  image_url: string | null
  rating: number | null
  is_open_now?: boolean
  tags?: RestaurantTag[]
  // ...其他欄位
}

export interface RestaurantTag {
  id: string
  name: string
  category: string | null
  color: string | null
  is_positive: boolean
}

// 使用者類型
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
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
```

---

## 7. 常數管理

**創建:** `src/lib/constants/index.ts`

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh-token',
    GOOGLE: '/oauth/google',
    DISCORD: '/oauth/discord',
  },
  RESTAURANTS: {
    SEARCH: '/restaurants/search',
    NEARBY: '/restaurants/nearby',
    DETAIL: (id: string) => `/restaurants/${id}`,
  },
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: (id: string) => `/favorites/${id}`,
  },
  VISITS: {
    LIST: '/visits',
    ADD: '/visits',
    REMOVE: (id: string) => `/visits/${id}`,
  },
} as const

export const LIMITS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_DEBOUNCE_MS: 300,
} as const

export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 25.0330, lng: 121.5654 }, // 台北
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
} as const
```

---

## 8. 驗證清單

完成修正後，請執行以下指令確認:

```bash
# 檢查 TypeScript 類型
npm run type-check

# 檢查 ESLint
npm run lint

# 檢查 Prettier 格式
npm run format:check

# 執行構建確認無錯誤
npm run build
```

所有指令都應該成功通過，不應有任何錯誤或警告。
