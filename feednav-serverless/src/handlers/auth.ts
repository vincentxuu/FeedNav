import { Hono, Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators'
import { createAuthService, AuthError } from '../services'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    const authService = createAuthService(c.env)

    const result = await authService.register(email, password)

    return c.json({
      success: true,
      data: result,
      message: '註冊成功',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 401 | 404 | 409 | 500
      )
    }
    console.error('Registration error:', error)
    return c.json(
      {
        success: false,
        error: 'REGISTRATION_FAILED',
        message: '註冊失敗，請稍後再試',
      },
      500
    )
  }
})

app.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    const authService = createAuthService(c.env)

    const result = await authService.login(email, password)

    return c.json({
      success: true,
      data: result,
      message: '登入成功',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 401 | 404 | 409 | 500
      )
    }
    console.error('Login error:', error)
    return c.json(
      {
        success: false,
        error: 'LOGIN_FAILED',
        message: '登入失敗，請稍後再試',
      },
      500
    )
  }
})

app.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')
    const authService = createAuthService(c.env)

    const result = await authService.refreshToken(refreshToken)

    return c.json({
      success: true,
      data: result,
      message: '令牌刷新成功',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 401 | 404 | 409 | 500
      )
    }
    console.error('Token refresh error:', error)
    return c.json(
      {
        success: false,
        error: 'TOKEN_REFRESH_FAILED',
        message: '令牌刷新失敗',
      },
      500
    )
  }
})

app.post('/logout', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')
    const authService = createAuthService(c.env)

    await authService.logout(refreshToken)

    return c.json({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json(
      {
        success: false,
        error: 'LOGOUT_FAILED',
        message: '登出失敗',
      },
      500
    )
  }
})

async function me(c: Context<AppEnv>) {
  try {
    const userId = c.get('userId')
    if (!userId) {
      return c.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: '請先登入',
        },
        401
      )
    }

    const authService = createAuthService(c.env)
    const user = await authService.getMe(userId)

    return c.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 401 | 404 | 409 | 500
      )
    }
    console.error('Get user error:', error)
    return c.json(
      {
        success: false,
        error: 'GET_USER_FAILED',
        message: '獲取用戶信息失敗',
      },
      500
    )
  }
}

const authHandler = Object.assign(app, { me })

export default authHandler
