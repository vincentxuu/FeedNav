# FeedNav Serverless 修正指南

本文件詳細說明 `feednav-serverless` 專案需要進行的修正，參考 `nobodyclimb-fe/backend` 專案的最佳實踐。

> **狀態更新: 2026-01-28**
> - ✅ 已完成: 1.1, 1.2, 1.4, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4
> - ⬜ 待處理: 1.3, 3.x (三層架構), 5, 6, 7

---

## 參考專案架構

`nobodyclimb-fe/backend` 採用清晰的三層架構：

```
backend/
├── src/
│   ├── index.ts                 # 應用入口 & 路由配置
│   ├── types.ts                 # 集中型別定義
│   ├── middleware/              # 中間件層
│   │   ├── auth.ts              # JWT 認證
│   │   ├── accessLog.ts         # 訪問日誌
│   │   └── rateLimit.ts         # 速率限制
│   ├── routes/                  # API 路由處理器
│   ├── services/                # 業務邏輯層
│   ├── repositories/            # 資料存取層
│   └── utils/                   # 工具函數
├── migrations/                  # D1 資料庫遷移
└── wrangler.toml
```

---

## 1. 配置文件修正

### 1.1 添加 ESLint 配置 ✅ 已完成

**創建:** `.eslintrc.json`
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["node_modules", "dist", ".wrangler"]
}
```

**安裝依賴:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 1.2 添加 Prettier 配置 ✅ 已完成

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
  "endOfLine": "lf"
}
```

**創建:** `.prettierignore`
```
node_modules
dist
.wrangler
coverage
```

**安裝依賴:**
```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### 1.3 更新 TypeScript 配置

**修改:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "lib": ["ES2022"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@handlers/*": ["./src/handlers/*"],
      "@middleware/*": ["./src/middleware/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 更新 package.json 腳本 ✅ 已完成

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:production": "wrangler deploy --env production",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 2. 專案結構重構

### 2.1 目標結構

從現有的扁平結構重構為三層架構：

**現有結構:**
```
src/
├── handlers/           # 混合路由和業務邏輯
├── middleware/
├── utils/
├── types/
└── index.ts
```

**目標結構:**
```
src/
├── index.ts                 # 應用入口
├── types.ts                 # 集中型別定義
├── constants.ts             # 常數定義
├── middleware/
│   ├── auth.ts              # JWT 認證
│   ├── cors.ts              # CORS 配置
│   ├── accessLog.ts         # 訪問日誌 (新增)
│   └── rateLimit.ts         # 速率限制 (新增)
├── routes/                  # 路由處理器 (從 handlers 重命名)
│   ├── auth.ts
│   ├── oauth.ts
│   ├── restaurants.ts
│   ├── favorites.ts
│   └── visits.ts
├── services/                # 業務邏輯層 (新增)
│   ├── auth-service.ts
│   ├── restaurant-service.ts
│   ├── favorite-service.ts
│   └── visit-service.ts
├── repositories/            # 資料存取層 (新增)
│   ├── user-repository.ts
│   ├── restaurant-repository.ts
│   ├── favorite-repository.ts
│   └── visit-repository.ts
├── utils/
│   ├── hash.ts
│   ├── jwt.ts
│   ├── oauth.ts
│   └── validators.ts
└── errors/                  # 錯誤處理 (新增)
    └── index.ts
