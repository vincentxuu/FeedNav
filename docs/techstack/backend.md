# Backend 技術棧

## 核心框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Hono** | 3.11.x | 輕量級 Web 框架 |
| **TypeScript** | 5.x | 型別安全 |
| **Cloudflare Workers** | - | Serverless Runtime |

## 資料庫與儲存

| 技術 | 用途 | 說明 |
|------|------|------|
| **Cloudflare D1** | 主資料庫 | SQLite 相容，邊緣分佈式 |
| **Cloudflare R2** | 物件儲存 | S3 相容，用於圖片/檔案 |
| **Cloudflare KV** | 快取 | Key-Value 儲存 |
| **Analytics Engine** | 存取日誌 | 即時分析 |

## 認證與安全

| 技術 | 版本 | 用途 |
|------|------|------|
| **jose** | 5.2.x | JWT 簽發與驗證 |
| **bcryptjs** | 2.4.x | 密碼雜湊 |
| **Zod** | 3.22.x | 請求驗證 |
| **@hono/zod-validator** | 0.2.x | Hono Zod 整合 |
| **nanoid** | 5.0.x | 唯一 ID 生成 |

## 測試框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Vitest** | 1.1.x | 單元測試框架 |

## 開發工具

| 技術 | 版本 | 用途 |
|------|------|------|
| **Wrangler** | 3.22.x | Cloudflare CLI |
| **@cloudflare/workers-types** | 4.x | TypeScript 型別 |
| **ESLint** | 8.56.x | 程式碼檢查 |
| **Prettier** | 3.2.x | 程式碼格式化 |

## 專案結構

```
feednav-serverless/
├── src/
│   ├── index.ts            # 主入口點與路由
│   ├── constants.ts        # 常數配置
│   ├── types/              # TypeScript 型別定義
│   │   └── index.ts
│   ├── handlers/           # API 路由處理器
│   │   ├── auth.ts         # 認證相關
│   │   ├── oauth.ts        # OAuth 社交登入
│   │   ├── restaurants.ts  # 餐廳 CRUD
│   │   ├── favorites.ts    # 收藏功能
│   │   └── visits.ts       # 造訪記錄
│   ├── middleware/         # 中介軟體
│   │   ├── auth.ts         # JWT 認證
│   │   ├── cors.ts         # CORS 處理
│   │   ├── rateLimit.ts    # 速率限制
│   │   └── accessLog.ts    # 存取日誌
│   ├── errors/             # 錯誤處理
│   │   └── index.ts
│   ├── utils/              # 工具函式
│   │   ├── jwt.ts          # JWT 工具
│   │   ├── hash.ts         # 密碼雜湊
│   │   ├── oauth.ts        # OAuth 工具
│   │   └── validators.ts   # 驗證工具
│   ├── repositories/       # 資料存取層
│   ├── services/           # 業務邏輯層
│   └── mappers/            # 資料轉換層
├── tests/                  # 測試檔案
├── migrations/             # D1 資料庫遷移
├── schema.sql              # 資料庫 Schema
├── wrangler.toml           # Cloudflare Workers 配置
└── vitest.config.ts        # Vitest 配置
```

## API 路由結構

```
/api/v1
├── /auth                   # 認證相關
│   ├── POST /register      # 註冊
│   ├── POST /login         # 登入
│   ├── POST /refresh       # Token 刷新
│   └── GET  /me            # 取得當前使用者
├── /oauth                  # OAuth 社交登入
│   ├── GET  /google        # Google OAuth 開始
│   ├── GET  /google/callback  # Google OAuth 回調
│   ├── GET  /discord       # Discord OAuth 開始
│   └── GET  /discord/callback # Discord OAuth 回調
├── /restaurants            # 餐廳管理
│   ├── GET  /              # 餐廳列表（分頁、篩選）
│   ├── GET  /:id           # 餐廳詳情
│   ├── GET  /nearby        # 附近餐廳（地理位置）
│   └── GET  /search        # 搜尋餐廳
├── /favorites              # 收藏功能
│   ├── GET  /              # 我的收藏列表
│   ├── POST /:restaurantId # 新增收藏
│   └── DELETE /:restaurantId # 移除收藏
├── /visits                 # 造訪記錄
│   ├── GET  /              # 我的造訪記錄
│   ├── POST /:restaurantId # 新增造訪
│   └── DELETE /:restaurantId # 移除造訪
└── /health                 # 健康檢查
```

## 資料庫 Schema

### 核心資料表

```sql
-- 餐廳表
restaurants (
  id, name, district, cuisine_type, rating, price_level,
  photos, address, phone, website, opening_hours,
  description, latitude, longitude, created_at, updated_at
)

-- 標籤表
tags (id, name, category, color, is_positive)

-- 餐廳標籤關聯
restaurant_tags (restaurant_id, tag_id)

-- 使用者表
users (
  id, email, password_hash, name, avatar,
  is_email_verified, created_at, updated_at
)

-- 社交帳戶表
social_accounts (
  id, user_id, provider, provider_id,
  provider_email, provider_name, provider_avatar
)

-- 收藏表
user_favorites (id, user_id, restaurant_id, created_at)

-- 造訪記錄表
user_visited_restaurants (id, user_id, restaurant_id, created_at)

-- 評論表
reviews (id, restaurant_id, user_id, rating, comment, helpful_count)
```

## 環境配置

### Cloudflare Bindings

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://feednav.cc,https://www.feednav.cc"
JWT_ISSUER = "feednav-api"

[[d1_databases]]
binding = "DB"
database_name = "feednav-db"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "feednav-storage"

[[kv_namespaces]]
binding = "CACHE"

[[analytics_engine_datasets]]
binding = "ACCESS_LOGS"
dataset = "feednav_access_logs"
```

### 環境變數 (Secrets)

| 變數名稱 | 說明 |
|----------|------|
| `JWT_SECRET` | JWT 簽名密鑰 |
| `JWT_REFRESH_SECRET` | JWT Refresh Token 密鑰 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `DISCORD_CLIENT_ID` | Discord OAuth Client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth Client Secret |

## 部署環境

| 環境 | Worker 名稱 | Domain | D1 Database |
|------|-------------|--------|-------------|
| **Production** | feednav-api-production | api.feednav.cc | feednav-db |
| **Preview** | feednav-api-preview | api-preview.feednav.cc | feednav-db-preview |

## 常用指令

```bash
cd feednav-serverless

pnpm dev                           # 啟動本地開發伺服器
pnpm deploy                        # 部署到 Preview 環境
pnpm deploy:production             # 部署到 Production 環境

# 程式碼品質
pnpm lint                          # ESLint 檢查
pnpm lint:fix                      # ESLint 自動修復
pnpm format                        # Prettier 格式化
pnpm type-check                    # TypeScript 型別檢查

# 測試
pnpm test                          # 執行測試
pnpm test:coverage                 # 測試覆蓋率報告
```

## 資料庫遷移

```bash
# 建立新遷移
wrangler d1 migrations create feednav-db <migration_name>

# 套用遷移 (本地)
wrangler d1 migrations apply feednav-db --local

# 套用遷移 (Preview)
wrangler d1 migrations apply feednav-db-preview --remote --env preview

# 套用遷移 (Production)
wrangler d1 migrations apply feednav-db --remote --env production
```

## 效能最佳化

1. **Edge Computing**: 全球 300+ 邊緣節點，低延遲
2. **D1 Read Replicas**: 讀取自動複製到最近節點
3. **KV Cache**: 熱門餐廳資料快取
4. **R2 CDN**: 餐廳圖片 CDN 分發
5. **Analytics Engine**: 即時存取日誌分析
