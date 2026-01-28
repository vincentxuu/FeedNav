"""
評論標籤提取器

從餐廳評論中提取環境、衛生、服務、寵物政策、付款方式、空氣品質等標籤。
"""
from __future__ import annotations

import re
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Any

# 配置常數
CONFIDENCE_CONFIG = {
    'BASE_CONFIDENCE': 0.6,
    'HIGH_RATING_BONUS': 0.3,      # 評分 >= 4 時的信心加成
    'LOW_RATING_PENALTY': 0.2,     # 評分 <= 2 時的信心扣減
    'LONG_TEXT_BONUS': 0.1,        # 長文本 (>100字) 的信心加成
    'MIN_CONFIDENCE': 0.1,
    'MAX_CONFIDENCE': 1.0,
    'AGGREGATION_THRESHOLD': 0.3,  # 聚合時的最低信心門檻
    'MAX_EVIDENCE_COUNT': 3,       # 保留的最大證據數量
}


class ReviewTagExtractor:
    """評論標籤提取主類別"""

    def __init__(self) -> None:
        """初始化標籤提取器"""
        self.tag_extractors: dict[str, BaseTagExtractor] = {
            'environment': EnvironmentTagExtractor(),
            'hygiene': HygieneTagExtractor(),
            'service': ServiceTagExtractor(),
            'pet_policy': PetPolicyExtractor(),
            'payment': PaymentMethodExtractor(),
            'air_quality': AirQualityExtractor()
        }

    def extract_all_tags(
        self, reviews: list[dict[str, Any] | str]
    ) -> dict[str, dict[str, Any]]:
        """
        從所有評論中提取標籤

        Args:
            reviews: 評論列表 (字典或字串格式)

        Returns:
            按類別分組的標籤字典
        """
        if not reviews:
            return {}

        all_tags: dict[str, list[dict[str, Any]]] = {}

        for review in reviews:
            if isinstance(review, dict):
                review_text = review.get('text', '')
                review_rating = review.get('rating', 0)
            else:
                review_text = str(review)
                review_rating = 0

            for category, extractor in self.tag_extractors.items():
                tags = extractor.extract(review_text, review_rating)

                if category not in all_tags:
                    all_tags[category] = []

                all_tags[category].extend(tags)

        return self._aggregate_tags(all_tags)

    def _aggregate_tags(
        self, all_tags: dict[str, list[dict[str, Any]]]
    ) -> dict[str, dict[str, Any]]:
        """
        聚合標籤並計算信心度

        Args:
            all_tags: 原始標籤列表

        Returns:
            聚合後的標籤字典
        """
        aggregated: dict[str, dict[str, Any]] = {}

        for category, tags in all_tags.items():
            tag_counts: dict[str, list[dict[str, Any]]] = defaultdict(list)

            for tag in tags:
                tag_counts[tag['type']].append(tag)

            category_result: dict[str, Any] = {}
            for tag_type, tag_list in tag_counts.items():
                total_confidence = sum(tag['confidence'] for tag in tag_list)
                avg_confidence = total_confidence / len(tag_list)

                if avg_confidence >= CONFIDENCE_CONFIG['AGGREGATION_THRESHOLD']:
                    category_result[tag_type] = {
                        'confidence': avg_confidence,
                        'count': len(tag_list),
                        'evidence': [
                            tag['evidence']
                            for tag in tag_list[:CONFIDENCE_CONFIG['MAX_EVIDENCE_COUNT']]
                        ]
                    }

            if category_result:
                aggregated[category] = category_result

        return aggregated


