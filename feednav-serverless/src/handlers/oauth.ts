import { Hono, Context } from 'hono'
import { nanoid } from 'nanoid'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  getGoogleAuthUrl,
  exchangeDiscordCode,
  getDiscordUserInfo,
  getDiscordAuthUrl,
  getDiscordAvatarUrl,
  generateOAuthState,
  validateEmail
} from '../utils/oauth'
import { JWT_CONFIG } from '../constants'
import type { AppEnv, Env, OAuthUser, SocialAccount, User } from '../types'

const app = new Hono<AppEnv>()

// Google OAuth 初始化
app.get('/google', async (c) => {
  try {
    if (!c.env.GOOGLE_CLIENT_ID) {
      return c.json({ success: false, error: 'GOOGLE_NOT_CONFIGURED', message: 'Google OAuth 未配置' }, 500)
    }

    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/api/oauth/google/callback`
    const state = generateOAuthState()

    // 存儲 state 以防 CSRF
    await c.env.KV.put(`oauth_state:${state}`, JSON.stringify({
      provider: 'google',
      timestamp: Date.now()
    }), { expirationTtl: 600 })

    const authUrl = getGoogleAuthUrl(c.env.GOOGLE_CLIENT_ID, redirectUri, state)
    
    return c.redirect(authUrl)
  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    return c.json({ 
      success: false, 
      error: 'OAuth initiation failed',
      message: 'Google 認證初始化失敗'
    }, 500)
  }
})

// Google OAuth 回調
app.get('/google/callback', async (c) => {
  try {
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
      return redirectToFrontend(c, 'error', 'Google OAuth 未配置')
    }

    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')

    if (error) {
      console.warn('Google OAuth error:', error)
      return redirectToFrontend(c, 'error', `Google 認證失敗: ${error}`)
    }

    if (!code || !state) {
      return redirectToFrontend(c, 'error', '缺少必要的認證參數')
    }

    // 驗證 state
    const storedStateData = await c.env.KV.get(`oauth_state:${state}`)
    if (!storedStateData) {
      return redirectToFrontend(c, 'error', '認證狀態已過期或無效')
    }

    const stateData = JSON.parse(storedStateData)
    if (stateData.provider !== 'google') {
      return redirectToFrontend(c, 'error', '無效的認證提供者')
    }

    // 清理 state
    await c.env.KV.delete(`oauth_state:${state}`)

    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/api/oauth/google/callback`
    
    // 交換 access token
    const tokenResponse = await exchangeGoogleCode(
      code, 
      c.env.GOOGLE_CLIENT_ID, 
      c.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // 獲取用戶資訊
    const googleUser = await getGoogleUserInfo(tokenResponse.access_token)

    if (!validateEmail(googleUser.email)) {
      return redirectToFrontend(c, 'error', '無效的電子郵件地址')
    }

    // 處理用戶註冊/登入
    const authResult = await handleOAuthUser(c.env.DB, {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      provider: 'google',
      provider_id: googleUser.id
    })

    // 生成認證 tokens
    const tokens = await generateAuthTokens(c.env, authResult.user)

    return redirectToFrontend(c, 'success', null, {
      token: tokens.token,
      refresh: tokens.refreshToken,
      new: authResult.isNewUser.toString()
    })
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return redirectToFrontend(c, 'error', 'Google 認證過程中發生錯誤')
  }
})

// Discord OAuth 初始化
app.get('/discord', async (c) => {
  try {
    if (!c.env.DISCORD_CLIENT_ID) {
      return c.json({ success: false, error: 'DISCORD_NOT_CONFIGURED', message: 'Discord OAuth 未配置' }, 500)
    }

    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/api/oauth/discord/callback`
    const state = generateOAuthState()

    await c.env.KV.put(`oauth_state:${state}`, JSON.stringify({
      provider: 'discord',
      timestamp: Date.now()
    }), { expirationTtl: 600 })

    const authUrl = getDiscordAuthUrl(c.env.DISCORD_CLIENT_ID, redirectUri, state)
    
    return c.redirect(authUrl)
  } catch (error) {
    console.error('Discord OAuth initiation error:', error)
    return c.json({ 
      success: false, 
      error: 'OAuth initiation failed',
      message: 'Discord 認證初始化失敗'
    }, 500)
  }
})

// Discord OAuth 回調
app.get('/discord/callback', async (c) => {
  try {
    if (!c.env.DISCORD_CLIENT_ID || !c.env.DISCORD_CLIENT_SECRET) {
      return redirectToFrontend(c, 'error', 'Discord OAuth 未配置')
    }

    const code = c.req.query('code')
    const state = c.req.query('state')
    const error = c.req.query('error')

    if (error) {
      console.warn('Discord OAuth error:', error)
      return redirectToFrontend(c, 'error', `Discord 認證失敗: ${error}`)
    }

    if (!code || !state) {
      return redirectToFrontend(c, 'error', '缺少必要的認證參數')
    }

    // 驗證 state
    const storedStateData = await c.env.KV.get(`oauth_state:${state}`)
    if (!storedStateData) {
      return redirectToFrontend(c, 'error', '認證狀態已過期或無效')
    }

    const stateData = JSON.parse(storedStateData)
    if (stateData.provider !== 'discord') {
      return redirectToFrontend(c, 'error', '無效的認證提供者')
    }

    await c.env.KV.delete(`oauth_state:${state}`)

    const baseUrl = new URL(c.req.url).origin
    const redirectUri = `${baseUrl}/api/oauth/discord/callback`
    
    // 交換 access token
    const tokenResponse = await exchangeDiscordCode(
      code, 
      c.env.DISCORD_CLIENT_ID, 
      c.env.DISCORD_CLIENT_SECRET,
      redirectUri
    )

    // 獲取用戶資訊
    const discordUser = await getDiscordUserInfo(tokenResponse.access_token)

    if (!discordUser.email || !validateEmail(discordUser.email)) {
      return redirectToFrontend(c, 'error', '無法獲取有效的電子郵件地址，請確保您的 Discord 帳戶已驗證電子郵件')
    }

    // 處理用戶註冊/登入
    const authResult = await handleOAuthUser(c.env.DB, {
      id: discordUser.id,
      email: discordUser.email,
      name: discordUser.global_name || discordUser.username,
      avatar: getDiscordAvatarUrl(discordUser.id, discordUser.avatar),
      provider: 'discord',
      provider_id: discordUser.id
    })

    // 生成認證 tokens
    const tokens = await generateAuthTokens(c.env, authResult.user)

    return redirectToFrontend(c, 'success', null, {
      token: tokens.token,
      refresh: tokens.refreshToken,
      new: authResult.isNewUser.toString()
    })
  } catch (error) {
    console.error('Discord OAuth callback error:', error)
    return redirectToFrontend(c, 'error', 'Discord 認證過程中發生錯誤')
  }
})

// 獲取用戶的社交帳戶
app.get('/accounts', async (c) => {
  try {
    const userId = c.get('userId')
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized',
        message: '請先登入'
      }, 401)
    }
    
    const accounts = await c.env.DB.prepare(`
      SELECT provider, provider_name, provider_email, provider_avatar, created_at 
      FROM social_accounts 
      WHERE user_id = ?
      ORDER BY created_at ASC
    `).bind(userId).all()
    
    return c.json({
      success: true,
      data: { accounts: accounts.results }
    })
  } catch (error) {
    console.error('Get social accounts error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get social accounts',
      message: '獲取社交帳戶失敗'
    }, 500)
  }
})

// 解除社交帳戶關聯
app.delete('/accounts/:provider', async (c) => {
  try {
    const userId = c.get('userId')
    const provider = c.req.param('provider')
    
    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized',
        message: '請先登入'
      }, 401)
    }

    if (!['google', 'discord'].includes(provider)) {
      return c.json({
        success: false,
        error: 'Invalid provider',
        message: '無效的提供者'
      }, 400)
    }
    
    // 檢查是否為最後一個認證方式
    const accountCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM social_accounts WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>()
    
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first<{ password_hash: string }>()
    
    const hasPassword = user?.password_hash && user.password_hash.trim() !== ''
    
    if (accountCount!.count <= 1 && !hasPassword) {
      return c.json({
        success: false,
        error: 'Cannot remove last auth method',
        message: '無法移除最後一個認證方式，請先設置密碼或綁定其他帳戶'
      }, 400)
    }
    
    const result = await c.env.DB.prepare(
      'DELETE FROM social_accounts WHERE user_id = ? AND provider = ?'
    ).bind(userId, provider).run()

    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        error: 'Account not found',
        message: '找不到要移除的帳戶'
      }, 404)
    }
    
    return c.json({
      success: true,
      message: `${provider} 帳戶關聯已移除`
    })
  } catch (error) {
    console.error('Remove social account error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to remove social account',
      message: '移除社交帳戶失敗'
    }, 500)
  }
})

// 輔助函數

// 處理 OAuth 用戶的通用函數
async function handleOAuthUser(db: D1Database, oauthUser: OAuthUser) {
  // 檢查是否已存在的社交帳戶
  const existingSocial = await db.prepare(
    'SELECT * FROM social_accounts WHERE provider = ? AND provider_id = ?'
  ).bind(oauthUser.provider, oauthUser.provider_id).first<SocialAccount>()

  if (existingSocial) {
    // 更新社交帳戶資訊
    await db.prepare(`
      UPDATE social_accounts 
      SET provider_email = ?, provider_name = ?, provider_avatar = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      oauthUser.email, 
      oauthUser.name, 
      oauthUser.avatar || null, 
      existingSocial.id
    ).run()

    // 獲取關聯的用戶
    const user = await db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(existingSocial.user_id).first<User>()

    if (!user) {
      throw new Error('Associated user not found')
    }

    return { user, isNewUser: false }
  }

  // 檢查是否已存在相同 email 的用戶
  let user = await db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(oauthUser.email).first<User>()

  let isNewUser = false

  if (!user) {
    // 創建新用戶
    const userId = nanoid()
    
    await db.prepare(`
      INSERT INTO users (id, email, name, avatar, is_email_verified, password_hash) 
      VALUES (?, ?, ?, ?, 1, '')
    `).bind(
      userId, 
      oauthUser.email, 
      oauthUser.name, 
      oauthUser.avatar || null
    ).run()

    user = await db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first<User>()

    if (!user) {
      throw new Error('Failed to create user')
    }

    isNewUser = true
  } else {
    // 更新現有用戶資訊（如果尚未設置）
    await db.prepare(`
      UPDATE users 
      SET name = CASE WHEN name IS NULL OR name = '' THEN ? ELSE name END,
          avatar = CASE WHEN avatar IS NULL OR avatar = '' THEN ? ELSE avatar END,
          is_email_verified = 1, 
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(oauthUser.name, oauthUser.avatar || null, user.id).run()
  }

  // 創建社交帳戶關聯
  await db.prepare(`
    INSERT OR REPLACE INTO social_accounts 
    (user_id, provider, provider_id, provider_email, provider_name, provider_avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    oauthUser.provider,
    oauthUser.provider_id,
    oauthUser.email,
    oauthUser.name,
    oauthUser.avatar || null
  ).run()

  return { user, isNewUser }
}

// 生成認證 tokens
async function generateAuthTokens(env: Env, user: User) {
  const token = await generateToken(
    { sub: user.id, email: user.email },
    env.JWT_SECRET,
    env.JWT_ISSUER
  )
  const refreshToken = generateRefreshToken()

  // 存儲 refresh token
  await env.KV.put(
    `refresh_token:${refreshToken}`,
    JSON.stringify({ userId: user.id, email: user.email }),
    { expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
  )

  return { token, refreshToken }
}

// 重定向到前端的輔助函數
function redirectToFrontend(
  c: Context<AppEnv>,
  type: 'success' | 'error',
  message?: string | null,
  params?: Record<string, string>
) {
  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173'
  let url = `${frontendUrl}/auth/${type}`
  
  const searchParams = new URLSearchParams()
  
  if (message) {
    searchParams.append('message', message)
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value)
    })
  }
  
  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`
  }
  
  return c.redirect(url)
}

export default app