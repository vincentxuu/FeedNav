# FeedNav API 完整文檔

## 基本信息

- **基礎 URL**: `https://your-worker.your-subdomain.workers.dev`
- **認證方式**: Bearer Token (JWT) + OAuth 2.0
- **回應格式**: JSON
- **API 版本**: v1

## 🔄 通用回應格式

### 成功回應
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": "Error Type",
  "message": "錯誤描述"
}
```

### 分頁回應
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🔐 認證 API

### 1. 用戶註冊

**POST** `/api/auth/register`

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  },
  "message": "註冊成功"
}
```

**錯誤碼**:
- `409 Conflict`: 電子郵件已被註冊
- `400 Bad Request`: 輸入驗證失敗

### 2. 用戶登入

**POST** `/api/auth/login`

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "使用者名稱",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "message": "登入成功"
}
```

**錯誤碼**:
- `401 Unauthorized`: 帳號密碼錯誤
- `400 Bad Request`: 輸入驗證失敗

### 3. 刷新 Token

**POST** `/api/auth/refresh`

**請求體**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  },
  "message": "令牌刷新成功"
}
```

### 4. 用戶登出

**POST** `/api/auth/logout`

**請求體**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**回應**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 5. 獲取當前用戶

**GET** `/api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "使用者名稱",
      "avatar": "https://example.com/avatar.jpg",
      "is_email_verified": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 🌐 OAuth 認證 API

### 1. Google OAuth 登入

**GET** `/api/oauth/google`

直接重定向到 Google 認證頁面。成功後重定向到前端回調頁面：
```
https://your-frontend.com/auth/success?token=JWT_TOKEN&refresh=REFRESH_TOKEN&new=false
```

### 2. Discord OAuth 登入

**GET** `/api/oauth/discord`

直接重定向到 Discord 認證頁面。成功後重定向到前端回調頁面：
```
https://your-frontend.com/auth/success?token=JWT_TOKEN&refresh=REFRESH_TOKEN&new=true
```

### 3. 獲取社交帳戶

**GET** `/api/oauth/accounts`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "provider": "google",
        "provider_name": "John Doe",
        "provider_email": "john@gmail.com",
        "provider_avatar": "https://lh3.googleusercontent.com/...",
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "provider": "discord",
        "provider_name": "JohnDoe#1234",
        "provider_email": "john@discord.com",
        "provider_avatar": "https://cdn.discordapp.com/avatars/...",
        "created_at": "2024-01-02T00:00:00Z"
      }
    ]
  }
}
```

### 4. 移除社交帳戶

**DELETE** `/api/oauth/accounts/:provider`

**Headers**: `Authorization: Bearer <token>`

**路徑參數**:
- `provider`: `google` 或 `discord`

**回應**:
```json
{
  "success": true,
  "message": "google 帳戶關聯已移除"
}
```

**錯誤碼**:
- `400 Bad Request`: 無法移除最後一個認證方式
- `404 Not Found`: 找不到要移除的帳戶

## 🍽️ 餐廳搜索 API

### 1. 搜索餐廳

**POST** `/api/restaurants/search`

**Headers**: `Authorization: Bearer <token>` (可選，用於個人化結果)

**請求體**:
```json
{
  "searchTerm": "火鍋",
  "sortBy": "rating_desc",
  "district": "信義區",
  "cuisine": "火鍋",
  "priceRange": [2, 4],
  "tags": ["米其林推薦", "寵物友善"],
  "page": 1,
  "limit": 20
}
```

**參數說明**:
- `searchTerm`: 搜索關鍵詞 (可選) - 搜索餐廳名稱、描述和地址
- `sortBy`: 排序方式 (可選)
  - `default`: 預設排序
  - `rating_desc`: 評分由高到低
  - `price_asc`: 價格由低到高
  - `price_desc`: 價格由高到低
- `district`: 地區篩選 (可選)
- `cuisine`: 料理類型篩選 (可選)
- `priceRange`: 價格範圍 `[min, max]` (可選，1-5)
- `tags`: 標籤篩選數組 (可選)
- `page`: 頁碼，預設 1
- `limit`: 每頁數量，預設 20，最大 100

**回應**:
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "鼎王麻辣鍋",
        "district": "信義區",
        "cuisine_type": "火鍋",
        "rating": 4.5,
        "price_level": 3,
        "photos": ["url1", "url2"],
        "address": "台北市信義區...",
        "phone": "02-1234-5678",
        "website": "https://example.com",
        "opening_hours": "11:00-22:00",
        "description": "知名火鍋連鎖店",
        "latitude": 25.033,
        "longitude": 121.565,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": [
          {
            "id": 1,
            "name": "米其林推薦",
            "category": "award",
            "color": "yellow",
            "is_positive": true
          }
        ],
        "is_favorited": true,
        "is_visited": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. 獲取單一餐廳

