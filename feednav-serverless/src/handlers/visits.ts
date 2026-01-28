import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { visitedSchema } from '../utils/validators'
import { createVisitService, VisitError } from '../services'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1')
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)

    const visitService = createVisitService(c.env)
    const result = await visitService.getList(userId, { page, limit })

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get visited restaurants error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to get visited restaurants',
        message: '獲取造訪列表失敗',
      },
      500
    )
  }
})

app.post('/', zValidator('json', visitedSchema), async (c) => {
  try {
    const userId = c.get('userId')
    const { restaurant_id } = c.req.valid('json')

    const visitService = createVisitService(c.env)
    await visitService.add(userId, restaurant_id)

    return c.json({
      success: true,
      message: '添加造訪記錄成功',
    })
  } catch (error) {
    if (error instanceof VisitError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 404 | 409 | 500
      )
    }
    console.error('Add visited restaurant error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to add visited restaurant',
        message: '添加造訪記錄失敗',
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

    const visitService = createVisitService(c.env)
    await visitService.remove(userId, restaurantId)

    return c.json({
      success: true,
      message: '移除造訪記錄成功',
    })
  } catch (error) {
    if (error instanceof VisitError) {
      return c.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        error.status as 400 | 404 | 409 | 500
      )
    }
    console.error('Remove visited restaurant error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to remove visited restaurant',
        message: '移除造訪記錄失敗',
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

    const visitService = createVisitService(c.env)
    const result = await visitService.check(userId, restaurantId)

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Check visited status error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to check visited status',
        message: '檢查造訪狀態失敗',
      },
      500
    )
  }
})

app.get('/stats', async (c) => {
  try {
    const userId = c.get('userId')

    const visitService = createVisitService(c.env)
    const result = await visitService.getStats(userId)

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get visit stats error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to get visit statistics',
        message: '獲取造訪統計失敗',
      },
      500
    )
  }
})

export default app