```

### 2.2 創建常數文件 ✅ 已完成

**創建:** `src/constants.ts`
```typescript
// JWT 配置
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 60 * 60,           // 1 小時
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
    WINDOW_MS: 15 * 60 * 1000,  // 15 分鐘
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 60 * 1000,       // 1 分鐘
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
```

### 2.3 創建錯誤處理層

**創建:** `src/errors/index.ts`
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toResponse() {
    return {
      success: false,
      error: this.errorCode,
      message: this.message,
    }
  }
}

// 預定義錯誤
export const Errors = {
  // 認證錯誤 (401)
  UNAUTHORIZED: () => new ApiError(401, 'UNAUTHORIZED', '未授權的請求'),
  INVALID_TOKEN: () => new ApiError(401, 'INVALID_TOKEN', '無效的 Token'),
  TOKEN_EXPIRED: () => new ApiError(401, 'TOKEN_EXPIRED', 'Token 已過期'),

  // 授權錯誤 (403)
  FORBIDDEN: () => new ApiError(403, 'FORBIDDEN', '沒有權限執行此操作'),
  ADMIN_REQUIRED: () => new ApiError(403, 'ADMIN_REQUIRED', '需要管理員權限'),

  // 資源錯誤 (404)
  NOT_FOUND: (resource: string) =>
    new ApiError(404, 'NOT_FOUND', `${resource}不存在`),
  USER_NOT_FOUND: () => new ApiError(404, 'USER_NOT_FOUND', '用戶不存在'),
  RESTAURANT_NOT_FOUND: () =>
    new ApiError(404, 'RESTAURANT_NOT_FOUND', '餐廳不存在'),

  // 驗證錯誤 (400)
  VALIDATION_ERROR: (message: string) =>
    new ApiError(400, 'VALIDATION_ERROR', message),
  INVALID_CREDENTIALS: () =>
    new ApiError(400, 'INVALID_CREDENTIALS', '帳號或密碼錯誤'),

  // 衝突錯誤 (409)
  EMAIL_EXISTS: () =>
    new ApiError(409, 'EMAIL_EXISTS', '此電子郵件已被註冊'),
  ALREADY_EXISTS: (resource: string) =>
    new ApiError(409, 'ALREADY_EXISTS', `${resource}已存在`),

  // 伺服器錯誤 (500)
  INTERNAL_ERROR: () =>
    new ApiError(500, 'INTERNAL_ERROR', '伺服器發生錯誤'),
} as const
```

---

## 3. 三層架構實作範例

### 3.1 Repository 層 (資料存取)

**創建:** `src/repositories/restaurant-repository.ts`
```typescript
import type { D1Database } from '@cloudflare/workers-types'
import type { Restaurant, RestaurantFilters } from '@/types'
import { PAGINATION } from '@/constants'

export class RestaurantRepository {
  constructor(private db: D1Database) {}

  async findMany(filters: RestaurantFilters): Promise<Restaurant[]> {
    const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, ...rest } = filters
    const offset = (page - 1) * limit

    let query = `
      SELECT r.*,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data
      FROM restaurants r
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (rest.searchTerm) {
      query += ` AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)`
      const term = `%${rest.searchTerm}%`
      params.push(term, term, term)
    }

    if (rest.cuisineType) {
      query += ` AND r.cuisine_type = ?`
      params.push(rest.cuisineType)
    }

    if (rest.district) {
      query += ` AND r.district = ?`
      params.push(rest.district)
    }

    if (rest.priceLevel) {
      query += ` AND r.price_level = ?`
      params.push(rest.priceLevel)
    }

    query += ` GROUP BY r.id ORDER BY r.rating DESC NULLS LAST LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const results = await this.db.prepare(query).bind(...params).all<Restaurant>()
    return results.results || []
  }

  async count(filters: Omit<RestaurantFilters, 'page' | 'limit'>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM restaurants r WHERE 1=1`
    const params: (string | number)[] = []

    if (filters.searchTerm) {
      query += ` AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)`
      const term = `%${filters.searchTerm}%`
      params.push(term, term, term)
    }

    // ... 其他過濾條件

    const result = await this.db.prepare(query).bind(...params).first<{ count: number }>()
    return result?.count || 0
  }

  async findById(id: string): Promise<Restaurant | null> {
    const result = await this.db
      .prepare(`SELECT * FROM restaurants WHERE id = ?`)
      .bind(id)
      .first<Restaurant>()
    return result || null
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number
  ): Promise<Restaurant[]> {
    // Haversine 公式計算距離
    const query = `
      SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
      FROM restaurants
      HAVING distance < ?
      ORDER BY distance
      LIMIT ?
    `
    const results = await this.db
      .prepare(query)
      .bind(latitude, longitude, latitude, radiusKm, limit)
      .all<Restaurant>()
    return results.results || []
  }
}
```

### 3.2 Service 層 (業務邏輯)

**創建:** `src/services/restaurant-service.ts`
```typescript
import type { D1Database } from '@cloudflare/workers-types'
import { RestaurantRepository } from '@/repositories/restaurant-repository'
import type { Restaurant, RestaurantFilters, PaginatedResponse } from '@/types'
import { Errors } from '@/errors'

