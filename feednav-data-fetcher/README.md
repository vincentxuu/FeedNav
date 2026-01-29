# FeedNav-DataFetcher

台北餐廳資料收集與整合服務，將 Google Places API 資料轉換並匯入 FeedNav-Serverless 資料庫。

## 功能特色

- **Google Places API 整合**：獲取餐廳基本資訊、評分、價位、營業時間等
- **地理位置處理**：自動識別行政區域並計算鄰近捷運站
- **菜系智慧分類**：從餐廳名稱、類型和評論中推斷菜系類型
- **評論標籤提取**：自動從評論中提取環境、服務、衛生等標籤
- **批量資料收集**：支援台北市 12 個行政區餐廳批量收集
- **資料庫整合**：直接匯入 FeedNav-Serverless D1/SQLite 資料庫

## 系統需求

- Python 3.10+
- Google Maps API Key（需啟用 Places API）

## 安裝說明

```bash
cd feednav-data-fetcher

# 建立虛擬環境並安裝依賴
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 設置環境變數

```bash
# 建立 .env 檔案
echo "GOOGLE_MAPS_API_KEY=你的API金鑰" > .env
```

---

## 使用方式

### 查看收集進度

```bash
python main.py --status
# 或簡寫
python main.py -s
```

### 收集指定區域

```bash
# 收集大安區和信義區
python main.py --districts 大安區 信義區

# 簡寫
python main.py -d 大安區 信義區
```

### 自動收集未完成的區域

```bash
# 收集所有未完成的區域
python main.py --pending

# 只收集前 2 個未完成的區域（分批收集）
python main.py --pending --limit 2
# 或
python main.py -p -l 2
```

### 指定搜尋類型

```bash
# 同時收集餐廳和咖啡廳
python main.py -d 大安區 --types restaurant cafe

# 可用類型：restaurant, dessert, cafe, healthy
```

### 重設收集進度

```bash
# 重設指定區域（重新收集）
python main.py --reset 大安區

# 重設所有進度
python main.py --reset-all
```

### 可用區域

```
中正區, 大同區, 中山區, 松山區, 大安區, 萬華區,
信義區, 士林區, 北投區, 內湖區, 南港區, 文山區
```

執行後會在當前目錄產生 `taipei_restaurants_<區域>_YYYYMMDD_HHMMSS.json`。

### 步驟二：整合到資料庫

> **重要**：FeedNav-Serverless 使用 Cloudflare D1 資料庫。
>
> **注意事項**：
> - `tags` 由 migration 管理，**不從本地匯出**
> - `restaurant_tags` 使用 **tag name 子查詢**，解決本地與遠端 tag_id 不同步問題
> - 必須使用 `pnpm exec wrangler`（專案內 v4.61.0+），避免使用全域舊版

```bash
# 1. 整合到臨時 SQLite 檔案
python integrate_data.py taipei_restaurants_20260128.json ./temp_import.db

# 2. 匯出為 SQL
# 2a. 匯出 restaurants
sqlite3 ./temp_import.db .dump | grep "^INSERT INTO restaurants " > import.sql

