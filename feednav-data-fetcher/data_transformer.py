"""
資料轉換器

將 DataFetcher 的輸出格式轉換為 Serverless 資料庫格式。
"""
from __future__ import annotations

import json
from typing import Any

from review_tag_extractor import VisitDurationExtractor

# 配置常數
TRANSFORMER_CONFIG = {
    'MAX_PHOTOS': 5,                         # 最多儲存的照片數量
    'TAG_CONFIDENCE_THRESHOLD': 0.5,         # 標籤信心度門檻
    'CUISINE_HIGH_CONFIDENCE_THRESHOLD': 0.8, # 高信心度菜系門檻
    'MAX_MRT_STATIONS': 2,                   # 描述中顯示的最大捷運站數
}


class DataTransformer:
    """資料轉換器"""

    def __init__(self) -> None:
        """初始化資料轉換器"""
        self.tag_mapping = self._load_tag_mapping()
        self.duration_extractor = VisitDurationExtractor()

    def _load_tag_mapping(self) -> dict[str, dict[str, str]]:
        """載入標籤對應表"""
        return {
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
            },
            'price_perception': {
                'cp_value_high': 'CP值高',
                'expensive': '價格偏貴',
                'large_portion': '份量大',
                'small_portion': '份量少'
            },
            'waiting': {
                'need_queue': '需要排隊',
                'no_wait': '免排隊',
                'reservation_recommended': '建議訂位'
            },
            'parking': {
                'parking_easy': '停車方便',
                'parking_difficult': '停車困難'
            },
            'dining_rules': {
                'time_limit': '用餐限時',
                'minimum_charge': '有低消',
                'no_time_limit': '不限時'
            },
            'occasion': {
                'solo_friendly': '適合獨食',
                'group_friendly': '適合聚餐',
                'business_friendly': '適合商務'
            },
            'accessibility': {
                'wheelchair_accessible': '無障礙設施',
                'baby_chair': '有兒童座椅'
            },
            'ambiance': {
                'good_view': '景觀優美',
                'instagrammable': '網美打卡',
                'vintage_style': '復古風格'
            },
            'scenario': {
                'diet_friendly': '飲控友善',
                'work_friendly': '適合工作',
                'date_friendly': '約會適合'
            },
            'facility': {
                'has_private_room': '有包廂',
                'has_counter': '有吧台',
                'has_power_outlet': '有插座',
                'has_wifi': '有Wi-Fi'
            }
        }
    
    def transform_restaurant_data(
        self, fetcher_data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        將 DataFetcher 資料轉換為 Serverless 格式

        Args:
            fetcher_data: DataFetcher 輸出的餐廳資料

        Returns:
            轉換後的餐廳資料
        """
        restaurant: dict[str, Any] = {
            'name': fetcher_data.get('name'),
            'district': fetcher_data.get('district'),
            'category': fetcher_data.get('category', '餐廳'),
            'cuisine_type': fetcher_data.get('cuisine_type'),
            'rating': fetcher_data.get('rating'),
            'price_level': fetcher_data.get('price_level'),
            'address': fetcher_data.get('formatted_address'),
            'phone': fetcher_data.get('formatted_phone_number'),
            'website': fetcher_data.get('website'),
            'latitude': self._extract_latitude(fetcher_data),
            'longitude': self._extract_longitude(fetcher_data),
            'photos': json.dumps(
                self._process_photos(fetcher_data.get('photos', []))
            ),
            'opening_hours': json.dumps(fetcher_data.get('opening_hours')),
            'description': self._generate_description(fetcher_data)
        }

        tags_data = fetcher_data.get('tags', {})
        restaurant['processed_tags'] = self._process_tags(tags_data)
        restaurant['scenario_tags'] = self._extract_scenario_tags(tags_data)
        restaurant['mrt_info'] = fetcher_data.get('nearby_mrt', [])

        # 提取設施資訊
        facility_info = self._extract_facility_info(tags_data)
        restaurant['has_wifi'] = facility_info['has_wifi']
        restaurant['has_power_outlet'] = facility_info['has_power_outlet']
        restaurant['seat_type'] = facility_info['seat_type']

        # 提取平均用餐時間
        reviews = fetcher_data.get('reviews', [])
        restaurant['avg_visit_duration'] = self.duration_extractor.extract_duration(reviews)

        return restaurant

    def _extract_latitude(self, fetcher_data: dict[str, Any]) -> float | None:
        """
        提取緯度

        Args:
            fetcher_data: 餐廳資料

        Returns:
            緯度值
        """
        geometry = fetcher_data.get('geometry', {})
        location = geometry.get('location', {})
        return location.get('lat')

    def _extract_longitude(self, fetcher_data: dict[str, Any]) -> float | None:
        """
        提取經度

        Args:
            fetcher_data: 餐廳資料

        Returns:
            經度值
        """
        geometry = fetcher_data.get('geometry', {})
        location = geometry.get('location', {})
        return location.get('lng')

    def _process_photos(
        self, photos: list[dict[str, Any] | str]
    ) -> list[dict[str, Any]]:
        """
        處理照片資料

        只儲存 photo_reference，避免暴露 API Key。

        Args:
            photos: 照片資料列表

        Returns:
            處理後的照片資料
        """
        photo_data: list[dict[str, Any]] = []
        max_photos = TRANSFORMER_CONFIG['MAX_PHOTOS']

        for photo in photos[:max_photos]:
            if isinstance(photo, dict) and 'photo_reference' in photo:
                photo_data.append({
                    'photo_reference': photo['photo_reference'],
                    'width': photo.get('width'),
                    'height': photo.get('height')
                })
            elif isinstance(photo, str):
                photo_data.append({'url': photo})

        return photo_data

    def _process_tags(
        self, tags_data: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        處理標籤資料

        Args:
            tags_data: 原始標籤資料

        Returns:
            處理後的標籤列表
        """
        processed_tags: list[dict[str, Any]] = []
        threshold = TRANSFORMER_CONFIG['TAG_CONFIDENCE_THRESHOLD']

        for category, tags in tags_data.items():
            if not isinstance(tags, dict):
                continue

            for tag_type, tag_info in tags.items():
                if not isinstance(tag_info, dict):
                    continue

                if tag_info.get('confidence', 0) >= threshold:
                    tag_name = self._get_tag_name(category, tag_type)
                    if tag_name:
                        processed_tags.append({
                            'name': tag_name,
                            'category': category,
                            'confidence': tag_info['confidence'],
                            'is_positive': self._is_positive_tag(tag_type)
                        })

        return processed_tags

    def _get_tag_name(self, category: str, tag_type: str) -> str:
        """
        將內部標籤類型轉換為顯示名稱

        Args:
            category: 標籤類別
            tag_type: 標籤類型

        Returns:
            顯示名稱
        """
        return self.tag_mapping.get(category, {}).get(tag_type, '')

    def _extract_scenario_tags(
        self, tags_data: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        提取情境標籤

        從標籤資料中提取情境相關標籤 (scenario, occasion 類別)。

        Args:
            tags_data: 原始標籤資料

        Returns:
            情境標籤列表
        """
        scenario_tags: list[dict[str, Any]] = []
        threshold = TRANSFORMER_CONFIG['TAG_CONFIDENCE_THRESHOLD']

        # 情境相關的類別
        scenario_categories = {'scenario', 'occasion'}

        for category, tags in tags_data.items():
            if category not in scenario_categories:
                continue

            if not isinstance(tags, dict):
                continue

            for tag_type, tag_info in tags.items():
                if not isinstance(tag_info, dict):
                    continue

                if tag_info.get('confidence', 0) >= threshold:
                    tag_name = self._get_tag_name(category, tag_type)
                    if tag_name:
                        scenario_tags.append({
                            'name': tag_name,
                            'type': tag_type,
                            'confidence': tag_info['confidence']
                        })

        return scenario_tags

    def _extract_facility_info(
        self, tags_data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        提取設施資訊

        從標籤資料中提取 Wi-Fi、插座、座位類型等設施資訊。

        Args:
            tags_data: 原始標籤資料

        Returns:
            設施資訊字典
        """
        threshold = TRANSFORMER_CONFIG['TAG_CONFIDENCE_THRESHOLD']
        facility_tags = tags_data.get('facility', {})

        # 提取 Wi-Fi 和插座資訊
        has_wifi = None
        has_power_outlet = None
        seat_types: list[str] = []

        if isinstance(facility_tags, dict):
            # Wi-Fi
            wifi_info = facility_tags.get('has_wifi', {})
            if isinstance(wifi_info, dict):
                if wifi_info.get('confidence', 0) >= threshold:
                    has_wifi = 1

            # 插座
            outlet_info = facility_tags.get('has_power_outlet', {})
            if isinstance(outlet_info, dict):
                if outlet_info.get('confidence', 0) >= threshold:
                    has_power_outlet = 1

            # 座位類型
            if facility_tags.get('has_counter', {}).get('confidence', 0) >= threshold:
                seat_types.append('吧台')
            if facility_tags.get('has_private_room', {}).get('confidence', 0) >= threshold:
                seat_types.append('包廂')

        return {
            'has_wifi': has_wifi,
            'has_power_outlet': has_power_outlet,
            'seat_type': seat_types
        }

    def _is_positive_tag(self, tag_type: str) -> bool:
        """
        判斷標籤是否為正面標籤

        Args:
            tag_type: 標籤類型

        Returns:
            是否為正面標籤
        """
        positive_tags = {
            'electronic_payment', 'multiple_payment', 'quiet', 'romantic',
            'family_friendly', 'clean', 'good_service', 'fast_service',
            'pet_friendly', 'non_smoking', 'good_ventilation',
            # 價格、等候、停車、用餐限制
            'cp_value_high', 'large_portion', 'no_wait', 'parking_easy',
            'no_time_limit', 'solo_friendly', 'group_friendly', 'business_friendly',
            'wheelchair_accessible', 'baby_chair', 'good_view', 'instagrammable',
            'vintage_style',
            # 情境與設施標籤
            'diet_friendly', 'work_friendly', 'date_friendly',
            'has_private_room', 'has_counter', 'has_power_outlet', 'has_wifi'
        }
        return tag_type in positive_tags

    def _generate_description(
        self, fetcher_data: dict[str, Any]
    ) -> str | None:
        """
        生成餐廳描述

        Args:
            fetcher_data: 餐廳資料

        Returns:
            描述文字
        """
        description_parts: list[str] = []
        max_mrt = TRANSFORMER_CONFIG['MAX_MRT_STATIONS']

        # 添加捷運站資訊
        nearby_mrt = fetcher_data.get('nearby_mrt', [])
        if nearby_mrt and isinstance(nearby_mrt, list):
            station_names: list[str] = []
            for station in nearby_mrt[:max_mrt]:
                if isinstance(station, dict) and 'name' in station:
                    distance = station.get('distance', 0)
                    station_names.append(f"{station['name']}({distance}m)")

            if station_names:
                description_parts.append(f"鄰近捷運站：{', '.join(station_names)}")

        # 添加菜系信心度資訊
        cuisine_confidence = fetcher_data.get('cuisine_confidence', 0)
        threshold = TRANSFORMER_CONFIG['CUISINE_HIGH_CONFIDENCE_THRESHOLD']
        if cuisine_confidence and cuisine_confidence > threshold:
            description_parts.append("菜系分類：高信心度")

        # 添加評論數量資訊
        reviews = fetcher_data.get('reviews', [])
        if reviews and isinstance(reviews, list):
            description_parts.append(f"Google評論：{len(reviews)}則")

        return ' | '.join(description_parts) if description_parts else None