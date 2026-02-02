# 服務設計文件索引

本資料夾包含 FeedNav 用戶參與飛輪系統的服務設計補充文件。這些文件是針對 [飛輪策略主文件](./flywheel-strategy.md) 的深入設計與執行規劃。

## 文件總覽

### 核心策略文件

| 文件 | 說明 | 用途 |
|------|------|------|
| [flywheel-strategy.md](./flywheel-strategy.md) | 飛輪策略主文件 | 飛輪完整設計與核心循環 |
| [mvp-scope.md](./mvp-scope.md) | MVP 功能範圍 | IN/OUT/MAYBE 清單與開發計畫 |
| [user-journey-map.md](./user-journey-map.md) | 用戶旅程地圖 | 6 階段用戶旅程與情緒曲線 |

### 設計細節文件

| 文件 | 說明 | 用途 |
|------|------|------|
| [ux-first-mile.md](./ux-first-mile.md) | 首次體驗設計 | 解決「只看不用」的心理障礙 |
| [hook-design.md](./hook-design.md) | 觸發點設計 | Hook Model 應用與習慣養成 |
| [cold-start-playbook.md](./cold-start-playbook.md) | 冷啟動執行手冊 | 30 位種子用戶招募與輔導 |

### 參考文件

| 文件 | 說明 | 用途 |
|------|------|------|
| [competitive-analysis.md](./competitive-analysis.md) | 競品分析 | Google Maps、愛食記等競品對比 |
| [analytics-events.md](./analytics-events.md) | Analytics 事件定義 | 追蹤事件名稱與參數規範 |
| [glossary.md](./glossary.md) | 術語表 | 統一用語與文案風格指南 |

## 建議閱讀順序

### 策略理解路線
1. **[飛輪策略主文件](./flywheel-strategy.md)** - 了解整體飛輪架構
2. **[競品分析](./competitive-analysis.md)** - 了解市場定位與差異化
3. **[用戶旅程地圖](./user-journey-map.md)** - 理解用戶全流程
4. **[首次體驗設計](./ux-first-mile.md)** - 深入首次體驗設計細節

### 執行落地路線
1. **[MVP 功能範圍](./mvp-scope.md)** - 確認開發範圍
2. **[Analytics 事件定義](./analytics-events.md)** - 設定數據追蹤
3. **[冷啟動執行手冊](./cold-start-playbook.md)** - 種子用戶招募執行
4. **[觸發點設計](./hook-design.md)** - 通知與習慣養成機制

### 開發參考
- **[術語表](./glossary.md)** - 統一用語，文案撰寫時參考

## 核心問題與解法

### 問題診斷
> 「很多人搜尋，很少人收藏分享」的根本原因是：**用戶覺得「只是吃個飯而已」**

這不是功能問題，而是心理障礙。

### 解法架構

```
降低門檻              建立價值              形成習慣
   │                    │                    │
   ▼                    ▼                    ▼
一鍵收藏              展示「美食探險家」     確保每個收藏
（不需要寫評論）       的精選餐廳           都有價值回饋
   │                    │                    │
   └────────────────────┴────────────────────┘
                        │
                        ▼
              「記錄美食發現是值得的」
```

## MVP 策略

本次 MVP 聚焦驗證 **收藏與探索飛輪**：

- **IN**: 核心收藏功能、餐廳探索、基礎通知
- **OUT**: 社群評論、進階推薦、擴展飛輪
- **驗證假設**: 「個人化推薦會讓用戶更願意探索」

詳見 [MVP 功能範圍](./mvp-scope.md)

## 關聯文件

- [飛輪策略主文件](./flywheel-strategy.md) - 飛輪完整設計
- [專案 README](../../README.md) - 專案技術架構說明

## 更新記錄

| 日期 | 更新內容 |
|------|----------|
| 2025-01-31 | 新增競品分析、Analytics 事件定義、術語表；更新文件索引結構 |
| 2025-01-28 | 更新為 FeedNav 餐廳探索平台內容 |
