# API 整合範例

本文檔提供了 FeedNav-DataFetcher 與 FeedNav-Serverless API 的整合範例。

## 直接 API 上傳

### 1. 透過 API 上傳餐廳資料

創建 `api_uploader.py`：

```python
import json
import requests
import os
from typing import Dict, List
from dotenv import load_dotenv
from data_transformer import DataTransformer

load_dotenv()

class APIUploader:
    def __init__(self, api_base_url: str, api_key: str = None):
        self.base_url = api_base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            })
    
    def upload_restaurant(self, restaurant_data: Dict) -> Dict:
        """上傳單一餐廳資料"""
        
        endpoint = f"{self.base_url}/api/admin/restaurants"
        
        # 轉換資料格式
        payload = self.format_restaurant_data(restaurant_data)
        
        try:
            response = self.session.post(endpoint, json=payload)
            response.raise_for_status()
            
            return {
                'success': True,
                'data': response.json(),
                'restaurant_id': response.json().get('data', {}).get('id')
            }
        
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None)
            }
    
    def batch_upload_restaurants(self, restaurants_data: List[Dict]) -> Dict:
        """批次上傳餐廳資料"""
        
        results = {
            'total': len(restaurants_data),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for i, restaurant in enumerate(restaurants_data):
            print(f"上傳進度: {i+1}/{len(restaurants_data)} - {restaurant.get('name', 'Unknown')}")
            
            result = self.upload_restaurant(restaurant)
            
            if result['success']:
                results['success'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'restaurant': restaurant.get('name', 'Unknown'),
                    'error': result['error']
                })
        
        return results
    
    def format_restaurant_data(self, restaurant_data: Dict) -> Dict:
        """格式化餐廳資料為 API 格式"""
        
        # 基本餐廳資訊
        formatted = {
            'name': restaurant_data.get('name'),
            'district': restaurant_data.get('district'),
            'cuisine_type': restaurant_data.get('cuisine_type'),
            'rating': restaurant_data.get('rating'),
            'price_level': restaurant_data.get('price_level'),
            'address': restaurant_data.get('formatted_address'),
            'phone': restaurant_data.get('formatted_phone_number'),
            'website': restaurant_data.get('website'),
            'latitude': self.extract_coordinate(restaurant_data, 'lat'),
            'longitude': self.extract_coordinate(restaurant_data, 'lng'),
            'photos': self.format_photos(restaurant_data.get('photos', [])),
            'opening_hours': restaurant_data.get('opening_hours'),
            'description': self.generate_description(restaurant_data)
        }
        
        # 標籤資訊
        formatted['tags'] = self.format_tags(restaurant_data.get('tags', {}))
        
        return formatted
    
    def extract_coordinate(self, data: Dict, coord_type: str) -> float:
        """提取座標"""
        geometry = data.get('geometry', {})
        location = geometry.get('location', {})
        return location.get(coord_type)
    
    def format_photos(self, photos: List) -> List[str]:
        """格式化照片 URL"""
        photo_urls = []
        api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        
        for photo in photos[:5]:
            if isinstance(photo, dict) and 'photo_reference' in photo:
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={api_key}"
                photo_urls.append(photo_url)
        
        return photo_urls
    
    def format_tags(self, tags_data: Dict) -> List[str]:
        """格式化標籤為名稱列表"""
        tag_names = []
        
        tag_mapping = {
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
        
        for category, tags in tags_data.items():
            if isinstance(tags, dict):
                for tag_type, tag_info in tags.items():
                    if isinstance(tag_info, dict) and tag_info.get('confidence', 0) >= 0.5:
                        tag_name = tag_mapping.get(category, {}).get(tag_type)
                        if tag_name:
                            tag_names.append(tag_name)
        
        return tag_names
    
    def generate_description(self, restaurant_data: Dict) -> str:
        """生成餐廳描述"""
        description_parts = []
        
        # 捷運站資訊
        nearby_mrt = restaurant_data.get('nearby_mrt', [])
        if nearby_mrt:
            station_names = [station['name'] for station in nearby_mrt[:2]]
            description_parts.append(f"鄰近捷運站：{', '.join(station_names)}")
        
        # 菜系信心度
        cuisine_confidence = restaurant_data.get('cuisine_confidence', 0)
        if cuisine_confidence > 0.8:
            description_parts.append("菜系分類：高信心度")
        
        return ' | '.join(description_parts) if description_parts else None

# 使用範例
def main():
    # 設定 API 基礎 URL
    api_base_url = os.getenv('FEEDNAV_API_URL', 'https://your-worker.your-subdomain.workers.dev')
    api_key = os.getenv('FEEDNAV_API_KEY')  # 如果需要認證
    
    # 讀取餐廳資料
    with open('taipei_restaurants_20231201.json', 'r', encoding='utf-8') as f:
        restaurants_data = json.load(f)
    
    # 初始化上傳器
    uploader = APIUploader(api_base_url, api_key)
    
    # 批次上傳
    results = uploader.batch_upload_restaurants(restaurants_data)
    
    print(f"\n上傳完成：")
    print(f"成功：{results['success']} 筆")
    print(f"失敗：{results['failed']} 筆")
    
    if results['errors']:
        print("\n錯誤詳情：")
        for error in results['errors'][:5]:  # 只顯示前5個錯誤
            print(f"  {error['restaurant']}: {error['error']}")

if __name__ == "__main__":
    main()
```

