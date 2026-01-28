import { cors } from 'hono/cors'
import type { Env } from '../types'

export function createCorsMiddleware(env: Env) {
  const envOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || []

  const allowedOrigins = [
    ...envOrigins,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]

  return cors({
    origin: (origin) => {
      if (!origin) return null

      // 支援 Cloudflare Pages 的 *.pages.dev 域名
      if (origin.endsWith('.pages.dev')) {
        return origin
      }

      return allowedOrigins.includes(origin) ? origin : null
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
}