# 2b. 匯出 restaurant_tags（使用 tag name 子查詢 + INSERT OR IGNORE）
sqlite3 ./temp_import.db "
  SELECT 'INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) SELECT ' ||
         rt.restaurant_id || ', id FROM tags WHERE name = ''' ||
         REPLACE(t.name, '''', '''''') || ''';'
  FROM restaurant_tags rt JOIN tags t ON rt.tag_id = t.id;
" >> import.sql

# 3. 匯入到遠端 D1
cd ../feednav-serverless

# Preview 環境
pnpm exec wrangler d1 execute feednav-db-preview --remote --file=../feednav-data-fetcher/import.sql

# Production 環境
pnpm exec wrangler d1 execute feednav-db --remote --file=../feednav-data-fetcher/import.sql -e production

# 4. 清理臨時檔案
cd ../feednav-data-fetcher
rm -f temp_import.db import.sql
```

#### 如果有新的 tags

如果本地使用了遠端不存在的 tags，需要先新增 migration：

```bash
# 1. 查看本地使用的所有 tags
grep "WHERE name = '" import.sql | sed "s/.*WHERE name = '//; s/';//" | sort -u

# 2. 在 feednav-serverless/migrations/ 建立新的 migration
# 例如：0003_add_missing_tags.sql

# 3. 應用 migration 到遠端
cd ../feednav-serverless
pnpm exec wrangler d1 execute feednav-db --remote -e production --file=migrations/0003_add_missing_tags.sql

# 4. 重新匯入 restaurant_tags
pnpm exec wrangler d1 execute feednav-db --remote -e production --file=../feednav-data-fetcher/import.sql
```

#### 安靜模式

```bash
python integrate_data.py taipei_restaurants_20260128.json ./temp_import.db --quiet
```

### 一鍵執行（推薦）

```bash
# 部署到 Preview 環境
./batch_integration.sh

# 部署到 Production 環境
./batch_integration.sh --production

# 跳過資料收集，使用現有 JSON
./batch_integration.sh --skip-collection --production
```

---

## 專案結構

```
feednav-data-fetcher/
├── main.py                  # 主程式入口（資料收集）
├── integrate_data.py        # 資料庫整合腳本
├── batch_integration.sh     # 一鍵執行腳本
├── collection_tracker.py    # 收集進度追蹤器
├── collection_progress.json # 收集進度記錄（自動產生）
├── data_collector.py        # 資料收集管道
├── location_processor.py    # 地點處理器
├── cuisine_classifier.py    # 菜系分類器
├── review_tag_extractor.py  # 評論標籤提取器
├── data_transformer.py      # 資料格式轉換器
├── database_inserter.py     # 資料庫插入器
├── requirements.txt         # 依賴套件
└── .env                     # 環境變數（需自行建立）
```

---

## 資料流架構

```
FeedNav-DataFetcher → 資料處理 → FeedNav-Serverless Database
      ↓                ↓                    ↓
Google Places API → JSON 檔案 → Cloudflare D1 Database
```

---

## 核心模組

### CollectionTracker (collection_tracker.py)
收集進度追蹤器，記錄已收集的區域：
- 自動儲存進度到 `collection_progress.json`
- 支援查看已收集/待收集區域
- 支援重設特定區域進度

進度檔案格式：
```json
{
  "collected_districts": {
    "大安區": {
      "collected_at": "2026-01-29T10:30:00",
      "restaurant_count": 150,
      "output_file": "taipei_restaurants_大安_20260129_103000.json"
    }
  },
  "last_updated": "2026-01-29T10:30:00"
}
```

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

---

## 目標資料庫結構

根據 `feednav-serverless/schema.sql`，主要資料表包括：

### restaurants 表
```sql
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT,
  cuisine_type TEXT,
  rating REAL,
  price_level INTEGER,
  photos TEXT DEFAULT '[]',
  address TEXT,
  phone TEXT,
  website TEXT,
  opening_hours TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### tags 表
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  color TEXT,
  is_positive INTEGER DEFAULT 1
);
```

### restaurant_tags 關聯表
```sql
CREATE TABLE restaurant_tags (
  restaurant_id INTEGER REFERENCES restaurants(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (restaurant_id, tag_id)
);
```

### 資料對應關係

| DataFetcher 欄位 | Serverless 欄位 | 資料處理 |
|------------------|-----------------|----------|
| `name` | `name` | 直接對應 |
| `district` | `district` | 直接對應 |
| `cuisine_type` | `cuisine_type` | 直接對應 |
| `rating` | `rating` | 直接對應 |
| `price_level` | `price_level` | 直接對應 |
| `formatted_address` | `address` | 直接對應 |
| `geometry.location.lat` | `latitude` | 提取座標 |
| `geometry.location.lng` | `longitude` | 提取座標 |
| `photos` | `photos` | JSON 格式轉換 |
| `opening_hours` | `opening_hours` | JSON 字串化 |
| `tags` | `tags` → `restaurant_tags` | 複雜對應處理 |
| `nearby_mrt` | - | 可作為描述或標籤 |

---

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

---

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

---

## 建議的收集流程

為避免一次收集過多資料（API 配額考量），建議分批收集：

| 批次 | 區域 | 說明 |
|------|------|------|
| 第 1 批 | 大安區、信義區 | 熱門區域 |
| 第 2 批 | 中山區、松山區 | 商業區 |
| 第 3 批 | 中正區、萬華區 | 市中心 |
| 第 4 批 | 士林區、北投區 | 北區 |
| 第 5 批 | 內湖區、南港區 | 東區 |
| 第 6 批 | 大同區、文山區 | 其他 |

```bash
# 1. 查看目前進度
python main.py -s

# 2. 分批收集（每次 2 個區域）
python main.py -p -l 2

# 3. 重複步驟 2 直到全部完成

# 4. 整合到資料庫
python integrate_data.py taipei_restaurants_*.json ./temp.db
```

---

## 進階整合

### 直接 API 上傳

若 FeedNav-Serverless 提供管理 API，可使用以下方式直接上傳：

```python
import requests
import json

def upload_restaurant(api_url: str, api_key: str, restaurant_data: dict):
    """透過 API 上傳餐廳資料"""
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    response = requests.post(
        f"{api_url}/api/admin/restaurants",
        headers=headers,
        json=restaurant_data
    )

    return response.json()
```

### 批次處理腳本 (batch_integration.sh)

一鍵執行完整資料管線：**資料收集 → 資料整合 → 部署到 Cloudflare D1**

#### 執行流程

```
1. check_prerequisites   - 檢查環境 (目錄、.env、sqlite3、Python 依賴)
2. collect_data          - 執行 main.py 收集餐廳資料 (30分鐘逾時)
3. find_latest_json      - 找到最新的 taipei_restaurants_*.json 檔案
4. integrate_data        - 執行 integrate_data.py 匯入臨時 SQLite
5. validate_database     - 驗證資料完整性，顯示餐廳和標籤數量
6. export_sql            - 匯出 SQL（restaurants + restaurant_tags via tag name）
7. deploy_to_cloudflare  - 透過 pnpm exec wrangler 部署到 D1
8. cleanup               - 清理暫存檔案，保留最新 3 個 JSON
```

#### SQL 匯出細節

`export_sql` 步驟會產生以下格式的 SQL：

```sql
-- restaurants: 直接使用 sqlite3 .dump 的 INSERT 語句
INSERT INTO restaurants VALUES(1,'餐廳名稱',...);

-- restaurant_tags: 使用 tag name 子查詢（解決 ID 不同步問題）
INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id)
SELECT 1, id FROM tags WHERE name = '有Wi-Fi';
```

這樣無論遠端 D1 的 tag_id 是什麼，只要 tag name 存在就能正確建立關聯。

#### 可用參數

| 參數 | 說明 |
|------|------|
| `--skip-collection` | 跳過資料收集，使用現有 JSON 檔案 |
| `--preview` | 部署到 Preview 環境 (預設) |
| `--production` | 部署到 Production 環境 |
| `--no-deploy` | 只處理資料，不部署到 Cloudflare |
| `--help` | 顯示使用說明 |

#### 使用範例

```bash
# 完整流程：收集資料並部署到 Preview 環境
./batch_integration.sh

