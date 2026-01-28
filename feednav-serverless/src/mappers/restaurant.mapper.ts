import type { Restaurant, Tag } from '../types'
import type { RestaurantRow } from '../repositories/restaurant.repository'
import type { FavoriteRow } from '../repositories/favorite.repository'
import type { VisitRow } from '../repositories/visit.repository'

export interface ParsedTag {
  id: number
  name: string
  category: string | null
  color: string | null
  is_positive: boolean
}

/**
 * 解析 GROUP_CONCAT 的標籤字串
 * 格式: "id:name:category:color:is_positive"
 */
export function parseTagsData(tagsData: string | undefined | null): Tag[] {
  if (!tagsData || !tagsData.trim()) {
    return []
  }

  return tagsData
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

/**
 * 將 DB 行轉換為 Restaurant 物件
 */
export function mapToRestaurant(
  row: RestaurantRow,
  options?: {
    userId?: string
    includeDistance?: boolean
  }
): Restaurant & { distance?: number } {
  const restaurant: Restaurant & { distance?: number } = {
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
    tags: parseTagsData(row.tags_data),
  }

  if (options?.userId) {
    restaurant.is_favorited = row.is_favorited === 1
    restaurant.is_visited = row.is_visited === 1
  }

  if (options?.includeDistance && row.distance !== undefined) {
    restaurant.distance = Math.round(row.distance * 100) / 100
  }

  return restaurant
}

/**
 * 將收藏行轉換為 Restaurant 物件（帶 favorited_at）
 */
export function mapFavoriteToRestaurant(
  row: FavoriteRow
): Restaurant & { favorited_at: string } {
  return {
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
    tags: parseTagsData(row.tags_data),
    is_favorited: true,
    is_visited: row.is_visited === 1,
    favorited_at: row.favorited_at,
  }
}

/**
 * 將造訪行轉換為 Restaurant 物件（帶 visited_at）
 */
export function mapVisitToRestaurant(
  row: VisitRow
): Restaurant & { visited_at: string } {
  return {
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
    tags: parseTagsData(row.tags_data),
    is_favorited: row.is_favorited === 1,
    is_visited: true,
    visited_at: row.visited_at,
  }
}

/**
 * 批量轉換餐廳列表
 */
export function mapToRestaurants(
  rows: RestaurantRow[],
  options?: {
    userId?: string
    includeDistance?: boolean
  }
): (Restaurant & { distance?: number })[] {
  return rows.map((row) => mapToRestaurant(row, options))
}

/**
 * 批量轉換收藏列表
 */
export function mapFavoritesToRestaurants(
  rows: FavoriteRow[]
): (Restaurant & { favorited_at: string })[] {
  return rows.map(mapFavoriteToRestaurant)
}

/**
 * 批量轉換造訪列表
 */
export function mapVisitsToRestaurants(
  rows: VisitRow[]
): (Restaurant & { visited_at: string })[] {
  return rows.map(mapVisitToRestaurant)
}
