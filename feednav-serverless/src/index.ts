import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types'
import { ApiError } from './errors'
import { createCorsMiddleware } from './middleware/cors'
import { accessLogMiddleware } from './middleware/accessLog'
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth'
import { loginRateLimitMiddleware } from './middleware/rateLimit'
import authHandler from './handlers/auth'
import restaurantsHandler from './handlers/restaurants'
import favoritesHandler from './handlers/favorites'
import visitsHandler from './handlers/visits'
import oauthHandler from './handlers/oauth'

const app = new Hono<AppEnv>()

// 全局中間件
app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', accessLogMiddleware)
app.use('*', (c, next) => createCorsMiddleware(c.env)(c, next))

// 全局錯誤處理
app.onError((err, c) => {
  console.error('Error:', err)

  if (err instanceof ApiError) {
    return c.json(err.toResponse(), err.statusCode)
  }

  // 不洩露詳細錯誤給客戶端
  return c.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '伺服器發生錯誤',
      ...(c.env?.ENVIRONMENT === 'development' && { details: err.message }),
    },
    500
  )
})

// 404 處理
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'NOT_FOUND',
      message: `路由 ${c.req.method} ${c.req.path} 不存在`,
    },
    404
  )
})

// 健康檢查
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FeedNav API',
  })
)

// 認證路由 - 登入相關路由添加速率限制
app.use('/api/auth/login', loginRateLimitMiddleware)
app.use('/api/auth/register', loginRateLimitMiddleware)
app.route('/api/auth', authHandler)

// OAuth 路由
app.route('/api/oauth', oauthHandler)

// 餐廳路由 - 部分需要可選認證
app.post('/api/restaurants/search', optionalAuthMiddleware, restaurantsHandler.search)
app.post('/api/restaurants/bounds', optionalAuthMiddleware, restaurantsHandler.bounds)
app.get('/api/restaurants/nearby', optionalAuthMiddleware, restaurantsHandler.nearby)
app.get('/api/restaurants/tags', restaurantsHandler.tags)
app.get('/api/restaurants/:id', optionalAuthMiddleware, restaurantsHandler.getById)

// 受保護的用戶資訊路由
app.use('/api/auth/me', authMiddleware)
app.get('/api/auth/me', authHandler.me)

// 收藏路由 - 需要認證
app.use('/api/favorites/*', authMiddleware)
app.route('/api/favorites', favoritesHandler)

// 造訪記錄路由 - 需要認證
app.use('/api/visits/*', authMiddleware)
app.route('/api/visits', visitsHandler)

// OAuth 帳號管理路由 - 需要認證
app.use('/api/oauth/accounts*', authMiddleware)

export default app
