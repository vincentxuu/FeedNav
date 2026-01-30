"""
FeedNav 資料收集管道

收集台北市餐廳資料，包含地點處理、菜系分類和評論標籤提取。
"""
import asyncio
import math
import time
import logging
from typing import Any

import googlemaps
from googlemaps.exceptions import ApiError, TransportError

from location_processor import LocationProcessor
from cuisine_classifier import CuisineClassifier
from review_tag_extractor import ReviewTagExtractor
from api_quota_tracker import APIQuotaTracker, QuotaExceededError

logger = logging.getLogger(__name__)

# 台北市行政區列表
TAIPEI_DISTRICTS: list[str] = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
]

# 台北市行政區中心座標
DISTRICT_COORDINATES: dict[str, tuple[float, float]] = {
    '中正區': (25.0323, 121.5185),
    '大同區': (25.0633, 121.5130),
    '中山區': (25.0685, 121.5336),
    '松山區': (25.0601, 121.5578),
    '大安區': (25.0267, 121.5435),
    '萬華區': (25.0340, 121.4997),
    '信義區': (25.0305, 121.5712),
    '士林區': (25.0930, 121.5250),
    '北投區': (25.1315, 121.5028),
    '內湖區': (25.0690, 121.5880),
    '南港區': (25.0385, 121.6065),
    '文山區': (24.9895, 121.5705),
}

# API 配置常數
API_CONFIG = {
    'SEARCH_RADIUS_METERS': 1200,           # 搜尋半徑 (公尺) - 縮小以配合網格搜尋
    'GRID_SIZE': 3,                         # 網格大小 (3x3 = 9 個搜尋點)
    'GRID_SPACING_METERS': 1500,            # 網格點間距 (公尺)
    'NEXT_PAGE_DELAY_SECONDS': 2,           # 翻頁延遲 (秒) - Google API 要求
    'REQUEST_DELAY_SECONDS': 0.1,           # 請求間隔 (秒) - 速率限制
    'LANGUAGE': 'zh-TW',                    # API 語言設定
}

# 搜尋類型設定
SEARCH_TYPES: dict[str, dict[str, Any]] = {
    'restaurant': {
        'type': 'restaurant',
        'keywords': ['餐廳'],
    },
    'dessert': {
        'type': 'bakery',
        'keywords': ['甜點', '蛋糕', '冰品', '甜點店'],
    },
    'cafe': {
        'type': 'cafe',
        'keywords': ['咖啡', '咖啡廳', '咖啡店'],
    },
    'healthy': {
        'type': 'restaurant',
        'keywords': ['健康餐', '沙拉', '健身餐', '低卡'],
    },
    'bar': {
        'type': 'bar',
        'keywords': ['酒吧', '居酒屋', '酒館'],
    },
    'meal_delivery': {
        'type': 'meal_delivery',
        'keywords': ['外送', '便當', '外送美食'],
    },
    'meal_takeaway': {
        'type': 'meal_takeaway',
        'keywords': ['外帶', '外帶美食'],
    },
    'food': {
        'type': 'food',
        'keywords': ['食物', '小吃', '美食'],
    },
}

# Place Details 請求欄位
PLACE_DETAIL_FIELDS: list[str] = [
    'name', 'rating', 'price_level', 'formatted_address',
    'geometry', 'review', 'type', 'opening_hours', 'photo'
]


