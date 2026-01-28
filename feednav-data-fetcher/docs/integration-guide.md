# FeedNav-DataFetcher 與 FeedNav-Serverless 整合指南

## 概述

本文檔說明如何將 FeedNav-DataFetcher 收集的餐廳資料整合到 FeedNav-Serverless 後端系統中。

## 資料流架構

```
FeedNav-DataFetcher → 資料處理 → FeedNav-Serverless Database
      ↓                ↓                    ↓
Google Places API → JSON 檔案 → Cloudflare D1 Database
```

## 目標資料庫結構

根據 `FeedNav-Serverless/schema.sql`，主要資料表包括：

### 1. restaurants 表
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

### 2. tags 表
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  color TEXT,
  is_positive INTEGER DEFAULT 1
);
```

### 3. restaurant_tags 關聯表
```sql
CREATE TABLE restaurant_tags (
  restaurant_id INTEGER REFERENCES restaurants(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (restaurant_id, tag_id)
);
```

## 資料對應關係

### DataFetcher 輸出 → Serverless 資料庫

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

## 整合實作

### 1. 資料轉換器

創建 `data_transformer.py` 來處理資料格式轉換：

```python
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any

class DataTransformer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.tag_mapping = self.load_tag_mapping()
    
    def transform_restaurant_data(self, fetcher_data: Dict) -> Dict:
        """將 DataFetcher 資料轉換為 Serverless 格式"""
        
        # 基本餐廳資料
        restaurant = {
            'name': fetcher_data.get('name'),
            'district': fetcher_data.get('district'),
            'cuisine_type': fetcher_data.get('cuisine_type'),
            'rating': fetcher_data.get('rating'),
            'price_level': fetcher_data.get('price_level'),
            'address': fetcher_data.get('formatted_address'),
            'phone': fetcher_data.get('formatted_phone_number'),
            'website': fetcher_data.get('website'),
            'latitude': fetcher_data.get('geometry', {}).get('location', {}).get('lat'),
            'longitude': fetcher_data.get('geometry', {}).get('location', {}).get('lng'),
            'photos': json.dumps(self.process_photos(fetcher_data.get('photos', []))),
            'opening_hours': json.dumps(fetcher_data.get('opening_hours')),
            'description': self.generate_description(fetcher_data)
        }
        
        # 處理標籤
        restaurant['processed_tags'] = self.process_tags(fetcher_data.get('tags', {}))
        restaurant['mrt_info'] = fetcher_data.get('nearby_mrt', [])
        
        return restaurant
    
    def process_photos(self, photos: List) -> List[str]:
        """處理照片 URL"""
        photo_urls = []
        for photo in photos[:5]:  # 限制最多5張照片
            if isinstance(photo, dict) and 'photo_reference' in photo:
                # 構建 Google Places Photo URL
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={os.getenv('GOOGLE_MAPS_API_KEY')}"
                photo_urls.append(photo_url)
        return photo_urls
    
    def process_tags(self, tags_data: Dict) -> List[Dict]:
        """處理標籤資料"""
        processed_tags = []
        
        for category, tags in tags_data.items():
            for tag_type, tag_info in tags.items():
                if tag_info['confidence'] >= 0.5:  # 只保留高信心度標籤
                    tag_name = self.get_tag_name(category, tag_type)
                    if tag_name:
                        processed_tags.append({
                            'name': tag_name,
                            'category': category,
                            'confidence': tag_info['confidence'],
                            'is_positive': self.is_positive_tag(tag_type)
                        })
        
        return processed_tags
    
    def get_tag_name(self, category: str, tag_type: str) -> str:
        """將內部標籤類型轉換為顯示名稱"""
        tag_names = {
            'payment': {
                'electronic_payment': '電子支付',
                'cash_only': '僅收現金',
                'multiple_payment': '多元支付'
            },
            'environment': {
                'quiet': '環境安靜',
                'noisy': '環境吵雜',
                'romantic': '浪漫氛圍',
                'family_friendly': '親子友善'
            },
            'hygiene': {
                'clean': '衛生良好',
                'dirty': '衛生不佳'
            },
            'service': {
                'good_service': '服務優質',
                'poor_service': '服務不佳',
                'fast_service': '出餐快速',
                'slow_service': '出餐較慢'
            },
            'pet_policy': {
                'pet_friendly': '寵物友善',
                'no_pets': '禁止寵物'
            },
            'air_quality': {
                'smoking_allowed': '允許吸菸',
                'non_smoking': '禁菸環境',
                'good_ventilation': '通風良好',
                'poor_ventilation': '通風不佳'
            }
        }
        
        return tag_names.get(category, {}).get(tag_type, '')
    
    def is_positive_tag(self, tag_type: str) -> bool:
        """判斷標籤是否為正面標籤"""
        positive_tags = [
            'electronic_payment', 'multiple_payment', 'quiet', 'romantic', 
            'family_friendly', 'clean', 'good_service', 'fast_service', 
            'pet_friendly', 'non_smoking', 'good_ventilation'
        ]
        return tag_type in positive_tags
    
    def generate_description(self, fetcher_data: Dict) -> str:
        """生成餐廳描述"""
        description_parts = []
        
        # 添加捷運站資訊
        nearby_mrt = fetcher_data.get('nearby_mrt', [])
        if nearby_mrt:
            station_names = [station['name'] for station in nearby_mrt[:2]]
            description_parts.append(f"鄰近捷運站：{', '.join(station_names)}")
        
        # 添加菜系信心度資訊
        cuisine_confidence = fetcher_data.get('cuisine_confidence', 0)
        if cuisine_confidence > 0.8:
            description_parts.append("菜系分類：高信心度")
        
        return ' | '.join(description_parts) if description_parts else None
```

### 2. 資料庫插入器

創建 `database_inserter.py`：

```python
import sqlite3
import json
from typing import Dict, List

class DatabaseInserter:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """初始化資料庫連接"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
    
    def insert_restaurant(self, restaurant_data: Dict) -> int:
        """插入餐廳資料"""
        
        # 檢查餐廳是否已存在
        existing = self.cursor.execute(
            "SELECT id FROM restaurants WHERE name = ? AND address = ?",
            (restaurant_data['name'], restaurant_data['address'])
        ).fetchone()
        
        if existing:
            return existing['id']
        
        # 插入新餐廳
        query = """
        INSERT INTO restaurants (
            name, district, cuisine_type, rating, price_level,
            photos, address, phone, website, opening_hours,
            description, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        self.cursor.execute(query, (
            restaurant_data['name'],
            restaurant_data['district'],
            restaurant_data['cuisine_type'],
            restaurant_data['rating'],
            restaurant_data['price_level'],
            restaurant_data['photos'],
            restaurant_data['address'],
            restaurant_data['phone'],
            restaurant_data['website'],
            restaurant_data['opening_hours'],
            restaurant_data['description'],
            restaurant_data['latitude'],
            restaurant_data['longitude']
        ))
        
        restaurant_id = self.cursor.lastrowid
        
        # 處理標籤
        self.insert_restaurant_tags(restaurant_id, restaurant_data['processed_tags'])
        
        self.conn.commit()
        return restaurant_id
    
    def insert_restaurant_tags(self, restaurant_id: int, tags: List[Dict]):
        """插入餐廳標籤"""
        for tag_data in tags:
            # 確保標籤存在
            tag_id = self.ensure_tag_exists(tag_data)
            
            # 插入關聯
            self.cursor.execute(
                "INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) VALUES (?, ?)",
                (restaurant_id, tag_id)
            )
    
    def ensure_tag_exists(self, tag_data: Dict) -> int:
        """確保標籤存在，不存在則創建"""
        existing = self.cursor.execute(
            "SELECT id FROM tags WHERE name = ?",
            (tag_data['name'],)
        ).fetchone()
        
        if existing:
            return existing['id']
        
        # 創建新標籤
        color = self.get_tag_color(tag_data['category'])
        self.cursor.execute(
            "INSERT INTO tags (name, category, color, is_positive) VALUES (?, ?, ?, ?)",
            (tag_data['name'], tag_data['category'], color, tag_data['is_positive'])
        )
        
        return self.cursor.lastrowid
    
    def get_tag_color(self, category: str) -> str:
        """根據類別獲取標籤顏色"""
        color_mapping = {
            'payment': 'orange',
            'environment': 'teal',
            'hygiene': 'blue',
            'service': 'purple',
            'pet_policy': 'green',
            'air_quality': 'gray'
        }
        return color_mapping.get(category, 'gray')
    
    def close(self):
        """關閉資料庫連接"""
        self.conn.close()
```

### 3. 整合腳本

創建 `integrate_data.py`：

```python
import json
import sys
import os
from pathlib import Path
from data_transformer import DataTransformer
from database_inserter import DatabaseInserter

def integrate_restaurant_data(json_file_path: str, db_path: str):
    """整合餐廳資料到 Serverless 資料庫"""
    
    print(f"開始整合資料：{json_file_path}")
    
    # 讀取 DataFetcher 輸出的 JSON 檔案
    with open(json_file_path, 'r', encoding='utf-8') as f:
        restaurants_data = json.load(f)
    
    # 初始化轉換器和插入器
    transformer = DataTransformer(db_path)
    inserter = DatabaseInserter(db_path)
    
    success_count = 0
    error_count = 0
    
    try:
        for i, restaurant_raw in enumerate(restaurants_data):
            try:
                # 轉換資料格式
                restaurant_data = transformer.transform_restaurant_data(restaurant_raw)
                
                # 插入資料庫
                restaurant_id = inserter.insert_restaurant(restaurant_data)
                
                success_count += 1
                print(f"[{i+1}/{len(restaurants_data)}] 成功插入：{restaurant_data['name']} (ID: {restaurant_id})")
                
            except Exception as e:
                error_count += 1
                print(f"[{i+1}/{len(restaurants_data)}] 錯誤：{restaurant_raw.get('name', 'Unknown')} - {e}")
                continue
    
    finally:
        inserter.close()
    
    print(f"\n整合完成！")
    print(f"成功：{success_count} 筆")
    print(f"錯誤：{error_count} 筆")
    print(f"總計：{len(restaurants_data)} 筆")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使用方式: python integrate_data.py <json_file_path> <database_path>")
        print("範例: python integrate_data.py taipei_restaurants_20231201.json ../FeedNav-Serverless/database.db")
        sys.exit(1)
    
    json_file_path = sys.argv[1]
    db_path = sys.argv[2]
    
    if not os.path.exists(json_file_path):
        print(f"錯誤：找不到檔案 {json_file_path}")
        sys.exit(1)
    
    integrate_restaurant_data(json_file_path, db_path)
```

## 使用流程

### 1. 資料收集
```bash
cd /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher
python main.py
# 輸出：taipei_restaurants_YYYYMMDD_HHMMSS.json
```

### 2. 資料整合
```bash
# 在 FeedNav-DataFetcher 目錄下
python integrate_data.py taipei_restaurants_20231201_143022.json ../FeedNav-Serverless/database.db
```

### 3. 驗證資料
```bash
# 檢查資料庫記錄數
cd /Users/xiaoxu/Projects/FeedNav/FeedNav-Serverless
sqlite3 database.db "SELECT COUNT(*) FROM restaurants;"
sqlite3 database.db "SELECT COUNT(*) FROM tags;"
sqlite3 database.db "SELECT COUNT(*) FROM restaurant_tags;"
```

## 自動化部署

### 1. 批次處理腳本

創建 `batch_integration.sh`：

```bash
#!/bin/bash

# 設定路徑
DATAFETCHER_DIR="/Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher"
SERVERLESS_DIR="/Users/xiaoxu/Projects/FeedNav/FeedNav-Serverless"
DATABASE_PATH="$SERVERLESS_DIR/database.db"

cd $DATAFETCHER_DIR

echo "開始資料收集..."
python main.py

# 找到最新的 JSON 檔案
LATEST_JSON=$(ls -t taipei_restaurants_*.json | head -n1)

if [ -n "$LATEST_JSON" ]; then
    echo "找到最新資料檔案：$LATEST_JSON"
    echo "開始資料整合..."
    python integrate_data.py "$LATEST_JSON" "$DATABASE_PATH"
    
    echo "部署到 Cloudflare..."
    cd $SERVERLESS_DIR
    npx wrangler d1 execute feednav-db --file=database.db --remote
    
    echo "完成！"
else
    echo "錯誤：找不到資料檔案"
    exit 1
fi
```

### 2. 定期更新

設定 cron job 進行定期更新：

```bash
# 每週日凌晨 2 點更新
0 2 * * 0 /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher/batch_integration.sh
```

## 注意事項

1. **API 限制**：Google Places API 有每日查詢限制，避免過於頻繁的資料收集
2. **資料去重**：確保不會重複插入相同餐廳
3. **錯誤處理**：妥善處理 API 錯誤和資料格式異常
4. **標籤管理**：新標籤會自動創建，需定期審查標籤品質
5. **備份策略**：整合前先備份現有資料庫

## 疑難排解

### 常見錯誤

1. **Google API Key 未設定**
   ```
   解決：確認 .env 檔案中的 GOOGLE_MAPS_API_KEY
   ```

2. **資料庫鎖定**
   ```
   解決：確認沒有其他程序正在使用資料庫
   ```

3. **標籤信心度過低**
   ```
   解決：調整 process_tags 中的信心度閾值
   ```

4. **記憶體不足**
   ```
   解決：分批處理大量資料，避免一次載入太多餐廳
   ```