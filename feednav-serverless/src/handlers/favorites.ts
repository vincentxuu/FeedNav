import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { favoriteSchema } from '../utils/validators'
import type { AppEnv, UserFavorite, Restaurant } from '../types'

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
        uf.created_at as favorited_at,
        GROUP_CONCAT(t.id || ':' || t.name || ':' || COALESCE(t.category, '') || ':' || COALESCE(t.color, '') || ':' || t.is_positive) as tags_data,
        EXISTS(SELECT 1 FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = r.id) as is_visited
      FROM user_favorites uf
      JOIN restaurants r ON uf.restaurant_id = r.id
      LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE uf.user_id = ?
      GROUP BY r.id, uf.created_at
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, userId, limit, offset).all()
    
    const restaurants: (Restaurant & { favorited_at: string })[] = result.results.map((row: any) => {
      const restaurant: Restaurant & { favorited_at: string } = {
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
        is_favorited: true,
        is_visited: row.is_visited === 1,
        favorited_at: row.favorited_at
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
      'SELECT COUNT(*) as total FROM user_favorites WHERE user_id = ?'
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
    console.error('Get favorites error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get favorites', 
      message: '獲取收藏列表失敗' 
    }, 500)
  }
})

app.post('/', zValidator('json', favoriteSchema), async (c) => {
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
      'SELECT id FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurant_id).first()
    
    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Already favorited', 
        message: '已在收藏列表中' 
      }, 409)
    }
    
    await c.env.DB.prepare(
      'INSERT INTO user_favorites (user_id, restaurant_id) VALUES (?, ?)'
    ).bind(userId, restaurant_id).run()
    
    return c.json({
      success: true,
      message: '添加收藏成功'
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to add favorite', 
      message: '添加收藏失敗' 
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
      'DELETE FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurantId).run()

    if (result.meta.changes === 0) {
      return c.json({ 
        success: false, 
        error: 'Favorite not found', 
        message: '收藏記錄不存在' 
      }, 404)
    }
    
    return c.json({
      success: true,
      message: '取消收藏成功'
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to remove favorite', 
      message: '取消收藏失敗' 
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
    
    const favorite = await c.env.DB.prepare(
      'SELECT id, created_at FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
    ).bind(userId, restaurantId).first<UserFavorite>()
    
    return c.json({
      success: true,
      data: {
        is_favorited: !!favorite,
        favorited_at: favorite?.created_at || null
      }
    })
  } catch (error) {
    console.error('Check favorite error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to check favorite status', 
      message: '檢查收藏狀態失敗' 
    }, 500)
  }
})

export default app