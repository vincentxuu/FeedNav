import type { Env, UserVisited } from '../types'

export interface VisitRow {
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
  visited_at: string
  is_favorited?: number
}

export interface VisitStats {
  total_visited: number
  districts_visited: number
  cuisines_tried: number
  avg_rating: number | null
  budget_friendly: number
  high_end: number
}

export interface RecentVisit {
  name: string
  district: string | null
  cuisine_type: string | null
  created_at: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export class VisitRepository {
  constructor(private db: D1Database) {}

  async getByUserId(
    userId: string,
    pagination: PaginationParams
  ): Promise<VisitRow[]> {
    const offset = (pagination.page - 1) * pagination.limit

    const result = await this.db
      .prepare(
        `
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
      `
      )
      .bind(userId, userId, pagination.limit, offset)
      .all<VisitRow>()

    return result.results
  }

  async count(userId: string): Promise<number> {
    const result = await this.db
      .prepare(
        'SELECT COUNT(*) as total FROM user_visited_restaurants WHERE user_id = ?'
      )
      .bind(userId)
      .first<{ total: number }>()
    return result?.total || 0
  }

  async add(userId: string, restaurantId: number): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO user_visited_restaurants (user_id, restaurant_id) VALUES (?, ?)'
      )
      .bind(userId, restaurantId)
      .run()
  }

  async remove(userId: string, restaurantId: number): Promise<number> {
    const result = await this.db
      .prepare(
        'DELETE FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .run()
    return result.meta.changes
  }

  async exists(userId: string, restaurantId: number): Promise<boolean> {
    const result = await this.db
      .prepare(
        'SELECT 1 FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .first()
    return !!result
  }

  async getOne(
    userId: string,
    restaurantId: number
  ): Promise<UserVisited | null> {
    const result = await this.db
      .prepare(
        'SELECT id, user_id, restaurant_id, created_at FROM user_visited_restaurants WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .first<UserVisited>()
    return result
  }

  async getStats(userId: string): Promise<VisitStats> {
    const result = await this.db
      .prepare(
        `
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
      `
      )
      .bind(userId)
      .first<VisitStats>()

    return {
      total_visited: result?.total_visited || 0,
      districts_visited: result?.districts_visited || 0,
      cuisines_tried: result?.cuisines_tried || 0,
      avg_rating: result?.avg_rating || null,
      budget_friendly: result?.budget_friendly || 0,
      high_end: result?.high_end || 0,
    }
  }

  async getRecent(userId: string, limit: number): Promise<RecentVisit[]> {
    const result = await this.db
      .prepare(
        `
        SELECT r.name, r.district, r.cuisine_type, uv.created_at
        FROM user_visited_restaurants uv
        JOIN restaurants r ON uv.restaurant_id = r.id
        WHERE uv.user_id = ?
        ORDER BY uv.created_at DESC
        LIMIT ?
      `
      )
      .bind(userId, limit)
      .all<RecentVisit>()

    return result.results
  }
}

export function createVisitRepository(env: Env): VisitRepository {
  return new VisitRepository(env.DB)
}
