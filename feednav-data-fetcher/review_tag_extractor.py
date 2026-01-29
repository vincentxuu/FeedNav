"""
評論標籤提取器

從餐廳評論中提取標籤，包含：
- 環境、衛生、服務、寵物政策、付款方式、空氣品質
- 價格感受、等候與訂位、停車交通、用餐限制
- 適合場合、無障礙設施、特色氛圍
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
            'air_quality': AirQualityExtractor(),
            'price_perception': PricePerceptionExtractor(),
            'waiting': WaitingExtractor(),
            'parking': ParkingExtractor(),
            'dining_rules': DiningRulesExtractor(),
            'occasion': OccasionExtractor(),
            'accessibility': AccessibilityExtractor(),
            'ambiance': AmbianceExtractor(),
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


class PricePerceptionExtractor(BaseTagExtractor):
    """價格感受標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'cp_value_high': [
                r'(CP值|cp值).*(高|很高|超高)',
                r'(划算|物超所值|便宜又好吃)',
                r'(價格|價位).*(實惠|親民|便宜)',
            ],
            'expensive': [
                r'(價格|價位).*(偏貴|很貴|太貴|不便宜)',
                r'(貴|有點貴|偏貴)',
            ],
            'large_portion': [
                r'(份量|分量).*(大|很大|超大|十足)',
                r'(吃很飽|吃不完|量很多)',
            ],
            'small_portion': [
                r'(份量|分量).*(少|很少|太少|小)',
                r'(吃不飽|量太少)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取價格感受標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class WaitingExtractor(BaseTagExtractor):
    """等候與訂位標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'need_queue': [
                r'(排隊|排很久|要等|等很久)',
                r'(人很多|大排長龍|人潮)',
            ],
            'no_wait': [
                r'(不用等|不用排|馬上入座)',
                r'(人不多|沒什麼人)',
            ],
            'reservation_recommended': [
                r'(要訂位|先訂位|建議訂位)',
                r'(沒訂位|不訂位).*(吃不到|沒位子)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取等候與訂位標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class ParkingExtractor(BaseTagExtractor):
    """停車交通標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'parking_easy': [
                r'(有停車場|停車方便|好停車)',
                r'(停車位|車位).*(很多|充足)',
            ],
            'parking_difficult': [
                r'(不好停車|停車困難|難停車)',
                r'(沒停車位|沒有車位)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取停車交通標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class DiningRulesExtractor(BaseTagExtractor):
    """用餐限制標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'time_limit': [
                r'(限時|用餐時間|時間限制)',
                r'(\d+分鐘|1.5小時|90分)',
            ],
            'minimum_charge': [
                r'(低消|最低消費)',
                r'(每人|每位).*(消費|\d+元)',
            ],
            'no_time_limit': [
                r'(不限時|沒有限時)',
                r'(可以坐很久|慢慢吃)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取用餐限制標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class OccasionExtractor(BaseTagExtractor):
    """適合場合標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'solo_friendly': [
                r'(一個人|獨自|單人).*(吃|用餐|來)',
                r'(適合|很適合).*(一個人|獨食)',
            ],
            'group_friendly': [
                r'(聚餐|朋友聚會|家庭聚餐)',
                r'(適合|很適合).*(聚餐|多人)',
                r'(慶生|慶祝)',
            ],
            'business_friendly': [
                r'(商務|談事情|招待客戶)',
                r'(適合|很適合).*(談公事|商務)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取適合場合標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class AccessibilityExtractor(BaseTagExtractor):
    """無障礙設施標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'wheelchair_accessible': [
                r'(輪椅|無障礙|電梯)',
                r'(行動不便|推車).*(方便|可以)',
            ],
            'baby_chair': [
                r'(兒童座椅|嬰兒椅|寶寶椅)',
                r'(有提供|有).*(兒童椅|嬰兒座椅)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取無障礙設施標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)


class AmbianceExtractor(BaseTagExtractor):
    """特色氛圍標籤提取器"""

    def __init__(self) -> None:
        self.patterns: dict[str, list[str]] = {
            'good_view': [
                r'(景觀|view|夜景|窗景).*(好|很棒|漂亮)',
                r'(看得到|可以看).*(風景|夜景|街景)',
            ],
            'instagrammable': [
                r'(網美|打卡|拍照|IG)',
                r'(很好拍|超好拍|適合拍照)',
            ],
            'vintage_style': [
                r'(復古|懷舊|老店|古早味)',
                r'(傳統|老字號)',
            ],
        }

    def extract(self, text: str, rating: int) -> list[dict[str, Any]]:
        """提取特色氛圍標籤"""
        return self._extract_with_patterns(text, rating, base_confidence=0.6)