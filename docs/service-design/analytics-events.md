# Analytics 事件定義

> 本文件定義 FeedNav 所有追蹤事件的名稱、參數、觸發時機，確保數據追蹤的一致性。

---

## 一、事件命名規範

### 命名格式

```
{category}_{action}_{target}

範例：
- restaurant_view_detail
- favorite_add_restaurant
- random_click_button
```

### 命名原則

| 原則 | 說明 | 範例 |
|------|------|------|
| 使用小寫 | 全部小寫，底線分隔 | `page_view` |
| 動詞在前 | action 使用動詞 | `view`, `click`, `add`, `remove` |
| 具體明確 | 避免模糊的名稱 | `favorite_add` 而非 `action` |

---

## 二、頁面瀏覽事件

### page_view

每次頁面載入時觸發。

| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `page_name` | string | 頁面名稱 | `home`, `restaurant_detail`, `favorites` |
| `page_path` | string | 頁面路徑 | `/`, `/restaurant/123`, `/favorites` |
| `referrer` | string | 來源頁面 | `https://google.com` |

**頁面名稱對照表**：

| page_name | 頁面 |
|-----------|------|
| `home` | 首頁 |
| `explore` | 探索頁（地圖） |
| `restaurant_list` | 餐廳列表 |
| `restaurant_detail` | 餐廳詳情 |
| `favorites` | 口袋名單 |
| `visited` | 美食足跡 |
| `profile` | 個人頁面 |
| `login` | 登入頁 |
| `register` | 註冊頁 |

---

## 三、用戶行為事件

### 3.1 認證相關

#### auth_register_start
用戶開始註冊流程。

| 參數 | 類型 | 說明 |
|------|------|------|
| `method` | string | 註冊方式：`email`, `google`, `discord` |

#### auth_register_complete
用戶完成註冊。

| 參數 | 類型 | 說明 |
|------|------|------|
| `method` | string | 註冊方式 |
| `time_to_complete` | number | 從開始到完成的秒數 |

#### auth_login
用戶登入。

| 參數 | 類型 | 說明 |
|------|------|------|
| `method` | string | 登入方式 |
| `is_returning` | boolean | 是否為回訪用戶 |

#### auth_logout
用戶登出。

---

### 3.2 餐廳探索

#### restaurant_view_detail
查看餐廳詳情。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |
| `restaurant_name` | string | 餐廳名稱 |
| `cuisine_type` | string | 料理類型 |
| `district` | string | 行政區 |
| `source` | string | 來源：`list`, `map`, `search`, `random`, `favorite` |

#### restaurant_search
使用搜尋功能。

| 參數 | 類型 | 說明 |
|------|------|------|
| `query` | string | 搜尋關鍵字 |
| `results_count` | number | 結果數量 |

#### restaurant_filter
使用篩選功能。

| 參數 | 類型 | 說明 |
|------|------|------|
| `filter_type` | string | 篩選類型：`district`, `cuisine`, `rating`, `tag` |
| `filter_value` | string | 篩選值 |
| `results_count` | number | 結果數量 |

#### map_view
查看地圖。

| 參數 | 類型 | 說明 |
|------|------|------|
| `center_lat` | number | 地圖中心緯度 |
| `center_lng` | number | 地圖中心經度 |
| `zoom_level` | number | 縮放等級 |

---

### 3.3 收藏功能

#### favorite_add
收藏餐廳。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |
| `restaurant_name` | string | 餐廳名稱 |
| `source` | string | 觸發來源：`detail_page`, `list_card`, `map_popup` |
| `total_favorites` | number | 用戶收藏總數（加入後） |
| `is_first_favorite` | boolean | 是否為首次收藏 |

#### favorite_remove
取消收藏。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |
| `source` | string | 觸發來源 |
| `total_favorites` | number | 用戶收藏總數（移除後） |

#### favorite_view_list
查看口袋名單頁面。

| 參數 | 類型 | 說明 |
|------|------|------|
| `total_favorites` | number | 收藏總數 |
| `view_mode` | string | 檢視模式：`list`, `map` |

---

### 3.4 去過功能

#### visited_add
標記去過。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |
| `restaurant_name` | string | 餐廳名稱 |
| `was_favorited` | boolean | 是否曾收藏過 |
| `total_visited` | number | 用戶去過總數 |

