"""
資料收集進度追蹤器

追蹤已收集的區域和收集狀態。
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# 預設追蹤檔案路徑
DEFAULT_TRACKER_FILE = Path(__file__).parent / "collection_progress.json"

# 台北市所有行政區
ALL_DISTRICTS: list[str] = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
]


class CollectionTracker:
    """資料收集進度追蹤器"""

    def __init__(self, tracker_file: Path | None = None) -> None:
        """
        初始化追蹤器

        Args:
            tracker_file: 追蹤檔案路徑，預設為 collection_progress.json
        """
        self.tracker_file = tracker_file or DEFAULT_TRACKER_FILE
        self.progress = self._load_progress()

    def _load_progress(self) -> dict[str, Any]:
        """載入進度檔案"""
        if self.tracker_file.exists():
            try:
                with open(self.tracker_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"無法載入進度檔案: {e}")

        return {
            "collected_districts": {},
            "api_usage": {
                "nearby_search": 0,
                "text_search": 0,
                "place_details": 0,
                "total_cost_usd": 0.0
            },
            "last_updated": None
        }

    def _save_progress(self) -> None:
        """儲存進度檔案"""
        self.progress["last_updated"] = datetime.now().isoformat()
        with open(self.tracker_file, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, ensure_ascii=False, indent=2)

    def mark_collected(
        self,
        district: str,
        restaurant_count: int,
        output_file: str | None = None
    ) -> None:
        """
        標記區域已收集

        Args:
            district: 行政區名稱
            restaurant_count: 收集到的餐廳數量
            output_file: 輸出檔案名稱
        """
        self.progress["collected_districts"][district] = {
            "collected_at": datetime.now().isoformat(),
            "restaurant_count": restaurant_count,
            "output_file": output_file
        }
        self._save_progress()
        logger.info(f"已標記 {district} 為已收集 ({restaurant_count} 家餐廳)")

    def is_collected(self, district: str) -> bool:
        """檢查區域是否已收集"""
        return district in self.progress["collected_districts"]

    def get_collected_districts(self) -> list[str]:
        """取得已收集的區域列表"""
        return list(self.progress["collected_districts"].keys())

    def get_pending_districts(self) -> list[str]:
        """取得尚未收集的區域列表"""
        collected = set(self.get_collected_districts())
        return [d for d in ALL_DISTRICTS if d not in collected]

    def get_status_summary(self) -> dict[str, Any]:
        """取得收集狀態摘要"""
        collected = self.get_collected_districts()
        pending = self.get_pending_districts()
        total_restaurants = sum(
            info["restaurant_count"]
            for info in self.progress["collected_districts"].values()
        )

        return {
            "total_districts": len(ALL_DISTRICTS),
            "collected_count": len(collected),
            "pending_count": len(pending),
            "collected_districts": collected,
            "pending_districts": pending,
            "total_restaurants": total_restaurants,
            "last_updated": self.progress.get("last_updated")
        }

    def print_status(self) -> None:
        """印出收集狀態"""
        status = self.get_status_summary()

        print("\n" + "=" * 50)
        print("📊 資料收集進度")
        print("=" * 50)
        print(f"進度: {status['collected_count']}/{status['total_districts']} 區域")
        print(f"已收集餐廳總數: {status['total_restaurants']}")

        if status['collected_districts']:
            print(f"\n✅ 已收集 ({status['collected_count']}):")
            for district in status['collected_districts']:
                info = self.progress["collected_districts"][district]
                print(f"   - {district}: {info['restaurant_count']} 家")

        if status['pending_districts']:
            print(f"\n⏳ 待收集 ({status['pending_count']}):")
            for district in status['pending_districts']:
                print(f"   - {district}")

        if status['last_updated']:
            print(f"\n最後更新: {status['last_updated']}")
        print("=" * 50 + "\n")

    def reset(self, districts: list[str] | None = None) -> None:
        """
        重設收集進度

        Args:
            districts: 要重設的區域列表，None 表示全部重設
        """
        if districts is None:
            self.progress["collected_districts"] = {}
            logger.info("已重設所有區域的收集進度")
        else:
            for district in districts:
                if district in self.progress["collected_districts"]:
                    del self.progress["collected_districts"][district]
                    logger.info(f"已重設 {district} 的收集進度")

        self._save_progress()

    def _get_current_month(self) -> str:
        """取得當前月份 (YYYY-MM)"""
        return datetime.now().strftime('%Y-%m')

    def _ensure_current_month(self) -> None:
        """確保 API 使用量是當月的，若跨月則自動重設"""
        current_month = self._get_current_month()
        api_usage = self.progress.get("api_usage", {})

        if api_usage.get("month") != current_month:
            self.progress["api_usage"] = {
                "month": current_month,
                "nearby_search": 0,
                "text_search": 0,
                "place_details": 0,
                "total_cost_usd": 0.0
            }
            self._save_progress()

    def update_api_usage(self, usage_summary: dict[str, Any]) -> None:
        """
        更新當月累計 API 使用量

        Args:
            usage_summary: 本次執行的 API 使用量摘要
        """
        self._ensure_current_month()

        api_usage = self.progress["api_usage"]
        api_usage["nearby_search"] += usage_summary.get("nearby_search", {}).get("count", 0)
        api_usage["text_search"] += usage_summary.get("text_search", {}).get("count", 0)
        api_usage["place_details"] += usage_summary.get("place_details", {}).get("count", 0)
        api_usage["total_cost_usd"] = round(
            api_usage["total_cost_usd"] + usage_summary.get("total_cost_usd", 0),
            2
        )

        self._save_progress()

    def get_api_usage(self) -> dict[str, Any]:
        """取得當月 API 使用量"""
        self._ensure_current_month()
        return self.progress.get("api_usage", {
            "month": self._get_current_month(),
            "nearby_search": 0,
            "text_search": 0,
            "place_details": 0,
            "total_cost_usd": 0.0
        })

    def print_api_usage(self) -> None:
        """印出 API 使用量"""
        usage = self.get_api_usage()
        monthly_budget = 200.0
        used = usage.get('total_cost_usd', 0)
        remaining = monthly_budget - used
        percentage = (used / monthly_budget) * 100

        # 進度條
        bar_width = 30
        filled = int(bar_width * used / monthly_budget)
        bar = '█' * filled + '░' * (bar_width - filled)

        print("\n" + "=" * 50)
        print(f"💰 API 使用量 ({usage.get('month', 'N/A')})")
        print("=" * 50)
        print(f"Nearby Search:  {usage.get('nearby_search', 0):>6} 次")
        print(f"Text Search:    {usage.get('text_search', 0):>6} 次")
        print(f"Place Details:  {usage.get('place_details', 0):>6} 次")
        print("-" * 50)
        print(f"本月額度:       ${used:.2f} / ${monthly_budget:.2f} USD")
        print(f"剩餘額度:       ${remaining:.2f} USD")
        print(f"使用比例:       [{bar}] {percentage:.1f}%")
        print("=" * 50 + "\n")

    def reset_api_usage(self) -> None:
        """重設 API 使用量"""
        self.progress["api_usage"] = {
            "nearby_search": 0,
            "text_search": 0,
            "place_details": 0,
            "total_cost_usd": 0.0
        }
        self._save_progress()
        logger.info("已重設 API 使用量統計")
