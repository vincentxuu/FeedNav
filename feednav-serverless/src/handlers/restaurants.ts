import { Context } from 'hono'
import { searchSchema } from '../utils/validators'
import type { AppEnv, Restaurant, Tag, SearchResponse } from '../types'

// 搜尋餐廳
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

    let query = `
      SELECT
        r.*,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data
    `

    const params: (string | number)[] = []

    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = r.id) as is_favorited,
        EXISTS(SELECT 1 FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = r.id) as is_visited
      `
      params.push(userId, userId)
    }

    query += `
      FROM restaurants r
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE 1=1
    `

    if (filters.searchTerm) {
      query += ` AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)`
      const searchTerm = `%${filters.searchTerm}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (filters.district) {
      query += ` AND r.district = ?`
      params.push(filters.district)
    }

    if (filters.cuisine) {
      query += ` AND r.cuisine_type = ?`
      params.push(filters.cuisine)
    }

    if (filters.priceRange) {
      query += ` AND r.price_level BETWEEN ? AND ?`
      params.push(filters.priceRange[0], filters.priceRange[1])
    }

    query += ` GROUP BY r.id`

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => `tags_data LIKE ?`).join(' AND ')
      query += ` HAVING ${tagConditions}`
      filters.tags.forEach((tag) => params.push(`%${tag}%`))
    }

    switch (filters.sortBy) {
      case 'rating_desc':
        query += ` ORDER BY r.rating DESC, r.id`
        break
      case 'price_asc':
        query += ` ORDER BY r.price_level ASC, r.id`
        break
      case 'price_desc':
        query += ` ORDER BY r.price_level DESC, r.id`
        break
      default:
        query += ` ORDER BY r.id`
    }

    const offset = (filters.page - 1) * filters.limit
    query += ` LIMIT ? OFFSET ?`
    params.push(filters.limit, offset)

    const result = await c.env.DB.prepare(query).bind(...params).all()

    const restaurants: Restaurant[] = result.results.map((row: Record<string, unknown>) => {
      const restaurant: Restaurant = {
        id: row.id as number,
        name: row.name as string,
        district: row.district as string | null,
        cuisine_type: row.cuisine_type as string | null,
        rating: row.rating as number | null,
        price_level: row.price_level as number | null,
        photos: JSON.parse((row.photos as string) || '[]'),
        address: row.address as string | null,
        phone: row.phone as string | null,
        website: row.website as string | null,
        opening_hours: row.opening_hours as string | null,
        description: row.description as string | null,
        latitude: row.latitude as number | null,
        longitude: row.longitude as number | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        tags: [],
      }

      if (row.tags_data && (row.tags_data as string).trim()) {
        restaurant.tags = (row.tags_data as string)
          .split(',')
          .map((tagStr: string) => {
            const [id, name, category, color, is_positive] = tagStr.split(':')
            return {
              id: parseInt(id),
              name,
              category: category || null,
              color: color || null,
              is_positive: is_positive === '1',
            }
          })
          .filter((tag: Tag) => !isNaN(tag.id))
      }

      if (userId) {
        restaurant.is_favorited = row.is_favorited === 1
        restaurant.is_visited = row.is_visited === 1
      }

      return restaurant
    })

    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM restaurants r
    `

    const countParams: (string | number)[] = []

    if (filters.tags && filters.tags.length > 0) {
      countQuery += `
        LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
        LEFT JOIN tags t ON rt.tag_id = t.id
      `
    }

    countQuery += ` WHERE 1=1`

    if (filters.searchTerm) {
      countQuery += ` AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)`
      const searchTerm = `%${filters.searchTerm}%`
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    if (filters.district) {
      countQuery += ` AND r.district = ?`
      countParams.push(filters.district)
    }

    if (filters.cuisine) {
      countQuery += ` AND r.cuisine_type = ?`
      countParams.push(filters.cuisine)
    }

    if (filters.priceRange) {
      countQuery += ` AND r.price_level BETWEEN ? AND ?`
      countParams.push(filters.priceRange[0], filters.priceRange[1])
    }

    if (filters.tags && filters.tags.length > 0) {
      countQuery += ` GROUP BY r.id`
      const tagConditions = filters.tags.map(() => `GROUP_CONCAT(t.name) LIKE ?`).join(' AND ')
      countQuery += ` HAVING ${tagConditions}`
      filters.tags.forEach((tag) => countParams.push(`%${tag}%`))
      countQuery = `SELECT COUNT(*) as total FROM (${countQuery})`
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()
    const total = countResult?.total || 0

    const response: SearchResponse = {
      restaurants,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    }

    return c.json({
      success: true,
      data: response,
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

// 取得餐廳詳情
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

    let query = `
      SELECT
        r.*,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data
    `

    const params: (string | number)[] = []

    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = r.id) as is_favorited,
        EXISTS(SELECT 1 FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = r.id) as is_visited
      `
      params.push(userId, userId)
    }

    query += `
      FROM restaurants r
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE r.id = ?
      GROUP BY r.id
    `
    params.push(id)

    const result = await c.env.DB.prepare(query).bind(...params).first()

    if (!result) {
      return c.json(
        {
          success: false,
          error: 'RESTAURANT_NOT_FOUND',
          message: '餐廳不存在',
        },
        404
      )
    }

    const restaurant: Restaurant = {
      id: result.id as number,
      name: result.name as string,
      district: result.district as string | null,
      cuisine_type: result.cuisine_type as string | null,
      rating: result.rating as number | null,
      price_level: result.price_level as number | null,
      photos: JSON.parse((result.photos as string) || '[]'),
      address: result.address as string | null,
      phone: result.phone as string | null,
      website: result.website as string | null,
      opening_hours: result.opening_hours as string | null,
      description: result.description as string | null,
      latitude: result.latitude as number | null,
      longitude: result.longitude as number | null,
      created_at: result.created_at as string,
      updated_at: result.updated_at as string,
      tags: [],
    }

    if (result.tags_data && (result.tags_data as string).trim()) {
      restaurant.tags = (result.tags_data as string)
        .split(',')
        .map((tagStr: string) => {
          const [id, name, category, color, is_positive] = tagStr.split(':')
          return {
            id: parseInt(id),
            name,
            category: category || null,
            color: color || null,
            is_positive: is_positive === '1',
          }
        })
        .filter((tag: Tag) => !isNaN(tag.id))
    }

    if (userId) {
      restaurant.is_favorited = (result.is_favorited as number) === 1
      restaurant.is_visited = (result.is_visited as number) === 1
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

// 取得附近餐廳
async function nearby(c: Context<AppEnv>) {
  try {
    const lat = parseFloat(c.req.query('lat') || '0')
    const lng = parseFloat(c.req.query('lng') || '0')
    const radius = parseFloat(c.req.query('radius') || '5')
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50)
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

    let query = `
      SELECT
        r.*,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(r.latitude))
          )
        ) AS distance
    `

    const params: (string | number)[] = [lat, lng, lat]

    if (userId) {
      query += `,
        EXISTS(SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = r.id) as is_favorited,
        EXISTS(SELECT 1 FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = r.id) as is_visited
      `
      params.push(userId, userId)
    }

    query += `
      FROM restaurants r
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL
      GROUP BY r.id
      HAVING distance <= ?
      ORDER BY distance
      LIMIT ?
    `

    params.push(radius, limit)

    const result = await c.env.DB.prepare(query).bind(...params).all()

    const restaurants: (Restaurant & { distance: number })[] = result.results.map(
      (row: Record<string, unknown>) => {
        const restaurant: Restaurant & { distance: number } = {
          id: row.id as number,
          name: row.name as string,
          district: row.district as string | null,
          cuisine_type: row.cuisine_type as string | null,
          rating: row.rating as number | null,
          price_level: row.price_level as number | null,
          photos: JSON.parse((row.photos as string) || '[]'),
          address: row.address as string | null,
          phone: row.phone as string | null,
          website: row.website as string | null,
          opening_hours: row.opening_hours as string | null,
          description: row.description as string | null,
          latitude: row.latitude as number | null,
          longitude: row.longitude as number | null,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          tags: [],
          distance: Math.round((row.distance as number) * 100) / 100,
        }

        if (row.tags_data && (row.tags_data as string).trim()) {
          restaurant.tags = (row.tags_data as string)
            .split(',')
            .map((tagStr: string) => {
              const [id, name, category, color, is_positive] = tagStr.split(':')
              return {
                id: parseInt(id),
                name,
                category: category || null,
                color: color || null,
                is_positive: is_positive === '1',
              }
            })
            .filter((tag: Tag) => !isNaN(tag.id))
        }

        if (userId) {
          restaurant.is_favorited = row.is_favorited === 1
          restaurant.is_visited = row.is_visited === 1
        }

        return restaurant
      }
    )

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

// 取得所有標籤
async function tags(c: Context<AppEnv>) {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM tags ORDER BY category, name').all()

    return c.json({
      success: true,
      data: { tags: result.results },
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

export default {
  search,
  getById,
  nearby,
  tags,
}
