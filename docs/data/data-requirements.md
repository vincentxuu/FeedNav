# FeedNav 資料需求規格

> **目標**：定義符合服務設計需求的餐廳資料規格
> **參考**：service-design/mvp-scope.md, service-design/flywheel-strategy.md

---

## 一、核心使用情境

根據服務設計，FeedNav 的核心使用情境是**正餐決策**，這是最難想的時刻。

### 主要情境

| 情境 | 用戶痛點 | 資料需求 |
|------|----------|----------|
| 聚餐規劃 | 找適合多人的餐廳 | 座位數、包廂、適合聚餐標籤 |
| 獨食探索 | 一個人吃不尷尬 | 吧台座位、適合獨食標籤 |
| 飲控需求 | 找健康低卡選項 | 健康餐、熱量資訊、飲控友善標籤 |

### 次要情境

| 情境 | 用戶痛點 | 資料需求 |
|------|----------|----------|
| 甜點探索 | 下午茶、飯後甜點 | 甜點店類型、品項資訊 |
| 咖啡廳探索 | 工作、約會、放空 | 咖啡廳類型、Wi-Fi、插座資訊 |

---

## 二、資料分類體系

### 2.1 店家類型（cuisine_type 擴展）

```
餐廳類型：
├─ 正餐類
│  ├─ 台式料理
│  ├─ 日式料理
│  ├─ 韓式料理
│  ├─ 中式料理
│  ├─ 西式料理
│  ├─ 東南亞料理
│  ├─ 美式料理
│  ├─ 義式料理
│  ├─ 法式料理
│  ├─ 印度料理
│  ├─ 火鍋
│  ├─ 燒烤
│  └─ 素食
│
├─ 輕食類
│  ├─ 早午餐
│  ├─ 輕食沙拉
│  └─ 三明治
│
├─ 甜點類 ⭐ 新增
│  ├─ 甜點店
│  ├─ 蛋糕店
│  ├─ 冰品店
│  ├─ 麵包店
│  └─ 手搖飲
│
└─ 咖啡廳類 ⭐ 新增
   ├─ 精品咖啡
   ├─ 連鎖咖啡
   ├─ 複合式咖啡廳
   └─ 茶館
```

### 2.2 情境標籤（scenario_tags）⭐ 新增需求

根據服務設計，需要新增**情境標籤**系統：

```
情境標籤：
├─ 聚餐適合 (group_friendly)
│  ├─ 判斷依據：座位數、包廂、評論關鍵字
│  ├─ 關鍵字：聚餐、適合多人、有包廂、團體
│  └─ 信心度門檻：0.5
│
├─ 一個人也適合 (solo_friendly)
│  ├─ 判斷依據：吧台座位、評論關鍵字
│  ├─ 關鍵字：一個人、獨食、吧台、單人座
│  └─ 信心度門檻：0.5
│
├─ 飲控友善 (diet_friendly)
│  ├─ 判斷依據：菜單類型、評論關鍵字
│  ├─ 關鍵字：健康、低卡、沙拉、健身、增肌、減脂
│  └─ 信心度門檻：0.5
│
├─ 適合工作 (work_friendly) ⭐ 咖啡廳情境
│  ├─ 判斷依據：Wi-Fi、插座、評論關鍵字
│  ├─ 關鍵字：辦公、工作、讀書、Wi-Fi、插座
│  └─ 信心度門檻：0.5
│
└─ 約會適合 (date_friendly)
   ├─ 判斷依據：環境氛圍、評論關鍵字
   ├─ 關鍵字：約會、浪漫、氣氛好、情侶
   └─ 信心度門檻：0.5
```

---

## 三、資料欄位規格

### 3.1 現有欄位（已實作）

