"""
菜系分類器

根據餐廳名稱、Google 類型和評論內容分類餐廳菜系。
支援主分類（餐廳/甜點/咖啡廳）判斷。
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

# 配置常數
CLASSIFIER_CONFIG = {
    'NAME_WEIGHT': 3.0,          # 餐廳名稱權重
    'TYPES_WEIGHT': 1.0,         # Google 類型權重
    'REVIEW_WEIGHT': 2.0,        # 評論權重
    'CONFIDENCE_THRESHOLD': 0.3, # 最低信心度門檻
    'MIN_SCORE_THRESHOLD': 2,    # 最低分數門檻
    'UNCLASSIFIED_LABEL': '未分類',
}

# 主分類關鍵字
CATEGORY_KEYWORDS = {
    '甜點': [
        '甜點', '蛋糕', '冰', '甜品', '烘焙', '麵包', 'Dessert', 'Bakery',
        '甜食', '糕點', '餅乾', '巧克力', '馬卡龍', '泡芙', '塔', '派',
        '冰淇淋', '霜淇淋', '雪花冰', '刨冰', '豆花', '仙草',
        '手搖', '飲料', '奶茶', '珍珠', '鮮茶'
    ],
    '咖啡廳': [
        '咖啡', 'Coffee', 'Cafe', 'Café', '茶館', '茶室', '茶屋',
        '咖啡廳', '咖啡店', '咖啡館', '手沖', '拿鐵', '義式咖啡',
        '精品咖啡', '烘豆', '自家烘焙'
    ]
}


class CuisineClassifier:
    """菜系分類器"""

    def __init__(self) -> None:
        """初始化菜系分類器"""
        self.cuisine_keywords = {
            '日式料理': ['日式', '日本', '壽司', '拉麵', '丼飯', '居酒屋', '燒肉', 'Japanese', '刺身', '天婦羅', '烏龍麵', '蕎麥麵'],
            '韓式料理': ['韓式', '韓國', '韓食', '泡菜', '烤肉', '石鍋', 'Korean', '韓式炸雞', '韓式烤肉', '韓式料理'],
            '義式料理': ['義式', '義大利', '披薩', '義大利麵', 'Pizza', 'Italian', 'Pasta', '千層麵', '燉飯'],
            '中式料理': ['中式', '台菜', '川菜', '粵菜', '湘菜', '麻辣', '熱炒', '中國菜', '港式', '飲茶'],
            '泰式料理': ['泰式', '泰國', '酸辣', '椰漿', 'Thai', '打拋', '冬陰功', '綠咖哩', '紅咖哩'],
            '火鍋': ['火鍋', '鍋物', '麻辣鍋', '涮涮鍋', '石頭火鍋', '薑母鴨', '羊肉爐'],
            '燒烤': ['燒烤', 'BBQ', '烤肉', '串燒', '炭火燒烤'],
            '咖啡廳': ['咖啡', 'Coffee', 'Cafe', '輕食', '下午茶', '手沖咖啡', '義式咖啡'],
            '甜點': ['甜點', '蛋糕', '冰淇淋', 'Dessert', '馬卡龍', '泡芙', '甜品'],
            '美式料理': ['美式', '漢堡', '牛排', 'American', 'Burger', 'Steak', '薯條'],
            '法式料理': ['法式', '法國', 'French', '法式料理', '可麗餅'],
            '印度料理': ['印度', 'Indian', '咖哩', '印度料理', '烤餅'],
            '素食': ['素食', '蔬食', 'Vegetarian', 'Vegan', '素', '全素'],
            '海鮮': ['海鮮', '活海鮮', '海產', '螃蟹', '蝦子', '魚類']
        }
        
        self.google_types_mapping = {
            'restaurant': 1,
            'food': 1,
            'meal_takeaway': 1,
            'cafe': 2,
            'bakery': 1,
            'bar': 0.5,
            'night_club': 0.2
        }
    
    def analyze_name(self, name: str) -> dict[str, int]:
        """
        分析餐廳名稱中的菜系關鍵字

        Args:
            name: 餐廳名稱

        Returns:
            各菜系的分數字典
        """
        scores: dict[str, int] = defaultdict(int)

        for cuisine, keywords in self.cuisine_keywords.items():
            for keyword in keywords:
                if keyword.lower() in name.lower():
                    scores[cuisine] += 2

        return dict(scores)

    def analyze_google_types(self, types: list[str]) -> dict[str, int]:
        """
        分析 Google Places 類型

        Args:
            types: Google Places 類型列表

        Returns:
            各菜系的分數字典
        """
        scores: dict[str, int] = defaultdict(int)

        if not types:
            return dict(scores)

        # 目前僅用於確認是餐廳，不影響具體菜系分數
        for type_name in types:
            if type_name in self.google_types_mapping:
                pass

        return dict(scores)

    def analyze_reviews(self, reviews_text: str) -> dict[str, int]:
        """
        分析評論文字中的菜系關鍵字

        Args:
            reviews_text: 合併後的評論文字

        Returns:
            各菜系的分數字典
        """
        scores: dict[str, int] = defaultdict(int)

        if not reviews_text:
            return dict(scores)

        full_text = reviews_text.lower()

        for cuisine, keywords in self.cuisine_keywords.items():
            for keyword in keywords:
                count = len(re.findall(re.escape(keyword.lower()), full_text))
                scores[cuisine] += count

        return dict(scores)

    def extract_from_reviews(
        self, reviews: list[dict[str, Any] | str]
    ) -> str:
        """
        從評論列表中提取文字

        Args:
            reviews: 評論列表

        Returns:
            合併後的評論文字
        """
        if not reviews:
            return ""

        review_texts: list[str] = []
        for review in reviews:
            if isinstance(review, dict) and 'text' in review:
                review_texts.append(review['text'])
            elif isinstance(review, str):
                review_texts.append(review)

        return " ".join(review_texts)

    def combine_scores(
        self,
        name_score: dict[str, int],
        types_score: dict[str, int],
        review_score: dict[str, int]
    ) -> dict[str, float]:
        """
        合併各來源的分數

        Args:
            name_score: 名稱分析分數
            types_score: 類型分析分數
            review_score: 評論分析分數

        Returns:
            加權後的總分字典
        """
        combined: dict[str, float] = defaultdict(float)

        all_cuisines = set(
            list(name_score.keys()) +
            list(types_score.keys()) +
            list(review_score.keys())
        )

        for cuisine in all_cuisines:
            combined[cuisine] = (
                name_score.get(cuisine, 0) * CLASSIFIER_CONFIG['NAME_WEIGHT'] +
                types_score.get(cuisine, 0) * CLASSIFIER_CONFIG['TYPES_WEIGHT'] +
                review_score.get(cuisine, 0) * CLASSIFIER_CONFIG['REVIEW_WEIGHT']
            )

        return dict(combined)

    def get_top_cuisine(self, scores: dict[str, float]) -> dict[str, Any]:
        """
        取得最可能的菜系

        Args:
            scores: 菜系分數字典

        Returns:
            包含主要菜系、信心度和所有分數的字典
        """
        unclassified = CLASSIFIER_CONFIG['UNCLASSIFIED_LABEL']

        if not scores:
            return {
                'primary_cuisine': unclassified,
                'confidence': 0.0,
                'all_scores': {}
            }

        top_cuisine = max(scores.items(), key=lambda x: x[1])
        max_score = top_cuisine[1]

        total_score = sum(scores.values())
        confidence = max_score / total_score if total_score > 0 else 0.0

        threshold = CLASSIFIER_CONFIG['CONFIDENCE_THRESHOLD']
        min_score = CLASSIFIER_CONFIG['MIN_SCORE_THRESHOLD']

        if confidence < threshold or max_score < min_score:
            return {
                'primary_cuisine': unclassified,
                'confidence': confidence,
                'all_scores': scores
            }

        return {
            'primary_cuisine': top_cuisine[0],
            'confidence': confidence,
            'all_scores': scores
        }

    def classify_cuisine(self, restaurant_data: dict[str, Any]) -> dict[str, Any]:
        """
        分類餐廳菜系

        Args:
            restaurant_data: 餐廳資料

        Returns:
            包含主要菜系、信心度和所有分數的字典
        """
        name = restaurant_data.get('name', '')
        types = restaurant_data.get('types', [])
        reviews = restaurant_data.get('reviews', [])

        reviews_text = self.extract_from_reviews(reviews)

        name_score = self.analyze_name(name)
        types_score = self.analyze_google_types(types)
        review_score = self.analyze_reviews(reviews_text)

        final_scores = self.combine_scores(name_score, types_score, review_score)

        return self.get_top_cuisine(final_scores)

    def classify_category(self, restaurant_data: dict[str, Any]) -> str:
        """
        判斷店家主分類：餐廳/甜點/咖啡廳

        根據店名、Google 類型和菜系類型綜合判斷。

        Args:
            restaurant_data: 餐廳資料

        Returns:
            主分類：'餐廳'、'甜點' 或 '咖啡廳'
        """
        name = restaurant_data.get('name', '')
        google_types = restaurant_data.get('types', [])
        cuisine_type = restaurant_data.get('cuisine_type', '')

        # 優先判斷店名
        name_lower = name.lower()
        for keyword in CATEGORY_KEYWORDS['甜點']:
            if keyword.lower() in name_lower:
                return '甜點'

        for keyword in CATEGORY_KEYWORDS['咖啡廳']:
            if keyword.lower() in name_lower:
                return '咖啡廳'

        # 次要判斷 Google 類型
        if 'bakery' in google_types:
            return '甜點'

        if 'cafe' in google_types and 'restaurant' not in google_types:
            return '咖啡廳'

        # 根據菜系類型判斷
        if cuisine_type == '甜點':
            return '甜點'

        if cuisine_type == '咖啡廳':
            return '咖啡廳'

        # 預設為餐廳
        return '餐廳'