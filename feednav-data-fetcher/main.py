"""
FeedNav 資料收集主程式

收集台北市餐廳資料並輸出為 JSON 檔案。
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from data_collector import DataCollectionPipeline, TAIPEI_DISTRICTS
from collection_tracker import CollectionTracker, ALL_DISTRICTS

load_dotenv()

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 輸出檔案名稱格式
OUTPUT_FILE_PATTERN = "taipei_restaurants_{timestamp}.json"


def parse_args() -> argparse.Namespace:
    """解析命令列參數"""
    parser = argparse.ArgumentParser(
        description='FeedNav 台北餐廳資料收集工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  python main.py --status                    # 查看收集進度
  python main.py --districts 大安區 信義區   # 收集指定區域
  python main.py --districts 大安區 --force  # 強制重新收集（忽略已收集記錄）
  python main.py --pending                   # 收集所有未完成的區域
  python main.py --pending --limit 2         # 收集前 2 個未完成的區域
  python main.py --reset 大安區              # 重設指定區域的進度
  python main.py --reset-all                 # 重設所有進度
  python main.py --reset-restaurants 大安區  # 重設指定區域的餐廳收集記錄
  python main.py --reset-restaurants-all     # 重設所有餐廳收集記錄

可用區域:
  中正區, 大同區, 中山區, 松山區, 大安區, 萬華區,
  信義區, 士林區, 北投區, 內湖區, 南港區, 文山區
        """
    )

    # 區域選擇
    parser.add_argument(
        '--districts', '-d',
        nargs='+',
        metavar='區域',
        help='指定要收集的行政區 (例如: --districts 大安區 信義區)'
    )
    parser.add_argument(
        '--pending', '-p',
        action='store_true',
        help='自動收集所有尚未完成的區域'
    )
    parser.add_argument(
        '--limit', '-l',
        type=int,
        metavar='N',
        help='限制本次收集的區域數量 (配合 --pending 使用)'
    )
    parser.add_argument(
        '--all', '-a',
        action='store_true',
        help='收集所有區域 (忽略已收集的進度)'
    )
    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='強制重新收集所有餐廳 (忽略已收集記錄，對新舊餐廳都呼叫 Place Details API)'
    )

    # 搜尋類型
    parser.add_argument(
        '--types', '-t',
        nargs='+',
        choices=['restaurant', 'dessert', 'cafe', 'healthy'],
        default=['restaurant'],
        help='搜尋類型 (預設: restaurant)'
    )

    # 進度管理
    parser.add_argument(
        '--status', '-s',
        action='store_true',
        help='顯示目前收集進度'
    )
    parser.add_argument(
        '--api-usage',
        action='store_true',
        help='顯示累計 API 使用量'
    )
    parser.add_argument(
        '--reset',
        nargs='+',
        metavar='區域',
        help='重設指定區域的收集進度'
    )
    parser.add_argument(
        '--reset-all',
        action='store_true',
        help='重設所有收集進度'
    )
    parser.add_argument(
        '--reset-api',
        action='store_true',
        help='重設 API 使用量統計'
    )
    parser.add_argument(
        '--reset-restaurants',
        nargs='?',
        const='__all__',
        metavar='區域',
        help='重設餐廳收集記錄 (不指定區域則重設全部)'
    )
    parser.add_argument(
        '--reset-restaurants-all',
        action='store_true',
        help='重設所有餐廳收集記錄'
    )

    # 輸出選項
    parser.add_argument(
        '--output', '-o',
        type=Path,
        metavar='目錄',
        help='指定輸出目錄'
    )

    return parser.parse_args()


def validate_districts(districts: list[str]) -> list[str]:
    """驗證區域名稱"""
    invalid = [d for d in districts if d not in ALL_DISTRICTS]
    if invalid:
        logger.error(f"無效的區域名稱: {', '.join(invalid)}")
        logger.info(f"可用區域: {', '.join(ALL_DISTRICTS)}")
        sys.exit(1)
    return districts


