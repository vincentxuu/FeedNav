# React Native App 技術規劃

> 狀態：規劃中

## 概覽

本文件規劃 FeedNav 的 React Native 行動應用開發策略，目標是最大化與現有 Web 專案的程式碼共用，並提供原生地圖體驗。

---

## 技術選型

### 核心框架

| 技術 | 版本建議 | 用途 |
|------|----------|------|
| **React Native** | 0.76+ | 跨平台行動應用框架 |
| **Expo** | SDK 52+ | 開發工具鏈與託管服務 |
| **TypeScript** | 5.x | 型別安全（與 Web 共用） |

### 路由導航

| 技術 | 說明 |
|------|------|
| **Expo Router** | 基於檔案的路由，類似 Next.js App Router |

### UI 元件庫

| 選項 | 優點 | 缺點 |
|------|------|------|
| **Tamagui** | 高效能，支援 Web + Native，完整設計系統 | 學習曲線較陡 |
| **NativeWind** | TailwindCSS 語法，與 Web 一致 | 部分功能受限 |
| **React Native Paper** | Material Design，完善的主題系統 | 風格偏 Material |

**建議**：使用 **Tamagui**，優點如下：
- **跨平台共用**：同一套元件可編譯至 Web 與 Native
- **高效能**：編譯時優化，產生原生樣式
- **完整設計系統**：內建主題、動畫、響應式設計
- **TypeScript 原生支援**：型別安全的樣式 API

### 地圖功能

| 技術 | 說明 |
|------|------|
| **react-native-maps** | 原生地圖元件 (Google Maps / Apple Maps) |
| **react-native-map-clustering** | 地圖標記群集 |

### 狀態管理

| 技術 | 說明 |
|------|------|
| **TanStack Query** | 與 Web 共用相同的 API 快取邏輯 |
| **Zustand** | 客戶端狀態管理（可選） |

### 表單與驗證

| 技術 | 說明 |
|------|------|
| **React Hook Form** | 與 Web 共用 |
| **Zod** | 與 Web 共用 Schema |

---

## 程式碼共用策略

### Monorepo 結構

```
FeedNav/
├── apps/
│   ├── web/                    # Next.js 應用（feednav-fe）
│   └── mobile/                 # React Native 應用（新增）
├── packages/
│   ├── shared/                 # 共用邏輯
│   │   ├── api/                # API 客戶端
│   │   ├── hooks/              # 共用 hooks
│   │   ├── types/              # TypeScript 型別
│   │   ├── utils/              # 工具函式
│   │   └── validation/         # Zod schemas
│   ├── ui/                     # Tamagui 共用 UI 元件
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── RestaurantCard.tsx
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                 # Tamagui 主題配置
│       ├── src/
│       │   ├── tamagui.config.ts
│       │   ├── tokens.ts       # 色彩、間距、字型
│       │   └── themes.ts       # 明暗主題
│       └── package.json
├── feednav-serverless/         # API (維持現狀)
├── feednav-data-fetcher/       # 資料爬取 (維持現狀)
└── package.json                # Workspace 配置
```

### 可共用模組

| 模組 | 共用程度 | 說明 |
|------|----------|------|
| **Tamagui UI Components** | 95% | Button, Card, Input 等基礎元件 |
| **Tamagui Theme/Tokens** | 100% | 色彩、間距、字型統一配置 |
| **API Client** | 100% | fetch 設定、endpoints、interceptors |
| **TanStack Query Hooks** | 90% | useRestaurants, useFavorites 等 |
| **Zod Schemas** | 100% | 表單驗證 schemas |
| **TypeScript Types** | 100% | Restaurant, User 等型別定義 |
| **Utility Functions** | 90% | date-fns 封裝、格式化函式 |
| **Constants** | 100% | API URLs、配置常數 |

### 平台特定模組

| 模組 | 說明 |
|------|------|
| **Navigation** | Web 用 Next.js Router，Mobile 用 Expo Router |
| **Storage** | Web 用 Cookie，Mobile 用 SecureStore |
| **Maps** | Web 用 Leaflet，Mobile 用 react-native-maps |
| **Platform-specific UI** | BottomSheet (Mobile only)、Modal 實作差異 |

---

## 架構設計

### API Layer 共用

```typescript
// packages/shared/api/client.ts
export const createApiClient = (config: {
  baseURL: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => void;
}) => {
  const request = async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    const token = await config.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${config.baseURL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });

    if (response.status === 401) {
      config.onUnauthorized();
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  return { request };
};
```

```typescript
// apps/web/lib/api.ts
import { createApiClient } from '@feednav/shared/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  getToken: async () => Cookies.get('token') || null,
  onUnauthorized: () => window.location.href = '/auth/login',
});
```

