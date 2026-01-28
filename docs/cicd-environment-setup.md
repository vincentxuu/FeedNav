# FeedNav CI/CD 與環境配置指南

本文件說明 FeedNav 專案的 CI/CD 流程和測試/正式環境配置，參考 `nobodyclimb-fe` 專案的最佳實踐。

---

## 1. 環境架構概覽

### 環境分類

| 環境 | 用途 | 前端 URL | 後端 URL |
|------|------|---------|---------|
| **Development** | 本地開發 | `localhost:3000` | `localhost:8787` |
| **Preview/Staging** | 測試環境 | `preview.feednav.cc` | `api-preview.feednav.cc` |
| **Production** | 正式環境 | `feednav.cc` | `api.feednav.cc` |

### Cloudflare 服務配置

| 服務 | Preview 環境 | Production 環境 |
|------|-------------|----------------|
| **Workers (前端)** | `feednav-fe-preview` | `feednav-fe-production` |
| **Workers (後端)** | `feednav-api-preview` | `feednav-api-production` |
| **D1 資料庫** | `feednav-db-preview` | `feednav-db` |
| **KV Namespace** | `feednav-cache-preview` | `feednav-cache` |
| **R2 Bucket** | `feednav-storage-preview` | `feednav-storage` |
| **Analytics Engine** | `feednav_access_logs_preview` | `feednav_access_logs` |

---

## 2. 前端環境配置 (feednav-fe)

### 2.1 更新 wrangler.toml

**修改:** `feednav-fe/wrangler.toml`

```toml
name = "feednav-fe"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat_v2"]

# Cloudflare 帳號 ID (可選，如果使用 CLOUDFLARE_ACCOUNT_ID 環境變數則不需要)
# account_id = "your-account-id"

# 靜態資源配置
pages_build_output_dir = ".next"

# KV Namespace (用於快取)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# ============================================
# 測試環境 (Preview/Staging)
# ============================================
[env.preview]
name = "feednav-fe-preview"

[[env.preview.kv_namespaces]]
binding = "CACHE"
id = "your-preview-kv-namespace-id"

[env.preview.vars]
NEXT_PUBLIC_API_URL = "https://api-preview.feednav.cc"
NEXT_PUBLIC_ENABLE_ANALYTICS = "false"

# 如果使用自訂域名
# [[env.preview.routes]]
# pattern = "preview.feednav.cc/*"
# zone_name = "feednav.cc"

# ============================================
# 正式環境 (Production)
# ============================================
[env.production]
name = "feednav-fe-production"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-production-kv-namespace-id"

[env.production.vars]
NEXT_PUBLIC_API_URL = "https://api.feednav.cc"
NEXT_PUBLIC_ENABLE_ANALYTICS = "true"

[[env.production.routes]]
pattern = "feednav.cc/*"
zone_name = "feednav.cc"

[[env.production.routes]]
pattern = "www.feednav.cc/*"
zone_name = "feednav.cc"
```

### 2.2 環境變數

**創建:** `feednav-fe/.env.local.example`

```bash
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:8787

# OAuth 配置 (Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# OAuth 配置 (Discord)
NEXT_PUBLIC_DISCORD_CLIENT_ID=your-discord-client-id

# 分析工具 (僅正式環境啟用)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=your-clarity-id

# 應用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.3 分析工具控制

**創建:** `feednav-fe/src/components/shared/analytics.tsx`

```typescript
'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

// 只在正式環境啟用分析
function isProductionDomain(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'feednav.cc' || hostname === 'www.feednav.cc'
}

export function Analytics() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    setShouldLoad(enabled && isProductionDomain())
  }, [])

  if (!shouldLoad) return null

  return (
    <>
      {/* Google Analytics */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity */}
      {process.env.NEXT_PUBLIC_CLARITY_ID && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  )
}
```

---

## 3. 後端環境配置 (feednav-serverless)

### 3.1 更新 wrangler.toml

**修改:** `feednav-serverless/wrangler.toml`

```toml
name = "feednav-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

# Cloudflare 帳號 ID
# account_id = "your-account-id"

# ============================================
# 測試環境 (Preview)
# ============================================
[env.preview]
name = "feednav-api-preview"

[[env.preview.routes]]
pattern = "api-preview.feednav.cc/*"
zone_name = "feednav.cc"

[env.preview.vars]
ENVIRONMENT = "preview"
CORS_ORIGIN = "https://preview.feednav.cc,http://localhost:3000,http://localhost:5173"
JWT_ISSUER = "feednav-api"
BCRYPT_ROUNDS = "10"

[[env.preview.d1_databases]]
binding = "DB"
database_name = "feednav-db-preview"
database_id = "your-preview-database-id"
migrations_dir = "migrations"

[[env.preview.kv_namespaces]]
binding = "CACHE"
id = "your-preview-kv-id"

[[env.preview.r2_buckets]]
binding = "STORAGE"
bucket_name = "feednav-storage-preview"

[[env.preview.analytics_engine_datasets]]
binding = "ACCESS_LOGS"
dataset = "feednav_access_logs_preview"

