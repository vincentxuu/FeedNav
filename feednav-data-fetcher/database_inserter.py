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
    'payment': 'orange',
    'environment': 'teal',
    'hygiene': 'blue',
    'service': 'purple',
    'pet_policy': 'green',
    'air_quality': 'gray'
}

DEFAULT_TAG_COLOR = 'gray'


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
            name, district, cuisine_type, rating, price_level,
            photos, address, phone, website, opening_hours,
            description, latitude, longitude, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        now = datetime.now().isoformat()
        
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
            restaurant_data['longitude'],
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
            district = ?, cuisine_type = ?, rating = ?, price_level = ?,
            photos = ?, phone = ?, website = ?, opening_hours = ?,
            description = ?, latitude = ?, longitude = ?, updated_at = ?
        WHERE id = ?
        """
        
        now = datetime.now().isoformat()
        
        self.cursor.execute(query, (
            restaurant_data['district'],
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