**GET** `/api/restaurants/:id`

**Headers**: `Authorization: Bearer <token>` (可選，用於個人化結果)

**路徑參數**:
- `id`: 餐廳 ID

**回應**: 單一餐廳對象 (同搜索結果中的餐廳格式)

**錯誤碼**:
- `404 Not Found`: 餐廳不存在
- `400 Bad Request`: 無效的餐廳 ID

### 3. 獲取附近餐廳

**GET** `/api/restaurants/nearby?lat=25.033&lng=121.565&radius=5&limit=10`

**Headers**: `Authorization: Bearer <token>` (可選，用於個人化結果)

**查詢參數**:
- `lat`: 緯度 (必需)
- `lng`: 經度 (必需)
- `radius`: 搜索半徑 (公里)，預設 5
- `limit`: 結果數量，預設 10，最大 50

**回應**:
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        // 餐廳資訊 (同搜索結果)
        "distance": 1.2
      }
    ]
  }
}
```

**錯誤碼**:
- `400 Bad Request`: 缺少必需的經緯度參數

### 4. 獲取所有標籤

**GET** `/api/restaurants/tags`

**回應**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "米其林推薦",
        "category": "award",
        "color": "yellow",
        "is_positive": true
      },
      {
        "id": 2,
        "name": "寵物友善",
        "category": "amenity",
        "color": "green",
        "is_positive": true
      }
    ]
  }
}
```

## ❤️ 收藏 API

### 1. 獲取收藏列表

**GET** `/api/favorites?page=1&limit=20`

**Headers**: `Authorization: Bearer <token>`

**查詢參數**:
- `page`: 頁碼，預設 1
- `limit`: 每頁數量，預設 20，最大 100

**回應**:
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        // 餐廳資訊 (同搜索結果)
        "favorited_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 2. 添加收藏

**POST** `/api/favorites`

**Headers**: `Authorization: Bearer <token>`

**請求體**:
```json
{
  "restaurant_id": 123
}
```

**回應**:
```json
{
  "success": true,
  "message": "添加收藏成功"
}
```

**錯誤碼**:
- `404 Not Found`: 餐廳不存在
- `409 Conflict`: 已在收藏列表中

### 3. 移除收藏

**DELETE** `/api/favorites/:restaurantId`

**Headers**: `Authorization: Bearer <token>`

**路徑參數**:
- `restaurantId`: 餐廳 ID

**回應**:
```json
{
  "success": true,
  "message": "取消收藏成功"
}
```

**錯誤碼**:
- `404 Not Found`: 收藏記錄不存在
- `400 Bad Request`: 無效的餐廳 ID

### 4. 檢查收藏狀態

**GET** `/api/favorites/check/:restaurantId`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "data": {
    "is_favorited": true,
    "favorited_at": "2024-01-01T00:00:00Z"
  }
}
```

## 📝 造訪記錄 API

### 1. 獲取造訪列表

**GET** `/api/visits?page=1&limit=20`

**Headers**: `Authorization: Bearer <token>`

**查詢參數**:
- `page`: 頁碼，預設 1
- `limit`: 每頁數量，預設 20，最大 100

**回應**: 同收藏列表格式，但包含 `visited_at` 時間

### 2. 添加造訪記錄

**POST** `/api/visits`

**Headers**: `Authorization: Bearer <token>`

**請求體**:
```json
{
  "restaurant_id": 123
}
```

**回應**:
```json
{
  "success": true,
  "message": "添加造訪記錄成功"
}
```

### 3. 移除造訪記錄

**DELETE** `/api/visits/:restaurantId`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "message": "移除造訪記錄成功"
}
```

### 4. 檢查造訪狀態

