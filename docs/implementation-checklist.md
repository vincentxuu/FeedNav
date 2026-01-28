# FeedNav 修正實施清單

本文件提供優先級排序的待辦事項清單，方便追蹤修正進度。

---

## 優先級說明

| 優先級 | 說明 | 建議完成時間 |
|--------|------|-------------|
| **P0** | 立即修正 - 影響開發品質 | 1-2 天 |
| **P1** | 重要修正 - 影響可維護性 | 3-5 天 |
| **P2** | 優化改進 - 提升品質 | 1-2 週 |
| **P3** | 長期改進 - 完善架構 | 持續進行 |

---

## feednav-fe 前端專案

### P0 - 立即修正

- [x] **移除錯誤忽略配置** ✅ 已完成
  - 檔案: `next.config.ts`
  - 動作: 移除 `eslint.ignoreDuringBuilds` 和 `typescript.ignoreBuildErrors`
  - 參考: [feednav-fe-fixes.md#1.1](./feednav-fe-fixes.md#11-移除錯誤忽略配置)

- [x] **添加 Prettier 配置** ✅ 已完成
  - 檔案: `.prettierrc.json`, `.prettierignore`
  - 動作: 創建配置文件並安裝依賴
  - 指令: `npm install --save-dev prettier prettier-plugin-tailwindcss`
  - 參考: [feednav-fe-fixes.md#1.2](./feednav-fe-fixes.md#12-添加-prettier-配置)

- [ ] **修正 ESLint 錯誤 - no-explicit-any (8 處)**
  - 檔案: `Map.tsx` (3), `RestaurantMap.tsx` (4), `useFavorites.ts` (1)
  - 動作: 定義適當的 TypeScript 介面替代 `any`
  - 參考: [feednav-fe-fixes.md#2.1](./feednav-fe-fixes.md#21-修正-typescript-eslintno-explicit-any)

- [ ] **修正 ESLint 錯誤 - no-unused-vars (9 處)**
  - 檔案: `UserNav.tsx`, `useHomePageData.ts`, `use-toast.ts`, `calendar.tsx`, `chart.tsx`
  - 動作: 移除未使用變數或使用 `_` 前綴
  - 參考: [feednav-fe-fixes.md#2.2](./feednav-fe-fixes.md#22-修正未使用變數)

### P1 - 重要修正

- [ ] **替換 img 為 Next.js Image**
  - 檔案: `RestaurantCard.tsx`
  - 動作: 使用 `next/image` 的 `Image` 組件
  - 參考: [feednav-fe-fixes.md#3.1](./feednav-fe-fixes.md#31-替換-img-為-image-)

- [ ] **修正 React Hooks 依賴警告**
  - 檔案: `Map.tsx` (第 76 行)
  - 動作: 添加 `mapCenter` 到 `useMemo` 依賴陣列
  - 參考: [feednav-fe-fixes.md#3.2](./feednav-fe-fixes.md#32-修正-react-hooks-依賴)

- [ ] **改進 API 客戶端**
  - 檔案: `lib/api-client.ts`
  - 動作: 添加 Token 刷新和重試機制
  - 參考: [feednav-fe-fixes.md#4](./feednav-fe-fixes.md#4-api-客戶端改進)

- [x] **創建 Token 儲存工具** ✅ 已完成 (已安裝 js-cookie 依賴)
  - 檔案: `lib/utils/tokenStorage.ts`
  - 動作: 實現雙重儲存策略 (Cookie + localStorage)
  - 指令: `npm install js-cookie && npm install --save-dev @types/js-cookie`
  - 參考: [feednav-fe-fixes.md#4.1](./feednav-fe-fixes.md#41-增強-token-管理)

- [ ] **修正空接口定義**
  - 檔案: `command.tsx`, `textarea.tsx`
  - 動作: 將空接口改為類型別名
  - 參考: [feednav-fe-fixes.md#2.3](./feednav-fe-fixes.md#23-修正空接口)

### P2 - 優化改進

- [ ] **清理 Supabase 依賴**
  - 指令: `npm uninstall @supabase/supabase-js @supabase/ssr`
  - 動作: 刪除 `src/integrations/supabase/` 目錄

- [ ] **創建常數管理文件**
  - 檔案: `lib/constants/index.ts`
  - 動作: 集中管理 API 端點、分頁設定等常數
  - 參考: [feednav-fe-fixes.md#7](./feednav-fe-fixes.md#7-常數管理)

- [ ] **改進類型定義**
  - 檔案: `types/index.ts`
  - 動作: 擴展 API 響應類型和領域類型
  - 參考: [feednav-fe-fixes.md#6](./feednav-fe-fixes.md#6-類型定義改進)

- [ ] **更新 ESLint 配置**
  - 檔案: `.eslintrc.json`
  - 動作: 從 FlatCompat 遷移到標準配置

### P3 - 長期改進

- [ ] **完全遷移到 App Router**
  - 動作: 將 `src/pages/` 內容整合到 `src/app/`

- [ ] **添加單元測試**
  - 工具: Jest + React Testing Library
  - 目標: 覆蓋關鍵 hooks 和組件

---

## feednav-serverless 後端專案

### P0 - 立即修正

- [x] **添加 ESLint 配置** ✅ 已完成
  - 檔案: `.eslintrc.json`
  - 指令: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - 參考: [feednav-serverless-fixes.md#1.1](./feednav-serverless-fixes.md#11-添加-eslint-配置)

- [x] **添加 Prettier 配置** ✅ 已完成
  - 檔案: `.prettierrc.json`, `.prettierignore`
  - 指令: `npm install --save-dev prettier eslint-config-prettier`
  - 參考: [feednav-serverless-fixes.md#1.2](./feednav-serverless-fixes.md#12-添加-prettier-配置)

- [ ] **更新 TypeScript 配置**
  - 檔案: `tsconfig.json`
  - 動作: 添加路徑別名配置
  - 參考: [feednav-serverless-fixes.md#1.3](./feednav-serverless-fixes.md#13-更新-typescript-配置)

- [x] **更新 package.json 腳本** ✅ 已完成
  - 動作: 添加 lint、format、type-check 腳本
  - 參考: [feednav-serverless-fixes.md#1.4](./feednav-serverless-fixes.md#14-更新-packagejson-腳本)

### P1 - 重要修正

- [x] **創建常數文件** ✅ 已完成
  - 檔案: `src/constants.ts`
  - 動作: 集中管理 JWT 配置、分頁設定等
  - 參考: [feednav-serverless-fixes.md#2.2](./feednav-serverless-fixes.md#22-創建常數文件)

- [x] **創建錯誤處理層** ✅ 已完成
  - 檔案: `src/errors/index.ts`
  - 動作: 實現 ApiError 類和預定義錯誤
  - 參考: [feednav-serverless-fixes.md#2.3](./feednav-serverless-fixes.md#23-創建錯誤處理層)

- [x] **提取 CORS 配置** ✅ 已完成
  - 檔案: `src/middleware/cors.ts`
  - 動作: 從 index.ts 提取 CORS 邏輯
  - 參考: [feednav-serverless-fixes.md#4.1](./feednav-serverless-fixes.md#41-提取-cors-配置)

- [x] **改進認證中間件** ✅ 已完成
  - 檔案: `src/middleware/auth.ts`
  - 動作: 添加可選認證中間件，改進錯誤處理
  - 參考: [feednav-serverless-fixes.md#4.4](./feednav-serverless-fixes.md#44-改進認證中間件)

- [ ] **實現全局錯誤處理**
  - 檔案: `src/index.ts`
  - 動作: 添加 onError 和 notFound 處理器
  - 參考: [feednav-serverless-fixes.md#5](./feednav-serverless-fixes.md#5-全局錯誤處理)

### P2 - 優化改進

- [x] **添加訪問日誌中間件** ✅ 已完成
  - 檔案: `src/middleware/accessLog.ts`
  - 動作: 記錄請求到 Analytics Engine
  - 參考: [feednav-serverless-fixes.md#4.2](./feednav-serverless-fixes.md#42-添加訪問日誌中間件)

- [x] **添加速率限制中間件** ✅ 已完成
  - 檔案: `src/middleware/rateLimit.ts`
  - 動作: 使用 KV 實現請求限制
  - 參考: [feednav-serverless-fixes.md#4.3](./feednav-serverless-fixes.md#43-添加速率限制中間件)

- [ ] **集中類型定義**
  - 檔案: `src/types.ts`
  - 動作: 將所有類型集中到單一文件
  - 參考: [feednav-serverless-fixes.md#6](./feednav-serverless-fixes.md#6-類型定義集中管理)

- [ ] **添加單元測試**
  - 檔案: `tests/` 目錄
  - 工具: Vitest
  - 參考: [feednav-serverless-fixes.md#7](./feednav-serverless-fixes.md#7-添加單元測試)

### P3 - 長期改進 (三層架構重構)

- [ ] **創建 Repository 層**
  - 檔案: `src/repositories/`
  - 動作: 將 SQL 查詢從 handlers 提取出來
  - 參考: [feednav-serverless-fixes.md#3.1](./feednav-serverless-fixes.md#31-repository-層-資料存取)

- [ ] **創建 Service 層**
  - 檔案: `src/services/`
  - 動作: 實現業務邏輯分離
  - 參考: [feednav-serverless-fixes.md#3.2](./feednav-serverless-fixes.md#32-service-層-業務邏輯)

- [ ] **重構 Routes 層**
  - 檔案: `src/routes/` (從 handlers 重命名)
  - 動作: 路由只負責接收請求和返回響應
  - 參考: [feednav-serverless-fixes.md#3.3](./feednav-serverless-fixes.md#33-route-層-路由處理)

---

## CI/CD 與環境配置

### P1 - 環境配置

- [ ] **更新前端 wrangler.toml**
  - 檔案: `feednav-fe/wrangler.toml`
  - 動作: 添加 Preview 和 Production 環境配置
  - 參考: [cicd-environment-setup.md#2.1](./cicd-environment-setup.md#21-更新-wranglertoml)

- [ ] **更新後端 wrangler.toml**
  - 檔案: `feednav-serverless/wrangler.toml`
  - 動作: 添加完整的 Preview 和 Production 環境配置
  - 參考: [cicd-environment-setup.md#3.1](./cicd-environment-setup.md#31-更新-wranglertoml)

- [ ] **創建環境變數範例文件**
  - 檔案: `.env.local.example`
  - 動作: 為兩個專案創建環境變數範例

- [ ] **設定 Cloudflare 服務**
  - 動作: 創建 D1 資料庫、KV Namespace、R2 Bucket (Preview + Production)

### P1 - GitHub Actions CI/CD

- [ ] **創建前端部署 Workflow**
  - 檔案: `feednav-fe/.github/workflows/deploy.yml`
  - 動作: 配置自動部署到 Preview/Production
  - 參考: [cicd-environment-setup.md#4.1](./cicd-environment-setup.md#41-前端部署流程)

- [ ] **創建後端部署 Workflow**
  - 檔案: `feednav-serverless/.github/workflows/deploy.yml`
  - 動作: 配置自動部署和資料庫遷移
  - 參考: [cicd-environment-setup.md#4.2](./cicd-environment-setup.md#42-後端部署流程)

- [ ] **設定 GitHub Secrets**
  - 動作: 添加 CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID 等
  - 參考: [cicd-environment-setup.md#5](./cicd-environment-setup.md#5-github-secrets-配置)

### P2 - 環境優化

- [ ] **設定 Wrangler Secrets**
  - 動作: 使用 `wrangler secret put` 設定 JWT_SECRET 等敏感變數

- [ ] **配置分析工具**
  - 檔案: `src/components/shared/analytics.tsx`
  - 動作: 實現只在正式環境啟用分析的邏輯

- [ ] **設定分支保護規則**
  - 動作: 在 GitHub 設定 main 和 develop 分支保護

---

## 驗證指令

### 前端專案

```bash
cd /Users/xiaoxu/Projects/FeedNav/feednav-fe

# 執行所有檢查
npm run type-check && npm run lint && npm run format:check && npm run build
```

### 後端專案

```bash
cd /Users/xiaoxu/Projects/FeedNav/feednav-serverless

# 執行所有檢查
npm run type-check && npm run lint && npm run format:check && npm run test
```

---

## 進度追蹤

| 階段 | feednav-fe | feednav-serverless | CI/CD | 狀態 |
|------|-----------|-------------------|-------|------|
| P0 配置修正 | 2/4 已完成 | 3/4 已完成 | - | 🔄 進行中 |
| P1 重要修正 | 1/5 已完成 | 4/5 已完成 | 0/6 | 🔄 進行中 |
| P2 優化改進 | 0/4 | 2/4 已完成 | 0/3 | 🔄 進行中 |
| P3 長期改進 | 0/2 | 0/3 | - | ⬜ 待開始 |

**圖例:** ⬜ 待開始 | 🔄 進行中 | ✅ 已完成

### 完成總結 (2026-01-28)

**feednav-fe 前端專案:**
- ✅ P0: 移除錯誤忽略配置、添加 Prettier 配置
- ✅ P1: 安裝 js-cookie 依賴

**feednav-serverless 後端專案:**
- ✅ P0: ESLint 配置、Prettier 配置、package.json 腳本
- ✅ P1: 常數文件、錯誤處理層、CORS 配置、認證中間件
- ✅ P2: 訪問日誌中間件、速率限制中間件

---

## 快速開始

建議從以下順序開始修正：

1. **第一步 (30 分鐘)**
   - 兩個專案都添加 Prettier 配置
   - 執行 `npm run format` 統一程式碼格式

2. **第二步 (1 小時)**
   - feednav-fe: 移除 next.config.ts 中的錯誤忽略
   - feednav-serverless: 添加 ESLint 配置

3. **第三步 (2 小時)**
   - 修正所有 ESLint 錯誤
   - 執行 `npm run lint` 確認無錯誤

4. **第四步 (持續)**
   - 按優先級處理剩餘項目
   - 每完成一項就執行驗證指令確認

---

*最後更新: 2026-01-28 (狀態已更新)*