```typescript
// apps/mobile/lib/api.ts
import { createApiClient } from '@feednav/shared/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const api = createApiClient({
  baseURL: 'https://api.feednav.cc/api/v1',
  getToken: async () => SecureStore.getItemAsync('token'),
  onUnauthorized: () => router.replace('/auth/login'),
});
```

### 共用 Query Hooks

```typescript
// packages/shared/hooks/useRestaurants.ts
import { useQuery } from '@tanstack/react-query';
import type { ApiClient, Restaurant, RestaurantFilters } from '../types';

export const createRestaurantHooks = (api: ApiClient) => {
  const useRestaurants = (filters?: RestaurantFilters) => {
    return useQuery({
      queryKey: ['restaurants', filters],
      queryFn: () => api.request<Restaurant[]>('/restaurants', {
        method: 'GET',
      }),
    });
  };

  const useRestaurant = (id: number) => {
    return useQuery({
      queryKey: ['restaurant', id],
      queryFn: () => api.request<Restaurant>(`/restaurants/${id}`),
      enabled: !!id,
    });
  };

  const useNearbyRestaurants = (lat: number, lng: number, radius?: number) => {
    return useQuery({
      queryKey: ['restaurants', 'nearby', lat, lng, radius],
      queryFn: () => api.request<Restaurant[]>(
        `/restaurants/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5}`
      ),
      enabled: !!lat && !!lng,
    });
  };

  return { useRestaurants, useRestaurant, useNearbyRestaurants };
};
```

### Tamagui 主題配置

```typescript
// packages/config/src/tokens.ts
import { createTokens } from '@tamagui/core';

export const tokens = createTokens({
  color: {
    // 品牌色彩 (與 TailwindCSS 對應)
    primary: '#f97316',        // orange-500 (美食主題)
    primaryDark: '#ea580c',    // orange-600
    secondary: '#10b981',      // emerald-500
    background: '#ffffff',
    backgroundDark: '#1f2937', // gray-800
    text: '#111827',           // gray-900
    textMuted: '#6b7280',      // gray-500
    warning: '#f59e0b',        // amber-500
    success: '#22c55e',        // green-500
    error: '#ef4444',          // red-500
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  size: {
    sm: 32,
    md: 44,
    lg: 56,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
});
```

### 共用 UI 元件

```tsx
// packages/ui/src/RestaurantCard.tsx
import { styled, Card, XStack, YStack, Text, Image } from 'tamagui';
import { Star, MapPin } from '@tamagui/lucide-icons';
import type { Restaurant } from '@feednav/shared/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
}

export const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {
  return (
    <Card
      elevate
      bordered
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      padding="$md"
      borderRadius="$lg"
    >
      <XStack space="$md">
        <Image
          source={{ uri: restaurant.photos?.[0] }}
          width={80}
          height={80}
          borderRadius="$md"
        />
        <YStack flex={1} space="$xs">
          <Text fontSize={16} fontWeight="600">
            {restaurant.name}
          </Text>
          <XStack alignItems="center" space="$xs">
            <Star size={14} color="$warning" fill="$warning" />
            <Text fontSize={14} color="$textMuted">
              {restaurant.rating?.toFixed(1) || 'N/A'}
            </Text>
            <Text fontSize={14} color="$textMuted">
              · {restaurant.cuisine_type}
            </Text>
          </XStack>
          <XStack alignItems="center" space="$xs">
            <MapPin size={14} color="$textMuted" />
            <Text fontSize={12} color="$textMuted" numberOfLines={1}>
              {restaurant.address}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
};
```

---

## 建議的依賴套件

### Core

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "@tamagui/core": "^1.120.0",
    "@tamagui/config": "^1.120.0",
    "tamagui": "^1.120.0"
  }
}
```

### State & Data

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.81.0",
    "zod": "^3.25.0",
    "react-hook-form": "^7.58.0",
    "@hookform/resolvers": "^5.1.0"
  }
}
```

### Maps

```json
{
  "dependencies": {
    "react-native-maps": "^1.14.0",
    "react-native-map-clustering": "^3.4.0",
    "expo-location": "~18.0.0"
  }
}
```

### Auth & Storage

```json
{
  "dependencies": {
    "expo-secure-store": "~14.0.0",
    "expo-auth-session": "~6.0.0",
    "@react-native-google-signin/google-signin": "^13.0.0"
  }
}
```

### UI Enhancement

