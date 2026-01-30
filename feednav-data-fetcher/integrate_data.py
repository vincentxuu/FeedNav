"""
資料整合腳本

將 DataFetcher 輸出的 JSON 檔案整合到 Serverless 資料庫。
"""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from data_transformer import DataTransformer
from database_inserter import DatabaseInserter

load_dotenv()

logger = logging.getLogger(__name__)

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def integrate_restaurant_data(
    json_file_path: str,
    db_path: str,
    verbose: bool = True,
    upload_photos: bool = True
) -> dict[str, int]:
    """
    整合餐廳資料到 Serverless 資料庫

    Args:
        json_file_path: JSON 資料檔案路徑
        db_path: 資料庫檔案路徑
        verbose: 是否顯示詳細輸出
        upload_photos: 是否上傳圖片到 R2 (需要設定 R2 和 Google API 環境變數)

    Returns:
        包含成功、跳過、錯誤數量的統計字典
    """
    if verbose:
        print(f"開始整合資料：{json_file_path}")
        print(f"目標資料庫：{db_path}")

    json_path = Path(json_file_path)
    if not json_path.exists():
        raise FileNotFoundError(f"找不到資料檔案：{json_file_path}")

    # 讀取 JSON 檔案
    with open(json_path, 'r', encoding='utf-8') as f:
        restaurants_data: list[dict[str, Any]] = json.load(f)

    if verbose:
        print(f"載入 {len(restaurants_data)} 筆餐廳資料")

    # 初始化 DataTransformer (傳入 Google API key 以啟用圖片上傳)
    google_api_key = None
    if upload_photos:
        google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        if google_api_key:
            print("圖片上傳功能已啟用 (將下載圖片並上傳到 R2)")
        else:
            print("警告：未設定 GOOGLE_MAPS_API_KEY，圖片上傳功能停用")

    transformer = DataTransformer(google_api_key=google_api_key)

    success_count = 0
    error_count = 0
    skipped_count = 0
    total = len(restaurants_data)

    with DatabaseInserter(db_path) as inserter:
        for i, restaurant_raw in enumerate(restaurants_data, start=1):
            name = restaurant_raw.get('name', 'Unknown')

            # 基本資料驗證
            if not restaurant_raw.get('name'):
                if verbose:
                    print(f"[{i}/{total}] 跳過：餐廳名稱為空")
                skipped_count += 1
                continue

            try:
                restaurant_data = transformer.transform_restaurant_data(restaurant_raw)

                if not restaurant_data.get('name') or not restaurant_data.get('address'):
                    if verbose:
                        print(f"[{i}/{total}] 跳過：缺少必要資訊 - {name}")
                    skipped_count += 1
                    continue

                restaurant_id = inserter.insert_restaurant(restaurant_data)

                success_count += 1
                if verbose:
                    print(f"[{i}/{total}] 成功：{restaurant_data['name']} (ID: {restaurant_id})")

            except (KeyError, ValueError) as e:
                error_count += 1
                if verbose:
                    print(f"[{i}/{total}] 錯誤：{name} - {type(e).__name__}")
                continue

        # 顯示統計資訊
        if verbose:
            _print_summary(inserter, success_count, skipped_count, error_count, total)

    return {
        'success': success_count,
        'skipped': skipped_count,
        'error': error_count,
        'total': total
    }


def _print_summary(
    inserter: DatabaseInserter,
    success: int,
    skipped: int,
    error: int,
    total: int
) -> None:
    """顯示整合結果摘要"""
    print(f"\n=== 整合完成 ===")
    print(f"成功：{success} 筆")
    print(f"跳過：{skipped} 筆")
    print(f"錯誤：{error} 筆")
    print(f"總計：{total} 筆")

    print(f"\n=== 資料庫統計 ===")
    stats = inserter.get_statistics()
    print(f"餐廳總數：{stats['total_restaurants']}")
    print(f"標籤總數：{stats['total_tags']}")
    print(f"標籤關聯總數：{stats['total_tag_relations']}")

    if stats['district_distribution']:
        print(f"\n行政區分佈（前5名）：")
        for district, count in list(stats['district_distribution'].items())[:5]:
            print(f"  {district}: {count} 間")

    if stats.get('category_distribution'):
        print(f"\n主分類分佈：")
        for category, count in stats['category_distribution'].items():
            print(f"  {category}: {count} 間")

    if stats['cuisine_distribution']:
        print(f"\n菜系分佈（前5名）：")
        for cuisine, count in list(stats['cuisine_distribution'].items())[:5]:
            print(f"  {cuisine}: {count} 間")

    # 設施統計
    print(f"\n=== 設施統計 ===")
    print(f"有 Wi-Fi：{stats.get('has_wifi_count', 0)} 間")
    print(f"有插座：{stats.get('has_power_outlet_count', 0)} 間")

    print(f"\n=== 資料完整性檢查 ===")
    integrity = inserter.validate_data_integrity()
    if integrity['has_issues']:
        for issue in integrity['issues']:
            print(f"⚠️  {issue}")
    else:
        print("✅ 資料完整性良好")

def main() -> int:
    """
    主程式進入點

    Returns:
        結束代碼 (0: 成功, 1: 失敗)
    """
    if len(sys.argv) < 3:
        print("使用方式: python integrate_data.py <json_file_path> <database_path> [選項]")
        print("範例: python integrate_data.py taipei_restaurants_20260128.json ./temp_import.db")
        print("參數:")
        print("  --quiet             安靜模式，減少輸出訊息")
        print("  --no-upload-photos  停用圖片上傳功能 (不下載圖片到 R2)")
        print("")
        print("圖片上傳環境變數:")
        print("  GOOGLE_MAPS_API_KEY  Google Maps API 金鑰")
        print("  R2_ACCOUNT_ID        Cloudflare 帳號 ID")
        print("  R2_ACCESS_KEY_ID     R2 API Token Access Key ID")
        print("  R2_SECRET_ACCESS_KEY R2 API Token Secret Access Key")
        print("  R2_BUCKET_NAME       R2 bucket 名稱 (預設: feednav-storage)")
        print("  R2_PUBLIC_URL        R2 公開存取 URL (預設: https://storage.feednav.cc)")
        print("")
        print("提示: 整合到遠端 D1 資料庫請參考 README.md")
        return 1

    json_file_path = sys.argv[1]
    db_path = sys.argv[2]
    verbose = '--quiet' not in sys.argv
    upload_photos = '--no-upload-photos' not in sys.argv

    try:
        result = integrate_restaurant_data(
            json_file_path, db_path, verbose, upload_photos
        )

        if result['error'] > 0:
            logger.warning(f"整合完成，但有 {result['error']} 筆錯誤")

        return 0

    except FileNotFoundError as e:
        print(f"錯誤：{e}")
        return 1
    except json.JSONDecodeError:
        print("錯誤：JSON 檔案格式不正確")
        return 1


if __name__ == "__main__":
    sys.exit(main())