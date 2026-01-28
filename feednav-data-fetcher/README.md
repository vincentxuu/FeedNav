# FeedNav-DataFetcher

台北餐廳資料收集與整合服務，將 Google Places API 資料轉換並匯入 FeedNav-Serverless 資料庫。

## 功能特色

- **Google Places API 整合**：獲取餐廳基本資訊、評分、價位、營業時間等
- **地理位置處理**：自動識別行政區域並計算鄰近捷運站
- **菜系智慧分類**：從餐廳名稱、類型和評論中推斷菜系類型
- **評論標籤提取**：自動從評論中提取環境、服務、衛生等標籤
- **批量資料收集**：支援台北市 12 個行政區餐廳批量收集
- **資料庫整合**：直接匯入 FeedNav-Serverless SQLite 資料庫

## 系統需求

- Python 3.10+
- Google Maps API Key（需啟用 Places API）

## 安裝說明

1. 安裝依賴套件：
```bash
pip install -r requirements.txt
```

2. 設置環境變數：
```bash
cp .env.example .env
```

3. 編輯 `.env` 檔案：
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 使用方式

### 步驟一：收集餐廳資料

```bash
python main.py
```

執行後會在當前目錄產生 `taipei_restaurants_YYYYMMDD_HHMMSS.json`。

### 步驟二：整合到資料庫

```bash
python integrate_data.py <json檔案路徑> <資料庫路徑>

# 範例
python integrate_data.py taipei_restaurants_20260128_143022.json ../feednav-serverless/database.db

# 安靜模式（減少輸出）
python integrate_data.py taipei_restaurants_20260128.json ../feednav-serverless/database.db --quiet
```

### 一鍵執行（收集+整合）

```bash
./batch_integration.sh
```

## 專案結構

```
feednav-data-fetcher/
├── main.py                  # 主程式入口（資料收集）
├── integrate_data.py        # 資料庫整合腳本
├── batch_integration.sh     # 一鍵執行腳本
├── data_collector.py        # 資料收集管道
├── location_processor.py    # 地點處理器
├── cuisine_classifier.py    # 菜系分類器
├── review_tag_extractor.py  # 評論標籤提取器
├── data_transformer.py      # 資料格式轉換器
├── database_inserter.py     # 資料庫插入器
├── requirements.txt         # 依賴套件
├── .env.example             # 環境變數範例
└── docs/
    ├── integration-guide.md # 整合指南
    └── api-examples.md      # API 範例
```

## 核心模組

### DataCollectionPipeline (data_collector.py)
主要的資料收集管道，負責協調各個處理模組。

### LocationProcessor (location_processor.py)
- 從地址提取台北市行政區
- 計算鄰近捷運站（500公尺內）
- 包含完整的台北捷運站資料庫

### CuisineClassifier (cuisine_classifier.py)
- 支援 14 種主要菜系分類
- 綜合分析餐廳名稱、Google 類型和評論內容
- 提供分類信心度評分

### ReviewTagExtractor (review_tag_extractor.py)
從評論中提取以下標籤：
- **環境標籤**：安靜、吵雜、浪漫、親子友善
- **衛生標籤**：乾淨、髒亂
- **服務標籤**：服務好、服務差、出餐快、出餐慢
- **寵物政策**：寵物友善、禁止寵物
- **支付方式**：電子支付、僅收現金、多元支付
- **空氣品質**：通風良好、通風差、可吸菸、禁菸

### DataTransformer (data_transformer.py)
將收集的資料轉換為資料庫格式：
- 提取座標資訊
- 處理照片參考（避免暴露 API Key）
- 轉換標籤為中文顯示名稱

### DatabaseInserter (database_inserter.py)
將轉換後的資料插入 SQLite 資料庫：
- 自動去重（根據名稱+地址）
- 自動建立標籤關聯
- 提供資料完整性驗證

## 輸出格式

```json
{
  "name": "餐廳名稱",
  "rating": 4.2,
  "price_level": 2,
  "formatted_address": "台北市信義區...",
  "district": "信義區",
  "nearby_mrt": [
    {
      "name": "台北101/世貿站",
      "distance": 350,
      "line": ["淡水信義線"]
    }
  ],
  "cuisine_type": "日式料理",
  "cuisine_confidence": 0.85,
  "tags": {
    "environment": {
      "quiet": {
        "confidence": 0.7,
        "count": 3,
        "evidence": ["安靜", "適合聊天"]
      }
    },
    "service": {
      "good_service": {
        "confidence": 0.8,
        "count": 5,
        "evidence": ["服務很好", "態度親切"]
      }
    }
  }
}
```

## 配置調整

各模組的配置常數位於檔案頂部，可依需求調整：

### data_collector.py
```python
API_CONFIG = {
    'SEARCH_RADIUS_METERS': 2000,      # 搜尋半徑
    'NEXT_PAGE_DELAY_SECONDS': 2,      # 翻頁延遲
    'REQUEST_DELAY_SECONDS': 0.1,      # 請求間隔
}
```

### review_tag_extractor.py
```python
CONFIDENCE_CONFIG = {
    'AGGREGATION_THRESHOLD': 0.3,      # 標籤信心度門檻
    'MAX_EVIDENCE_COUNT': 3,           # 保留的證據數量
}
```

### data_transformer.py
```python
TRANSFORMER_CONFIG = {
    'MAX_PHOTOS': 5,                   # 最多儲存的照片數
    'TAG_CONFIDENCE_THRESHOLD': 0.5,   # 標籤過濾門檻
}
```

## API 使用限制

- Google Places API 有每日查詢限制
- 程式內建速率限制（0.1 秒/請求）
- 翻頁需等待 2 秒（Google API 要求）
- 詳細配額資訊請參考 [Google Cloud Console](https://console.cloud.google.com/)

## 資料品質

| 指標 | 說明 |
|------|------|
| 菜系分類準確率 | 目標 80%+ |
| 標籤提取門檻 | 信心度 ≥ 0.3 |
| 地理位置匹配 | 支援地址解析和座標反查 |
| 捷運站匹配 | 500 公尺內 |

## 常見問題

### API Key 未設定
```
錯誤：環境變數 GOOGLE_MAPS_API_KEY 未設定
解決：確認 .env 檔案存在且內容正確
```

### 資料庫鎖定
```
錯誤：database is locked
解決：確認沒有其他程序正在使用資料庫
```

### 標籤數量過少
```
原因：信心度門檻設定過高
解決：調整 TAG_CONFIDENCE_THRESHOLD 為較低值（如 0.3）
```

## 相關文件

- [整合指南](docs/integration-guide.md) - 完整的資料庫整合說明
- [API 範例](docs/api-examples.md) - Google Places API 使用範例