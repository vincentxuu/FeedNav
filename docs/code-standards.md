# FeedNav 統一程式碼標準

本文件定義 FeedNav 專案應遵循的程式碼標準，參考 `nobodyclimb-fe` 專案的最佳實踐。

---

## 1. ESLint 配置

### 前端專案 (feednav-fe)

創建 `.eslintrc.json`:
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

### 後端專案 (feednav-serverless)

創建 `.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2021,
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
    "es2021": true
  }
}
```

---

## 2. Prettier 配置

兩個專案使用相同的 `.prettierrc.json`:

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

前端專案額外安裝 Tailwind 插件:
```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:
```
node_modules
.next
dist
build
.wrangler
coverage
```

---

## 3. TypeScript 配置

### 通用設定

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### 路徑別名配置

前端 (`feednav-fe/tsconfig.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

後端 (`feednav-serverless/tsconfig.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@handlers/*": ["./src/handlers/*"],
      "@middleware/*": ["./src/middleware/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

---

## 4. 檔案命名規範

| 類型 | 命名規則 | 範例 |
|------|---------|------|
| React 元件 | PascalCase | `RestaurantCard.tsx` |
| 自訂 Hooks | camelCase, use 前綴 | `useAuthSession.ts` |
| 工具函式 | camelCase | `tokenStorage.ts` |
| 常數檔案 | kebab-case 或 camelCase | `api-endpoints.ts` |
| 類型定義 | camelCase | `restaurant.ts` |
| 測試檔案 | 原檔名 + .test/.spec | `auth.test.ts` |

---

## 5. 資料夾結構標準

### 前端專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # 頁面路由
│   ├── layout.tsx         # 根佈局
│   └── globals.css        # 全域樣式
├── components/
│   ├── [feature]/         # 按功能領域分組
│   ├── shared/            # 跨功能共用元件
│   ├── ui/                # 基礎 UI 元件
│   └── layout/            # 佈局元件
├── lib/
│   ├── api/               # API 層
│   │   ├── client.ts      # API 客戶端實例
│   │   ├── services.ts    # API 服務函式
│   │   └── endpoints.ts   # API 端點定義
│   ├── constants/         # 常數定義
│   ├── hooks/             # 自訂 Hooks
│   ├── types/             # TypeScript 類型
│   └── utils/             # 工具函式
├── store/                 # 狀態管理 (如使用 Zustand)
└── queries/               # React Query 查詢
```

### 後端專案結構

```
src/
├── handlers/              # API 路由處理器
├── middleware/            # 中間件
├── services/              # 業務邏輯服務
├── utils/                 # 工具函式
├── types/                 # 類型定義
├── constants/             # 常數定義
├── errors/                # 錯誤處理
└── index.ts               # 主入口
tests/
└── __tests__/             # 測試文件
```

---

## 6. 元件編寫標準

### React 元件模板

```typescript
'use client'  // 如果是客戶端元件

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ComponentProps } from '@/lib/types'

interface MyComponentProps {
  /** 屬性說明 */
  title: string
  /** 可選屬性 */
  className?: string
}

export function MyComponent({ title, className }: MyComponentProps) {
  const [state, setState] = useState<string>('')

  const handleAction = useCallback(() => {
    // 實現邏輯
  }, [])

  return (
    <div className={cn('base-styles', className)}>
      <h1>{title}</h1>
    </div>
  )
}

MyComponent.displayName = 'MyComponent'
```

### 自訂 Hook 模板

```typescript
'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

interface UseFeatureOptions {
  enabled?: boolean
}

interface UseFeatureReturn {
  data: DataType | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useFeature(options: UseFeatureOptions = {}): UseFeatureReturn {
  const { enabled = true } = options

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feature'],
    queryFn: () => apiClient.getFeature(),
    enabled,
  })

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
```

---

## 7. API 客戶端標準

### 前端 API 客戶端

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios'
import { getToken, setToken, clearToken } from '@/lib/utils/tokenStorage'

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 500, 502, 503, 504],
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 請求攔截器: 添加 Token
    this.client.interceptors.request.use((config) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 響應攔截器: 處理錯誤和 Token 刷新
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 嘗試刷新 Token
          const refreshed = await this.refreshToken()
          if (refreshed && error.config) {
            return this.client.request(error.config)
          }
          clearToken()
          window.location.href = '/auth/login'
        }
        throw error
      }
    )
  }

  private async refreshToken(): Promise<boolean> {
    // 實現 Token 刷新邏輯
    return false
  }
}

export const apiClient = new ApiClient()
```

### 後端錯誤處理標準

```typescript
// src/errors/ApiError.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// src/errors/index.ts
export const Errors = {
  UNAUTHORIZED: new ApiError(401, 'UNAUTHORIZED', '未授權的請求'),
  NOT_FOUND: new ApiError(404, 'NOT_FOUND', '資源不存在'),
  VALIDATION_ERROR: new ApiError(400, 'VALIDATION_ERROR', '驗證失敗'),
  INTERNAL_ERROR: new ApiError(500, 'INTERNAL_ERROR', '伺服器錯誤'),
}
```

---

## 8. 類型定義標準

### 統一 API 響應類型

```typescript
// types/api.ts
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
```

### 按領域組織類型

```typescript
// types/restaurant.ts
export interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  // ...
}

// types/user.ts
export interface User {
  id: string
  email: string
  name: string
  // ...
}

// types/index.ts
export * from './restaurant'
export * from './user'
export * from './api'
```

---

## 9. 常數管理標準

```typescript
// constants/index.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh-token',
  },
  RESTAURANTS: {
    SEARCH: '/restaurants/search',
    DETAIL: (id: string) => `/restaurants/${id}`,
  },
} as const

export const LIMITS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  JWT_EXPIRY_SECONDS: 60 * 60, // 1 小時
  REFRESH_TOKEN_TTL: 30 * 24 * 60 * 60, // 30 天
} as const

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 100,
} as const
```

---

## 10. 註解標準

### JSDoc 註解

```typescript
/**
 * 根據關鍵字搜尋餐廳
 * @param query - 搜尋關鍵字
 * @param options - 搜尋選項
 * @returns 餐廳列表
 * @throws {ApiError} 當 API 請求失敗時
 */
export async function searchRestaurants(
  query: string,
  options?: SearchOptions
): Promise<Restaurant[]> {
  // 實現
}
```

### 行內註解

```typescript
// 只在複雜或不明顯的邏輯處添加註解
const result = items.filter((item) => {
  // 排除已刪除和未發布的項目
  return !item.deleted && item.status === 'published'
})
```

---

## 11. Git Commit 規範

遵循 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型

| Type | 說明 |
|------|------|
| feat | 新功能 |
| fix | 修復 Bug |
| docs | 文檔更新 |
| style | 程式碼格式 (不影響功能) |
| refactor | 重構 |
| test | 測試相關 |
| chore | 建構/工具更新 |

### 範例

```
feat(auth): add token refresh mechanism

- Implement automatic token refresh on 401 response
- Add retry logic with exponential backoff
- Store tokens in both cookie and localStorage

Closes #123
```

---

## 12. package.json 腳本標準

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```
