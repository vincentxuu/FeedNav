# FeedNav 資料整合文檔

本目錄包含 FeedNav-DataFetcher 與 FeedNav-Serverless 整合的完整文檔。

## 📚 文檔列表

### 1. [整合指南](./integration-guide.md)
完整的資料整合流程說明，包括：
- 資料流架構圖
- 資料庫結構對應
- 資料轉換實作
- 批次處理腳本
- 自動化部署

### 2. [API 整合範例](./api-examples.md)
實際的程式碼範例，包括：
- 直接 API 上傳
- 即時同步腳本
- Webhook 通知
- 系統監控
- 排程執行

## 🚀 快速開始

### 基本流程
```bash
# 1. 收集資料
cd /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher
python main.py

# 2. 整合到資料庫
python integrate_data.py taipei_restaurants_YYYYMMDD.json ../FeedNav-Serverless/database.db

# 3. 自動化批次處理
./batch_integration.sh
```

### 設定環境變數
```bash
# 複製環境變數範本
cp .env.example .env

# 編輯並添加必要的 API Key
vim .env
```

## 📋 檢查清單

在開始整合前，請確認：

- [ ] Google Maps API Key 已設定
- [ ] FeedNav-Serverless 專案已正確部署
- [ ] 資料庫架構已建立（schema.sql）
- [ ] Python 依賴已安裝（requirements.txt）
- [ ] 執行權限已設定（batch_integration.sh）

## 🔧 故障排除

### 常見問題

1. **API 限制錯誤**
   - 檢查 Google Maps API 配額
   - 調整請求間隔時間

2. **資料庫鎖定**
   - 確認沒有其他程序使用資料庫
   - 檢查檔案權限

3. **標籤信心度過低**
   - 調整 `data_transformer.py` 中的閾值
   - 檢查評論品質

4. **記憶體不足**
   - 分批處理大量資料
   - 使用 `--quiet` 參數減少輸出

## 📊 監控與維護

### 資料品質檢查
```bash
# 檢查資料庫統計
python -c "
from database_inserter import DatabaseInserter
with DatabaseInserter('../FeedNav-Serverless/database.db') as db:
    stats = db.get_statistics()
    print(f'餐廳數量: {stats[\"total_restaurants\"]}')
    print(f'標籤數量: {stats[\"total_tags\"]}')
"
```

### 定期更新
```bash
# 設定 cron job 每週自動更新
0 2 * * 0 /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher/batch_integration.sh
```

## 🔗 相關連結

- [FeedNav-DataFetcher 主要 README](../README.md)
- [FeedNav-Serverless 專案](../../FeedNav-Serverless/)
- [Google Places API 文檔](https://developers.google.com/maps/documentation/places/web-service)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)

## 📝 更新日誌

- **2023-12-01**: 初始版本，基本整合功能
- **2023-12-02**: 新增 API 直接上傳功能
- **2023-12-03**: 新增監控和通知機制

## 🤝 貢獻

如需改善整合流程或添加新功能，請：

1. Fork 專案
2. 建立功能分支
3. 提交 Pull Request
4. 更新相關文檔

---

**注意**: 請確保遵守 Google Places API 的使用條款，避免過度頻繁的請求。