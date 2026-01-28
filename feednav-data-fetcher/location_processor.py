"""
地點處理器

處理餐廳地點資訊，包含行政區辨識、鄰近捷運站查詢。
"""
from __future__ import annotations

import logging
import math
from typing import Any

import googlemaps
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

logger = logging.getLogger(__name__)

# 配置常數
MRT_NEARBY_DISTANCE_METERS = 500
GEOCODER_TIMEOUT_SECONDS = 10
GEOCODER_USER_AGENT = "taipei_restaurants"
EARTH_RADIUS_METERS = 6371000

# 台北市行政區列表
TAIPEI_DISTRICTS: list[str] = [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'
]


class LocationProcessor:
    """地點處理器"""

    def __init__(self, api_key: str) -> None:
        """
        初始化地點處理器

        Args:
            api_key: Google Maps API 金鑰
        """
        self.gmaps = googlemaps.Client(key=api_key)
        self.geolocator = Nominatim(
            user_agent=GEOCODER_USER_AGENT,
            timeout=GEOCODER_TIMEOUT_SECONDS
        )
        self.mrt_stations = self._load_mrt_stations()
    
    def _load_mrt_stations(self) -> list[dict[str, Any]]:
        """載入台北捷運站點資料"""
        return [
            {"name": "台北車站", "line": ["淡水信義線", "板南線"], "lat": 25.0478, "lng": 121.5171, "district": "中正區"},
            {"name": "中正紀念堂站", "line": ["淡水信義線"], "lat": 25.0303, "lng": 121.5180, "district": "中正區"},
            {"name": "東門站", "line": ["淡水信義線"], "lat": 25.0338, "lng": 121.5287, "district": "中正區"},
            {"name": "信義安和站", "line": ["淡水信義線"], "lat": 25.0333, "lng": 121.5527, "district": "大安區"},
            {"name": "台北101/世貿站", "line": ["淡水信義線"], "lat": 25.0330, "lng": 121.5654, "district": "信義區"},
            {"name": "象山站", "line": ["淡水信義線"], "lat": 25.0330, "lng": 121.5697, "district": "信義區"},
            {"name": "市政府站", "line": ["板南線"], "lat": 25.0408, "lng": 121.5653, "district": "信義區"},
            {"name": "永春站", "line": ["板南線"], "lat": 25.0408, "lng": 121.5780, "district": "信義區"},
            {"name": "後山埤站", "line": ["板南線"], "lat": 25.0447, "lng": 121.5819, "district": "信義區"},
            {"name": "昆陽站", "line": ["板南線"], "lat": 25.0503, "lng": 121.5928, "district": "南港區"},
            {"name": "南港站", "line": ["板南線"], "lat": 25.0528, "lng": 121.6069, "district": "南港區"},
            {"name": "忠孝復興站", "line": ["板南線", "文湖線"], "lat": 25.0417, "lng": 121.5440, "district": "大安區"},
            {"name": "忠孝敦化站", "line": ["板南線"], "lat": 25.0417, "lng": 121.5502, "district": "大安區"},
            {"name": "國父紀念館站", "line": ["板南線"], "lat": 25.0417, "lng": 121.5575, "district": "大安區"},
            {"name": "善導寺站", "line": ["板南線"], "lat": 25.0445, "lng": 121.5242, "district": "中正區"},
            {"name": "忠孝新生站", "line": ["板南線"], "lat": 25.0423, "lng": 121.5323, "district": "中正區"},
            {"name": "西門站", "line": ["板南線"], "lat": 25.0420, "lng": 121.5081, "district": "萬華區"},
            {"name": "龍山寺站", "line": ["板南線"], "lat": 25.0353, "lng": 121.4998, "district": "萬華區"},
            {"name": "江子翠站", "line": ["板南線"], "lat": 25.0285, "lng": 121.4722, "district": "新北市"},
            {"name": "新埔站", "line": ["板南線"], "lat": 25.0237, "lng": 121.4685, "district": "新北市"},
            {"name": "淡水站", "line": ["淡水信義線"], "lat": 25.1677, "lng": 121.4456, "district": "新北市"},
            {"name": "紅樹林站", "line": ["淡水信義線"], "lat": 25.1548, "lng": 121.4590, "district": "新北市"},
            {"name": "竹圍站", "line": ["淡水信義線"], "lat": 25.1374, "lng": 121.4596, "district": "新北市"},
            {"name": "關渡站", "line": ["淡水信義線"], "lat": 25.1262, "lng": 121.4671, "district": "北投區"},
            {"name": "忠義站", "line": ["淡水信義線"], "lat": 25.1305, "lng": 121.4730, "district": "北投區"},
            {"name": "復興崗站", "line": ["淡水信義線"], "lat": 25.1378, "lng": 121.4851, "district": "北投區"},
            {"name": "新北投站", "line": ["淡水信義線支線"], "lat": 25.1367, "lng": 121.5032, "district": "北投區"},
            {"name": "北投站", "line": ["淡水信義線"], "lat": 25.1314, "lng": 121.4985, "district": "北投區"},
            {"name": "奇岩站", "line": ["淡水信義線"], "lat": 25.1259, "lng": 121.5010, "district": "北投區"},
            {"name": "唭哩岸站", "line": ["淡水信義線"], "lat": 25.1205, "lng": 121.5064, "district": "北投區"},
            {"name": "石牌站", "line": ["淡水信義線"], "lat": 25.1146, "lng": 121.5152, "district": "北投區"},
            {"name": "明德站", "line": ["淡水信義線"], "lat": 25.1097, "lng": 121.5186, "district": "北投區"},
            {"name": "芝山站", "line": ["淡水信義線"], "lat": 25.1033, "lng": 121.5225, "district": "士林區"},
            {"name": "士林站", "line": ["淡水信義線"], "lat": 25.0937, "lng": 121.5263, "district": "士林區"},
            {"name": "劍潭站", "line": ["淡水信義線"], "lat": 25.0851, "lng": 121.5248, "district": "士林區"},
            {"name": "圓山站", "line": ["淡水信義線"], "lat": 25.0713, "lng": 121.5201, "district": "中山區"},
            {"name": "民權西路站", "line": ["淡水信義線", "中和新蘆線"], "lat": 25.0623, "lng": 121.5200, "district": "大同區"},
            {"name": "雙連站", "line": ["淡水信義線"], "lat": 25.0576, "lng": 121.5201, "district": "中山區"},
            {"name": "中山站", "line": ["淡水信義線"], "lat": 25.0521, "lng": 121.5202, "district": "中山區"},
            {"name": "南京復興站", "line": ["文湖線"], "lat": 25.0521, "lng": 121.5440, "district": "中山區"},
            {"name": "南京東路站", "line": ["文湖線"], "lat": 25.0521, "lng": 121.5502, "district": "松山區"},
            {"name": "台北小巨蛋站", "line": ["文湖線"], "lat": 25.0521, "lng": 121.5575, "district": "松山區"},
            {"name": "南京三民站", "line": ["文湖線"], "lat": 25.0521, "lng": 121.5643, "district": "松山區"},
            {"name": "松山機場站", "line": ["文湖線"], "lat": 25.0630, "lng": 121.5513, "district": "松山區"}
        ]
    
    def get_district_from_address(self, address: str) -> str | None:
        """
        從地址中提取行政區

        Args:
            address: 完整地址字串

        Returns:
            行政區名稱，找不到時返回 None
        """
        for district in TAIPEI_DISTRICTS:
            if district in address:
                return district
        return None

    def calculate_distance(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """
        使用 Haversine 公式計算兩點間的距離

        Args:
            lat1: 起點緯度
            lng1: 起點經度
            lat2: 終點緯度
            lng2: 終點經度

        Returns:
            兩點間距離 (公尺)
        """
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)

        a = (
            math.sin(delta_lat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) *
            math.sin(delta_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return EARTH_RADIUS_METERS * c

    def get_nearby_mrt_stations(
        self, lat: float, lng: float
    ) -> list[dict[str, Any]]:
        """
        取得鄰近捷運站

        Args:
            lat: 緯度
            lng: 經度

        Returns:
            鄰近捷運站列表，按距離排序
        """
        nearby_stations: list[dict[str, Any]] = []

        for station in self.mrt_stations:
            distance = self.calculate_distance(
                lat, lng, station['lat'], station['lng']
            )
            if distance <= MRT_NEARBY_DISTANCE_METERS:
                nearby_stations.append({
                    'name': station['name'],
                    'distance': round(distance),
                    'line': station['line']
                })

        nearby_stations.sort(key=lambda x: x['distance'])
        return nearby_stations

    def reverse_geocode_district(self, lat: float, lng: float) -> str | None:
        """
        透過反向地理編碼取得行政區

        Args:
            lat: 緯度
            lng: 經度

        Returns:
            行政區名稱，失敗時返回 None
        """
        try:
            location = self.geolocator.reverse(f"{lat}, {lng}", language='zh-TW')
            if location and location.address:
                return self.get_district_from_address(location.address)
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.warning(f"反向地理編碼失敗: {type(e).__name__}")
        return None

    def process_location(
        self, place_details: dict[str, Any]
    ) -> dict[str, Any]:
        """
        處理地點資訊

        Args:
            place_details: Google Places API 回傳的地點詳情

        Returns:
            包含行政區、鄰近捷運站和座標的字典
        """
        address = place_details.get('formatted_address', '')
        geometry = place_details.get('geometry', {})
        location = geometry.get('location', {})

        lat = location.get('lat')
        lng = location.get('lng')

        # 從地址提取行政區
        district = self.get_district_from_address(address)

        # 如果地址中找不到，嘗試反向地理編碼
        if not district and lat and lng:
            district = self.reverse_geocode_district(lat, lng)

        # 查詢鄰近捷運站
        nearby_mrt: list[dict[str, Any]] = []
        if lat and lng:
            nearby_mrt = self.get_nearby_mrt_stations(lat, lng)

        return {
            'district': district,
            'nearby_mrt': nearby_mrt,
            'coordinates': {
                'lat': lat,
                'lng': lng
            }
        }