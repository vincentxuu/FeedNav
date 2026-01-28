# Frontend 技術棧

## 核心框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.3.x | React 全端框架，App Router |
| **React** | 19.x | UI 函式庫 |
| **TypeScript** | 5.x | 型別安全 |

## 樣式與 UI

| 技術 | 版本 | 用途 |
|------|------|------|
| **TailwindCSS** | 3.4.x | Utility-first CSS |
| **tailwindcss-animate** | 1.0.x | TailwindCSS 動畫擴展 |
| **Radix UI** | 各元件獨立版本 | Headless UI 元件 |
| **Lucide React** | 0.525.x | 圖示庫 |
| **class-variance-authority** | 0.7.x | 元件變體管理 |
| **clsx** | 2.1.x | 條件式 className |
| **tailwind-merge** | 3.3.x | TailwindCSS class 合併 |
| **next-themes** | 0.4.x | 深色模式切換 |

### Radix UI 元件清單

```
@radix-ui/react-accordion      @radix-ui/react-alert-dialog
@radix-ui/react-aspect-ratio   @radix-ui/react-avatar
@radix-ui/react-checkbox       @radix-ui/react-collapsible
@radix-ui/react-context-menu   @radix-ui/react-dialog
@radix-ui/react-dropdown-menu  @radix-ui/react-hover-card
@radix-ui/react-label          @radix-ui/react-menubar
@radix-ui/react-navigation-menu @radix-ui/react-popover
@radix-ui/react-progress       @radix-ui/react-radio-group
@radix-ui/react-scroll-area    @radix-ui/react-select
@radix-ui/react-separator      @radix-ui/react-slider
@radix-ui/react-slot           @radix-ui/react-switch
@radix-ui/react-tabs           @radix-ui/react-toast
@radix-ui/react-toggle         @radix-ui/react-toggle-group
@radix-ui/react-tooltip
```

## 地圖功能

| 技術 | 版本 | 用途 |
|------|------|------|
| **Leaflet** | 1.9.x | 互動式地圖 |
| **React Leaflet** | 5.0.x | React 整合 |
| **leaflet.markercluster** | 1.5.x | 標記群集 |

## 狀態管理

| 技術 | 版本 | 用途 |
|------|------|------|
| **TanStack Query** | 5.81.x | 伺服器狀態管理與快取 |

## 表單處理

| 技術 | 版本 | 用途 |
|------|------|------|
| **React Hook Form** | 7.58.x | 表單狀態管理 |
| **Zod** | 3.25.x | Schema 驗證 |
| **@hookform/resolvers** | 5.1.x | Zod 與 RHF 整合 |

## API 通訊

| 技術 | 版本 | 用途 |
|------|------|------|
| **js-cookie** | 3.0.x | Cookie 管理 (JWT Token) |

## 進階 UI 元件

| 技術 | 版本 | 用途 |
|------|------|------|
| **cmdk** | 1.1.x | 命令面板 (Command Palette) |
| **sonner** | 2.0.x | Toast 通知 |
| **vaul** | 1.1.x | Drawer 元件 |
| **embla-carousel-react** | 8.6.x | 輪播圖 |
| **react-resizable-panels** | 3.0.x | 可調整面板 |
| **input-otp** | 1.4.x | OTP 輸入框 |
| **react-day-picker** | 9.13.x | 日期選擇器 |
| **recharts** | 3.0.x | 圖表視覺化 |

## 工具函式庫

| 技術 | 版本 | 用途 |
|------|------|------|
| **date-fns** | 4.1.x | 日期處理 |

## 開發工具

| 技術 | 版本 | 用途 |
|------|------|------|
| **ESLint** | 9.x | 程式碼檢查 |
| **eslint-config-next** | 15.3.x | Next.js ESLint 配置 |
| **Prettier** | 3.4.x | 程式碼格式化 |
| **prettier-plugin-tailwindcss** | 0.6.x | TailwindCSS class 排序 |

## 部署

| 技術 | 版本 | 用途 |
|------|------|------|
| **Cloudflare Workers** | - | OpenNext.js SSR 部署 |
| **Wrangler** | 4.22.x | Cloudflare CLI |

## 專案結構

```
feednav-fe/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── layout.tsx          # 根佈局
│   │   ├── page.tsx            # 首頁
│   │   ├── auth/               # 認證頁面
│   │   │   ├── login/          # 登入
│   │   │   └── register/       # 註冊
│   │   ├── restaurants/        # 餐廳相關頁面
│   │   │   ├── page.tsx        # 餐廳列表
│   │   │   └── [id]/           # 餐廳詳情
│   │   ├── map/                # 地圖瀏覽
│   │   ├── favorites/          # 我的收藏
│   │   ├── profile/            # 使用者個人檔案
│   │   └── search/             # 搜尋頁面
│   ├── components/             # React 元件
│   │   ├── ui/                 # 基礎 UI 元件 (shadcn/ui)
│   │   ├── restaurant/         # 餐廳相關元件
│   │   ├── map/                # 地圖相關元件
│   │   ├── auth/               # 認證相關元件
│   │   └── shared/             # 共用元件
│   ├── lib/
│   │   ├── api/                # API 客戶端
│   │   ├── hooks/              # 自訂 Hooks
│   │   ├── types/              # TypeScript 型別
│   │   ├── utils/              # 工具函式
│   │   └── constants/          # 常數配置
│   └── styles/                 # 全域樣式
├── public/                     # 靜態資源
├── next.config.js              # Next.js 配置
├── tailwind.config.js          # TailwindCSS 配置
└── tsconfig.json               # TypeScript 配置
```

## API Client 架構

```typescript
// src/lib/api/client.ts
// - 基於 fetch 的 API 客戶端
// - Request Interceptor: 自動附加 JWT Token
// - Response Interceptor: 處理 401 Token Refresh
// - 錯誤處理與重試機制
```

## 常用指令

```bash
cd feednav-fe

pnpm dev                 # 啟動開發伺服器 (localhost:3000) with Turbopack
pnpm build              # 建置生產版本
pnpm start              # 啟動生產伺服器
pnpm lint               # 執行 ESLint
pnpm lint:fix           # ESLint 自動修復
pnpm format             # Prettier 格式化
pnpm format:check       # 檢查程式碼格式
pnpm type-check         # TypeScript 型別檢查

# Cloudflare Workers 部署 (OpenNext.js)
pnpm preview            # 本地預覽 Worker
pnpm deploy             # 建置並部署到 Cloudflare Workers
```

## 功能模組

### 餐廳瀏覽
- 列表視圖 (卡片式)
- 地圖視圖 (Leaflet + 標記群集)
- 篩選條件 (地區、料理類型、價位、評分)
- 搜尋功能

### 使用者功能
- 註冊 / 登入 (Email + OAuth)
- 收藏餐廳
- 造訪記錄
- 個人檔案管理

### 地圖功能
- 互動式地圖瀏覽
- 餐廳標記與群集
- 附近餐廳搜尋
- 路線規劃 (規劃中)