export class RestaurantService {
  private repository: RestaurantRepository

  constructor(db: D1Database) {
    this.repository = new RestaurantRepository(db)
  }

  async search(filters: RestaurantFilters): Promise<PaginatedResponse<Restaurant>> {
    const [restaurants, total] = await Promise.all([
      this.repository.findMany(filters),
      this.repository.count(filters),
    ])

    const page = filters.page || 1
    const limit = filters.limit || 20
    const totalPages = Math.ceil(total / limit)

    return {
      data: restaurants.map((r) => this.formatRestaurant(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  async getById(id: string): Promise<Restaurant> {
    const restaurant = await this.repository.findById(id)
    if (!restaurant) {
      throw Errors.RESTAURANT_NOT_FOUND()
    }
    return this.formatRestaurant(restaurant)
  }

  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    limit: number = 20
  ): Promise<Restaurant[]> {
    const restaurants = await this.repository.findNearby(
      latitude,
      longitude,
      radiusKm,
      limit
    )
    return restaurants.map((r) => this.formatRestaurant(r))
  }

  private formatRestaurant(restaurant: Restaurant): Restaurant {
    // 解析 tags_data 字串為結構化資料
    const tagsData = (restaurant as any).tags_data
    if (tagsData) {
      restaurant.tags = tagsData.split(',').map((tagStr: string) => {
        const [id, name, category, color, isPositive] = tagStr.split(':')
        return {
          id,
          name,
          category: category || null,
          color: color || null,
          is_positive: isPositive === '1',
        }
      })
    }
    delete (restaurant as any).tags_data
    return restaurant
  }
}
```

### 3.3 Route 層 (路由處理)

**修改:** `src/routes/restaurants.ts`
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '@/types'
import { RestaurantService } from '@/services/restaurant-service'
import { PAGINATION } from '@/constants'
import { ApiError } from '@/errors'

const searchSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  q: z.string().optional(),
  cuisine_type: z.string().optional(),
  district: z.string().optional(),
  price_level: z.coerce.number().int().min(1).max(5).optional(),
})

const nearbySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(5),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export const restaurantsRoutes = new Hono<{ Bindings: Env }>()

// GET /restaurants/search
restaurantsRoutes.get(
  '/search',
  zValidator('query', searchSchema),
  async (c) => {
    const params = c.req.valid('query')
    const service = new RestaurantService(c.env.DB)

    const result = await service.search({
      page: params.page,
      limit: params.limit,
      searchTerm: params.q,
      cuisineType: params.cuisine_type,
      district: params.district,
      priceLevel: params.price_level,
    })

    return c.json({ success: true, ...result })
  }
)

// GET /restaurants/nearby
restaurantsRoutes.get(
  '/nearby',
  zValidator('query', nearbySchema),
  async (c) => {
    const { latitude, longitude, radius, limit } = c.req.valid('query')
    const service = new RestaurantService(c.env.DB)

    const restaurants = await service.getNearby(latitude, longitude, radius, limit)

    return c.json({ success: true, data: restaurants })
  }
)

// GET /restaurants/:id
restaurantsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const service = new RestaurantService(c.env.DB)

  try {
    const restaurant = await service.getById(id)
    return c.json({ success: true, data: restaurant })
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(error.toResponse(), error.statusCode)
    }
    throw error
  }
})
```

---

## 4. 中間件改進

### 4.1 提取 CORS 配置

**創建:** `src/middleware/cors.ts`
```typescript
import { cors } from 'hono/cors'
import type { Env } from '@/types'

export function createCorsMiddleware(env: Env) {
  const envOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || []

  const allowedOrigins = [
    ...envOrigins,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]

  return cors({
    origin: (origin) => {
      if (!origin) return null
      return allowedOrigins.includes(origin) ? origin : null
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
}
```

### 4.2 添加訪問日誌中間件

**創建:** `src/middleware/accessLog.ts`
```typescript
import { createMiddleware } from 'hono/factory'
import type { Env } from '@/types'

export const accessLogMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const startTime = Date.now()

    await next()

    const responseTime = Date.now() - startTime
    const method = c.req.method
    const path = new URL(c.req.url).pathname
    const statusCode = c.res.status
    const userAgent = c.req.header('user-agent') || ''
    const userId = c.get('userId') || 'anonymous'

    // 如果有 Analytics Engine，寫入日誌
    if (c.env.ACCESS_LOGS) {
      try {
        c.env.ACCESS_LOGS.writeDataPoint({
          blobs: [method, path, userAgent, userId, String(statusCode)],
          doubles: [responseTime, statusCode],
          indexes: [path],
        })
      } catch (error) {
        console.error('Failed to write access log:', error)
      }
    }
  }
)
```

### 4.3 添加速率限制中間件

**創建:** `src/middleware/rateLimit.ts`
```typescript
import { createMiddleware } from 'hono/factory'
import type { Env } from '@/types'
import { RATE_LIMIT } from '@/constants'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  config: { windowMs: number; maxRequests: number; keyPrefix: string }
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()

  const recordJson = await kv.get(key)
  const requests: number[] = recordJson ? JSON.parse(recordJson) : []

  // 移除過期的請求記錄
  const validRequests = requests.filter((ts) => ts > now - config.windowMs)

  if (validRequests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...validRequests)
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // 記錄新請求
  validRequests.push(now)
  await kv.put(key, JSON.stringify(validRequests), {
    expirationTtl: Math.ceil(config.windowMs / 1000) + 60,
  })

  return { allowed: true, remaining: config.maxRequests - validRequests.length }
}

export const loginRateLimitMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'

    const result = await checkRateLimit(c.env.CACHE, ip, {
      ...RATE_LIMIT.LOGIN,
      keyPrefix: 'ratelimit:login',
    })

    if (!result.allowed) {
      return c.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: '請求過於頻繁，請稍後再試',
          retryAfter: result.retryAfter,
        },
        429
      )
    }

    c.res.headers.set('X-RateLimit-Remaining', String(result.remaining))
    await next()
  }
)

export const apiRateLimitMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'

    const result = await checkRateLimit(c.env.CACHE, ip, {
      ...RATE_LIMIT.API,
      keyPrefix: 'ratelimit:api',
    })

    if (!result.allowed) {
      return c.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: '請求過於頻繁，請稍後再試',
          retryAfter: result.retryAfter,
        },
        429
      )
    }

    c.res.headers.set('X-RateLimit-Remaining', String(result.remaining))
    await next()
  }
)
```

### 4.4 改進認證中間件

**修改:** `src/middleware/auth.ts`
```typescript
import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'
import type { Env } from '@/types'

// 標準認證中間件
export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        { success: false, error: 'UNAUTHORIZED', message: '缺少授權標頭' },
        401
      )
    }

    const token = authHeader.substring(7)

    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: c.env.JWT_ISSUER || 'feednav-api',
      })

      c.set('user', payload)
      c.set('userId', payload.sub as string)

      await next()
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return c.json(
          { success: false, error: 'TOKEN_EXPIRED', message: 'Token 已過期' },
          401
        )
      }
      return c.json(
        { success: false, error: 'INVALID_TOKEN', message: '無效的 Token' },
        401
      )
    }
  }
)

// 可選認證中間件 (有 token 則驗證，無 token 則繼續)
export const optionalAuthMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET)
        const { payload } = await jose.jwtVerify(token, secret)

        c.set('user', payload)
        c.set('userId', payload.sub as string)
      } catch {
        // 忽略驗證錯誤，繼續執行
      }
    }

    await next()
  }
)
```

---

## 5. 全局錯誤處理

**修改:** `src/index.ts`
```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from '@/types'
import { ApiError } from '@/errors'
import { createCorsMiddleware } from '@/middleware/cors'
import { accessLogMiddleware } from '@/middleware/accessLog'
import { authRoutes } from '@/routes/auth'
import { oauthRoutes } from '@/routes/oauth'
import { restaurantsRoutes } from '@/routes/restaurants'
import { favoritesRoutes } from '@/routes/favorites'
import { visitsRoutes } from '@/routes/visits'

const app = new Hono<{ Bindings: Env }>()

// 全局中間件
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', accessLogMiddleware)
app.use('*', (c, next) => createCorsMiddleware(c.env)(c, next))

// 全局錯誤處理
app.onError((err, c) => {
  console.error('Error:', err)

  if (err instanceof ApiError) {
    return c.json(err.toResponse(), err.statusCode)
  }

  // 不洩露詳細錯誤給客戶端
  return c.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '伺服器發生錯誤',
    },
    500
  )
})

// 404 處理
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'NOT_FOUND',
      message: `路由 ${c.req.method} ${c.req.path} 不存在`,
    },
    404
  )
})

// API 路由
const api = new Hono<{ Bindings: Env }>()

api.route('/auth', authRoutes)
api.route('/oauth', oauthRoutes)
api.route('/restaurants', restaurantsRoutes)
api.route('/favorites', favoritesRoutes)
api.route('/visits', visitsRoutes)

app.route('/api', api)

// 健康檢查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
```

---

## 6. 類型定義集中管理

**修改:** `src/types.ts` (或 `src/types/index.ts`)
```typescript
// 環境變數類型
export interface Env {
  DB: D1Database
  CACHE: KVNamespace
  STORAGE?: R2Bucket
  ACCESS_LOGS?: AnalyticsEngineDataset
  JWT_SECRET: string
  JWT_ISSUER?: string
  CORS_ORIGIN?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  DISCORD_CLIENT_ID?: string
  DISCORD_CLIENT_SECRET?: string
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
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 使用者類型
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// 餐廳類型
export interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  district: string | null
  latitude: number
  longitude: number
  price_level: number | null
  cuisine_type: string | null
  image_url: string | null
  rating: number | null
  review_count: number
  tags?: RestaurantTag[]
}

export interface RestaurantTag {
  id: string
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
}

// 收藏類型
export interface Favorite {
  id: string
  user_id: string
  restaurant_id: string
  notes: string | null
  created_at: string
}

// 造訪記錄類型
export interface Visit {
  id: string
  user_id: string
  restaurant_id: string
  visited_at: string
  rating: number | null
  notes: string | null
  created_at: string
}

// JWT Payload 類型
export interface JwtPayload {
  sub: string
  email: string
  name: string
  iat: number
  exp: number
  iss: string
}
```

---

## 7. 添加單元測試

**創建:** `tests/services/restaurant-service.test.ts`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RestaurantService } from '@/services/restaurant-service'

describe('RestaurantService', () => {
  let mockDb: any
  let service: RestaurantService

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(),
      first: vi.fn(),
    }
    service = new RestaurantService(mockDb)
  })

