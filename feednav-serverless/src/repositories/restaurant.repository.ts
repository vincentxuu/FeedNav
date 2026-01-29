import type { Env, Tag } from '../types'

export interface RestaurantRow {
  id: number
  name: string
  district: string | null
  cuisine_type: string | null
  rating: number | null
  price_level: number | null
  photos: string
  address: string | null
  phone: string | null
  website: string | null
  opening_hours: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
  tags_data?: string
  is_favorited?: number
  is_visited?: number
  distance?: number
}

export interface SearchFilters {
  searchTerm?: string
  district?: string
  cuisine?: string
  priceRange?: [number, number]
  tags?: string[]
  sortBy?: 'default' | 'rating_desc' | 'price_asc' | 'price_desc'
}

export interface PaginationParams {
  page: number
  limit: number
}

export class RestaurantRepository {
  constructor(private db: D1Database) {}

  async getById(id: number, userId?: string): Promise<RestaurantRow | null> {
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

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first<RestaurantRow>()
    return result
  }

  async search(
    filters: SearchFilters,
    pagination: PaginationParams,
    userId?: string
  ): Promise<RestaurantRow[]> {
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

    if (filters.district && filters.district !== 'all') {
      query += ` AND r.district = ?`
      params.push(filters.district)
    }

    if (filters.cuisine && filters.cuisine !== 'all') {
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

    const offset = (pagination.page - 1) * pagination.limit
    query += ` LIMIT ? OFFSET ?`
    params.push(pagination.limit, offset)

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<RestaurantRow>()
    return result.results
  }

  async count(filters: SearchFilters): Promise<number> {
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

    if (filters.district && filters.district !== 'all') {
      countQuery += ` AND r.district = ?`
      countParams.push(filters.district)
    }

    if (filters.cuisine && filters.cuisine !== 'all') {
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

    const countResult = await this.db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>()
    return countResult?.total || 0
  }

  async getNearby(
    lat: number,
    lng: number,
    radius: number,
    limit: number,
    userId?: string
  ): Promise<RestaurantRow[]> {
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

    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<RestaurantRow>()
    return result.results
  }

  async getAllTags(): Promise<Tag[]> {
    const result = await this.db.prepare('SELECT * FROM tags ORDER BY category, name').all<Tag>()
    return result.results
  }

  async existsById(id: number): Promise<boolean> {
    const result = await this.db.prepare('SELECT 1 FROM restaurants WHERE id = ?').bind(id).first()
    return !!result
  }
}

export function createRestaurantRepository(env: Env): RestaurantRepository {
  return new RestaurantRepository(env.DB)
}
