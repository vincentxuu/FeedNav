# OAuth 設置指南

本指南將協助您在 FeedNav Serverless API 中設置 Google 和 Discord OAuth 登入功能。

## 🚀 快速設置步驟

### 1. 外部服務配置

#### Google Cloud Console 設置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 **Google+ API**
4. 前往「API 和服務」→「憑證」
5. 點擊「創建憑證」→「OAuth 2.0 客戶端 ID」
6. 選擇「Web 應用程式」
7. 設置授權重定向 URI：
   ```
   # 本地開發
   http://localhost:8787/api/oauth/google/callback
   
   # 生產環境 (替換為您的實際域名)
   https://your-worker.your-subdomain.workers.dev/api/oauth/google/callback
   ```
8. 記錄 **Client ID** 和 **Client Secret**

#### Discord Developer Portal 設置

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 點擊「New Application」
3. 輸入應用程式名稱
4. 前往左側「OAuth2」選單
5. 添加重定向 URL：
   ```
   # 本地開發
   http://localhost:8787/api/oauth/discord/callback
   
   # 生產環境 (替換為您的實際域名)
   https://your-worker.your-subdomain.workers.dev/api/oauth/discord/callback
   ```
6. 設置 Scopes: 選擇 `identify` 和 `email`
7. 記錄 **Client ID** 和 **Client Secret**

### 2. 環境變數設置

```bash
# Google OAuth 憑證
wrangler secret put GOOGLE_CLIENT_ID
# 輸入您的 Google Client ID

wrangler secret put GOOGLE_CLIENT_SECRET
# 輸入您的 Google Client Secret

# Discord OAuth 憑證
wrangler secret put DISCORD_CLIENT_ID
# 輸入您的 Discord Client ID

wrangler secret put DISCORD_CLIENT_SECRET
# 輸入您的 Discord Client Secret

# 前端 URL (可選，用於 OAuth 回調重定向)
wrangler secret put FRONTEND_URL
# 例如: https://your-frontend-domain.com
```

### 3. 數據庫更新

```bash
# 更新本地數據庫 schema
wrangler d1 execute feednav-db --local --file=schema.sql

# 更新生產數據庫 schema
wrangler d1 execute feednav-db --file=schema.sql
```

### 4. 部署

```bash
npm run deploy:production
```

## 🧪 測試 OAuth 功能

### 本地測試

1. 啟動本地開發服務器：
   ```bash
   npm run dev
   ```

2. 測試 OAuth 端點：
   - Google: `http://localhost:8787/api/oauth/google`
   - Discord: `http://localhost:8787/api/oauth/discord`

### 生產環境測試

- Google: `https://your-worker.workers.dev/api/oauth/google`
- Discord: `https://your-worker.workers.dev/api/oauth/discord`

## 📱 前端整合範例

### HTML 按鈕

```html
<button onclick="window.location.href='/api/oauth/google'">
  使用 Google 登入
</button>

<button onclick="window.location.href='/api/oauth/discord'">
  使用 Discord 登入
</button>
```

### React 組件

```jsx
const LoginButtons = () => {
  const handleGoogleLogin = () => {
    window.location.href = '/api/oauth/google'
  }

  const handleDiscordLogin = () => {
    window.location.href = '/api/oauth/discord'
  }

  return (
    <div>
      <button onClick={handleGoogleLogin}>
        使用 Google 登入
      </button>
      <button onClick={handleDiscordLogin}>
        使用 Discord 登入
      </button>
    </div>
  )
}
```

### 處理認證回調

OAuth 認證成功後，用戶會被重定向到前端，URL 包含認證信息：

```
https://your-frontend.com/auth/success?token=JWT_TOKEN&refresh=REFRESH_TOKEN&new=true
```

創建處理回調的頁面：

```jsx
// AuthCallback.jsx
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refresh')
    const isNewUser = searchParams.get('new') === 'true'

    if (token && refreshToken) {
      // 存儲認證 tokens
      localStorage.setItem('authToken', token)
      localStorage.setItem('refreshToken', refreshToken)

      // 重定向到適當頁面
      if (isNewUser) {
        navigate('/welcome') // 新用戶歡迎頁
      } else {
        navigate('/dashboard') // 現有用戶儀表板
      }
    } else {
      navigate('/auth/error')
    }
  }, [])

  return <div>正在處理登入...</div>
}
```

## 🔧 API 使用範例

### 獲取用戶社交帳戶

```javascript
const getSocialAccounts = async () => {
  const token = localStorage.getItem('authToken')
  
  const response = await fetch('/api/oauth/accounts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  const data = await response.json()
  console.log('社交帳戶:', data.data.accounts)
}
```

### 移除社交帳戶關聯

```javascript
const removeSocialAccount = async (provider) => {
  const token = localStorage.getItem('authToken')
  
  const response = await fetch(`/api/oauth/accounts/${provider}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (response.ok) {
    console.log(`${provider} 帳戶已移除`)
  }
}

// 使用範例
removeSocialAccount('google')  // 移除 Google 帳戶
removeSocialAccount('discord') // 移除 Discord 帳戶
```

## 🔍 故障排除

### 常見問題

1. **重定向 URI 不匹配**
   ```
   錯誤: redirect_uri_mismatch
   ```
   **解決方案**: 確保 OAuth 提供者設置中的重定向 URI 與實際使用的完全匹配（包括協議、域名、端口和路徑）

2. **無法獲取用戶 email**
   ```
   錯誤: Discord 用戶沒有 email
   ```
   **解決方案**: 
   - 確保用戶的 Discord 帳戶已驗證 email
   - 確認應用程式請求了 `email` 權限

3. **認證狀態驗證失敗**
   ```
   錯誤: Invalid state
   ```
   **解決方案**: 
   - 檢查 KV 存儲是否正常工作
   - 確認系統時間同步正確
   - 檢查是否有多個瀏覽器標籤頁同時進行認證

4. **Token 交換失敗**
   ```
   錯誤: Token exchange failed
   ```
   **解決方案**:
   - 驗證 Client ID 和 Client Secret 是否正確
   - 檢查網路連接和 API 端點可用性
   - 確認 OAuth 應用程式狀態為「已發布」

### 除錯技巧

1. **查看 Workers 日誌**:
   ```bash
   wrangler tail --env production
   ```

2. **檢查環境變數**:
   ```bash
   wrangler secret list
   ```

3. **測試 OAuth URL**:
   在瀏覽器中直接訪問 OAuth 啟動 URL，檢查重定向是否正常

4. **檢查數據庫 schema**:
   ```bash
   wrangler d1 execute feednav-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

## ✅ 部署檢查清單

- [ ] Google Cloud Console OAuth 應用程式已配置
- [ ] Discord Developer Portal OAuth 應用程式已配置
- [ ] 重定向 URI 設置正確（本地和生產環境）
- [ ] 所有環境變數已設置（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET）
- [ ] 數據庫 schema 已更新
- [ ] 前端路由包含認證回調處理
- [ ] OAuth 按鈕已添加到登入頁面
- [ ] 本地測試通過
- [ ] 生產環境部署成功

## 🔗 相關連結

- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth 2.0 文檔](https://discord.com/developers/docs/topics/oauth2)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Hono.js 文檔](https://hono.dev/)

完成這些步驟後，您的 FeedNav 應用程式就支援 Google 和 Discord OAuth 登入了！