# ============================================
# 正式環境 (Production)
# ============================================
[env.production]
name = "feednav-api-production"

[[env.production.routes]]
pattern = "api.feednav.cc/*"
zone_name = "feednav.cc"

[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://feednav.cc,https://www.feednav.cc"
JWT_ISSUER = "feednav-api"
BCRYPT_ROUNDS = "12"

[[env.production.d1_databases]]
binding = "DB"
database_name = "feednav-db"
database_id = "your-production-database-id"
migrations_dir = "migrations"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-production-kv-id"

[[env.production.r2_buckets]]
binding = "STORAGE"
bucket_name = "feednav-storage"

[[env.production.analytics_engine_datasets]]
binding = "ACCESS_LOGS"
dataset = "feednav_access_logs"
```

### 3.2 秘密變數管理

使用 `wrangler secret` 管理敏感資訊：

```bash
# Preview 環境
wrangler secret put JWT_SECRET --env preview
wrangler secret put GOOGLE_CLIENT_ID --env preview
wrangler secret put GOOGLE_CLIENT_SECRET --env preview
wrangler secret put DISCORD_CLIENT_ID --env preview
wrangler secret put DISCORD_CLIENT_SECRET --env preview

# Production 環境
wrangler secret put JWT_SECRET --env production
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put DISCORD_CLIENT_ID --env production
wrangler secret put DISCORD_CLIENT_SECRET --env production
```

---

## 4. GitHub Actions CI/CD 配置

### 4.1 前端部署流程

**創建:** `feednav-fe/.github/workflows/deploy.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '20'

jobs:
  # ============================================
  # 程式碼品質檢查
  # ============================================
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm run test --if-present

  # ============================================
  # 部署到 Preview 環境
  # ============================================
  deploy-preview:
    name: Deploy to Preview
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: preview
      url: https://preview.feednav.cc

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api-preview.feednav.cc
          NEXT_PUBLIC_ENABLE_ANALYTICS: 'false'

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .next --project-name=feednav-fe --branch=preview

  # ============================================
  # 部署到 Production 環境
  # ============================================
  deploy-production:
    name: Deploy to Production
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://feednav.cc

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.feednav.cc
          NEXT_PUBLIC_ENABLE_ANALYTICS: 'true'
          NEXT_PUBLIC_GA_ID: ${{ secrets.GA_ID }}
          NEXT_PUBLIC_CLARITY_ID: ${{ secrets.CLARITY_ID }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .next --project-name=feednav-fe --branch=main
```

### 4.2 後端部署流程

**創建:** `feednav-serverless/.github/workflows/deploy.yml`

```yaml
name: Deploy API

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'src/**'
      - 'migrations/**'
      - 'wrangler.toml'
      - 'package.json'
      - '.github/workflows/deploy.yml'
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '20'

jobs:
  # ============================================
  # 程式碼品質檢查
  # ============================================
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm run test --if-present

  # ============================================
  # 部署到 Preview 環境
  # ============================================
  deploy-preview:
    name: Deploy to Preview
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: api-preview
      url: https://api-preview.feednav.cc

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run D1 Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 migrations apply feednav-db-preview --remote --env preview

      - name: Deploy to Preview
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview

  # ============================================
  # 部署到 Production 環境
  # ============================================
  deploy-production:
    name: Deploy to Production
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: api-production
      url: https://api.feednav.cc

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run D1 Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 migrations apply feednav-db --remote --env production

      - name: Deploy to Production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

### 4.3 Pull Request 檢查

**創建:** `.github/workflows/pr-check.yml` (兩個專案共用)

```yaml
name: PR Check

on:
  pull_request:
    branches:
      - main
      - develop

jobs:
  check:
    name: Quality Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Build
        run: npm run build
```

---

## 5. GitHub Secrets 配置

### 必需的 Secrets

| Secret 名稱 | 說明 | 取得方式 |
|------------|------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳號 ID | Cloudflare Dashboard → Overview |
| `GA_ID` | Google Analytics ID | Google Analytics |
| `CLARITY_ID` | Microsoft Clarity ID | Clarity Dashboard |

### 創建 Cloudflare API Token

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 前往 **My Profile** → **API Tokens**
3. 點擊 **Create Token**
4. 選擇 **Edit Cloudflare Workers** 模板
5. 確保包含以下權限：
   - Account: Workers KV Storage (Edit)
   - Account: Workers R2 Storage (Edit)
   - Account: Workers Scripts (Edit)
   - Account: D1 (Edit)
   - Zone: Workers Routes (Edit)

---

## 6. 本地開發指令

### 前端 (feednav-fe)

```bash
# 開發
npm run dev                    # 啟動開發伺服器

# 檢查
npm run type-check             # TypeScript 類型檢查
npm run lint                   # ESLint 檢查
npm run format:check           # Prettier 格式檢查

# 構建
npm run build                  # 構建生產版本

# 部署 (手動)
npx wrangler pages deploy .next --project-name=feednav-fe --branch=preview
npx wrangler pages deploy .next --project-name=feednav-fe --branch=main
```

### 後端 (feednav-serverless)

```bash
# 開發
npm run dev                    # 啟動本地 Workers 開發伺服器

# 檢查
npm run type-check             # TypeScript 類型檢查
npm run lint                   # ESLint 檢查
npm run format:check           # Prettier 格式檢查
npm run test                   # 執行測試

# 資料庫遷移
npx wrangler d1 migrations apply feednav-db-preview --remote --env preview
npx wrangler d1 migrations apply feednav-db --remote --env production

# 部署 (手動)
npm run deploy:preview         # 部署到 Preview
npm run deploy:production      # 部署到 Production

# 或直接使用 wrangler
npx wrangler deploy --env preview
npx wrangler deploy --env production

# 查看日誌
npx wrangler tail --env preview
npx wrangler tail --env production
```

---

## 7. 資料庫遷移管理

### 7.1 建立遷移目錄結構

```
feednav-serverless/
└── migrations/
    ├── 0001_initial_schema.sql
    ├── 0002_add_tags_table.sql
    ├── 0003_add_visits_table.sql
    └── ...
```

### 7.2 遷移檔案命名規範

```
NNNN_description.sql
```

- `NNNN`: 4 位數序號 (0001, 0002, ...)
- `description`: 簡短描述，使用底線分隔

### 7.3 遷移指令

```bash
# 本地開發
npx wrangler d1 execute feednav-db --local --file=./migrations/0001_initial_schema.sql

# 遠端 Preview
npx wrangler d1 migrations apply feednav-db-preview --remote --env preview

# 遠端 Production
npx wrangler d1 migrations apply feednav-db --remote --env production

# 查看遷移狀態
npx wrangler d1 migrations list feednav-db-preview --env preview
npx wrangler d1 migrations list feednav-db --env production
```

---

## 8. 分支策略

### Git Flow

```
main (正式環境)
  ↑
  └── develop (測試環境)
        ↑
        └── feature/xxx (功能開發)
        └── fix/xxx (問題修復)
        └── hotfix/xxx (緊急修復，可直接合併到 main)
```

### 分支保護規則

**main 分支:**
- 需要 Pull Request 審查
- 需要通過 CI 檢查
- 禁止強制推送

**develop 分支:**
- 需要通過 CI 檢查
- 允許自動合併

---

## 9. 環境變數對照表

### 前端環境變數

| 變數名稱 | Development | Preview | Production |
|---------|-------------|---------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8787` | `https://api-preview.feednav.cc` | `https://api.feednav.cc` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `false` | `false` | `true` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://preview.feednav.cc` | `https://feednav.cc` |

### 後端環境變數

| 變數名稱 | Development | Preview | Production |
|---------|-------------|---------|------------|
| `ENVIRONMENT` | `development` | `preview` | `production` |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://preview.feednav.cc,...` | `https://feednav.cc,...` |
| `BCRYPT_ROUNDS` | `10` | `10` | `12` |
| `JWT_ISSUER` | `feednav-api` | `feednav-api` | `feednav-api` |

---

## 10. 部署檢查清單

### 首次部署

- [ ] 創建 Cloudflare 帳號並設定網域
- [ ] 創建 D1 資料庫 (Preview + Production)
- [ ] 創建 KV Namespace (Preview + Production)
- [ ] 創建 R2 Bucket (Preview + Production)
- [ ] 設定 GitHub Secrets
- [ ] 執行資料庫遷移
- [ ] 設定 Wrangler Secrets (JWT_SECRET 等)
- [ ] 測試 Preview 環境
- [ ] 測試 Production 環境

### 每次部署前

- [ ] 本地測試通過
- [ ] `npm run type-check` 通過
- [ ] `npm run lint` 通過
- [ ] `npm run format:check` 通過
- [ ] PR 審查完成 (如適用)

### 部署後驗證

- [ ] 健康檢查端點回應正常
- [ ] 主要功能測試
- [ ] 監控 Cloudflare Analytics
- [ ] 檢查錯誤日誌

---

## 11. 故障排除

### 常見問題

**1. 部署失敗 - API Token 權限不足**
```
確保 API Token 包含以下權限：
- Workers Scripts (Edit)
- Workers KV Storage (Edit)
- Workers R2 Storage (Edit)
- D1 (Edit)
```

**2. D1 遷移失敗**
```bash
# 檢查資料庫 ID 是否正確
npx wrangler d1 list

# 手動執行 SQL
npx wrangler d1 execute feednav-db --remote --env production --command "SELECT 1"
```

**3. CORS 錯誤**
```
確保 wrangler.toml 中的 CORS_ORIGIN 包含請求來源
Preview: https://preview.feednav.cc
Production: https://feednav.cc, https://www.feednav.cc
```

**4. 環境變數未生效**
```bash
# 檢查當前環境變數
npx wrangler deploy --dry-run --env preview

# 重新部署
npx wrangler deploy --env preview
```

---

*最後更新: 2026-01-28*