async def collect_data(
    districts: list[str],
    search_types: list[str],
    tracker: CollectionTracker,
    force: bool = False
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """
    執行資料收集

    Args:
        districts: 要收集的區域列表
        search_types: 搜尋類型列表
        tracker: 進度追蹤器
        force: 是否強制重新收集所有餐廳

    Returns:
        (收集結果字典, API 使用量摘要)
        收集結果字典包含: restaurants, is_update_mode, new_count, updated_count, collected_restaurants
    """
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        logger.error("環境變數 GOOGLE_MAPS_API_KEY 未設定")
        return {'restaurants': [], 'is_update_mode': False, 'new_count': 0, 'updated_count': 0, 'collected_restaurants': []}, None

    pipeline = DataCollectionPipeline(api_key)

    # 取得已收集的 place_id
    collected_place_ids = tracker.get_collected_place_ids()

    logger.info(f"開始收集區域: {', '.join(districts)}")
    logger.info(f"搜尋類型: {', '.join(search_types)}")
    if force:
        logger.info("強制模式：重新收集所有餐廳")
    else:
        logger.info(f"已追蹤餐廳: {len(collected_place_ids)} 家")

    result = await pipeline.batch_collect_taipei_restaurants(
        districts=districts,
        search_types=search_types,
        collected_place_ids=collected_place_ids,
        force=force
    )

    # 取得 API 使用量摘要
    api_usage = pipeline.quota_tracker.get_usage_summary()

    return result, api_usage


def save_results(
    results: list[dict[str, Any]],
    districts: list[str],
    output_dir: Path | None = None
) -> Path:
    """
    儲存結果到 JSON 檔案

    Args:
        results: 餐廳資料列表
        districts: 收集的區域列表
        output_dir: 輸出目錄

    Returns:
        輸出檔案路徑
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # 檔名包含區域資訊
    if len(districts) == 1:
        district_suffix = districts[0].replace('區', '')
    elif len(districts) <= 3:
        district_suffix = '_'.join(d.replace('區', '') for d in districts)
    else:
        district_suffix = f"{len(districts)}districts"

    filename = f"taipei_restaurants_{district_suffix}_{timestamp}.json"

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / filename
    else:
        output_path = Path(filename)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    return output_path


async def main() -> int:
    """
    主程式進入點

    Returns:
        結束代碼 (0: 成功, 1: 失敗)
    """
    args = parse_args()
    tracker = CollectionTracker()

    # 處理狀態查詢
    if args.status:
        tracker.print_status()
        tracker.print_api_usage()
        return 0

    # 處理 API 使用量查詢
    if args.api_usage:
        tracker.print_api_usage()
        return 0

    # 處理重設 API 使用量
    if args.reset_api:
        tracker.reset_api_usage()
        print("已重設 API 使用量統計")
        return 0

    # 處理重設餐廳收集記錄
    if args.reset_restaurants_all:
        count = tracker.reset_restaurants(None)
        print(f"已重設所有餐廳收集記錄 ({count} 家)")
        return 0

    if args.reset_restaurants:
        if args.reset_restaurants == '__all__':
            count = tracker.reset_restaurants(None)
            print(f"已重設所有餐廳收集記錄 ({count} 家)")
        else:
            validate_districts([args.reset_restaurants])
            count = tracker.reset_restaurants(args.reset_restaurants)
            print(f"已重設 {args.reset_restaurants} 的餐廳收集記錄 ({count} 家)")
        return 0

    # 處理重設
    if args.reset_all:
        tracker.reset()
        print("已重設所有收集進度")
        return 0

    if args.reset:
        validate_districts(args.reset)
        tracker.reset(args.reset)
        print(f"已重設區域: {', '.join(args.reset)}")
        return 0

    # 決定要收集的區域
    districts: list[str] = []

    if args.all:
        districts = ALL_DISTRICTS.copy()
    elif args.districts:
        districts = validate_districts(args.districts)
    elif args.pending:
        districts = tracker.get_pending_districts()
        if args.limit:
            districts = districts[:args.limit]
    else:
        # 沒有指定任何選項，顯示說明
        tracker.print_status()
        print("使用 --help 查看可用選項")
        print("範例: python main.py --districts 大安區 信義區")
        print("範例: python main.py --pending --limit 2")
        return 0

    if not districts:
        print("✅ 所有區域都已收集完成！")
        tracker.print_status()
        return 0

    print(f"\n準備收集 {len(districts)} 個區域: {', '.join(districts)}")
    if args.force:
        print("模式: 強制重新收集所有餐廳\n")
    else:
        print("模式: 智慧增量收集\n")

    try:
        collect_result, api_usage = await collect_data(
            districts, args.types, tracker, force=args.force
        )

        restaurants = collect_result['restaurants']
        is_update_mode = collect_result['is_update_mode']
        new_count = collect_result['new_count']
        updated_count = collect_result['updated_count']
        collected_restaurants = collect_result['collected_restaurants']

        if not restaurants:
            logger.warning("未收集到任何餐廳資料")
            return 1

        output_path = save_results(restaurants, districts, args.output)

        # 更新追蹤進度 - 按區域統計
        district_counts: dict[str, int] = {}
        for restaurant in restaurants:
            district = restaurant.get('district', '未知')
            district_counts[district] = district_counts.get(district, 0) + 1

        for district in districts:
            count = district_counts.get(district, 0)
            tracker.mark_collected(district, count, str(output_path))

        # 更新餐廳追蹤記錄
        restaurants_to_track = [
            {
                'place_id': r.get('place_id', ''),
                'name': r.get('name', ''),
                'district': r.get('district', '')
            }
            for r in restaurants
            if r.get('place_id')
        ]
        if restaurants_to_track:
            tracker.mark_restaurants_collected_batch(restaurants_to_track)

        # 更新累計 API 使用量
        if api_usage:
            tracker.update_api_usage(api_usage)

        # 輸出收集結果摘要
        if args.force:
            logger.info(f"強制收集完成。共 {len(restaurants)} 家餐廳，已儲存至 {output_path}")
        elif is_update_mode:
            logger.info(f"更新完成。更新 {updated_count} 家舊餐廳，已儲存至 {output_path}")
        else:
            logger.info(f"收集完成。新增 {new_count} 家新餐廳，已儲存至 {output_path}")

        tracker.print_status()
        tracker.print_api_usage()

        return 0

    except KeyboardInterrupt:
        logger.info("使用者中斷執行")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
