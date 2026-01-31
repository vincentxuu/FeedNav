import { Context } from 'hono'
import { searchSchema, boundsSchema } from '../utils/validators'
import { createRestaurantService } from '../services'
import type { AppEnv } from '../types'

async function search(c: Context<AppEnv>) {
  try {
    const body = await c.req.json()
    const parseResult = searchSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '請求參數驗證失敗',
        },
        400
      )
    }

    const filters = parseResult.data
    const userId = c.get('userId')
    const restaurantService = createRestaurantService(c.env)

    const result = await restaurantService.search(
      {
        searchTerm: filters.searchTerm,
        district: filters.district,
        cuisine: filters.cuisine,
        priceRange: filters.priceRange,
        tags: filters.tags,
        sortBy: filters.sortBy,
      },
      { page: filters.page, limit: filters.limit },
      userId
    )

    return c.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Restaurant search error:', error)
    return c.json(
      {
        success: false,
        error: 'SEARCH_FAILED',
        message: '搜索失敗，請稍後再試',
      },
      500
    )
  }
}

async function getById(c: Context<AppEnv>) {
  try {
    const id = parseInt(c.req.param('id'))
    const userId = c.get('userId')

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: 'INVALID_ID',
          message: '無效的餐廳ID',
        },
        400
      )
    }

    const restaurantService = createRestaurantService(c.env)
    const restaurant = await restaurantService.getById(id, userId)

    if (!restaurant) {
      return c.json(
        {
          success: false,
          error: 'RESTAURANT_NOT_FOUND',
          message: '餐廳不存在',
        },
        404
      )
    }

    return c.json({
      success: true,
      data: { restaurant },
    })
  } catch (error) {
    console.error('Get restaurant error:', error)
    return c.json(
      {
        success: false,
        error: 'GET_FAILED',
        message: '獲取餐廳信息失敗',
      },
      500
    )
  }
}

async function nearby(c: Context<AppEnv>) {
  try {
    const lat = parseFloat(c.req.query('lat') || '0')
    const lng = parseFloat(c.req.query('lng') || '0')
    const radius = parseFloat(c.req.query('radius') || '5')
    const limit = parseInt(c.req.query('limit') || '10')
    const userId = c.get('userId')

    if (!lat || !lng) {
      return c.json(
        {
          success: false,
          error: 'MISSING_COORDINATES',
          message: '請提供有效的經緯度座標',
        },
        400
      )
    }

    const restaurantService = createRestaurantService(c.env)
    const restaurants = await restaurantService.getNearby({ lat, lng, radius, limit }, userId)

    return c.json({
      success: true,
      data: { restaurants },
    })
  } catch (error) {
    console.error('Nearby restaurants error:', error)
    return c.json(
      {
        success: false,
        error: 'NEARBY_FAILED',
        message: '獲取附近餐廳失敗',
      },
      500
    )
  }
}

async function tags(c: Context<AppEnv>) {
  try {
    const restaurantService = createRestaurantService(c.env)
    const allTags = await restaurantService.getAllTags()

    return c.json({
      success: true,
      data: { tags: allTags },
    })
  } catch (error) {
    console.error('Get tags error:', error)
    return c.json(
      {
        success: false,
        error: 'GET_TAGS_FAILED',
        message: '獲取標籤失敗',
      },
      500
    )
  }
}

async function bounds(c: Context<AppEnv>) {
  try {
    const body = await c.req.json()
    const parseResult = boundsSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '請求參數驗證失敗',
        },
        400
      )
    }

    const { minLat, maxLat, minLng, maxLng, limit } = parseResult.data
    const userId = c.get('userId')
    const restaurantService = createRestaurantService(c.env)

    const restaurants = await restaurantService.getByBounds(
      { minLat, maxLat, minLng, maxLng, limit },
      userId
    )

    return c.json({
      success: true,
      data: { restaurants },
    })
  } catch (error) {
    console.error('Bounds restaurants error:', error)
    return c.json(
      {
        success: false,
        error: 'BOUNDS_FAILED',
        message: '獲取範圍內餐廳失敗',
      },
      500
    )
  }
}

export default {
  search,
  getById,
  nearby,
  tags,
  bounds,
}