# 使用現有 JSON 資料部署到 Preview
./batch_integration.sh --skip-collection

# 收集資料並部署到 Production 環境
./batch_integration.sh --production

# 只處理資料產生 SQL，不部署
./batch_integration.sh --no-deploy

# 使用現有資料部署到 Production
./batch_integration.sh --skip-collection --production
```

#### 重要特點

- **錯誤處理**：使用 `set -e`，任何錯誤立即停止
- **中斷處理**：捕捉 `INT/TERM` 信號，確保清理暫存檔案
- **自動清理**：只保留最新 3 個 JSON 檔案，避免磁碟空間浪費
- **環境檢查**：自動驗證 `.env`、`sqlite3`、Python 依賴等

### 定期更新（Cron Job）

```bash
# 每週日凌晨 2 點更新
0 2 * * 0 /path/to/feednav-data-fetcher/batch_integration.sh
```

---

## 資料品質

| 指標 | 說明 |
|------|------|
| 菜系分類準確率 | 目標 80%+ |
| 標籤提取門檻 | 信心度 ≥ 0.3 |
| 地理位置匹配 | 支援地址解析和座標反查 |
| 捷運站匹配 | 500 公尺內 |

---

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

### 記憶體不足
```
原因：一次載入太多餐廳資料
解決：分批處理大量資料，或使用 --quiet 參數減少輸出
```

### Wrangler FileHandle 錯誤
```
錯誤：A FileHandle object was closed during garbage collection
原因：全域安裝的 wrangler 版本過舊（< 4.61.0）
解決：使用 pnpm exec wrangler 執行專案內的版本
```

### FOREIGN KEY constraint failed
```
錯誤：FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
原因：restaurant_tags 參照的 tag name 在遠端 tags 表中不存在
解決：
1. 在 feednav-serverless/migrations/ 新增缺少的 tags
2. 執行 migration 後重新匯入
```

### 標籤關聯數量不符
```
現象：本地 434 筆 restaurant_tags，遠端只有 306 筆
原因：部分 tag name 在遠端不存在（會被 INSERT OR IGNORE 跳過）
解決：檢查並新增缺少的 tags 到 migration
```

---

## API 使用限制

- Google Places API 有每日查詢限制
- 程式內建速率限制（0.1 秒/請求）
- 翻頁需等待 2 秒（Google API 要求）
- 詳細配額資訊請參考 [Google Cloud Console](https://console.cloud.google.com/)

---

## 環境變數設定

### .env 範例

```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# FeedNav API（可選，用於直接 API 上傳）
FEEDNAV_API_URL=https://api.feednav.cc
FEEDNAV_API_KEY=your_api_key_if_needed

# Webhook 通知（可選）
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 相關連結

- [FeedNav-Serverless 專案](../feednav-serverless/)
- [Google Places API 文檔](https://developers.google.com/maps/documentation/places/web-service)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