  describe('search', () => {
    it('should return paginated restaurants', async () => {
      mockDb.all.mockResolvedValueOnce({
        results: [
          { id: '1', name: 'Restaurant 1' },
          { id: '2', name: 'Restaurant 2' },
        ],
      })
      mockDb.first.mockResolvedValueOnce({ count: 10 })

      const result = await service.search({ page: 1, limit: 20 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(10)
      expect(result.pagination.totalPages).toBe(1)
    })
  })

  describe('getById', () => {
    it('should return restaurant when found', async () => {
      mockDb.first.mockResolvedValueOnce({ id: '1', name: 'Restaurant 1' })

      const result = await service.getById('1')

      expect(result.id).toBe('1')
    })

    it('should throw error when not found', async () => {
      mockDb.first.mockResolvedValueOnce(null)

      await expect(service.getById('999')).rejects.toThrow('餐廳不存在')
    })
  })
})
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

# 執行測試
npm run test

# 本地開發測試
npm run dev
```

---

## 9. 遷移步驟

### 階段一：配置文件 (Day 1)
1. [ ] 添加 ESLint 配置
2. [ ] 添加 Prettier 配置
3. [ ] 更新 TypeScript 配置
4. [ ] 更新 package.json 腳本

### 階段二：錯誤處理和類型 (Day 2)
1. [ ] 創建 `src/errors/index.ts`
2. [ ] 更新 `src/types.ts`
3. [ ] 創建 `src/constants.ts`

### 階段三：中間件改進 (Day 3)
1. [ ] 提取 CORS 到 `src/middleware/cors.ts`
2. [ ] 添加訪問日誌中間件
3. [ ] 添加速率限制中間件
4. [ ] 改進認證中間件

### 階段四：三層架構重構 (Day 4-5)
1. [ ] 創建 Repository 層
2. [ ] 創建 Service 層
3. [ ] 重構 Routes (從 handlers 遷移)

### 階段五：測試和文檔 (Day 6)
1. [ ] 添加單元測試
2. [ ] 更新 API 文檔
3. [ ] 執行完整驗證
