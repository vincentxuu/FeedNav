# CI/CD Pipeline

## 概覽

FeedNav 使用 GitHub Actions 實現自動化部署，分為以下主要 Workflow：

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   deploy-fe.yml │  │  deploy-api.yml │  │  keep-alive.yml │ │
│  │                 │  │                 │  │                 │ │
│  │  Frontend 部署  │  │  Backend 部署   │  │  Worker 保活    │ │
│  │  (Next.js)      │  │  (Hono API)     │  │  (每 5 分鐘)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ mobile-build.yml│  │ mobile-ota.yml  │                      │
│  │                 │  │                 │                      │
│  │  App 建置提交   │  │  OTA 熱更新     │                      │
│  │  (規劃中)       │  │  (規劃中)       │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend 部署 (deploy-fe.yml)

### 觸發條件

```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'feednav-fe/**'
      - '.github/workflows/deploy-fe.yml'
  pull_request:
    branches: [main]
    paths:
      - 'feednav-fe/**'
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [preview, production]
```

### 部署流程

```
Push to feednav-fe/**
        │
        ▼
┌───────────────────┐
│  Checkout Code    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Setup pnpm 9     │
│  Setup Node.js 20 │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  pnpm install     │
│  --frozen-lockfile│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Lint & Type Check│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  pnpm build       │
│  (Next.js Build)  │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Wrangler Pages   │
│  Deploy           │
└───────────────────┘
        │
        ▼ (main branch only)
┌───────────────────┐
│  Purge Cloudflare │
│  Cache            │
└───────────────────┘
```

### 環境變數配置

