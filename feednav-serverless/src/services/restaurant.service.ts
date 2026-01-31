import type { Env, Restaurant, Tag, PaginationInfo } from '../types'
import { createRestaurantRepository, RestaurantRepository, SearchFilters } from '../repositories'
import { mapToRestaurant, mapToRestaurants } from '../mappers'

export interface SearchResult {
  restaurants: Restaurant[]
  pagination: PaginationInfo
}

export interface NearbyParams {
  lat: number
  lng: number
  radius?: number
  limit?: number
}

export interface BoundsParams {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  limit?: number
}

export class RestaurantService {
  private restaurantRepo: RestaurantRepository

  constructor(env: Env) {
    this.restaurantRepo = createRestaurantRepository(env)
  }

  async search(
    filters: SearchFilters,
    pagination: { page: number; limit: number },
    userId?: string
  ): Promise<SearchResult> {
    const [rows, total] = await Promise.all([
      this.restaurantRepo.search(filters, pagination, userId),
      this.restaurantRepo.count(filters),
    ])

    const restaurants = mapToRestaurants(rows, { userId })

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

  async getById(id: number, userId?: string): Promise<Restaurant | null> {
    const row = await this.restaurantRepo.getById(id, userId)
    if (!row) {
      return null
    }
    return mapToRestaurant(row, { userId })
  }

  async getNearby(
    params: NearbyParams,
    userId?: string
  ): Promise<(Restaurant & { distance: number })[]> {
    const { lat, lng, radius = 5, limit = 10 } = params
    const safeLimit = Math.min(limit, 50)

    const rows = await this.restaurantRepo.getNearby(lat, lng, radius, safeLimit, userId)

    return mapToRestaurants(rows, {
      userId,
      includeDistance: true,
    }) as (Restaurant & { distance: number })[]
  }

  async getAllTags(): Promise<Tag[]> {
    return this.restaurantRepo.getAllTags()
  }

  async exists(id: number): Promise<boolean> {
    return this.restaurantRepo.existsById(id)
  }

  async getByBounds(params: BoundsParams, userId?: string): Promise<Restaurant[]> {
    const { minLat, maxLat, minLng, maxLng, limit = 200 } = params
    const safeLimit = Math.min(limit, 500)

    const rows = await this.restaurantRepo.getByBounds(
      minLat,
      maxLat,
      minLng,
      maxLng,
      safeLimit,
      userId
    )

    return mapToRestaurants(rows, { userId })
  }
}

export function createRestaurantService(env: Env): RestaurantService {
  return new RestaurantService(env)
}
