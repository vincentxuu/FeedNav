import type { Env, Restaurant, PaginationInfo } from '../types'
import {
  createVisitRepository,
  createRestaurantRepository,
  VisitRepository,
  RestaurantRepository,
  RecentVisit,
} from '../repositories'
import { mapVisitsToRestaurants } from '../mappers'

export interface VisitListResult {
  restaurants: (Restaurant & { visited_at: string })[]
  pagination: PaginationInfo
}

export interface VisitCheckResult {
  is_visited: boolean
  visited_at: string | null
}

export interface VisitStatsResult {
  stats: {
    total_visited: number
    districts_visited: number
    cuisines_tried: number
    avg_rating: number
    budget_friendly: number
    high_end: number
  }
  recent_visits: RecentVisit[]
}

export class VisitService {
  private visitRepo: VisitRepository
  private restaurantRepo: RestaurantRepository

  constructor(env: Env) {
    this.visitRepo = createVisitRepository(env)
    this.restaurantRepo = createRestaurantRepository(env)
  }

  async getList(
    userId: string,
    pagination: { page: number; limit: number }
  ): Promise<VisitListResult> {
    const [rows, total] = await Promise.all([
      this.visitRepo.getByUserId(userId, pagination),
      this.visitRepo.count(userId),
    ])

    const restaurants = mapVisitsToRestaurants(rows)

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
      throw new VisitError('RESTAURANT_NOT_FOUND', '餐廳不存在', 404)
    }

    const alreadyVisited = await this.visitRepo.exists(userId, restaurantId)
    if (alreadyVisited) {
      throw new VisitError('ALREADY_VISITED', '已在造訪列表中', 409)
    }

    await this.visitRepo.add(userId, restaurantId)
  }

  async remove(userId: string, restaurantId: number): Promise<void> {
    const changes = await this.visitRepo.remove(userId, restaurantId)
    if (changes === 0) {
      throw new VisitError('VISIT_NOT_FOUND', '造訪記錄不存在', 404)
    }
  }

  async check(userId: string, restaurantId: number): Promise<VisitCheckResult> {
    const visit = await this.visitRepo.getOne(userId, restaurantId)
    return {
      is_visited: !!visit,
      visited_at: visit?.created_at || null,
    }
  }

  async getStats(userId: string): Promise<VisitStatsResult> {
    const [stats, recentVisits] = await Promise.all([
      this.visitRepo.getStats(userId),
      this.visitRepo.getRecent(userId, 5),
    ])

    return {
      stats: {
        total_visited: stats.total_visited,
        districts_visited: stats.districts_visited,
        cuisines_tried: stats.cuisines_tried,
        avg_rating: stats.avg_rating ? Math.round(Number(stats.avg_rating) * 10) / 10 : 0,
        budget_friendly: stats.budget_friendly,
        high_end: stats.high_end,
      },
      recent_visits: recentVisits,
    }
  }
}

export class VisitError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'VisitError'
  }
}

export function createVisitService(env: Env): VisitService {
  return new VisitService(env)
}
