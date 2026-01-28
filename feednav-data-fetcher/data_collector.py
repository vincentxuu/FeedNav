"""
FeedNav 資料收集管道

收集台北市餐廳資料，包含地點處理、菜系分類和評論標籤提取。
"""
import asyncio
import time
import logging
from typing import Any

import googlemaps
from googlemaps.exceptions import ApiError, TransportError

from location_processor import LocationProcessor
from cuisine_classifier import CuisineClassifier
from review_tag_extractor import ReviewTagExtractor

logger = logging.getLogger(__name__)

# 台北市行政區列表
TAIPEI_DISTRICTS: list[str] = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
]

# API 配置常數
API_CONFIG = {
    'SEARCH_RADIUS_METERS': 2000,           # 搜尋半徑 (公尺)
    'NEXT_PAGE_DELAY_SECONDS': 2,           # 翻頁延遲 (秒) - Google API 要求
    'REQUEST_DELAY_SECONDS': 0.1,           # 請求間隔 (秒) - 速率限制
    'LANGUAGE': 'zh-TW',                    # API 語言設定
}

# Place Details 請求欄位
PLACE_DETAIL_FIELDS: list[str] = [
    'name', 'rating', 'price_level', 'formatted_address',
    'geometry', 'reviews', 'types', 'opening_hours', 'photos'
]

class DataCollectionPipeline:
    """餐廳資料收集管道"""

    def __init__(self, api_key: str) -> None:
        """
        初始化資料收集管道

        Args:
            api_key: Google Maps API 金鑰
        """
        self.gmaps = googlemaps.Client(key=api_key)
        self.location_processor = LocationProcessor(api_key)
        self.cuisine_classifier = CuisineClassifier()
        self.tag_extractor = ReviewTagExtractor()

    async def collect_restaurant_data(self, place_id: str) -> dict[str, Any] | None:
        """
        收集單一餐廳的詳細資料

        Args:
            place_id: Google Places API 的 place_id

        Returns:
            包含餐廳完整資訊的字典，失敗時返回 None
        """
        try:
            place_details = self.gmaps.place(
                place_id=place_id,
                fields=PLACE_DETAIL_FIELDS,
                language=API_CONFIG['LANGUAGE']
            )['result']

            location_data = self.location_processor.process_location(place_details)
            cuisine_data = self.cuisine_classifier.classify_cuisine(place_details)
            tag_data = self.tag_extractor.extract_all_tags(
                place_details.get('reviews', [])
            )

            complete_data = {
                **place_details,
                'district': location_data['district'],
                'nearby_mrt': location_data['nearby_mrt'],
                'cuisine_type': cuisine_data['primary_cuisine'],
                'cuisine_confidence': cuisine_data['confidence'],
                'tags': tag_data
            }

            return complete_data

        except (ApiError, TransportError) as e:
            logger.error(f"Google API 錯誤 (place_id: {place_id}): {type(e).__name__}")
            return None
        except KeyError as e:
            logger.error(f"回應格式錯誤 (place_id: {place_id}): 缺少欄位 {e}")
            return None
    
    def search_restaurants_in_district(self, district: str) -> list[dict[str, str]]:
        """
        搜尋指定行政區的餐廳

        Args:
            district: 行政區名稱

        Returns:
            餐廳基本資訊列表 (place_id, name, district)
        """
        try:
            places_result = self.gmaps.places_nearby(
                location=f"{district}, 台北市, 台灣",
                radius=API_CONFIG['SEARCH_RADIUS_METERS'],
                type='restaurant',
                language=API_CONFIG['LANGUAGE']
            )

            restaurants: list[dict[str, str]] = []

            def extract_operational_restaurants(results: list[dict[str, Any]]) -> None:
                """從搜尋結果中提取營業中的餐廳"""
                for place in results:
                    if place.get('business_status') == 'OPERATIONAL':
                        restaurants.append({
                            'place_id': place['place_id'],
                            'name': place['name'],
                            'district': district
                        })

            extract_operational_restaurants(places_result.get('results', []))

            # 處理分頁 (Google API 要求延遲)
            while 'next_page_token' in places_result:
                time.sleep(API_CONFIG['NEXT_PAGE_DELAY_SECONDS'])
                places_result = self.gmaps.places_nearby(
                    page_token=places_result['next_page_token']
                )
                extract_operational_restaurants(places_result.get('results', []))

            return restaurants

        except (ApiError, TransportError) as e:
            logger.error(f"搜尋餐廳失敗 ({district}): {type(e).__name__}")
            return []
    
    def deduplicate_restaurants(
        self, restaurants: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        """
        移除重複的餐廳

        Args:
            restaurants: 餐廳列表

        Returns:
            去重後的餐廳列表
        """
        seen_place_ids: set[str] = set()
        unique_restaurants: list[dict[str, str]] = []

        for restaurant in restaurants:
            place_id = restaurant['place_id']
            if place_id not in seen_place_ids:
                seen_place_ids.add(place_id)
                unique_restaurants.append(restaurant)

        return unique_restaurants
    
    async def batch_collect_taipei_restaurants(self) -> list[dict[str, Any]]:
        """
        批次收集台北市所有行政區的餐廳資料

        Returns:
            所有餐廳的詳細資訊列表
        """
        taipei_restaurants: list[dict[str, str]] = []

        # 搜尋各行政區餐廳
        for district in TAIPEI_DISTRICTS:
            logger.info(f"正在搜尋 {district} 的餐廳...")
            district_restaurants = self.search_restaurants_in_district(district)
            taipei_restaurants.extend(district_restaurants)
            logger.info(f"在 {district} 找到 {len(district_restaurants)} 家餐廳")

        # 移除重複
        unique_restaurants = self.deduplicate_restaurants(taipei_restaurants)
        logger.info(f"共找到 {len(unique_restaurants)} 家不重複的餐廳")

        # 收集詳細資料
        detailed_results: list[dict[str, Any]] = []
        total = len(unique_restaurants)

        for i, restaurant in enumerate(unique_restaurants, start=1):
            logger.info(f"處理中 ({i}/{total}): {restaurant['name']}")

            detailed_data = await self.collect_restaurant_data(restaurant['place_id'])

            if detailed_data:
                detailed_results.append(detailed_data)

            # 速率限制
            await asyncio.sleep(API_CONFIG['REQUEST_DELAY_SECONDS'])

        logger.info(f"成功收集 {len(detailed_results)} 家餐廳的詳細資料")
        return detailed_results