| 變數 | main 分支 | 其他分支 |
|------|-----------|----------|
| `NEXT_PUBLIC_API_URL` | `https://api.feednav.cc/api/v1` | `https://api-preview.feednav.cc/api/v1` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` | `false` |

### Analytics 環境變數

```yaml
NEXT_PUBLIC_GA_ID: ${{ secrets.GA_ID }}
NEXT_PUBLIC_CLARITY_ID: ${{ secrets.CLARITY_ID }}
```

---

## 2. Backend API 部署 (deploy-api.yml)

### 觸發條件

```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'feednav-serverless/**'
      - '.github/workflows/deploy-api.yml'
  pull_request:
    branches: [main]
    paths:
      - 'feednav-serverless/**'
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [preview, production]
```

### 部署流程

```
Push to feednav-serverless/**
        │
        ▼
┌─────────────────────────────────────────┐
│           Job: lint-and-typecheck       │
├─────────────────────────────────────────┤
│  1. Checkout                            │
│  2. Setup pnpm 9 + Node.js 20           │
│  3. pnpm install --frozen-lockfile      │
│  4. pnpm lint (ESLint)                  │
│  5. pnpm type-check (TypeScript)        │
│  6. pnpm test (Vitest)                  │
└─────────────────────────────────────────┘
        │
        ▼ (on push/workflow_dispatch only)
┌─────────────────────────────────────────┐
│              Job: deploy                │
├─────────────────────────────────────────┤
│  1. Determine Environment               │
│     - main → production                 │
│     - develop → preview                 │
│     - workflow_dispatch → user choice   │
│                                         │
│  2. Check Required Secrets              │
│     - JWT_SECRET (required)             │
│     - GOOGLE_CLIENT_ID (optional)       │
│     - GOOGLE_CLIENT_SECRET (optional)   │
│                                         │
│  3. Wrangler Deploy                     │
│                                         │
│  4. Upload Secrets to Workers           │
│                                         │
│  5. Apply D1 Migrations                 │
│     - 最多重試 3 次                     │
│     - 重試間隔 10 秒                    │
└─────────────────────────────────────────┘
```

### 環境判斷邏輯

```bash
if [ workflow_dispatch ]; then
  environment = user_input
elif [ main branch ]; then
  environment = production
else
  environment = preview
fi
```

### Secrets 配置

| Secret 名稱 | 必要性 | 說明 |
|-------------|--------|------|
| `CLOUDFLARE_API_TOKEN` | 必要 | Cloudflare API Token |
| `JWT_SECRET` | 必要 | JWT 簽名密鑰 |
| `JWT_REFRESH_SECRET` | 必要 | JWT Refresh Token 密鑰 |
| `GOOGLE_CLIENT_ID` | 選填 | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | 選填 | Google OAuth |
| `DISCORD_CLIENT_ID` | 選填 | Discord OAuth |
| `DISCORD_CLIENT_SECRET` | 選填 | Discord OAuth |

---

## 3. Worker Keep-Alive (keep-alive.yml)

### 用途

定期 ping Cloudflare Workers，保持 Worker 溫暖，減少冷啟動延遲。

### 觸發條件

```yaml
on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分鐘
  workflow_dispatch:        # 手動觸發
```

### 健康檢查端點

| 端點 | 說明 |
|------|------|
| `https://feednav.cc/api/health` | Frontend Worker |
| `https://api.feednav.cc/health` | API Worker |

---

## GitHub Secrets 完整清單

| Secret 名稱 | 用途 | 必要性 |
|-------------|------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare 部署權限 | 必要 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳戶 ID | 必要 |
| `CLOUDFLARE_ZONE_ID` | 快取清除用 | Frontend 必要 |
| `JWT_SECRET` | API 認證 | Backend 必要 |
| `JWT_REFRESH_SECRET` | Token 刷新 | Backend 必要 |
| `GOOGLE_CLIENT_ID` | Google OAuth | 選填 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | 選填 |
| `DISCORD_CLIENT_ID` | Discord OAuth | 選填 |
| `DISCORD_CLIENT_SECRET` | Discord OAuth | 選填 |
| `GA_ID` | Google Analytics | 選填 |
| `CLARITY_ID` | Microsoft Clarity | 選填 |
| `EXPO_TOKEN` | Expo/EAS 認證 (Mobile) | Mobile 必要 |

---

## 部署環境對應

| 分支 | Frontend | Backend Worker | Domain |
|------|----------|----------------|--------|
| `main` | Cloudflare Workers (Production) | feednav-api-production | feednav.cc |
| `develop` | Cloudflare Workers (Preview) | feednav-api-preview | preview.feednav.cc |

---

## 手動部署指令

```bash
# Frontend
cd feednav-fe
pnpm build
pnpm deploy                         # 部署到 Cloudflare Workers

# Backend
cd feednav-serverless
pnpm deploy                         # 部署到 Preview
pnpm deploy:production              # 部署到 Production
```

---

## Workflow 檔案範例

### deploy-fe.yml

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main, develop]
    paths:
      - 'feednav-fe/**'
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [preview, production]
        default: preview

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: feednav-fe/pnpm-lock.yaml

      - name: Install dependencies
        run: |
          cd feednav-fe
          pnpm install --frozen-lockfile

      - name: Lint & Type Check
        run: |
          cd feednav-fe
          pnpm lint
          pnpm type-check

      - name: Build
        env:
          NEXT_PUBLIC_API_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.feednav.cc/api/v1' || 'https://api-preview.feednav.cc/api/v1' }}
        run: |
          cd feednav-fe
          pnpm build

      - name: Deploy to Cloudflare Workers
        run: |
          cd feednav-fe
          pnpm deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Purge Cache (Production only)
        if: github.ref == 'refs/heads/main'
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
```

### deploy-api.yml

```yaml
name: Deploy API

on:
  push:
    branches: [main, develop]
    paths:
      - 'feednav-serverless/**'
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [preview, production]
        default: preview

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: feednav-serverless/pnpm-lock.yaml

      - name: Install dependencies
        run: |
          cd feednav-serverless
          pnpm install --frozen-lockfile

      - name: Lint & Type Check
        run: |
          cd feednav-serverless
          pnpm lint
          pnpm type-check

      - name: Run Tests
        run: |
          cd feednav-serverless
          pnpm test

  deploy:
    needs: test
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: feednav-serverless/pnpm-lock.yaml

      - name: Install dependencies
        run: |
          cd feednav-serverless
          pnpm install --frozen-lockfile

      - name: Determine Environment
        id: env
        run: |
          if [ "${{ github.event.inputs.environment }}" != "" ]; then
            echo "env=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "env=production" >> $GITHUB_OUTPUT
          else
            echo "env=preview" >> $GITHUB_OUTPUT
          fi

      - name: Deploy to Cloudflare Workers
        run: |
          cd feednav-serverless
          npx wrangler deploy --env ${{ steps.env.outputs.env }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Upload Secrets
        run: |
          cd feednav-serverless
          echo "${{ secrets.JWT_SECRET }}" | npx wrangler secret put JWT_SECRET --env ${{ steps.env.outputs.env }}
          echo "${{ secrets.JWT_REFRESH_SECRET }}" | npx wrangler secret put JWT_REFRESH_SECRET --env ${{ steps.env.outputs.env }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Apply D1 Migrations
        run: |
          cd feednav-serverless
          DB_NAME=${{ steps.env.outputs.env == 'production' && 'feednav-db' || 'feednav-db-preview' }}
          for i in 1 2 3; do
            npx wrangler d1 migrations apply $DB_NAME --remote --env ${{ steps.env.outputs.env }} && break
            echo "Retry $i..."
            sleep 10
          done
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## 故障排除

### D1 Migration 失敗

Migration 會自動重試 3 次，間隔 10 秒。如仍失敗：

1. 檢查 migration 檔案語法
2. 手動執行：
```bash
wrangler d1 migrations apply feednav-db --remote --env production
```

### Secrets 未設定

檢查 GitHub Repository Settings → Secrets and variables → Actions

### 快取問題

Production 部署後會自動清除 Cloudflare 快取。如需手動清除：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Wrangler 版本不匹配

確保本地和 CI 使用相同版本的 Wrangler：
```bash
# 本地
pnpm add -D wrangler@latest

# CI 中明確指定版本
npx wrangler@3.22.1 deploy
```
