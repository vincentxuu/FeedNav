import type { Env, Restaurant, PaginationInfo } from '../types'
import {
  createFavoriteRepository,
  createRestaurantRepository,
  FavoriteRepository,
  RestaurantRepository,
} from '../repositories'
import { mapFavoritesToRestaurants } from '../mappers'

export interface FavoriteListResult {
  restaurants: (Restaurant & { favorited_at: string })[]
  pagination: PaginationInfo
}

export interface FavoriteCheckResult {
  is_favorited: boolean
  favorited_at: string | null
}

export class FavoriteService {
  private favoriteRepo: FavoriteRepository
  private restaurantRepo: RestaurantRepository

  constructor(env: Env) {
    this.favoriteRepo = createFavoriteRepository(env)
    this.restaurantRepo = createRestaurantRepository(env)
  }

  async getList(
    userId: string,
    pagination: { page: number; limit: number }
  ): Promise<FavoriteListResult> {
    const [rows, total] = await Promise.all([
      this.favoriteRepo.getByUserId(userId, pagination),
      this.favoriteRepo.count(userId),
    ])

    const restaurants = mapFavoritesToRestaurants(rows)

    return {
      restaurants,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  }

  async add(userId: string, restaurantId: number): Promise<void> {
    const exists = await this.restaurantRepo.existsById(restaurantId)
    if (!exists) {
      throw new FavoriteError('RESTAURANT_NOT_FOUND', '餐廳不存在', 404)
    }

    const alreadyFavorited = await this.favoriteRepo.exists(userId, restaurantId)
    if (alreadyFavorited) {
      throw new FavoriteError('ALREADY_FAVORITED', '已在收藏列表中', 409)
    }

    await this.favoriteRepo.add(userId, restaurantId)
  }

  async remove(userId: string, restaurantId: number): Promise<void> {
    const changes = await this.favoriteRepo.remove(userId, restaurantId)
    if (changes === 0) {
      throw new FavoriteError('FAVORITE_NOT_FOUND', '收藏記錄不存在', 404)
    }
  }

  async check(userId: string, restaurantId: number): Promise<FavoriteCheckResult> {
    const favorite = await this.favoriteRepo.getOne(userId, restaurantId)
    return {
      is_favorited: !!favorite,
      favorited_at: favorite?.created_at || null,
    }
  }
}

export class FavoriteError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'FavoriteError'
  }
}

export function createFavoriteService(env: Env): FavoriteService {
  return new FavoriteService(env)
}
