import type { Env, UserFavorite } from '../types'

export interface FavoriteRow {
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
  favorited_at: string
  is_visited?: number
}

export interface PaginationParams {
  page: number
  limit: number
}

export class FavoriteRepository {
  constructor(private db: D1Database) {}

  async getByUserId(
    userId: string,
    pagination: PaginationParams
  ): Promise<FavoriteRow[]> {
    const offset = (pagination.page - 1) * pagination.limit

    const result = await this.db
      .prepare(
        `
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
      `
      )
      .bind(userId, userId, pagination.limit, offset)
      .all<FavoriteRow>()

    return result.results
  }

  async count(userId: string): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as total FROM user_favorites WHERE user_id = ?')
      .bind(userId)
      .first<{ total: number }>()
    return result?.total || 0
  }

  async add(userId: string, restaurantId: number): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO user_favorites (user_id, restaurant_id) VALUES (?, ?)'
      )
      .bind(userId, restaurantId)
      .run()
  }

  async remove(userId: string, restaurantId: number): Promise<number> {
    const result = await this.db
      .prepare(
        'DELETE FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .run()
    return result.meta.changes
  }

  async exists(userId: string, restaurantId: number): Promise<boolean> {
    const result = await this.db
      .prepare(
        'SELECT 1 FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .first()
    return !!result
  }

  async getOne(
    userId: string,
    restaurantId: number
  ): Promise<UserFavorite | null> {
    const result = await this.db
      .prepare(
        'SELECT id, user_id, restaurant_id, created_at FROM user_favorites WHERE user_id = ? AND restaurant_id = ?'
      )
      .bind(userId, restaurantId)
      .first<UserFavorite>()
    return result
  }
}

export function createFavoriteRepository(env: Env): FavoriteRepository {
  return new FavoriteRepository(env.DB)
}