| 欄位 | 類型 | 說明 | 來源 |
|------|------|------|------|
| name | TEXT | 店家名稱 | Google Places |
| district | TEXT | 行政區 | 地址解析 |
| cuisine_type | TEXT | 料理類型 | AI 分類 |
| rating | REAL | 評分 | Google Places |
| price_level | INTEGER | 價位 (1-4) | Google Places |
| address | TEXT | 地址 | Google Places |
| phone | TEXT | 電話 | Google Places |
| website | TEXT | 網站 | Google Places |
| opening_hours | TEXT | 營業時間 (JSON) | Google Places |
| latitude | REAL | 緯度 | Google Places |
| longitude | REAL | 經度 | Google Places |
| photos | TEXT | 照片 (JSON) | Google Places |

### 3.2 現有標籤（已實作）

| 標籤類別 | 標籤項目 | 來源 |
|----------|----------|------|
| 環境 | 安靜、吵雜、浪漫、親子友善 | 評論分析 |
| 衛生 | 乾淨、髒亂 | 評論分析 |
| 服務 | 服務好、服務差、出餐快、出餐慢 | 評論分析 |
| 寵物 | 寵物友善、禁止寵物 | 評論分析 |
| 支付 | 電子支付、僅收現金、多元支付 | 評論分析 |
| 空氣 | 通風良好、通風差、可吸菸、禁菸 | 評論分析 |

### 3.3 新增欄位需求

| 欄位 | 類型 | 說明 | 來源 | 優先級 |
|------|------|------|------|--------|
| category | TEXT | 主分類 (餐廳/甜點/咖啡廳) | AI 分類 | P0 |
| scenario_tags | TEXT | 情境標籤 (JSON) | 評論分析 | P0 |
| has_wifi | INTEGER | 是否有 Wi-Fi | 評論分析 | P1 |
| has_power_outlet | INTEGER | 是否有插座 | 評論分析 | P1 |
| seat_type | TEXT | 座位類型 (JSON) | 評論分析 | P1 |
| avg_visit_duration | INTEGER | 平均用餐時間(分鐘) | 評論分析 | P2 |

### 3.4 新增標籤需求

| 標籤類別 | 標籤項目 | 用途 | 優先級 |
|----------|----------|------|--------|
| 情境 | 聚餐適合 | 聚餐篩選 | P0 |
| 情境 | 一個人也適合 | 獨食篩選 | P0 |
| 情境 | 飲控友善 | 飲控篩選 | P0 |
| 情境 | 適合工作 | 咖啡廳篩選 | P1 |
| 情境 | 約會適合 | 約會篩選 | P1 |
| 設施 | 有包廂 | 聚餐篩選 | P1 |
| 設施 | 有吧台 | 獨食篩選 | P1 |
| 設施 | 有插座 | 工作篩選 | P1 |
| 設施 | 有 Wi-Fi | 工作篩選 | P1 |

---

## 四、資料收集策略

### 4.1 收集範圍擴展

```
目前收集：
├─ 關鍵字：餐廳
└─ 範圍：台北市 12 區

需要擴展：
├─ 甜點店 ⭐ 新增
│  ├─ 關鍵字：甜點、蛋糕、冰品、甜點店
│  └─ Place Type：bakery, cafe
│
├─ 咖啡廳 ⭐ 新增
│  ├─ 關鍵字：咖啡、咖啡廳、咖啡店
│  └─ Place Type：cafe
│
└─ 健康餐 ⭐ 新增
   ├─ 關鍵字：健康餐、沙拉、健身餐、低卡
   └─ Place Type：restaurant, meal_takeaway
```

### 4.2 情境標籤提取邏輯

