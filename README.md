# FeedNav

*其他語言版本: [繁體中文](#繁體中文) | [English](#english)*

一個專為台北打造的全方位餐廳探索與推薦系統，採用現代化全端架構開發。

---

## 繁體中文

### 專案概述

FeedNav 是一個專門為台灣台北設計的精緻餐廳探索平台。結合智能數據收集、AI驅動的分類系統，以及友善的使用者介面，幫助人們發現並追蹤在台北的美食體驗。

### 系統架構

採用前後端分離架構，包含三個主要組件：

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   資料收集器        │    │     前端介面        │    │   無伺服器 API      │
│   (Python)          │───▶│   (Next.js)         │◀──▶│  (Cloudflare)       │
│                     │    │                     │    │                     │
│ • Google Places API │    │ • React 19          │    │ • Hono.js           │
│ • AI 智能分類       │    │ • TypeScript        │    │ • D1 資料庫         │
│ • 評論分析          │    │ • Leaflet 地圖      │    │ • 分層架構          │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### 組件介紹

#### feednav-data-fetcher
**基於 Python 的資料收集與處理管道**

- **技術棧**: Python 3.x, Google Maps API, aiohttp, geopy
- **用途**: 從 Google Places 收集並處理餐廳資料
- **功能特色**:
  - Google Places API 整合
  - AI 驅動的料理分類 (14 個類別)
  - 自動評論標籤提取
  - 地理資訊處理 (台北行政區、捷運站)
  - 跨台北各區批次處理

#### feednav-fe
**Next.js 前端應用程式**

- **技術棧**:
  - Next.js 15.3.4 (Turbopack)
  - React 19
  - TypeScript 5
  - Tailwind CSS 3.4
  - TanStack Query 5 (React Query)
  - shadcn/ui (Radix UI)
  - Leaflet + React-Leaflet 地圖
- **功能特色**:
  - 餐廳搜尋與篩選
  - 互動式地圖與聚類顯示
  - 使用者身份驗證 (JWT + OAuth)
  - 個人收藏與造訪記錄
  - 響應式設計適配所有裝置
  - 隨機餐廳探索

#### feednav-serverless
**Cloudflare Workers 無伺服器 API**

- **技術棧**:
  - Cloudflare Workers
  - Hono.js 3.11
  - TypeScript 5.3
  - Zod 驗證
  - Jose (JWT)
  - Vitest 測試框架
- **架構設計**:
  - `handlers/` - API 路由處理
  - `services/` - 業務邏輯層
  - `repositories/` - 資料存取層
  - `mappers/` - 資料轉換層
  - `middleware/` - 中介軟體 (認證、CORS、限流)
- **功能特色**:
  - 高效能無伺服器 API
  - 多重身份驗證 (JWT, OAuth)
  - 地理位置查詢
  - 使用者個人化功能
  - 全球邊緣分散式部署

### 快速開始

#### 環境需求
- Node.js 18+ (前端與無伺服器)
- Python 3.8+ (資料收集器)
- pnpm 9+ (建議使用)
- Cloudflare 帳戶 (無伺服器部署)

#### 安裝步驟

**1. 資料收集器設置**
```bash
cd feednav-data-fetcher
pip install -r requirements.txt
cp .env.example .env
# 在 .env 中添加你的 Google Maps API 金鑰
python main.py
```

**2. 前端設置**
```bash
cd feednav-fe
pnpm install  # 或 npm install
cp .env.local.example .env.local
# 配置環境變數
pnpm dev  # 使用 Turbopack 開發模式
```

**3. 無伺服器 API 設置**
```bash
cd feednav-serverless
pnpm install
cp .dev.vars.example .dev.vars
# 配置環境變數
pnpm dev
```

### 功能特色

#### 餐廳探索
- **進階搜尋**: 依料理類型、行政區、價格範圍、評分篩選
- **互動式地圖**: 地理瀏覽與餐廳聚類顯示
- **智能推薦**: 基於 AI 的個人化建議
- **隨機探索**: 透過隨機化發現新餐廳

#### 使用者功能
- **身份驗證**: 支援 JWT 與多種 OAuth 提供商的安全登入
- **個人收藏**: 儲存並整理喜愛的餐廳
- **造訪追蹤**: 記錄用餐歷史與體驗
- **位置推薦**: 基於位置的附近餐廳建議

#### 智能分類
- **14 種料理類別**: AI 自動分類餐廳類型
- **評論標籤**: 自動提取環境、服務與設施標籤
- **地理資料**: 行政區對應與捷運站距離

### 部署

**前端部署 (Cloudflare Workers)**
```bash
cd feednav-fe
pnpm run cf:deploy
```

**無伺服器 API 部署 (Cloudflare Workers)**
```bash
cd feednav-serverless
pnpm run deploy
# 正式環境
pnpm run deploy:production
```

### 技術棧總覽

| 組件 | 主要技術 |
|------|----------|
| **資料收集** | Python 3.x, Google Maps API, aiohttp, geopy |
| **前端** | Next.js 15.3, React 19, TypeScript 5, TanStack Query, Leaflet |
| **後端 API** | Cloudflare Workers, Hono.js 3.11, TypeScript, Zod |
| **資料庫** | Cloudflare D1 (SQLite) |
| **身份驗證** | JWT (Jose), OAuth (Google, Discord) |
| **部署** | Cloudflare Workers, D1 |
| **測試** | Vitest |
| **CI/CD** | GitHub Actions |

### 專案文件

詳細的開發指南和修正文件位於 `docs/` 目錄：

| 文件 | 說明 |
|------|------|
| [analysis-report.md](./docs/analysis-report.md) | 專案分析報告 |
| [code-standards.md](./docs/code-standards.md) | 統一程式碼標準 |
| [feednav-fe-fixes.md](./docs/feednav-fe-fixes.md) | 前端修正指南 |
| [feednav-serverless-fixes.md](./docs/feednav-serverless-fixes.md) | 後端修正指南 |
| [cicd-environment-setup.md](./docs/cicd-environment-setup.md) | CI/CD 與環境配置 |
| [implementation-checklist.md](./docs/implementation-checklist.md) | 實施清單 |

### 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。

### 致謝

- Google Places API 提供餐廳資料
- Cloudflare 提供無伺服器基礎設施
- OpenAI 提供 AI 驅動的分類功能
- 台灣政府提供地理資料

---

## English

### Overview

FeedNav is a sophisticated restaurant discovery platform specifically designed for Taipei, Taiwan. It combines intelligent data collection, AI-powered categorization, and user-friendly interfaces to help people discover and track their favorite dining experiences in Taipei.

### Architecture

The project follows a frontend-backend separation architecture with three main components:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Data Fetcher      │    │     Frontend        │    │   Serverless API    │
│   (Python)          │───▶│   (Next.js)         │◀──▶│  (Cloudflare)       │
│                     │    │                     │    │                     │
│ • Google Places API │    │ • React 19          │    │ • Hono.js           │
│ • AI Classification │    │ • TypeScript        │    │ • D1 Database       │
│ • Review Analysis   │    │ • Leaflet Maps      │    │ • Layered Arch      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Components

#### feednav-data-fetcher
**Python-based data collection and processing pipeline**

- **Tech Stack**: Python 3.x, Google Maps API, aiohttp, geopy
- **Purpose**: Collect and process restaurant data from Google Places
- **Features**:
  - Google Places API integration
  - AI-powered cuisine classification (14 categories)
  - Automatic review tag extraction
  - Geographic processing (Taipei districts, MRT stations)
  - Batch processing across all Taipei districts

#### feednav-fe
**Next.js frontend application**

- **Tech Stack**:
  - Next.js 15.3.4 (Turbopack)
  - React 19
  - TypeScript 5
  - Tailwind CSS 3.4
  - TanStack Query 5 (React Query)
  - shadcn/ui (Radix UI)
  - Leaflet + React-Leaflet Maps
- **Features**:
  - Restaurant search and filtering
  - Interactive map with clustering
  - User authentication (JWT + OAuth)
  - Personal favorites and visit tracking
  - Responsive design for all devices
  - Random restaurant discovery

#### feednav-serverless
**Cloudflare Workers serverless API**

- **Tech Stack**:
  - Cloudflare Workers
  - Hono.js 3.11
  - TypeScript 5.3
  - Zod validation
  - Jose (JWT)
  - Vitest testing framework
- **Architecture**:
  - `handlers/` - API route handlers
  - `services/` - Business logic layer
  - `repositories/` - Data access layer
  - `mappers/` - Data transformation layer
  - `middleware/` - Middleware (auth, CORS, rate limiting)
- **Features**:
  - High-performance serverless API
  - Multi-authentication (JWT, OAuth)
  - Geographic proximity queries
  - User personalization features
  - Global edge distribution

### Getting Started

#### Prerequisites
- Node.js 18+ (for frontend and serverless)
- Python 3.8+ (for data fetcher)
- pnpm 9+ (recommended)
- Cloudflare account (for serverless deployment)

#### Setup Instructions

**1. Data Fetcher Setup**
```bash
cd feednav-data-fetcher
pip install -r requirements.txt
cp .env.example .env
# Add your Google Maps API key to .env
python main.py
```

**2. Frontend Setup**
```bash
cd feednav-fe
pnpm install  # or npm install
cp .env.local.example .env.local
# Configure environment variables
pnpm dev  # Uses Turbopack dev mode
```

**3. Serverless API Setup**
```bash
cd feednav-serverless
pnpm install
cp .dev.vars.example .dev.vars
# Configure environment variables
pnpm dev
```

### Features

#### Restaurant Discovery
- **Advanced Search**: Filter by cuisine, district, price range, ratings
- **Interactive Maps**: Geographic browsing with restaurant clustering
- **Smart Recommendations**: AI-powered suggestions based on preferences
- **Random Discovery**: Explore new restaurants with randomization

#### User Features
- **Authentication**: Secure login with JWT and multiple OAuth providers
- **Personal Favorites**: Save and organize preferred restaurants
- **Visit Tracking**: Record dining history and experiences
- **Location-Based**: Nearby restaurant recommendations

#### Smart Classification
- **14 Cuisine Categories**: AI-classified restaurant types
- **Review Tags**: Automatic extraction of environment, service, and amenity tags
- **Geographic Data**: District mapping and MRT station proximity

### Deployment

**Frontend (Cloudflare Workers)**
```bash
cd feednav-fe
pnpm run cf:deploy
```

**Serverless API (Cloudflare Workers)**
```bash
cd feednav-serverless
pnpm run deploy
# Production environment
pnpm run deploy:production
```

### Tech Stack Summary

| Component | Primary Technologies |
|-----------|---------------------|
| **Data Collection** | Python 3.x, Google Maps API, aiohttp, geopy |
| **Frontend** | Next.js 15.3, React 19, TypeScript 5, TanStack Query, Leaflet |
| **Backend API** | Cloudflare Workers, Hono.js 3.11, TypeScript, Zod |
| **Database** | Cloudflare D1 (SQLite) |
| **Authentication** | JWT (Jose), OAuth (Google, Discord) |
| **Deployment** | Cloudflare Workers, D1 |
| **Testing** | Vitest |
| **CI/CD** | GitHub Actions |

### Documentation

Detailed development guides and fix documentation are available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [analysis-report.md](./docs/analysis-report.md) | Project analysis report |
| [code-standards.md](./docs/code-standards.md) | Unified code standards |
| [feednav-fe-fixes.md](./docs/feednav-fe-fixes.md) | Frontend fix guide |
| [feednav-serverless-fixes.md](./docs/feednav-serverless-fixes.md) | Backend fix guide |
| [cicd-environment-setup.md](./docs/cicd-environment-setup.md) | CI/CD and environment setup |
| [implementation-checklist.md](./docs/implementation-checklist.md) | Implementation checklist |

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

- Google Places API for restaurant data
- Cloudflare for serverless infrastructure
- OpenAI for AI-powered categorization
- Taiwan government for geographic data

---

**Built for the Taipei food community**
