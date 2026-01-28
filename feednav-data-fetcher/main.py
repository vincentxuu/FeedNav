"""
FeedNav 資料收集主程式

收集台北市餐廳資料並輸出為 JSON 檔案。
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from data_collector import DataCollectionPipeline

load_dotenv()

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 輸出檔案名稱格式
OUTPUT_FILE_PATTERN = "taipei_restaurants_{timestamp}.json"


async def collect_data() -> list[dict[str, Any]] | None:
    """
    執行資料收集

    Returns:
        餐廳資料列表，失敗時返回 None
    """
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        logger.error("環境變數 GOOGLE_MAPS_API_KEY 未設定")
        return None

    pipeline = DataCollectionPipeline(api_key)

    logger.info("開始收集台北市餐廳資料...")

    results = await pipeline.batch_collect_taipei_restaurants()
    return results


def save_results(results: list[dict[str, Any]], output_dir: Path | None = None) -> Path:
    """
    儲存結果到 JSON 檔案

    Args:
        results: 餐廳資料列表
        output_dir: 輸出目錄，預設為當前目錄

    Returns:
        輸出檔案路徑
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = OUTPUT_FILE_PATTERN.format(timestamp=timestamp)

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
    try:
        results = await collect_data()

        if results is None:
            return 1

        if not results:
            logger.warning("未收集到任何餐廳資料")
            return 1

        output_path = save_results(results)
        logger.info(f"收集完成。共 {len(results)} 家餐廳，已儲存至 {output_path}")

        return 0

    except KeyboardInterrupt:
        logger.info("使用者中斷執行")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)