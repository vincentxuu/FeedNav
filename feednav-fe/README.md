# FeedNav - 台北美食指南 (Next.js版)

這是台北美食指南的 Next.js 前端應用，使用 Cloudflare Workers (OpenNext.js) 部署，連接 FeedNav Serverless API 後端。

## 功能特色

- **餐廳瀏覽與搜尋**: 依關鍵字快速搜尋餐廳名稱
- **多重篩選與排序**: 依行政區、菜系、價格範圍、特定標籤篩選
- **地圖模式**: 互動式地圖瀏覽餐廳位置
- **隨機選擇器**: 隨機推薦餐廳
- **使用者認證**: 註冊、登入功能及 OAuth 社交登入 (Google、Discord)
- **我的收藏**: 收藏喜愛的餐廳
- **美食足跡**: 記錄造訪過的餐廳
- **附近餐廳推薦**: 基於地理位置的推薦
- **響應式設計**: 支援桌面、平板和手機

## 技術棧

- **框架**: Next.js 15 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS + shadcn/ui
- **狀態管理**: TanStack Query
- **地圖**: Leaflet + React Leaflet
- **API 後端**: FeedNav Serverless API (Cloudflare Workers)
- **認證**: JWT + OAuth 2.0 (Google, Discord)
- **部署**: Cloudflare Workers (OpenNext.js)

## 開發環境設置

### 前置需求

- Node.js 18 或更高版本
- npm 或 yarn

### 安裝步驟

1. 複製專案
```bash
git clone <repository-url>
cd feednav-fe
```

2. 安裝依賴
```bash
npm install
```

3. 設置環境變數
```bash
cp .env.local.example .env.local
```
編輯 `.env.local` 並填入你的 API 配置：
```
NEXT_PUBLIC_API_URL=https://your-worker.your-subdomain.workers.dev
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. 啟動開發伺服器
```bash
npm run dev
```

應用將在 `http://localhost:3000` 啟動。

## 部署到 Cloudflare Workers

此專案使用 [OpenNext.js for Cloudflare](https://opennext.js.org/cloudflare) 將 Next.js 應用部署到 Cloudflare Workers，支援 SSR、Server Components 等完整功能。

### 使用 OpenNext.js CLI

1. 安裝依賴
```bash
pnpm install
```

2. 登入 Cloudflare
```bash
npx wrangler login
```

3. 本地預覽
```bash
pnpm preview
```

4. 部署到 Cloudflare Workers
```bash
pnpm deploy
```

### 環境變數設置

在 Cloudflare Workers 的專案設定中新增環境變數：

- `NEXT_PUBLIC_API_URL` - FeedNav Serverless API 的 URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API 金鑰 (選用)
- `NEXT_PUBLIC_APP_URL` - 前端應用的 URL

## 專案結構

```
src/
├── app/                  # Next.js App Router 頁面
│   ├── layout.tsx       # 根佈局
│   ├── page.tsx         # 首頁
│   ├── auth/            # 認證頁面
│   ├── favorites/       # 收藏頁面
│   ├── visited/         # 造訪記錄頁面
│   └── map/            # 地圖頁面
├── components/          # React 元件
│   ├── ui/             # shadcn/ui 基礎元件
│   ├── layout/         # 佈局元件
│   └── restaurant/     # 餐廳相關元件
├── hooks/              # 自定義 React Hooks
│   ├── useAuthSession.ts    # 認證狀態管理
│   ├── useFavorites.ts      # 收藏功能
│   ├── useVisitedRestaurants.ts # 造訪記錄
│   └── useRestaurantDetail.ts   # 餐廳詳細資訊
├── lib/                # 工具函式與服務
│   ├── api-client.ts   # API 客戶端
│   ├── location.ts     # 地理位置工具
│   ├── recommendations.ts # 推薦算法
│   └── utils.ts        # 通用工具函式
├── pages/              # 頁面元件
├── queries/            # API 查詢函式
│   └── restaurants.ts  # 餐廳資料查詢
├── types/              # TypeScript 型別定義
└── integrations/       # 第三方服務整合 (已棄用 Supabase)
```

## 開發腳本

- `npm run dev` - 啟動開發伺服器 (使用 Turbopack)
- `npm run build` - 建置生產版本
- `npm run export` - 匯出靜態檔案
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行 ESLint
- `pnpm preview` - 本地預覽 Worker (OpenNext.js)
- `pnpm deploy` - 建置並部署到 Cloudflare Workers

## 特殊功能

### SSR 優化
- 所有需要瀏覽器 API 的元件都使用客戶端渲染
- 地圖元件支援動態載入以避免 SSR 問題
- 適當的載入狀態處理

### 地圖功能
- 使用 Leaflet 和 React Leaflet
- 支援標記聚集
- 響應式地圖設計

### 認證系統
- 整合 FeedNav Serverless API 認證
- 支援用戶註冊、登入、登出
- OAuth 社交登入 (Google、Discord)
- JWT 令牌管理與自動刷新
- 受保護的路由和功能

## 問題排解

### 常見問題

1. **地圖不顯示**
   - 確保已正確設置 Google Maps API 金鑰
   - 檢查網路連線

2. **API 連線問題**
   - 確認 `NEXT_PUBLIC_API_URL` 設定正確
   - 檢查 FeedNav Serverless API 是否正常運作
   - 檢查環境變數設定

3. **認證失效**
   - 確認 API 後端認證配置正確
   - 檢查 JWT 令牌是否有效
   - 清除瀏覽器快取和 localStorage

4. **建置失敗**
   - 確保所有依賴已正確安裝
   - 檢查 TypeScript 錯誤
   - 確認 API 客戶端配置正確

## API 後端需求

此前端應用需要搭配 FeedNav Serverless API 後端使用：

- **後端專案**: `/feednav-serverless/`
- **部署平台**: Cloudflare Workers
- **API 文檔**: 參見 `/feednav-serverless/docs/API.md`

### API 端點概覽

- **認證**: `/api/auth/*` - 註冊、登入、OAuth
- **餐廳**: `/api/restaurants/*` - 搜尋、詳細資訊、附近餐廳
- **收藏**: `/api/favorites/*` - 管理使用者收藏
- **造訪記錄**: `/api/visits/*` - 管理造訪記錄與統計

確保後端 API 已正確部署並設定好資料庫與 OAuth 設定。

## 貢獻

歡迎提交 Pull Request 或建立 Issue 來改善這個專案。

## 授權

MIT License