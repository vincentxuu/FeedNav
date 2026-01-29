# FeedNav 資料規格文件

本目錄包含 FeedNav 餐廳資料的規格與需求定義。

## 文件索引

| 文件 | 說明 |
|------|------|
| [data-requirements.md](./data-requirements.md) | 資料需求規格（根據服務設計） |

## 快速參考

### 資料分類

```
店家類型：
├─ 餐廳（正餐）
├─ 甜點（甜點店、蛋糕、冰品）
└─ 咖啡廳（精品咖啡、複合式）
```

### 情境標籤

| 標籤 | 用途 | 判斷依據 |
|------|------|----------|
| 聚餐適合 | 多人聚餐篩選 | 包廂、座位數、評論 |
| 一個人也適合 | 獨食篩選 | 吧台、評論 |
| 飲控友善 | 健康餐篩選 | 菜單類型、評論 |

### 相關文件

- [服務設計文件](../service-design/) - 產品策略與用戶旅程
- [Data Fetcher README](../../feednav-data-fetcher/README.md) - 資料收集工具
- [Database Schema](../../feednav-serverless/schema.sql) - 資料庫結構
