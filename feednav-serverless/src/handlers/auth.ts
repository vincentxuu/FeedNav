import { Hono, Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { nanoid } from 'nanoid'
import { hashPassword, verifyPassword } from '../utils/hash'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators'
import { JWT_CONFIG } from '../constants'
import type { AppEnv, User } from '../types'

const app = new Hono<AppEnv>()

app.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first()

    if (existingUser) {
      return c.json(
        {
          success: false,
          error: 'EMAIL_EXISTS',
          message: '該電子郵件地址已被註冊',
        },
        409
      )
    }

    const userId = nanoid()
    const rounds = parseInt(c.env.BCRYPT_ROUNDS || '10')
    const passwordHash = await hashPassword(password, rounds)

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, is_email_verified) VALUES (?, ?, ?, 0)'
    )
      .bind(userId, email, passwordHash)
      .run()

    const token = await generateToken({ sub: userId, email }, c.env.JWT_SECRET, c.env.JWT_ISSUER)
    const refreshToken = generateRefreshToken()

    await c.env.KV.put(`refresh_token:${refreshToken}`, JSON.stringify({ userId, email }), {
      expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    })

    return c.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: userId, email },
      },
      message: '註冊成功',
    })
  } catch (error) {
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

    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name, avatar FROM users WHERE email = ?'
    )
      .bind(email)
      .first<User>()

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '電子郵件地址或密碼錯誤',
        },
        401
      )
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return c.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: '電子郵件地址或密碼錯誤',
        },
        401
      )
    }

    const token = await generateToken(
      { sub: user.id, email: user.email },
      c.env.JWT_SECRET,
      c.env.JWT_ISSUER
    )
    const refreshToken = generateRefreshToken()

    await c.env.KV.put(
      `refresh_token:${refreshToken}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      { expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
    )

    return c.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      },
      message: '登入成功',
    })
  } catch (error) {
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

    const tokenData = await c.env.KV.get(`refresh_token:${refreshToken}`)

    if (!tokenData) {
      return c.json(
        {
          success: false,
          error: 'INVALID_REFRESH_TOKEN',
          message: '無效的刷新令牌',
        },
        401
      )
    }

    const { userId, email } = JSON.parse(tokenData)

    const token = await generateToken({ sub: userId, email }, c.env.JWT_SECRET, c.env.JWT_ISSUER)
    const newRefreshToken = generateRefreshToken()

    await c.env.KV.delete(`refresh_token:${refreshToken}`)

    await c.env.KV.put(`refresh_token:${newRefreshToken}`, JSON.stringify({ userId, email }), {
      expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    })

    return c.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
      message: '令牌刷新成功',
    })
  } catch (error) {
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

    if (refreshToken) {
      await c.env.KV.delete(`refresh_token:${refreshToken}`)
    }

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

// 獨立導出的 me 函數，用於 /api/auth/me 路由
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

    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar, is_email_verified, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<Omit<User, 'password_hash'>>()

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: '用戶不存在',
        },
        404
      )
    }

    return c.json({
      success: true,
      data: { user },
    })
  } catch (error) {
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

// 導出 Hono app 和 me 函數
const authHandler = Object.assign(app, { me })

export default authHandler