**GET** `/api/visits/check/:restaurantId`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "data": {
    "is_visited": true,
    "visited_at": "2024-01-01T00:00:00Z"
  }
}
```

### 5. 獲取造訪統計

**GET** `/api/visits/stats`

**Headers**: `Authorization: Bearer <token>`

**回應**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_visited": 25,
      "districts_visited": 8,
      "cuisines_tried": 12,
      "avg_rating": 4.2,
      "budget_friendly": 10,
      "high_end": 5
    },
    "recent_visits": [
      {
        "name": "餐廳名稱",
        "district": "信義區",
        "cuisine_type": "日式料理",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## 🚨 錯誤碼參考

| HTTP 狀態碼 | 錯誤類型 | 說明 | 常見場景 |
|-------------|----------|------|----------|
| 400 | Bad Request | 請求參數錯誤 | 輸入驗證失敗、缺少必要參數 |
| 401 | Unauthorized | 未認證或認證失效 | Token 過期、未提供 Token |
| 403 | Forbidden | 無權限訪問 | 權限不足 |
| 404 | Not Found | 資源不存在 | 餐廳、用戶或記錄不存在 |
| 409 | Conflict | 資源衝突 | 重複收藏、電子郵件已註冊 |
| 422 | Validation Error | 輸入驗證失敗 | Zod 驗證錯誤 |
| 429 | Too Many Requests | 請求頻率過高 | 達到速率限制 |
| 500 | Internal Server Error | 伺服器內部錯誤 | 系統錯誤 |

## 📝 使用範例

### JavaScript/TypeScript

```typescript
// 設置 API 基底配置
const API_BASE_URL = 'https://your-worker.workers.dev'

class FeedNavAPI {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    return response.json()
  }

  // 認證相關
  async register(email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (result.success) {
      this.setToken(result.data.token)
    }
    
    return result
  }

  // 餐廳搜索
  async searchRestaurants(filters: {
    searchTerm?: string
    sortBy?: string
    district?: string
    cuisine?: string
    priceRange?: [number, number]
    tags?: string[]
    page?: number
    limit?: number
  }) {
    return this.request('/api/restaurants/search', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  // 收藏功能
  async addFavorite(restaurantId: number) {
    return this.request('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    })
  }

  async getFavorites(page = 1, limit = 20) {
    return this.request(`/api/favorites?page=${page}&limit=${limit}`)
  }

  // 造訪記錄
  async addVisit(restaurantId: number) {
    return this.request('/api/visits', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    })
  }

  async getVisitStats() {
    return this.request('/api/visits/stats')
  }

  // OAuth 登入
  loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/api/oauth/google`
  }

  loginWithDiscord() {
    window.location.href = `${API_BASE_URL}/api/oauth/discord`
  }
}

// 使用範例
const api = new FeedNavAPI()

// 傳統登入
const loginResult = await api.login('user@example.com', 'password123')

// 搜索餐廳
const restaurants = await api.searchRestaurants({
  searchTerm: '火鍋',
  district: '信義區',
  priceRange: [2, 4],
  page: 1,
  limit: 20
})

// 添加收藏
await api.addFavorite(123)

// 獲取統計
const stats = await api.getVisitStats()
```

### cURL 範例

```bash
# 用戶註冊
curl -X POST https://your-worker.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 用戶登入
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 搜索餐廳 (使用 Token)
curl -X POST https://your-worker.workers.dev/api/restaurants/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "searchTerm": "火鍋",
    "district": "信義區",
    "sortBy": "rating_desc",
    "page": 1,
    "limit": 20
  }'

# 添加收藏
curl -X POST https://your-worker.workers.dev/api/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"restaurant_id": 123}'

# 獲取造訪統計
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-worker.workers.dev/api/visits/stats
```

## 🔧 開發者工具

### Postman Collection

我們提供 Postman Collection 文件，包含所有 API 端點的預設請求：

```json
{
  "info": {
    "name": "FeedNav API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://your-worker.workers.dev"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### SDK 和包裝器

我們計劃提供以下語言的 SDK：

- JavaScript/TypeScript (優先)
- Python
- PHP
- Go

## 📊 API 限制和配額

| 限制類型 | 限制值 | 說明 |
|----------|--------|------|
| 請求頻率 | 100 req/min | 每個 IP 地址的請求限制 |
| 認證請求 | 1000 req/hour | 已認證用戶的請求限制 |
| 搜索結果 | 100 items/page | 單次搜索最大結果數 |
| 檔案上傳 | 10 MB | 單個檔案大小限制 |
| Token 有效期 | 1 小時 | JWT Token 有效時間 |
| Refresh Token | 30 天 | Refresh Token 有效時間 |

## 🔗 相關連結

- [認證流程指南](./AUTH_GUIDE.md)
- [OAuth 設置指南](../OAUTH_SETUP.md)
- [錯誤處理最佳實踐](./ERROR_HANDLING.md)
- [SDK 文檔](./SDK_DOCS.md)

---

**FeedNav API** - 現代化的餐廳搜索 API 解決方案 🍽️