import { Hono, Context } from 'hono'
import { createOAuthService, OAuthError } from '../services'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/google', async (c) => {
  try {
    const baseUrl = new URL(c.req.url).origin
    const oauthService = createOAuthService(c.env)

    const result = await oauthService.initGoogle(baseUrl)

    return c.redirect(result.authUrl)
  } catch (error) {
    if (error instanceof OAuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 500
      )
    }
    console.error('Google OAuth initiation error:', error)
    return c.json(
      {
        success: false,
        error: 'OAuth initiation failed',
        message: 'Google 認證初始化失敗',
      },
      500
    )
  }
})

app.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const errorParam = c.req.query('error')

    if (errorParam) {
      console.warn('Google OAuth error:', errorParam)
      return redirectToFrontend(c, 'error', `Google 認證失敗: ${errorParam}`)
    }

    if (!code || !state) {
      return redirectToFrontend(c, 'error', '缺少必要的認證參數')
    }

    const baseUrl = new URL(c.req.url).origin
    const oauthService = createOAuthService(c.env)

    const result = await oauthService.handleGoogleCallback(code, state, baseUrl)

    return redirectToFrontend(c, 'success', null, {
      token: result.token,
      refresh: result.refreshToken,
      new: result.isNewUser.toString(),
    })
  } catch (error) {
    if (error instanceof OAuthError) {
      return redirectToFrontend(c, 'error', error.message)
    }
    console.error('Google OAuth callback error:', error)
    return redirectToFrontend(c, 'error', 'Google 認證過程中發生錯誤')
  }
})

app.get('/discord', async (c) => {
  try {
    const baseUrl = new URL(c.req.url).origin
    const oauthService = createOAuthService(c.env)

    const result = await oauthService.initDiscord(baseUrl)

    return c.redirect(result.authUrl)
  } catch (error) {
    if (error instanceof OAuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 500
      )
    }
    console.error('Discord OAuth initiation error:', error)
    return c.json(
      {
        success: false,
        error: 'OAuth initiation failed',
        message: 'Discord 認證初始化失敗',
      },
      500
    )
  }
})

app.get('/discord/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    const errorParam = c.req.query('error')

    if (errorParam) {
      console.warn('Discord OAuth error:', errorParam)
      return redirectToFrontend(c, 'error', `Discord 認證失敗: ${errorParam}`)
    }

    if (!code || !state) {
      return redirectToFrontend(c, 'error', '缺少必要的認證參數')
    }

    const baseUrl = new URL(c.req.url).origin
    const oauthService = createOAuthService(c.env)

    const result = await oauthService.handleDiscordCallback(code, state, baseUrl)

    return redirectToFrontend(c, 'success', null, {
      token: result.token,
      refresh: result.refreshToken,
      new: result.isNewUser.toString(),
    })
  } catch (error) {
    if (error instanceof OAuthError) {
      return redirectToFrontend(c, 'error', error.message)
    }
    console.error('Discord OAuth callback error:', error)
    return redirectToFrontend(c, 'error', 'Discord 認證過程中發生錯誤')
  }
})

app.get('/accounts', async (c) => {
  try {
    const userId = c.get('userId')
    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: '請先登入',
        },
        401
      )
    }

    const oauthService = createOAuthService(c.env)
    const accounts = await oauthService.getAccounts(userId)

    return c.json({
      success: true,
      data: { accounts },
    })
  } catch (error) {
    console.error('Get social accounts error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to get social accounts',
        message: '獲取社交帳戶失敗',
      },
      500
    )
  }
})

app.delete('/accounts/:provider', async (c) => {
  try {
    const userId = c.get('userId')
    const provider = c.req.param('provider')

    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: '請先登入',
        },
        401
      )
    }

    if (!['google', 'discord'].includes(provider)) {
      return c.json(
        {
          success: false,
          error: 'Invalid provider',
          message: '無效的提供者',
        },
        400
      )
    }

    const oauthService = createOAuthService(c.env)
    await oauthService.removeAccount(userId, provider as 'google' | 'discord')

    return c.json({
      success: true,
      message: `${provider} 帳戶關聯已移除`,
    })
  } catch (error) {
    if (error instanceof OAuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 404 | 500
      )
    }
    console.error('Remove social account error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to remove social account',
        message: '移除社交帳戶失敗',
      },
      500
    )
  }
})

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
