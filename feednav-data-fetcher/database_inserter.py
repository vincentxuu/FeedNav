"""
資料庫插入器

將轉換後的餐廳資料插入 SQLite 資料庫。
"""
from __future__ import annotations

import logging
import sqlite3
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# 標籤顏色對應表
TAG_COLOR_MAPPING: dict[str, str] = {
    'payment': '#FF9800',
    'environment': '#00BCD4',
    'hygiene': '#2196F3',
    'service': '#9C27B0',
    'pet_policy': '#4CAF50',
    'air_quality': '#607D8B',
    'price_perception': '#8BC34A',
    'waiting': '#FF5722',
    'parking': '#795548',
    'dining_rules': '#FFC107',
    'occasion': '#FF6B6B',
    'accessibility': '#2196F3',
    'ambiance': '#E91E63',
    'scenario': '#4ECDC4',
    'facility': '#FFD93D',
}

DEFAULT_TAG_COLOR = '#9E9E9E'


class DatabaseInserter:
    """資料庫插入器"""

    def __init__(self, db_path: str) -> None:
        """
        初始化資料庫插入器

        Args:
            db_path: 資料庫檔案路徑
        """
        self.db_path = db_path
        self.conn: sqlite3.Connection | None = None
        self.cursor: sqlite3.Cursor | None = None
        self._init_database()

    def _init_database(self) -> None:
        """初始化資料庫連接"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()

        # 確保外鍵約束啟用
        self.cursor.execute("PRAGMA foreign_keys = ON")
    
    def insert_restaurant(self, restaurant_data: dict[str, Any]) -> int:
        """
        插入餐廳資料

        Args:
            restaurant_data: 餐廳資料字典

        Returns:
            餐廳 ID
        """
        if self.cursor is None:
            raise RuntimeError("資料庫連接未初始化")

        # 檢查餐廳是否已存在（根據名稱和地址）
        existing = self.cursor.execute(
            "SELECT id FROM restaurants WHERE name = ? AND address = ?",
            (restaurant_data['name'], restaurant_data['address'])
        ).fetchone()

        if existing:
            logger.info(f"餐廳已存在，更新資料：{restaurant_data['name']}")
            return self.update_restaurant(existing['id'], restaurant_data)
        
        # 插入新餐廳
        query = """
        INSERT INTO restaurants (
            name, district, category, cuisine_type, rating, price_level,
            photos, address, phone, website, opening_hours,
            description, latitude, longitude, scenario_tags,
            has_wifi, has_power_outlet, seat_type,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        now = datetime.now().isoformat()
        scenario_tags = self._serialize_scenario_tags(restaurant_data.get('scenario_tags', []))
        seat_type = self._serialize_seat_type(restaurant_data.get('seat_type', []))

        self.cursor.execute(query, (
            restaurant_data['name'],
            restaurant_data['district'],
            restaurant_data.get('category', '餐廳'),
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
            restaurant_data['longitude'],
            scenario_tags,
            restaurant_data.get('has_wifi'),
            restaurant_data.get('has_power_outlet'),
            seat_type,
            now,
            now
        ))
        
        restaurant_id = self.cursor.lastrowid
        
        # 處理標籤
        if 'processed_tags' in restaurant_data:
            self.insert_restaurant_tags(restaurant_id, restaurant_data['processed_tags'])
        
        self.conn.commit()
        return restaurant_id
    
    def update_restaurant(
        self, restaurant_id: int, restaurant_data: dict[str, Any]
    ) -> int:
        """
        更新現有餐廳資料

        Args:
            restaurant_id: 餐廳 ID
            restaurant_data: 餐廳資料字典

        Returns:
            餐廳 ID
        """
        if self.cursor is None or self.conn is None:
            raise RuntimeError("資料庫連接未初始化")

        query = """
        UPDATE restaurants SET
            district = ?, category = ?, cuisine_type = ?, rating = ?, price_level = ?,
            photos = ?, phone = ?, website = ?, opening_hours = ?,
            description = ?, latitude = ?, longitude = ?, scenario_tags = ?,
            has_wifi = ?, has_power_outlet = ?, seat_type = ?,
            updated_at = ?
        WHERE id = ?
        """

        now = datetime.now().isoformat()
        scenario_tags = self._serialize_scenario_tags(restaurant_data.get('scenario_tags', []))
        seat_type = self._serialize_seat_type(restaurant_data.get('seat_type', []))

        self.cursor.execute(query, (
            restaurant_data['district'],
            restaurant_data.get('category', '餐廳'),
            restaurant_data['cuisine_type'],
            restaurant_data['rating'],
            restaurant_data['price_level'],
            restaurant_data['photos'],
            restaurant_data['phone'],
            restaurant_data['website'],
            restaurant_data['opening_hours'],
            restaurant_data['description'],
            restaurant_data['latitude'],
            restaurant_data['longitude'],
            scenario_tags,
            restaurant_data.get('has_wifi'),
            restaurant_data.get('has_power_outlet'),
            seat_type,
            now,
            restaurant_id
        ))
        
        # 清除現有標籤關聯
        self.cursor.execute("DELETE FROM restaurant_tags WHERE restaurant_id = ?", (restaurant_id,))
        
        # 重新插入標籤
        if 'processed_tags' in restaurant_data:
            self.insert_restaurant_tags(restaurant_id, restaurant_data['processed_tags'])
        
        self.conn.commit()
        return restaurant_id
    
    def insert_restaurant_tags(
        self, restaurant_id: int, tags: list[dict[str, Any]]
    ) -> None:
        """
        插入餐廳標籤

        Args:
            restaurant_id: 餐廳 ID
            tags: 標籤資料列表
        """
        if self.cursor is None:
            raise RuntimeError("資料庫連接未初始化")

        for tag_data in tags:
            try:
                tag_id = self._ensure_tag_exists(tag_data)

                self.cursor.execute(
                    "INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) VALUES (?, ?)",
                    (restaurant_id, tag_id)
                )
            except (KeyError, sqlite3.Error) as e:
                tag_name = tag_data.get('name', 'Unknown')
                logger.warning(f"插入標籤失敗 ({tag_name}): {type(e).__name__}")
                continue

    def _ensure_tag_exists(self, tag_data: dict[str, Any]) -> int:
        """
        確保標籤存在，不存在則創建

        Args:
            tag_data: 標籤資料

        Returns:
            標籤 ID
        """
        if self.cursor is None:
            raise RuntimeError("資料庫連接未初始化")

        existing = self.cursor.execute(
            "SELECT id FROM tags WHERE name = ?",
            (tag_data['name'],)
        ).fetchone()

        if existing:
            return existing['id']

        color = TAG_COLOR_MAPPING.get(tag_data['category'], DEFAULT_TAG_COLOR)
        is_positive = 1 if tag_data.get('is_positive', True) else 0

        self.cursor.execute(
            "INSERT INTO tags (name, category, color, is_positive) VALUES (?, ?, ?, ?)",
            (tag_data['name'], tag_data['category'], color, is_positive)
        )

        return self.cursor.lastrowid or 0

    def _serialize_scenario_tags(self, scenario_tags: list[dict[str, Any]]) -> str:
        """
        序列化情境標籤為 JSON 字串

        Args:
            scenario_tags: 情境標籤列表

        Returns:
            JSON 格式字串
        """
        import json

        if not scenario_tags:
            return '[]'

        # 只保留必要欄位
        simplified = [
            {'name': tag.get('name', ''), 'type': tag.get('type', '')}
            for tag in scenario_tags
            if tag.get('name')
        ]

        return json.dumps(simplified, ensure_ascii=False)

    def _serialize_seat_type(self, seat_type: list[str]) -> str:
        """
        序列化座位類型為 JSON 字串

        Args:
            seat_type: 座位類型列表

        Returns:
            JSON 格式字串
        """
        import json

        if not seat_type:
            return '[]'

        return json.dumps(seat_type, ensure_ascii=False)

    def get_statistics(self) -> dict[str, Any]:
        """
        獲取資料庫統計資訊

        Returns:
            統計資訊字典
        """
        if self.cursor is None:
            raise RuntimeError("資料庫連接未初始化")

        stats: dict[str, Any] = {}

        # 餐廳總數
        result = self.cursor.execute(
            "SELECT COUNT(*) as count FROM restaurants"
        ).fetchone()
        stats['total_restaurants'] = result['count']

        # 標籤總數
        result = self.cursor.execute(
            "SELECT COUNT(*) as count FROM tags"
        ).fetchone()
        stats['total_tags'] = result['count']

        # 標籤關聯總數
        result = self.cursor.execute(
            "SELECT COUNT(*) as count FROM restaurant_tags"
        ).fetchone()
        stats['total_tag_relations'] = result['count']

        # 各行政區餐廳數量
        district_counts = self.cursor.execute(
            """SELECT district, COUNT(*) as count FROM restaurants
               WHERE district IS NOT NULL
               GROUP BY district ORDER BY count DESC"""
        ).fetchall()
        stats['district_distribution'] = {
            row['district']: row['count'] for row in district_counts
        }

        # 各菜系餐廳數量
        cuisine_counts = self.cursor.execute(
            """SELECT cuisine_type, COUNT(*) as count FROM restaurants
               WHERE cuisine_type IS NOT NULL
               GROUP BY cuisine_type ORDER BY count DESC"""
        ).fetchall()
        stats['cuisine_distribution'] = {
            row['cuisine_type']: row['count'] for row in cuisine_counts
        }

        # 各主分類數量
        category_counts = self.cursor.execute(
            """SELECT category, COUNT(*) as count FROM restaurants
               WHERE category IS NOT NULL
               GROUP BY category ORDER BY count DESC"""
        ).fetchall()
        stats['category_distribution'] = {
            row['category']: row['count'] for row in category_counts
        }

        # 設施統計
        wifi_count = self.cursor.execute(
            "SELECT COUNT(*) as count FROM restaurants WHERE has_wifi = 1"
        ).fetchone()
        stats['has_wifi_count'] = wifi_count['count']

        outlet_count = self.cursor.execute(
            "SELECT COUNT(*) as count FROM restaurants WHERE has_power_outlet = 1"
        ).fetchone()
        stats['has_power_outlet_count'] = outlet_count['count']

        return stats

    def validate_data_integrity(self) -> dict[str, Any]:
        """
        驗證資料完整性

        Returns:
            包含問題列表的字典
        """
        if self.cursor is None:
            raise RuntimeError("資料庫連接未初始化")

        issues: list[str] = []

        # 檢查沒有座標的餐廳
        result = self.cursor.execute(
            """SELECT COUNT(*) as count FROM restaurants
               WHERE latitude IS NULL OR longitude IS NULL"""
        ).fetchone()
        if result['count'] > 0:
            issues.append(f"{result['count']} 間餐廳缺少座標資訊")

        # 檢查沒有地址的餐廳
        result = self.cursor.execute(
            """SELECT COUNT(*) as count FROM restaurants
               WHERE address IS NULL OR address = ''"""
        ).fetchone()
        if result['count'] > 0:
            issues.append(f"{result['count']} 間餐廳缺少地址資訊")

        # 檢查沒有標籤的餐廳
        result = self.cursor.execute(
            """SELECT COUNT(*) as count FROM restaurants r
               LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
               WHERE rt.restaurant_id IS NULL"""
        ).fetchone()
        if result['count'] > 0:
            issues.append(f"{result['count']} 間餐廳沒有任何標籤")

        # 檢查孤立的標籤
        result = self.cursor.execute(
            """SELECT COUNT(*) as count FROM tags t
               LEFT JOIN restaurant_tags rt ON t.id = rt.tag_id
               WHERE rt.tag_id IS NULL"""
        ).fetchone()
        if result['count'] > 0:
            issues.append(f"{result['count']} 個標籤沒有被任何餐廳使用")

        return {
            'has_issues': len(issues) > 0,
            'issues': issues
        }

    def close(self) -> None:
        """關閉資料庫連接"""
        if self.conn is not None:
            self.conn.close()
            self.conn = None
            self.cursor = None

    def __enter__(self) -> 'DatabaseInserter':
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: Any
    ) -> None:
        self.close()