#### visited_remove
取消去過標記。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |

---

### 3.5 隨機推薦

#### random_click
點擊隨機推薦按鈕。

| 參數 | 類型 | 說明 |
|------|------|------|
| `has_filters` | boolean | 是否有篩選條件 |
| `filters` | object | 篩選條件（如有） |

#### random_result_view
查看隨機推薦結果。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 推薦的餐廳 ID |
| `restaurant_name` | string | 餐廳名稱 |

#### random_result_action
對隨機結果採取行動。

| 參數 | 類型 | 說明 |
|------|------|------|
| `restaurant_id` | string | 餐廳 ID |
| `action` | string | 行動：`favorite`, `detail`, `refresh`, `dismiss` |

---

### 3.6 分享功能

#### share_click
點擊分享按鈕。

| 參數 | 類型 | 說明 |
|------|------|------|
| `content_type` | string | 分享內容：`restaurant`, `favorite_list` |
| `content_id` | string | 內容 ID |

#### share_complete
完成分享。

| 參數 | 類型 | 說明 |
|------|------|------|
| `content_type` | string | 分享內容 |
| `share_method` | string | 分享方式：`copy_link`, `line`, `facebook` |

---

## 四、里程碑事件

### milestone_reached
達成里程碑。

| 參數 | 類型 | 說明 |
|------|------|------|
| `milestone_type` | string | 類型：`favorite`, `visited`, `district` |
| `milestone_value` | number | 數值：5, 10, 20, 50, 100 |
| `milestone_name` | string | 里程碑名稱（顯示用） |

**里程碑定義**：

| 類型 | 數值 | 名稱 |
|------|------|------|
| favorite | 5 | 美食新手 |
| favorite | 10 | 口袋名單達人 |
| favorite | 20 | 美食探險家 |
| favorite | 50 | 台北美食通 |
| visited | 5 | 開始探索 |
| visited | 10 | 美食足跡累積中 |
| visited | 20 | 吃遍台北進行中 |

---

## 五、錯誤追蹤

### error_occurred
發生錯誤。

| 參數 | 類型 | 說明 |
|------|------|------|
| `error_type` | string | 錯誤類型：`api`, `auth`, `network`, `ui` |
| `error_code` | string | 錯誤代碼 |
| `error_message` | string | 錯誤訊息 |
| `page_name` | string | 發生頁面 |

---

## 六、實作指南

### 前端實作位置

```
apps/web/src/
├── lib/
│   └── analytics.ts      # Analytics 工具函數
├── hooks/
│   └── useAnalytics.ts   # React Hook
└── components/
    └── AnalyticsProvider.tsx  # Context Provider
```

### 範例程式碼

```typescript
// lib/analytics.ts
export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
) => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params);
  }

  // 自建 Analytics（可選）
  // sendToAnalyticsAPI(eventName, params);
};

// 使用範例
trackEvent('favorite_add', {
  restaurant_id: '123',
  restaurant_name: '麵屋一燈',
  source: 'detail_page',
  total_favorites: 15,
  is_first_favorite: false,
});
```

### 驗證 Checklist

- [ ] 事件名稱符合命名規範
- [ ] 必要參數都有傳送
- [ ] 參數值類型正確
- [ ] 在 GA4 Debug View 可以看到事件
- [ ] 資料有正確記錄到報表

---

## 七、Dashboard 建議

### 核心指標 Dashboard

| 指標 | 計算方式 | 目標 |
|------|---------|------|
| 日活躍用戶 (DAU) | unique users with any event | 追蹤趨勢 |
| 新註冊數 | count(auth_register_complete) | > 5/天 |
| 收藏轉換率 | users with favorite_add / total users | > 20% |
| 首次收藏率 | users with is_first_favorite / new users | > 40% |
| 隨機功能使用率 | users with random_click / total users | > 15% |

### 漏斗分析

```
訪問首頁
    ↓ (轉換率 A)
瀏覽餐廳詳情
    ↓ (轉換率 B)
收藏餐廳
    ↓ (轉換率 C)
回訪
```

---

## 更新記錄

| 日期 | 更新內容 |
|------|----------|
| 2025-01-31 | 初版建立 |