```json
{
  "dependencies": {
    "@tamagui/animations-react-native": "^1.120.0",
    "@tamagui/font-inter": "^1.120.0",
    "@tamagui/lucide-icons": "^1.120.0",
    "@tamagui/sheet": "^1.120.0",
    "expo-image": "~2.0.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "@gorhom/bottom-sheet": "^5.0.0"
  }
}
```

---

## App 部署架構

### 部署流程總覽

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        App 部署流程                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  開發者  │───▶│  GitHub  │───▶│ EAS Build│───▶│  App Store /     │  │
│  │  Push    │    │  Actions │    │  Cloud   │    │  Google Play     │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    EAS Update (OTA 更新)                          │  │
│  │  JS Bundle 更新無需重新提交 App Store，用戶自動收到更新           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 兩種更新方式

| 更新類型 | 適用情況 | 審核時間 | 工具 |
|----------|----------|----------|------|
| **Full Build** | 原生程式碼變更、SDK 升級 | iOS 1-3 天, Android 數小時 | EAS Build + Submit |
| **OTA Update** | JS/TS 程式碼、樣式、資源 | 即時生效 | EAS Update |

### 部署環境

| 環境 | 用途 | 分發方式 |
|------|------|----------|
| **Development** | 開發測試 | Expo Go / Dev Client |
| **Preview** | 內部測試 (QA) | Internal Distribution / TestFlight |
| **Production** | 正式上架 | App Store / Google Play |

---

## 前置準備

### 1. Apple Developer 帳號

| 項目 | 說明 |
|------|------|
| **費用** | $99 USD / 年 |
| **申請** | https://developer.apple.com/programs/enroll/ |

### 2. Google Play Console 帳號

| 項目 | 說明 |
|------|------|
| **費用** | $25 USD (一次性) |
| **申請** | https://play.google.com/console/signup |

### 3. Expo 帳號

```bash
# 安裝 EAS CLI
npm install -g eas-cli

# 登入 Expo
eas login

# 連結專案
cd apps/mobile
eas init
```

---

## 本地部署指令

### 開發建置

```bash
# iOS 模擬器
eas build --profile development --platform ios

# Android 模擬器
eas build --profile development --platform android
```

### Preview 建置 (內部測試)

```bash
eas build --profile preview --platform all
```

### Production 建置與提交

```bash
# 建置 + 提交
eas build --profile production --platform all --auto-submit
```

### OTA 更新

```bash
# 發布更新到 Preview 頻道
eas update --branch preview --message "修復 bug"

# 發布更新到 Production 頻道
eas update --branch production --message "v1.0.1 修復登入問題"
```

---

## 開發階段規劃

### Phase 1: 基礎建設

- [ ] 設定 Monorepo (Turborepo)
- [ ] 抽取共用模組到 `packages/shared`
- [ ] 建立 Expo 專案
- [ ] 整合 Tamagui 設計系統
- [ ] 建立共用主題配置

### Phase 2: 核心功能

- [ ] 認證流程 (Email + Google OAuth)
- [ ] 首頁瀏覽 (餐廳列表)
- [ ] 餐廳詳情頁面
- [ ] 地圖視圖 (react-native-maps)

### Phase 3: 使用者功能

- [ ] 收藏餐廳
- [ ] 造訪記錄
- [ ] 使用者個人檔案
- [ ] 搜尋與篩選

### Phase 4: 進階功能

- [ ] 附近餐廳搜尋 (GPS)
- [ ] 推播通知 (Expo Push)
- [ ] 離線支援
- [ ] 深層連結 (Deep Linking)

---

## App 功能規格

### 首頁
- 餐廳列表（卡片式）
- 篩選按鈕（地區、料理、價位）
- 搜尋按鈕
- 切換地圖視圖

### 地圖頁面
- 全螢幕地圖
- 餐廳標記群集
- 點擊標記顯示餐廳卡片
- 定位到目前位置

### 餐廳詳情
- 照片輪播
- 基本資訊（評分、價位、料理類型）
- 地址與路線規劃
- 營業時間
- 標籤顯示
- 收藏/造訪按鈕

### 個人頁面
- 登入/註冊
- 我的收藏
- 造訪記錄
- 帳號設定

---

## 注意事項

1. **React 版本相容性**：React Native 0.76 使用 React 18.3，而 Web 使用 React 19，需注意相容性
2. **Tamagui 學習曲線**：Tamagui 有獨特的樣式 API，需要時間熟悉
3. **地圖差異**：Web 用 Leaflet (開源免費)，Mobile 用 react-native-maps (需 Google Maps API Key)
4. **測試策略**：共用模組可使用 Jest 測試，UI 需分別測試
5. **效能監控**：建議整合 Sentry for React Native
