# FeedNav 技術棧文件

> 最後更新：2026-01-28

## 目錄

1. [技術架構總覽](#技術架構總覽)
2. [Frontend 技術棧](./frontend.md)
3. [Backend 技術棧](./backend.md)
4. [CI/CD Pipeline](./cicd.md)
5. [React Native App 規劃](./react-native.md)

---

## 技術架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web (Next.js 15)          │  Mobile (React Native) - 規劃中   │
│  - React 19                │  - Expo                           │
│  - TailwindCSS             │  - Tamagui                        │
│  - TanStack Query          │  - 共用狀態管理邏輯               │
│  - Leaflet (地圖)          │  - React Native Maps              │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Workers                                             │
│  - Hono Framework                                               │
│  - JWT Authentication + OAuth                                   │
│  - Rate Limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  D1 (SQLite)    │  R2 (Object Storage)  │  KV (Key-Value Cache) │
│  - 餐廳資料庫   │  - 圖片/檔案儲存      │  - 快取               │
│  - 使用者資料   │                       │                       │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data Collection Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  feednav-data-fetcher (Python)                                  │
│  - 餐廳資料爬取與整合                                           │
│  - 料理分類器                                                   │
│  - 評論標籤提取                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 技術選型原則

1. **Edge-First**: 使用 Cloudflare 全球邊緣網路，降低延遲
2. **Type-Safe**: 全面使用 TypeScript，前後端共享型別
3. **Serverless**: 無伺服器架構，按需擴展，成本優化
4. **DX (Developer Experience)**: 優化開發者體驗，快速迭代
5. **Cross-Platform**: Web + Mobile 共用邏輯，減少重複開發

## 版本資訊

| 類別 | 技術 | 版本 |
|------|------|------|
| **Runtime** | Node.js | 20.x |
| **Package Manager** | pnpm | 9.x |
| **Frontend Framework** | Next.js | 15.3.x |
| **React** | React | 19.x |
| **Backend Framework** | Hono | 3.11.x |
| **Language** | TypeScript | 5.x |
| **Styling** | TailwindCSS | 3.4.x |
| **Server State** | TanStack Query | 5.81.x |
| **Form** | React Hook Form | 7.58.x |
| **Validation** | Zod | 3.25.x |
| **Maps** | Leaflet + React Leaflet | 1.9.x / 5.0.x |

## 專案結構

```
FeedNav/
├── feednav-fe/              # Next.js 前端應用
├── feednav-serverless/      # Cloudflare Workers API
├── feednav-data-fetcher/    # Python 資料爬取工具
└── docs/                    # 專案文件
    ├── techstack/           # 技術棧文件
    └── ...
```

## 環境配置

| 環境 | 前端 Domain | API Domain | 資料庫 |
|------|-------------|------------|--------|
| **Development** | localhost:3000 | localhost:8787 | feednav-db-preview |
| **Preview** | preview.feednav.cc | api-preview.feednav.cc | feednav-db-preview |
| **Production** | feednav.cc | api.feednav.cc | feednav-db |
