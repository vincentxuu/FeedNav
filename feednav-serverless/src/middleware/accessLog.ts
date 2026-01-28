import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

export const accessLogMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const startTime = Date.now()

  await next()

  const responseTime = Date.now() - startTime
  const method = c.req.method
  const path = new URL(c.req.url).pathname
  const statusCode = c.res.status
  const userAgent = c.req.header('user-agent') || ''
  const userId = c.get('userId') || 'anonymous'

  // 如果有 Analytics Engine，寫入日誌
  if (c.env.ACCESS_LOGS) {
    try {
      c.env.ACCESS_LOGS.writeDataPoint({
        blobs: [method, path, userAgent, userId, String(statusCode)],
        doubles: [responseTime, statusCode],
        indexes: [path],
      })
    } catch (error) {
      console.error('Failed to write access log:', error)
    }
  }
})