### 2. 即時同步腳本

創建 `realtime_sync.py`：

```python
import json
import time
import asyncio
from typing import Dict, List
from data_collector import DataCollectionPipeline
from api_uploader import APIUploader
import os
from dotenv import load_dotenv

load_dotenv()

class RealtimeSync:
    def __init__(self, api_base_url: str, google_api_key: str, api_key: str = None):
        self.api_uploader = APIUploader(api_base_url, api_key)
        self.data_collector = DataCollectionPipeline(google_api_key)
        self.sync_interval = 3600  # 1小時同步一次
    
    async def sync_single_restaurant(self, place_id: str) -> Dict:
        """同步單一餐廳"""
        
        try:
            # 收集最新資料
            restaurant_data = await self.data_collector.collect_restaurant_data(place_id)
            
            if not restaurant_data:
                return {'success': False, 'error': 'Failed to collect data'}
            
            # 上傳到 API
            result = self.api_uploader.upload_restaurant(restaurant_data)
            
            return result
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def sync_restaurant_list(self, place_ids: List[str]) -> Dict:
        """同步餐廳列表"""
        
        results = {
            'total': len(place_ids),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for place_id in place_ids:
            result = await self.sync_single_restaurant(place_id)
            
            if result['success']:
                results['success'] += 1
                print(f"✅ 同步成功：{place_id}")
            else:
                results['failed'] += 1
                results['errors'].append({
                    'place_id': place_id,
                    'error': result['error']
                })
                print(f"❌ 同步失敗：{place_id} - {result['error']}")
            
            # 避免超過 API 限制
            await asyncio.sleep(0.1)
        
        return results
    
    async def continuous_sync(self, place_ids: List[str]):
        """持續同步模式"""
        
        print(f"開始持續同步模式，間隔：{self.sync_interval} 秒")
        
        while True:
            try:
                print(f"\n開始同步 {len(place_ids)} 間餐廳...")
                start_time = time.time()
                
                results = await self.sync_restaurant_list(place_ids)
                
                elapsed_time = time.time() - start_time
                print(f"\n同步完成，耗時：{elapsed_time:.2f} 秒")
                print(f"成功：{results['success']} 筆")
                print(f"失敗：{results['failed']} 筆")
                
                # 等待下次同步
                print(f"等待 {self.sync_interval} 秒後開始下次同步...")
                await asyncio.sleep(self.sync_interval)
                
            except KeyboardInterrupt:
                print("\n同步已停止")
                break
            except Exception as e:
                print(f"同步過程發生錯誤：{e}")
                await asyncio.sleep(60)  # 錯誤發生時等待1分鐘

# 使用範例
async def main():
    api_base_url = os.getenv('FEEDNAV_API_URL')
    google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    api_key = os.getenv('FEEDNAV_API_KEY')
    
    # 要同步的餐廳 place_id 列表
    place_ids = [
        'ChIJN1t_tDeuEmsRUsoyG83frY4',  # 範例 place_id
        'ChIJrTLr-GyuEmsRBfy61i59si0',
        # 添加更多 place_id...
    ]
    
    sync = RealtimeSync(api_base_url, google_api_key, api_key)
    
    # 執行一次性同步
    # results = await sync.sync_restaurant_list(place_ids)
    
    # 或執行持續同步
    await sync.continuous_sync(place_ids)

if __name__ == "__main__":
    asyncio.run(main())
```

## Webhook 整合

### 3. Webhook 通知

創建 `webhook_notifier.py`：

