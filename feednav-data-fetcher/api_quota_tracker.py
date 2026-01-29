"""
API 配額追蹤器

追蹤並限制 Google Places API 的使用量，避免超出預算。
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import ClassVar

logger = logging.getLogger(__name__)


class QuotaExceededError(Exception):
    """API 配額超出限制"""
    pass


@dataclass
class APIQuotaTracker:
    """API 配額追蹤器"""

    # API 類型常數
    NEARBY_SEARCH: ClassVar[str] = 'nearby_search'
    TEXT_SEARCH: ClassVar[str] = 'text_search'
    PLACE_DETAILS: ClassVar[str] = 'place_details'

    # 每種 API 的單價 (USD per 1000 calls)
    PRICING: ClassVar[dict[str, float]] = {
        'nearby_search': 32.0,
        'text_search': 32.0,
        'place_details': 17.0,
    }

    # 配額限制 (從環境變數讀取)
    max_nearby_search: int = field(default_factory=lambda: int(os.getenv('MAX_NEARBY_SEARCH_CALLS', '0')))
    max_text_search: int = field(default_factory=lambda: int(os.getenv('MAX_TEXT_SEARCH_CALLS', '0')))
    max_place_details: int = field(default_factory=lambda: int(os.getenv('MAX_PLACE_DETAILS_CALLS', '0')))

    # 使用量計數器
    nearby_search_count: int = 0
    text_search_count: int = 0
    place_details_count: int = 0

    def check_and_increment(self, api_type: str) -> None:
        """
        檢查配額並增加計數

        Args:
            api_type: API 類型 (nearby_search, text_search, place_details)

        Raises:
            QuotaExceededError: 超出配額限制
        """
        if api_type == self.NEARBY_SEARCH:
            if self.max_nearby_search > 0 and self.nearby_search_count >= self.max_nearby_search:
                raise QuotaExceededError(
                    f"Nearby Search API 已達配額限制 ({self.max_nearby_search} 次)"
                )
            self.nearby_search_count += 1

        elif api_type == self.TEXT_SEARCH:
            if self.max_text_search > 0 and self.text_search_count >= self.max_text_search:
                raise QuotaExceededError(
                    f"Text Search API 已達配額限制 ({self.max_text_search} 次)"
                )
            self.text_search_count += 1

        elif api_type == self.PLACE_DETAILS:
            if self.max_place_details > 0 and self.place_details_count >= self.max_place_details:
                raise QuotaExceededError(
                    f"Place Details API 已達配額限制 ({self.max_place_details} 次)"
                )
            self.place_details_count += 1

    def get_usage_summary(self) -> dict[str, any]:
        """
        取得使用量摘要

        Returns:
            包含使用量和預估費用的字典
        """
        return {
            'nearby_search': {
                'count': self.nearby_search_count,
                'limit': self.max_nearby_search if self.max_nearby_search > 0 else '無限制',
                'cost_usd': round(self.nearby_search_count * self.PRICING['nearby_search'] / 1000, 2),
            },
            'text_search': {
                'count': self.text_search_count,
                'limit': self.max_text_search if self.max_text_search > 0 else '無限制',
                'cost_usd': round(self.text_search_count * self.PRICING['text_search'] / 1000, 2),
            },
            'place_details': {
                'count': self.place_details_count,
                'limit': self.max_place_details if self.max_place_details > 0 else '無限制',
                'cost_usd': round(self.place_details_count * self.PRICING['place_details'] / 1000, 2),
            },
            'total_cost_usd': round(
                self.nearby_search_count * self.PRICING['nearby_search'] / 1000 +
                self.text_search_count * self.PRICING['text_search'] / 1000 +
                self.place_details_count * self.PRICING['place_details'] / 1000,
                2
            ),
        }

    def log_usage(self) -> None:
        """記錄當前使用量"""
        summary = self.get_usage_summary()
        logger.info("=== API 使用量統計 ===")
        logger.info(f"Nearby Search: {summary['nearby_search']['count']} 次 (限制: {summary['nearby_search']['limit']}) - ${summary['nearby_search']['cost_usd']}")
        logger.info(f"Text Search: {summary['text_search']['count']} 次 (限制: {summary['text_search']['limit']}) - ${summary['text_search']['cost_usd']}")
        logger.info(f"Place Details: {summary['place_details']['count']} 次 (限制: {summary['place_details']['limit']}) - ${summary['place_details']['cost_usd']}")
        logger.info(f"預估總費用: ${summary['total_cost_usd']} USD")