class BaseTagExtractor(ABC):
    """標籤提取器抽象基類"""

    patterns: dict[str, list[str]]

    @abstractmethod
    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取標籤"""

    def _extract_with_patterns(
        self, text: str, rating: int, base_confidence: float = 0.6
    ) -> list[dict[str, Any]]:
        """
        使用正則表達式模式提取標籤

        Args:
            text: 評論文字
            rating: 評分
            base_confidence: 基礎信心度

        Returns:
            提取的標籤列表
        """
        tags: list[dict[str, Any]] = []

        for tag_type, patterns in self.patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    confidence = self._calculate_confidence(
                        text, rating, base_confidence
                    )
                    evidence = matches[0] if isinstance(matches[0], str) else str(matches[0])
                    tags.append({
                        'type': tag_type,
                        'confidence': confidence,
                        'evidence': evidence
                    })

        return tags

    def _calculate_confidence(
        self, text: str, rating: int, base: float = 0.6
    ) -> float:
        """
        計算信心度

        Args:
            text: 評論文字
            rating: 評分
            base: 基礎信心度

        Returns:
            計算後的信心度
        """
        confidence = base

        if rating >= 4:
            confidence += CONFIDENCE_CONFIG['HIGH_RATING_BONUS']
        elif rating <= 2:
            confidence -= CONFIDENCE_CONFIG['LOW_RATING_PENALTY']

        if len(text) > 100:
            confidence += CONFIDENCE_CONFIG['LONG_TEXT_BONUS']

        return min(
            CONFIDENCE_CONFIG['MAX_CONFIDENCE'],
            max(CONFIDENCE_CONFIG['MIN_CONFIDENCE'], confidence)
        )


class PaymentMethodExtractor(BaseTagExtractor):
    """付款方式標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'electronic_payment': [
                r'(可以|能夠|支援|接受).*(刷卡|信用卡)',
                r'(LINE Pay|街口|Apple Pay|Google Pay|悠遊卡)',
                r'(電子支付|行動支付|數位支付)'
            ],
            'cash_only': [
                r'(只收|僅收|只能用).*(現金)',
                r'(不能|無法|不可以).*(刷卡|信用卡)',
                r'(現金|現金交易).*(only|限定)'
            ],
            'multiple_payment': [
                r'(什麼|任何|各種).*(支付|付款).*(都可以|都行)',
                r'(支付方式|付款方式).*(很多|齊全|多元)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取付款方式標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.7)


class EnvironmentTagExtractor(BaseTagExtractor):
    """環境標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'quiet': [
                r'(安靜|靜謐|寧靜|不吵)',
                r'(適合|很好).*(聊天|談話|討論)',
                r'(環境|氛圍).*(舒適|放鬆)'
            ],
            'noisy': [
                r'(吵|嘈雜|喧嘩|很吵)',
                r'(音樂|聲音).*(太大|很大聲)',
                r'(環境|氛圍).*(吵雜|嘈雜)'
            ],
            'romantic': [
                r'(浪漫|情侶|約會)',
                r'(燈光|氣氛).*(溫馨|浪漫)',
                r'(適合|很棒).*(情侶|約會)'
            ],
            'family_friendly': [
                r'(適合|很好).*(家庭|小孩|親子)',
                r'(家庭|親子).*(友善|適合)',
                r'(小朋友|孩子).*(喜歡|適合)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取環境標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class HygieneTagExtractor(BaseTagExtractor):
    """衛生標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'clean': [
                r'(乾淨|整潔|衛生)',
                r'(環境|店內).*(很乾淨|整潔)',
                r'(衛生|清潔).*(很好|不錯)'
            ],
            'dirty': [
                r'(髒|不乾淨|不整潔)',
                r'(環境|店內).*(髒|衛生不好)',
                r'(桌子|地板).*(髒|不乾淨)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取衛生標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.7)


class ServiceTagExtractor(BaseTagExtractor):
    """服務標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'good_service': [
                r'(服務|態度).*(很好|不錯|親切|熱情)',
                r'(店員|服務生).*(親切|熱情|有禮貌)',
                r'(服務品質|服務態度).*(優秀|很棒)'
            ],
            'poor_service': [
                r'(服務|態度).*(不好|很差|冷淡)',
                r'(店員|服務生).*(不親切|態度差|很冷)',
                r'(服務品質|服務態度).*(很差|不好)'
            ],
            'fast_service': [
                r'(出餐|上菜).*(很快|快速)',
                r'(服務|效率).*(很快|迅速)',
                r'(等待時間).*(很短|不長)'
            ],
            'slow_service': [
                r'(出餐|上菜).*(很慢|慢)',
                r'(等|等待).*(很久|太久)',
                r'(服務|效率).*(很慢|太慢)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取服務標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class PetPolicyExtractor(BaseTagExtractor):
    """寵物政策標籤提取器"""

    # 寵物政策資訊通常較為可靠
    PET_POLICY_CONFIDENCE = 0.8

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'pet_friendly': [
                r'(寵物|狗狗|貓咪).*(友善|歡迎|可以帶)',
                r'(可以|能夠).*(帶寵物|帶狗|帶貓)',
                r'(寵物友善|Pet Friendly)'
            ],
            'no_pets': [
                r'(不能|不可以|禁止).*(帶寵物|帶狗|帶貓)',
                r'(寵物|狗狗|貓咪).*(不能進入|禁止)',
                r'(No Pets|寵物禁止)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取寵物政策標籤"""
        return self._extract_with_patterns(
            text, rating, base_confidence=self.PET_POLICY_CONFIDENCE
        )


class AirQualityExtractor(BaseTagExtractor):
    """空氣品質標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'smoking_allowed': [
                r'(可以|能夠|允許).*(抽菸|吸菸|抽煙)',
                r'(吸菸區|抽菸區)',
                r'(有菸味|菸味重)'
            ],
            'non_smoking': [
                r'(禁菸|禁煙|不能抽菸)',
                r'(無菸|非吸菸)',
                r'(空氣|環境).*(清新|沒有菸味)'
            ],
            'good_ventilation': [
                r'(通風|空氣流通).*(很好|不錯)',
                r'(空氣|環境).*(清新|很好)',
                r'(通風良好|空氣好)'
            ],
            'poor_ventilation': [
                r'(通風|空氣流通).*(不好|很差)',
                r'(悶|空氣不好|很悶)',
                r'(通風差|空氣悶)'
            ]
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取空氣品質標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)