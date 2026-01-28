import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'
import { RATE_LIMIT } from '../constants'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  config: { WINDOW_MS: number; MAX_REQUESTS: number },
  keyPrefix: string
): Promise<RateLimitResult> {
  const key = `${keyPrefix}:${identifier}`
  const now = Date.now()

  const recordJson = await kv.get(key)
  const requests: number[] = recordJson ? JSON.parse(recordJson) : []

  // 移除過期的請求記錄
  const validRequests = requests.filter((ts) => ts > now - config.WINDOW_MS)

  if (validRequests.length >= config.MAX_REQUESTS) {
    const oldestRequest = Math.min(...validRequests)
    const retryAfter = Math.ceil((oldestRequest + config.WINDOW_MS - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // 記錄新請求
  validRequests.push(now)
  await kv.put(key, JSON.stringify(validRequests), {
    expirationTtl: Math.ceil(config.WINDOW_MS / 1000) + 60,
  })

  return { allowed: true, remaining: config.MAX_REQUESTS - validRequests.length }
}

export const loginRateLimitMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'

  const result = await checkRateLimit(c.env.KV, ip, RATE_LIMIT.LOGIN, 'ratelimit:login')

  if (!result.allowed) {
    return c.json(
      {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: '請求過於頻繁，請稍後再試',
        retryAfter: result.retryAfter,
      },
      429
    )
  }

  c.res.headers.set('X-RateLimit-Remaining', String(result.remaining))
  await next()
})

export const apiRateLimitMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'

  const result = await checkRateLimit(c.env.KV, ip, RATE_LIMIT.API, 'ratelimit:api')

  if (!result.allowed) {
    return c.json(
      {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: '請求過於頻繁，請稍後再試',
        retryAfter: result.retryAfter,
      },
      429
    )
  }

  c.res.headers.set('X-RateLimit-Remaining', String(result.remaining))
  await next()
})
