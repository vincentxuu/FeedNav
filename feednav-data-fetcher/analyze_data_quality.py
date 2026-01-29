"""
資料品質分析腳本

分析資料庫中的標籤分布、情境標籤覆蓋率、設施資訊完整度等。
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path
from typing import Any


class DataQualityAnalyzer:
    """資料品質分析器"""

    def __init__(self, db_path: str) -> None:
        """
        初始化分析器

        Args:
            db_path: 資料庫檔案路徑
        """
        self.db_path = db_path
        self.conn: sqlite3.Connection | None = None
        self._connect()

    def _connect(self) -> None:
        """建立資料庫連接"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row

    def analyze_all(self) -> dict[str, Any]:
        """
        執行完整的資料品質分析

        Returns:
            分析結果字典
        """
        return {
            'overview': self._analyze_overview(),
            'category_distribution': self._analyze_category_distribution(),
            'scenario_tags': self._analyze_scenario_tags(),
            'facility_coverage': self._analyze_facility_coverage(),
            'tag_distribution': self._analyze_tag_distribution(),
            'quality_metrics': self._calculate_quality_metrics(),
            'issues': self._identify_issues(),
        }

    def _analyze_overview(self) -> dict[str, int]:
        """分析概覽統計"""
        cursor = self.conn.cursor()

        total = cursor.execute(
            "SELECT COUNT(*) FROM restaurants"
        ).fetchone()[0]

        with_tags = cursor.execute(
            """SELECT COUNT(DISTINCT restaurant_id)
               FROM restaurant_tags"""
        ).fetchone()[0]

        with_scenario = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE scenario_tags IS NOT NULL
               AND scenario_tags != '[]'"""
        ).fetchone()[0]

        with_wifi = cursor.execute(
            "SELECT COUNT(*) FROM restaurants WHERE has_wifi = 1"
        ).fetchone()[0]

        with_outlet = cursor.execute(
            "SELECT COUNT(*) FROM restaurants WHERE has_power_outlet = 1"
        ).fetchone()[0]

        with_duration = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE avg_visit_duration IS NOT NULL"""
        ).fetchone()[0]

        return {
            'total_restaurants': total,
            'with_tags': with_tags,
            'with_scenario_tags': with_scenario,
            'with_wifi': with_wifi,
            'with_power_outlet': with_outlet,
            'with_visit_duration': with_duration,
        }

    def _analyze_category_distribution(self) -> dict[str, int]:
        """分析主分類分布"""
        cursor = self.conn.cursor()

        rows = cursor.execute(
            """SELECT category, COUNT(*) as count
               FROM restaurants
               GROUP BY category
               ORDER BY count DESC"""
        ).fetchall()

        return {row['category'] or '未分類': row['count'] for row in rows}

    def _analyze_scenario_tags(self) -> dict[str, Any]:
        """分析情境標籤分布"""
        cursor = self.conn.cursor()

        # 解析 scenario_tags JSON
        rows = cursor.execute(
            """SELECT scenario_tags FROM restaurants
               WHERE scenario_tags IS NOT NULL
               AND scenario_tags != '[]'"""
        ).fetchall()

        tag_counts: dict[str, int] = {}
        for row in rows:
            try:
                tags = json.loads(row['scenario_tags'])
                for tag in tags:
                    name = tag.get('name', '')
                    if name:
                        tag_counts[name] = tag_counts.get(name, 0) + 1
            except json.JSONDecodeError:
                continue

        # 計算預期的情境標籤
        expected_tags = ['聚餐適合', '一個人也適合', '飲控友善', '適合工作', '約會適合']
        coverage = {tag: tag_counts.get(tag, 0) for tag in expected_tags}

        return {
            'tag_counts': tag_counts,
            'expected_coverage': coverage,
        }

    def _analyze_facility_coverage(self) -> dict[str, Any]:
        """分析設施資訊覆蓋率"""
        cursor = self.conn.cursor()

        total = cursor.execute(
            "SELECT COUNT(*) FROM restaurants"
        ).fetchone()[0]

        # 座位類型分析
        seat_types: dict[str, int] = {}
        rows = cursor.execute(
            """SELECT seat_type FROM restaurants
               WHERE seat_type IS NOT NULL
               AND seat_type != '[]'"""
        ).fetchall()

        for row in rows:
            try:
                types = json.loads(row['seat_type'])
                for seat in types:
                    seat_types[seat] = seat_types.get(seat, 0) + 1
            except json.JSONDecodeError:
                continue

        # 設施標籤統計
        facility_tags = cursor.execute(
            """SELECT t.name, COUNT(*) as count
               FROM tags t
               JOIN restaurant_tags rt ON t.id = rt.tag_id
               WHERE t.category = 'facility'
               GROUP BY t.name
               ORDER BY count DESC"""
        ).fetchall()

        return {
            'seat_type_distribution': seat_types,
            'facility_tags': {row['name']: row['count'] for row in facility_tags},
            'total_restaurants': total,
        }

    def _analyze_tag_distribution(self) -> dict[str, Any]:
        """分析標籤分布"""
        cursor = self.conn.cursor()

        # 按類別統計標籤
        category_stats = cursor.execute(
            """SELECT t.category, COUNT(*) as count
               FROM tags t
               JOIN restaurant_tags rt ON t.id = rt.tag_id
               GROUP BY t.category
               ORDER BY count DESC"""
        ).fetchall()

        # 前 20 名標籤
        top_tags = cursor.execute(
            """SELECT t.name, t.category, COUNT(*) as count
               FROM tags t
               JOIN restaurant_tags rt ON t.id = rt.tag_id
               GROUP BY t.id
               ORDER BY count DESC
               LIMIT 20"""
        ).fetchall()

        # 未使用的標籤
        unused_tags = cursor.execute(
            """SELECT t.name, t.category
               FROM tags t
               LEFT JOIN restaurant_tags rt ON t.id = rt.tag_id
               WHERE rt.tag_id IS NULL"""
        ).fetchall()

        return {
            'by_category': {row['category']: row['count'] for row in category_stats},
            'top_tags': [
                {'name': row['name'], 'category': row['category'], 'count': row['count']}
                for row in top_tags
            ],
            'unused_tags': [
                {'name': row['name'], 'category': row['category']}
                for row in unused_tags
            ],
        }

    def _calculate_quality_metrics(self) -> dict[str, float]:
        """計算資料品質指標"""
        cursor = self.conn.cursor()

        total = cursor.execute(
            "SELECT COUNT(*) FROM restaurants"
        ).fetchone()[0]

        if total == 0:
            return {
                'tag_coverage': 0.0,
                'scenario_coverage': 0.0,
                'category_accuracy': 0.0,
                'facility_coverage': 0.0,
            }

        # 標籤覆蓋率
        with_tags = cursor.execute(
            "SELECT COUNT(DISTINCT restaurant_id) FROM restaurant_tags"
        ).fetchone()[0]

        # 情境標籤覆蓋率
        with_scenario = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE scenario_tags IS NOT NULL
               AND scenario_tags != '[]'"""
        ).fetchone()[0]

        # 主分類覆蓋率（非預設值的比例）
        with_category = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE category IS NOT NULL
               AND category != ''"""
        ).fetchone()[0]

        # 設施資訊覆蓋率
        with_facility = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE has_wifi IS NOT NULL
               OR has_power_outlet IS NOT NULL
               OR (seat_type IS NOT NULL AND seat_type != '[]')"""
        ).fetchone()[0]

        return {
            'tag_coverage': round(with_tags / total * 100, 1),
            'scenario_coverage': round(with_scenario / total * 100, 1),
            'category_accuracy': round(with_category / total * 100, 1),
            'facility_coverage': round(with_facility / total * 100, 1),
        }

    def _identify_issues(self) -> list[str]:
        """識別資料問題"""
        cursor = self.conn.cursor()
        issues: list[str] = []

        # 缺少座標的餐廳
        missing_coords = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE latitude IS NULL OR longitude IS NULL"""
        ).fetchone()[0]
        if missing_coords > 0:
            issues.append(f"{missing_coords} 間餐廳缺少座標資訊")

        # 缺少地址的餐廳
        missing_address = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE address IS NULL OR address = ''"""
        ).fetchone()[0]
        if missing_address > 0:
            issues.append(f"{missing_address} 間餐廳缺少地址資訊")

        # 沒有任何標籤的餐廳
        no_tags = cursor.execute(
            """SELECT COUNT(*) FROM restaurants r
               LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
               WHERE rt.restaurant_id IS NULL"""
        ).fetchone()[0]
        if no_tags > 0:
            issues.append(f"{no_tags} 間餐廳沒有任何標籤")

        # 檢查情境標籤覆蓋率是否達標
        total = cursor.execute("SELECT COUNT(*) FROM restaurants").fetchone()[0]
        with_scenario = cursor.execute(
            """SELECT COUNT(*) FROM restaurants
               WHERE scenario_tags IS NOT NULL
               AND scenario_tags != '[]'"""
        ).fetchone()[0]

        if total > 0 and (with_scenario / total) < 0.5:
            coverage = round(with_scenario / total * 100, 1)
            issues.append(f"情境標籤覆蓋率僅 {coverage}%，未達 50% 目標")

        return issues

    def print_report(self) -> None:
        """列印分析報告"""
        results = self.analyze_all()

        print("=" * 60)
        print("FeedNav 資料品質分析報告")
        print("=" * 60)

        # 概覽
        print("\n📊 概覽統計")
        print("-" * 40)
        overview = results['overview']
        print(f"  餐廳總數：{overview['total_restaurants']}")
        print(f"  有標籤的餐廳：{overview['with_tags']}")
        print(f"  有情境標籤：{overview['with_scenario_tags']}")
        print(f"  有 Wi-Fi 資訊：{overview['with_wifi']}")
        print(f"  有插座資訊：{overview['with_power_outlet']}")
        print(f"  有用餐時間：{overview['with_visit_duration']}")

        # 主分類分布
        print("\n🏪 主分類分布")
        print("-" * 40)
        for category, count in results['category_distribution'].items():
            print(f"  {category}：{count} 間")

        # 情境標籤
        print("\n🎯 情境標籤覆蓋")
        print("-" * 40)
        expected = results['scenario_tags']['expected_coverage']
        for tag, count in expected.items():
            status = "✅" if count >= 500 else "⚠️" if count >= 200 else "❌"
            print(f"  {status} {tag}：{count} 間")

        # 設施標籤
        print("\n🔌 設施標籤分布")
        print("-" * 40)
        for tag, count in results['facility_coverage']['facility_tags'].items():
            print(f"  {tag}：{count} 間")

        # 座位類型
        if results['facility_coverage']['seat_type_distribution']:
            print("\n🪑 座位類型分布")
            print("-" * 40)
            for seat, count in results['facility_coverage']['seat_type_distribution'].items():
                print(f"  {seat}：{count} 間")

        # 品質指標
        print("\n📈 品質指標")
        print("-" * 40)
        metrics = results['quality_metrics']
        print(f"  標籤覆蓋率：{metrics['tag_coverage']}%")
        print(f"  情境標籤覆蓋率：{metrics['scenario_coverage']}%")
        print(f"  主分類覆蓋率：{metrics['category_accuracy']}%")
        print(f"  設施資訊覆蓋率：{metrics['facility_coverage']}%")

        # 前 10 名標籤
        print("\n🏷️ 最常見標籤（前 10 名）")
        print("-" * 40)
        for tag in results['tag_distribution']['top_tags'][:10]:
            print(f"  {tag['name']} ({tag['category']})：{tag['count']} 次")

        # 問題列表
        if results['issues']:
            print("\n⚠️ 資料問題")
            print("-" * 40)
            for issue in results['issues']:
                print(f"  • {issue}")
        else:
            print("\n✅ 未發現資料問題")

        print("\n" + "=" * 60)

    def close(self) -> None:
        """關閉資料庫連接"""
        if self.conn:
            self.conn.close()
            self.conn = None


def main() -> int:
    """
    主程式進入點

    Returns:
        結束代碼 (0: 成功, 1: 失敗)
    """
    if len(sys.argv) < 2:
        print("使用方式: python analyze_data_quality.py <database_path>")
        print("範例: python analyze_data_quality.py ./feednav.db")
        return 1

    db_path = sys.argv[1]

    if not Path(db_path).exists():
        print(f"錯誤：找不到資料庫檔案 {db_path}")
        return 1

    try:
        analyzer = DataQualityAnalyzer(db_path)
        analyzer.print_report()
        analyzer.close()
        return 0
    except sqlite3.Error as e:
        print(f"資料庫錯誤：{e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