```python
# 評論關鍵字對應 (新增到 review_tag_extractor.py)

SCENARIO_TAG_KEYWORDS = {
    'group_friendly': {
        'positive': ['聚餐', '適合多人', '有包廂', '團體', '家族', '朋友聚會', '慶生'],
        'negative': ['不適合多人', '位子小', '太擠'],
        'display_name': '聚餐適合'
    },
    'solo_friendly': {
        'positive': ['一個人', '獨食', '吧台', '單人座', '一人用餐'],
        'negative': ['低消太高', '不適合一個人'],
        'display_name': '一個人也適合'
    },
    'diet_friendly': {
        'positive': ['健康', '低卡', '沙拉', '健身', '增肌', '減脂', '低GI', '無糖'],
        'negative': ['油膩', '重口味', '高熱量'],
        'display_name': '飲控友善'
    },
    'work_friendly': {
        'positive': ['辦公', '工作', '讀書', 'Wi-Fi', '插座', '不限時', '安靜'],
        'negative': ['太吵', '限時', '沒插座'],
        'display_name': '適合工作'
    },
    'date_friendly': {
        'positive': ['約會', '浪漫', '氣氛好', '情侶', '燭光', '私密'],
        'negative': ['太吵', '環境差'],
        'display_name': '約會適合'
    }
}
```

### 4.3 主分類判斷邏輯

```python
# 店家主分類判斷 (新增到 cuisine_classifier.py)

def classify_category(name: str, google_types: list, cuisine_type: str) -> str:
    """
    判斷店家主分類：餐廳/甜點/咖啡廳
    """
    # 甜點關鍵字
    dessert_keywords = ['甜點', '蛋糕', '冰', '甜品', '烘焙', '麵包', 'Dessert', 'Bakery']

    # 咖啡廳關鍵字
    cafe_keywords = ['咖啡', 'Coffee', 'Cafe', '茶館', '茶室']

    # 優先判斷店名
    for keyword in dessert_keywords:
        if keyword in name:
            return '甜點'

    for keyword in cafe_keywords:
        if keyword in name:
            return '咖啡廳'

    # 次要判斷 Google 類型
    if 'bakery' in google_types:
        return '甜點'

    if 'cafe' in google_types and 'restaurant' not in google_types:
        return '咖啡廳'

    # 預設為餐廳
    return '餐廳'
```

---

## 五、資料庫結構變更

### 5.1 restaurants 表新增欄位

```sql
-- 新增欄位
ALTER TABLE restaurants ADD COLUMN category TEXT DEFAULT '餐廳';
ALTER TABLE restaurants ADD COLUMN scenario_tags TEXT DEFAULT '[]';
ALTER TABLE restaurants ADD COLUMN has_wifi INTEGER;
ALTER TABLE restaurants ADD COLUMN has_power_outlet INTEGER;
ALTER TABLE restaurants ADD COLUMN seat_type TEXT DEFAULT '[]';
```

### 5.2 tags 表新增資料

```sql
-- 情境標籤
INSERT INTO tags (name, category, color, is_positive) VALUES
('聚餐適合', 'scenario', '#FF6B6B', 1),
('一個人也適合', 'scenario', '#4ECDC4', 1),
('飲控友善', 'scenario', '#45B7D1', 1),
('適合工作', 'scenario', '#96CEB4', 1),
('約會適合', 'scenario', '#DDA0DD', 1);

-- 設施標籤
INSERT INTO tags (name, category, color, is_positive) VALUES
('有包廂', 'facility', '#FFD93D', 1),
('有吧台', 'facility', '#6BCB77', 1),
('有插座', 'facility', '#4D96FF', 1),
('有 Wi-Fi', 'facility', '#FF6B6B', 1);
```

---

## 六、資料收集優先級

### Phase 1：MVP 核心 (P0) ✅ 已完成

```
目標：滿足正餐決策的三大情境

必須完成：
✅ 情境標籤系統實作
✅ 聚餐適合標籤提取
✅ 一個人也適合標籤提取
✅ 飲控友善標籤提取
✅ 現有餐廳資料重新處理（加上情境標籤）
```

### Phase 2：品類擴展 (P1) ✅ 已完成

```
目標：擴展甜點與咖啡廳

必須完成：
✅ 甜點店資料收集
✅ 咖啡廳資料收集
✅ 主分類欄位實作
✅ 適合工作標籤提取
✅ 設施標籤（Wi-Fi、插座）提取
✅ has_wifi 欄位實作
✅ has_power_outlet 欄位實作
✅ seat_type 欄位實作
```

