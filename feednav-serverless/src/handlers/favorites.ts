import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { favoriteSchema } from '../utils/validators'
import { createFavoriteService, FavoriteError } from '../services'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1')
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)

    const favoriteService = createFavoriteService(c.env)
    const result = await favoriteService.getList(userId, { page, limit })

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to get favorites',
        message: '獲取收藏列表失敗',
      },
      500
    )
  }
})

app.post('/', zValidator('json', favoriteSchema), async (c) => {
  try {
    const userId = c.get('userId')
    const { restaurant_id } = c.req.valid('json')

    const favoriteService = createFavoriteService(c.env)
    await favoriteService.add(userId, restaurant_id)

    return c.json({
      success: true,
      message: '添加收藏成功',
    })
  } catch (error) {
    if (error instanceof FavoriteError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 404 | 409 | 500
      )
    }
    console.error('Add favorite error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to add favorite',
        message: '添加收藏失敗',
      },
      500
    )
  }
})

app.delete('/:restaurantId', async (c) => {
  try {
    const userId = c.get('userId')
    const restaurantId = parseInt(c.req.param('restaurantId'))

    if (isNaN(restaurantId)) {
      return c.json(
        {
          success: false,
          error: 'Invalid restaurant ID',
          message: '無效的餐廳ID',
        },
        400
      )
    }

    const favoriteService = createFavoriteService(c.env)
    await favoriteService.remove(userId, restaurantId)

    return c.json({
      success: true,
      message: '取消收藏成功',
    })
  } catch (error) {
    if (error instanceof FavoriteError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 404 | 409 | 500
      )
    }
    console.error('Remove favorite error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to remove favorite',
        message: '取消收藏失敗',
      },
      500
    )
  }
})

app.get('/check/:restaurantId', async (c) => {
  try {
    const userId = c.get('userId')
    const restaurantId = parseInt(c.req.param('restaurantId'))

    if (isNaN(restaurantId)) {
      return c.json(
        {
          success: false,
          error: 'Invalid restaurant ID',
          message: '無效的餐廳ID',
        },
        400
      )
    }

    const favoriteService = createFavoriteService(c.env)
    const result = await favoriteService.check(userId, restaurantId)

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Check favorite error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to check favorite status',
        message: '檢查收藏狀態失敗',
      },
      500
    )
  }
})

export default app
