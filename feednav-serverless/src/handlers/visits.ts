import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { visitedSchema } from '../utils/validators'
import type { AppEnv, UserVisited, Restaurant } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    const page = parseInt(c.req.query('page') || '1')
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
    const offset = (page - 1) * limit
    
    const result = await c.env.DB.prepare(`
      SELECT 
        r.*,
        uv.created_at as visited_at,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data,
        EXISTS(SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = r.id) as is_favorited
      FROM user_visited_restaurants uv
      JOIN restaurants r ON uv.restaurant_id = r.id
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE uv.user_id = ?
      GROUP BY r.id, uv.created_at
      ORDER BY uv.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, userId, limit, offset).all()
    
    const restaurants: (Restaurant & { visited_at: string })[] = result.results.map((row: any) => {
      const restaurant: Restaurant & { visited_at: string } = {
        id: row.id,
        name: row.name,
        district: row.district,
        cuisine_type: row.cuisine_type,
        rating: row.rating,
        price_level: row.price_level,
        photos: JSON.parse(row.photos || '[]'),
        address: row.address,
        phone: row.phone,
        website: row.website,
        opening_hours: row.opening_hours,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: [],
        is_favorited: row.is_favorited === 1,
        is_visited: true,
        visited_at: row.visited_at
      }
      
      if (row.tags_data && row.tags_data.trim()) {
        restaurant.tags = row.tags_data.split(',').map((tagStr: string) => {
          const [id, name, category, color, is_positive] = tagStr.split(':')
          return {
            id: parseInt(id),
            name,
            category: category || null,
            color: color || null,
            is_positive: is_positive === '1'
          }
        }).filter((tag: any) => !isNaN(tag.id))
      }
      
      return restaurant
    })
    
    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM user_visited_restaurants WHERE user_id = ?'
    ).bind(userId).first<{ total: number }>()
    
    const total = countResult?.total || 0
    
    return c.json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get visited restaurants error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get visited restaurants', 
      message: '獲取造訪列表失敗' 
    }, 500)
  }
})

app.post('/', zValidator('json', visitedSchema), async (c) => {
  try {
    const userId = c.get('userId')
    const { restaurant_id } = c.req.valid('json')
    
    const restaurant = await c.env.DB.prepare(
      'SELECT id FROM restaurants WHERE id = ?'
    ).bind(restaurant_id).first()
    
    if (!restaurant) {
      return c.json({ 
        success: false, 
        error: 'Restaurant not found', 
        message: '餐廳不存在' 
      }, 404)
    }
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurant_id).first()
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Already visited', 
        message: '已在造訪列表中' 
      }, 409)
    }
    
    await c.env.DB.prepare(
      'INSERT INTO user_visited_restaurants (user_id, restaurant_id) VALUES (?, ?)'
    ).bind(userId, restaurant_id).run()
    
    return c.json({
      success: true,
      message: '添加造訪記錄成功'
    })
  } catch (error) {
    console.error('Add visited restaurant error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to add visited restaurant', 
      message: '添加造訪記錄失敗' 
    }, 500)
  }
})

app.delete('/:restaurantId', async (c) => {
  try {
    const userId = c.get('userId')
    const restaurantId = parseInt(c.req.param('restaurantId'))
    
    if (isNaN(restaurantId)) {
      return c.json({ 
        success: false, 
        error: 'Invalid restaurant ID', 
        message: '無效的餐廳ID' 
      }, 400)
    }
    
    const result = await c.env.DB.prepare(
      'DELETE FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurantId).run()

    if (result.meta.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Visit record not found', 
        message: '造訪記錄不存在' 
      }, 404)
    }
    
    return c.json({
      success: true,
      message: '移除造訪記錄成功'
    })
  } catch (error) {
    console.error('Remove visited restaurant error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to remove visited restaurant', 
      message: '移除造訪記錄失敗' 
    }, 500)
  }
})

app.get('/check/:restaurantId', async (c) => {
  try {
    const userId = c.get('userId')
    const restaurantId = parseInt(c.req.param('restaurantId'))
    
    if (isNaN(restaurantId)) {
      return c.json({ 
        success: false, 
        error: 'Invalid restaurant ID', 
        message: '無效的餐廳ID' 
      }, 400)
    }
    
    const visited = await c.env.DB.prepare(
      'SELECT id, created_at FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurantId).first<UserVisited>()
    
    return c.json({
      success: true,
      data: {
        is_visited: !!visited,
        visited_at: visited?.created_at || null
      }
    })
  } catch (error) {
    console.error('Check visited status error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to check visited status', 
      message: '檢查造訪狀態失敗' 
    }, 500)
  }
})

app.get('/stats', async (c) => {
  try {
    const userId = c.get('userId')
    
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_visited,
        COUNT(DISTINCT r.district) as districts_visited,
        COUNT(DISTINCT r.cuisine_type) as cuisines_tried,
        AVG(r.rating) as avg_rating,
        COUNT(CASE WHEN r.price_level <= 2 THEN 1 END) as budget_friendly,
        COUNT(CASE WHEN r.price_level >= 4 THEN 1 END) as high_end
      FROM user_visited_restaurants uv
      JOIN restaurants r ON uv.restaurant_id = r.id
      WHERE uv.user_id = ?
    `).bind(userId).first()
    
    const recentVisits = await c.env.DB.prepare(`
      SELECT r.name, r.district, r.cuisine_type, uv.created_at
      FROM user_visited_restaurants uv
      JOIN restaurants r ON uv.restaurant_id = r.id
      WHERE uv.user_id = ?
      ORDER BY uv.created_at DESC
      LIMIT 5
    `).bind(userId).all()
    
    return c.json({
      success: true,
      data: {
        stats: {
          total_visited: stats?.total_visited || 0,
          districts_visited: stats?.districts_visited || 0,
          cuisines_tried: stats?.cuisines_tried || 0,
          avg_rating: stats?.avg_rating ? Math.round(Number(stats.avg_rating) * 10) / 10 : 0,
          budget_friendly: stats?.budget_friendly || 0,
          high_end: stats?.high_end || 0
        },
        recent_visits: recentVisits.results
      }
    })
  } catch (error) {
    console.error('Get visit stats error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get visit statistics', 
      message: '獲取造訪統計失敗' 
    }, 500)
  }
})

export default app