### Phase 3：體驗優化 (P2) ✅ 已完成

```
目標：提升資料精細度

選擇性完成：
✅ 座位類型資訊 (seat_type 欄位)
✅ 約會適合標籤 (date_friendly)
✅ 平均用餐時間 (avg_visit_duration 提取邏輯已實作)
✅ 更多設施標籤 (戶外座位、投影設備、可訂位)
```

---

## 七、資料品質指標

### 必達標準

| 指標 | 目標 | 說明 |
|------|------|------|
| 情境標籤覆蓋率 | > 50% | 至少一半餐廳有情境標籤 |
| 主分類準確率 | > 90% | 餐廳/甜點/咖啡廳分類正確 |
| 標籤信心度 | > 0.5 | 只保留高信心度標籤 |

### 期望標準

| 指標 | 目標 | 說明 |
|------|------|------|
| 聚餐標籤數量 | > 500 家 | 有足夠的聚餐選項 |
| 獨食標籤數量 | > 500 家 | 有足夠的獨食選項 |
| 飲控標籤數量 | > 200 家 | 有足夠的健康選項 |
| 甜點店數量 | > 300 家 | 甜點品類豐富 |
| 咖啡廳數量 | > 300 家 | 咖啡廳品類豐富 |

---

## 八、實作路線圖

### Week 1-2：情境標籤系統 ✅ 已完成

```
✅ 修改 review_tag_extractor.py 加入情境標籤
✅ 修改 data_transformer.py 處理情境標籤
✅ 更新資料庫 schema
🔧 重新處理現有餐廳資料 (使用 integrate_data.py)
🔧 驗證標籤品質 (使用 analyze_data_quality.py)
```

### Week 3-4：品類擴展 ✅ 已完成

```
✅ 修改 data_collector.py 支援多關鍵字搜尋
✅ 收集甜點店資料
✅ 收集咖啡廳資料
✅ 修改 cuisine_classifier.py 加入主分類
🔧 整合新資料到資料庫 (使用 integrate_data.py)
```

### Week 5-6：品質優化 🔧 工具已就緒

```
🔧 分析標籤分布 (使用 analyze_data_quality.py)
🔧 調整關鍵字與門檻 (修改 review_tag_extractor.py)
⬜ 人工抽查驗證
⬜ 補充缺失資料
```

---

## 九、與服務設計的對應

| 服務設計需求 | 資料需求 | 實作方式 |
|--------------|----------|----------|
| 情境標籤篩選 | scenario_tags | 評論關鍵字分析 |
| 隨機推薦 | 完整餐廳資料 | 現有系統 |
| 收藏地圖 | latitude, longitude | 現有系統 |
| 飲控友善 | diet_friendly 標籤 | 評論關鍵字分析 |
| 聚餐適合 | group_friendly 標籤 | 評論關鍵字分析 |
| 一個人也適合 | solo_friendly 標籤 | 評論關鍵字分析 |
| 甜點探索 | category = '甜點' | 主分類系統 |
| 咖啡廳探索 | category = '咖啡廳' | 主分類系統 |

---

## 十、總結

### 核心資料需求

```
MVP 必備：
✅ 情境標籤（聚餐/獨食/飲控）
✅ 主分類（餐廳/甜點/咖啡廳）
✅ 完整的地理資訊

後續擴展：
✅ 設施標籤（Wi-Fi/插座/包廂）
✅ 工作友善標籤
✅ 約會適合標籤
✅ 平均用餐時間提取邏輯
```

### 關鍵成功因素

1. **情境標籤品質**：準確識別聚餐、獨食、飲控適合的餐廳
2. **品類覆蓋**：甜點和咖啡廳有足夠的資料量
3. **地理分布**：12 個行政區都有足夠的選項
4. **持續更新**：定期收集新餐廳、更新評論分析
