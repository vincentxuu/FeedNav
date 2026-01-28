import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'
import type { AppEnv } from '../types'

// 標準認證中間件
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'UNAUTHORIZED', message: '缺少授權標頭' }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: c.env.JWT_ISSUER || 'feednav-api',
    })

    c.set('user', {
      sub: payload.sub as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    })
    c.set('userId', payload.sub as string)
    c.set('userEmail', payload.email as string)

    await next()
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return c.json({ success: false, error: 'TOKEN_EXPIRED', message: 'Token 已過期' }, 401)
    }
    return c.json({ success: false, error: 'INVALID_TOKEN', message: '無效的 Token' }, 401)
  }
})

// 可選認證中間件 (有 token 則驗證，無 token 則繼續)
export const optionalAuthMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: c.env.JWT_ISSUER || 'feednav-api',
      })

      c.set('user', {
        sub: payload.sub as string,
        email: payload.email as string,
        iat: payload.iat as number,
        exp: payload.exp as number,
      })
      c.set('userId', payload.sub as string)
      c.set('userEmail', payload.email as string)
    } catch {
      // 忽略驗證錯誤，繼續執行
    }
  }

  await next()
})