```python
import json
import requests
from typing import Dict, List

class WebhookNotifier:
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send_sync_notification(self, results: Dict, webhook_type: str = 'discord'):
        """發送同步結果通知"""
        
        if webhook_type == 'discord':
            self.send_discord_notification(results)
        elif webhook_type == 'slack':
            self.send_slack_notification(results)
    
    def send_discord_notification(self, results: Dict):
        """發送 Discord 通知"""
        
        embed = {
            "title": "🍽️ FeedNav 資料同步完成",
            "color": 0x00ff00 if results['failed'] == 0 else 0xff9900,
            "fields": [
                {
                    "name": "📊 統計資訊",
                    "value": f"總計：{results['total']} 筆\n成功：{results['success']} 筆\n失敗：{results['failed']} 筆",
                    "inline": True
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        
        if results['errors']:
            error_text = "\n".join([
                f"• {error['restaurant']}: {error['error'][:50]}..."
                for error in results['errors'][:5]
            ])
            embed['fields'].append({
                "name": "❌ 錯誤訊息（前5筆）",
                "value": error_text,
                "inline": False
            })
        
        payload = {
            "embeds": [embed]
        }
        
        try:
            response = requests.post(self.webhook_url, json=payload)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Webhook 通知失敗：{e}")
    
    def send_slack_notification(self, results: Dict):
        """發送 Slack 通知"""
        
        color = "good" if results['failed'] == 0 else "warning"
        
        attachment = {
            "color": color,
            "title": "🍽️ FeedNav 資料同步完成",
            "fields": [
                {
                    "title": "總計",
                    "value": str(results['total']),
                    "short": True
                },
                {
                    "title": "成功",
                    "value": str(results['success']),
                    "short": True
                },
                {
                    "title": "失敗",
                    "value": str(results['failed']),
                    "short": True
                }
            ]
        }
        
        if results['errors']:
            error_text = "\n".join([
                f"• {error['restaurant']}: {error['error'][:50]}..."
                for error in results['errors'][:3]
            ])
            attachment['fields'].append({
                "title": "錯誤訊息",
                "value": error_text,
                "short": False
            })
        
        payload = {
            "attachments": [attachment]
        }
        
        try:
            response = requests.post(self.webhook_url, json=payload)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Webhook 通知失敗：{e}")
```

## 排程執行

### 4. Cron Job 設定

```bash
# 編輯 crontab
crontab -e

# 每日凌晨2點執行資料收集和同步
0 2 * * * cd /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher && /bin/bash batch_integration.sh

# 每4小時執行即時同步（針對熱門餐廳）
0 */4 * * * cd /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher && python realtime_sync.py

# 每週日執行完整重新同步
0 1 * * 0 cd /Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher && DEPLOY_TO_CLOUDFLARE=true /bin/bash batch_integration.sh
```

### 5. 系統監控腳本

創建 `monitor.py`：

```python
import os
import json
import sqlite3
import requests
from datetime import datetime, timedelta
from typing import Dict

class FeedNavMonitor:
    def __init__(self, db_path: str, api_base_url: str):
        self.db_path = db_path
        self.api_base_url = api_base_url
    
    def check_database_health(self) -> Dict:
        """檢查資料庫健康狀態"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 檢查表是否存在
            tables = cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
            
            # 檢查餐廳數量
            restaurant_count = cursor.execute(
                "SELECT COUNT(*) FROM restaurants"
            ).fetchone()[0]
            
            # 檢查最近更新時間
            last_update = cursor.execute(
                "SELECT MAX(updated_at) FROM restaurants"
            ).fetchone()[0]
            
            conn.close()
            
            return {
                'status': 'healthy',
                'tables': len(tables),
                'restaurant_count': restaurant_count,
                'last_update': last_update
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def check_api_health(self) -> Dict:
        """檢查 API 健康狀態"""
        
        try:
            response = requests.get(f"{self.api_base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                return {
                    'status': 'healthy',
                    'response_time': response.elapsed.total_seconds()
                }
            else:
                return {
                    'status': 'error',
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def generate_health_report(self) -> Dict:
        """生成健康檢查報告"""
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'database': self.check_database_health(),
            'api': self.check_api_health()
        }
        
        # 整體狀態
        if (report['database']['status'] == 'healthy' and 
            report['api']['status'] == 'healthy'):
            report['overall_status'] = 'healthy'
        else:
            report['overall_status'] = 'unhealthy'
        
        return report

# 使用範例
if __name__ == "__main__":
    monitor = FeedNavMonitor(
        db_path="../FeedNav-Serverless/database.db",
        api_base_url="https://your-worker.your-subdomain.workers.dev"
    )
    
    report = monitor.generate_health_report()
    
    print("=== FeedNav 健康檢查報告 ===")
    print(f"時間：{report['timestamp']}")
    print(f"整體狀態：{report['overall_status']}")
    print(f"資料庫狀態：{report['database']['status']}")
    print(f"API 狀態：{report['api']['status']}")
    
    if report['database']['status'] == 'healthy':
        print(f"餐廳數量：{report['database']['restaurant_count']}")
        print(f"最後更新：{report['database']['last_update']}")
```

## 環境變數設定

創建 `.env.production` 範例：

```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# FeedNav API
FEEDNAV_API_URL=https://your-worker.your-subdomain.workers.dev
FEEDNAV_API_KEY=your_api_key_if_needed

# Webhook 通知
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# 部署設定
DEPLOY_TO_CLOUDFLARE=true
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# 監控設定
HEALTH_CHECK_INTERVAL=300  # 5分鐘
ALERT_EMAIL=admin@yourdomain.com
```

這些範例展示了如何將 FeedNav-DataFetcher 與 FeedNav-Serverless 進行深度整合，包括直接 API 上傳、即時同步、監控和自動化部署等功能。