def generate_grid_points(
    center: tuple[float, float],
    grid_size: int = 3,
    spacing_meters: float = 1500
) -> list[tuple[float, float]]:
    """
    生成網格搜尋點，以中心點為基準向四周擴展

    Args:
        center: 中心點座標 (lat, lng)
        grid_size: 網格大小 (例如 3 表示 3x3 = 9 個點)
        spacing_meters: 網格點之間的距離 (公尺)

    Returns:
        網格點座標列表
    """
    # 1 度緯度 ≈ 111km
    # 1 度經度 ≈ 111km * cos(緯度)
    lat_offset = spacing_meters / 111000
    lng_offset = spacing_meters / (111000 * math.cos(math.radians(center[0])))

    points: list[tuple[float, float]] = []
    half = grid_size // 2

    for i in range(-half, half + 1):
        for j in range(-half, half + 1):
            points.append((
                center[0] + i * lat_offset,
                center[1] + j * lng_offset
            ))

    return points


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
        self.quota_tracker = APIQuotaTracker()

    def _normalize_field_names(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        標準化 API 回傳的欄位名稱

        Google Places API 請求用單數，但回傳可能用單數或複數
        """
        # 單數 -> 複數 的映射
        field_mapping = {
            'review': 'reviews',
            'photo': 'photos',
            'type': 'types',
        }

        normalized = dict(data)
        for singular, plural in field_mapping.items():
            if singular in normalized and plural not in normalized:
                normalized[plural] = normalized.pop(singular)

        return normalized

    async def collect_restaurant_data(self, place_id: str) -> dict[str, Any] | None:
        """
        收集單一餐廳的詳細資料

        Args:
            place_id: Google Places API 的 place_id

        Returns:
            包含餐廳完整資訊的字典，失敗時返回 None
        """
        try:
            self.quota_tracker.check_and_increment(APIQuotaTracker.PLACE_DETAILS)
            place_details = self.gmaps.place(
                place_id=place_id,
                fields=PLACE_DETAIL_FIELDS,
                language=API_CONFIG['LANGUAGE']
            )['result']

            # 標準化欄位名稱 (API 回傳可能用單數或複數)
            place_details = self._normalize_field_names(place_details)

            location_data = self.location_processor.process_location(place_details)
            cuisine_data = self.cuisine_classifier.classify_cuisine(place_details)
            tag_data = self.tag_extractor.extract_all_tags(
                place_details.get('reviews', [])
            )

            # 先建立基礎資料用於分類
            base_data = {
                **place_details,
                'cuisine_type': cuisine_data['primary_cuisine'],
            }

            # 判斷主分類
            category = self.cuisine_classifier.classify_category(base_data)

            complete_data = {
                **place_details,
                'place_id': place_id,  # 確保 place_id 被包含在返回資料中
                'district': location_data['district'],
                'nearby_mrt': location_data['nearby_mrt'],
                'cuisine_type': cuisine_data['primary_cuisine'],
                'cuisine_confidence': cuisine_data['confidence'],
                'category': category,
                'tags': tag_data
            }

            return complete_data

        except QuotaExceededError:
            raise
        except (ApiError, TransportError) as e:
            logger.error(f"Google API 錯誤 (place_id: {place_id}): {type(e).__name__}")
            return None
        except KeyError as e:
            logger.error(f"回應格式錯誤 (place_id: {place_id}): 缺少欄位 {e}")
            return None
    
    def search_restaurants_in_district(
        self,
        district: str,
        place_type: str = 'restaurant'
    ) -> list[dict[str, str]]:
        """
        搜尋指定行政區的餐廳（使用多中心點網格搜尋）

        Args:
            district: 行政區名稱
            place_type: Google Places 類型 (restaurant, cafe, bakery)

        Returns:
            餐廳基本資訊列表 (place_id, name, district)
        """
        # 取得行政區中心座標
        center = DISTRICT_COORDINATES.get(district)
        if not center:
            logger.warning(f"找不到 {district} 的座標，跳過 Nearby Search")
            return []

        # 生成網格搜尋點
        grid_points = generate_grid_points(
            center,
            grid_size=API_CONFIG['GRID_SIZE'],
            spacing_meters=API_CONFIG['GRID_SPACING_METERS']
        )

        restaurants: list[dict[str, str]] = []
        seen_place_ids: set[str] = set()

        def extract_operational_restaurants(results: list[dict[str, Any]]) -> None:
            """從搜尋結果中提取營業中的餐廳（自動去重）"""
            for place in results:
                place_id = place.get('place_id')
                if not place_id:
                    continue
                # 預設為 OPERATIONAL，避免漏掉沒有 business_status 的店家
                if (place.get('business_status', 'OPERATIONAL') == 'OPERATIONAL'
                        and place_id not in seen_place_ids):
                    seen_place_ids.add(place_id)
                    restaurants.append({
                        'place_id': place_id,
                        'name': place.get('name', '未知店家'),
                        'district': district
                    })

        # 對每個網格點進行搜尋
        for point_idx, point in enumerate(grid_points):
            try:
                self.quota_tracker.check_and_increment(APIQuotaTracker.NEARBY_SEARCH)
                places_result = self.gmaps.places_nearby(
                    location=point,
                    radius=API_CONFIG['SEARCH_RADIUS_METERS'],
                    type=place_type,
                    language=API_CONFIG['LANGUAGE']
                )

                extract_operational_restaurants(places_result.get('results', []))

                # 處理分頁 (Google API 要求延遲)
                while 'next_page_token' in places_result:
                    time.sleep(API_CONFIG['NEXT_PAGE_DELAY_SECONDS'])
                    self.quota_tracker.check_and_increment(APIQuotaTracker.NEARBY_SEARCH)
                    places_result = self.gmaps.places_nearby(
                        page_token=places_result['next_page_token']
                    )
                    extract_operational_restaurants(places_result.get('results', []))

            except QuotaExceededError:
                raise
            except (ApiError, TransportError) as e:
                logger.error(
                    f"搜尋餐廳失敗 ({district}, 點 {point_idx + 1}, {place_type}): "
                    f"{type(e).__name__}"
                )
                continue

        logger.info(f"網格搜尋 {district}: {len(grid_points)} 個點，找到 {len(restaurants)} 家")
        return restaurants

    def search_by_keyword(
        self,
        district: str,
        keyword: str,
        place_type: str = 'restaurant'
    ) -> list[dict[str, str]]:
        """
        使用關鍵字搜尋指定行政區的店家

        Args:
            district: 行政區名稱
            keyword: 搜尋關鍵字
            place_type: Google Places 類型

        Returns:
            店家基本資訊列表 (place_id, name, district)
        """
        try:
            self.quota_tracker.check_and_increment(APIQuotaTracker.TEXT_SEARCH)
            query = f"{keyword} {district} 台北市"
            places_result = self.gmaps.places(
                query=query,
                type=place_type,
                language=API_CONFIG['LANGUAGE']
            )

            restaurants: list[dict[str, str]] = []

            def extract_operational(results: list[dict[str, Any]]) -> None:
                """從搜尋結果中提取營業中的店家"""
                for place in results:
                    place_id = place.get('place_id')
                    if not place_id:
                        continue
                    if place.get('business_status', 'OPERATIONAL') == 'OPERATIONAL':
                        restaurants.append({
                            'place_id': place_id,
                            'name': place.get('name', '未知店家'),
                            'district': district
                        })

            extract_operational(places_result.get('results', []))

            # 處理分頁
            while 'next_page_token' in places_result:
                time.sleep(API_CONFIG['NEXT_PAGE_DELAY_SECONDS'])
                self.quota_tracker.check_and_increment(APIQuotaTracker.TEXT_SEARCH)
                places_result = self.gmaps.places(
                    page_token=places_result['next_page_token']
                )
                extract_operational(places_result.get('results', []))

            return restaurants

        except QuotaExceededError:
            raise
        except (ApiError, TransportError) as e:
            logger.error(f"關鍵字搜尋失敗 ({keyword}, {district}): {type(e).__name__}")
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
    
    async def batch_collect_taipei_restaurants(
        self,
        districts: list[str] | None = None,
        search_types: list[str] | None = None,
        collected_place_ids: set[str] | None = None,
        force: bool = False
    ) -> dict[str, Any]:
        """
        批次收集台北市指定行政區的餐廳資料

        智慧增量收集邏輯：
        - 有新餐廳 → 只收集新餐廳（節省 API 配額）
        - 沒有新餐廳 → 更新舊餐廳資料（保持資料新鮮度）
        - force=True → 強制收集所有餐廳（忽略已收集記錄）

        Args:
            districts: 要收集的行政區列表，預設為全部 12 區
            search_types: 要搜尋的類型列表，預設為 ['restaurant']
                          可選：'restaurant', 'dessert', 'cafe', 'healthy'
            collected_place_ids: 已收集過的 place_id 集合
            force: 是否強制重新收集所有餐廳

        Returns:
            包含以下鍵值的字典：
            - restaurants: 餐廳詳細資訊列表
            - is_update_mode: 是否為更新模式
            - new_count: 新餐廳數量
            - updated_count: 更新的餐廳數量
            - collected_restaurants: 本次收集的餐廳基本資訊列表
        """
        if districts is None:
            districts = TAIPEI_DISTRICTS
        if search_types is None:
            search_types = ['restaurant']
        if collected_place_ids is None:
            collected_place_ids = set()

        taipei_restaurants: list[dict[str, str]] = []
        quota_exceeded = False

        # 搜尋各行政區
        try:
            for district in districts:
                if quota_exceeded:
                    break
                for search_type in search_types:
                    if search_type not in SEARCH_TYPES:
                        logger.warning(f"未知的搜尋類型: {search_type}")
                        continue

                    config = SEARCH_TYPES[search_type]
                    place_type = config['type']
                    keywords = config['keywords']

                    logger.info(f"正在搜尋 {district} 的 {search_type}...")

                    # 使用 place type 搜尋
                    district_results = self.search_restaurants_in_district(
                        district, place_type
                    )
                    taipei_restaurants.extend(district_results)

                    # 使用關鍵字搜尋補充
                    for keyword in keywords:
                        keyword_results = self.search_by_keyword(
                            district, keyword, place_type
                        )
                        taipei_restaurants.extend(keyword_results)

                    logger.info(
                        f"在 {district} 找到 {len(district_results)} 家 {search_type}"
                    )
        except QuotaExceededError as e:
            logger.warning(f"搜尋階段配額超出: {e}")
            quota_exceeded = True

        # 移除重複
        unique_restaurants = self.deduplicate_restaurants(taipei_restaurants)
        logger.info(f"共找到 {len(unique_restaurants)} 家不重複的店家")

        # 智慧增量收集邏輯
        is_update_mode = False
        restaurants_to_collect: list[dict[str, str]] = []

        if force:
            # 強制模式：收集所有餐廳
            restaurants_to_collect = unique_restaurants
            logger.info("強制模式：收集所有餐廳")
        else:
            # 區分新舊餐廳
            new_restaurants = [
                r for r in unique_restaurants
                if r['place_id'] not in collected_place_ids
            ]
            old_restaurants = [
                r for r in unique_restaurants
                if r['place_id'] in collected_place_ids
            ]

            if new_restaurants:
                # 有新餐廳 → 只收集新餐廳
                restaurants_to_collect = new_restaurants
                logger.info(
                    f"收集模式：新餐廳，發現 {len(new_restaurants)} 家新餐廳，"
                    f"跳過 {len(old_restaurants)} 家已收集餐廳"
                )
            else:
                # 沒有新餐廳 → 更新舊餐廳
                restaurants_to_collect = old_restaurants
                is_update_mode = True
                logger.info(
                    f"收集模式：更新，沒有新餐廳，更新 {len(old_restaurants)} 家舊餐廳"
                )

        # 收集詳細資料
        detailed_results: list[dict[str, Any]] = []
        total = len(restaurants_to_collect)

        try:
            for i, restaurant in enumerate(restaurants_to_collect, start=1):
                mode_label = "更新" if is_update_mode else "收集"
                logger.info(f"{mode_label}中 ({i}/{total}): {restaurant['name']}")

                detailed_data = await self.collect_restaurant_data(restaurant['place_id'])

                if detailed_data:
                    detailed_results.append(detailed_data)

                # 速率限制
                await asyncio.sleep(API_CONFIG['REQUEST_DELAY_SECONDS'])
        except QuotaExceededError as e:
            logger.warning(f"詳細資料收集階段配額超出: {e}")

        logger.info(f"成功收集 {len(detailed_results)} 家店家的詳細資料")
        self.quota_tracker.log_usage()

        return {
            'restaurants': detailed_results,
            'is_update_mode': is_update_mode,
            'new_count': len(restaurants_to_collect) if not is_update_mode else 0,
            'updated_count': len(restaurants_to_collect) if is_update_mode else 0,
            'collected_restaurants': restaurants_to_collect
        }

    async def batch_collect_all_categories(
        self,
        collected_place_ids: set[str] | None = None,
        force: bool = False
    ) -> dict[str, Any]:
        """
        批次收集所有類型的店家（餐廳、甜點、咖啡廳、健康餐）

        Args:
            collected_place_ids: 已收集過的 place_id 集合
            force: 是否強制重新收集所有餐廳

        Returns:
            包含餐廳資料和收集統計的字典
        """
        return await self.batch_collect_taipei_restaurants(
            search_types=['restaurant', 'dessert', 'cafe', 'healthy'],
            collected_place_ids=collected_place_ids,
            force=force
        )