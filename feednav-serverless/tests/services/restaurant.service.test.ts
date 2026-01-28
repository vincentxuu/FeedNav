import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RestaurantService } from '../../src/services/restaurant.service'
import {
  createMockEnv,
  createMockRestaurantRow,
} from '../setup'

describe('RestaurantService', () => {
  let service: RestaurantService
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv = createMockEnv()
    service = new RestaurantService(mockEnv.env as any)
  })

  describe('search', () => {
    it('should return empty results when no restaurants found', async () => {
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [] })
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ total: 0 })

      const result = await service.search(
        {},
        { page: 1, limit: 10 }
      )

      expect(result.restaurants).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('should return restaurants with proper mapping', async () => {
      const mockRow = createMockRestaurantRow()
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [mockRow] })
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ total: 1 })

      const result = await service.search(
        {},
        { page: 1, limit: 10 }
      )

      expect(result.restaurants).toHaveLength(1)
      expect(result.restaurants[0].id).toBe(1)
      expect(result.restaurants[0].name).toBe('Test Restaurant')
      expect(result.restaurants[0].tags).toHaveLength(2)
      expect(result.pagination.total).toBe(1)
    })

    it('should include user state when userId is provided', async () => {
      const mockRow = createMockRestaurantRow({
        is_favorited: 1,
        is_visited: 0,
      })
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [mockRow] })
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ total: 1 })

      const result = await service.search(
        {},
        { page: 1, limit: 10 },
        'test-user-id'
      )

      expect(result.restaurants[0].is_favorited).toBe(true)
      expect(result.restaurants[0].is_visited).toBe(false)
    })

    it('should handle filters correctly', async () => {
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [] })
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ total: 0 })

      await service.search(
        {
          searchTerm: 'pizza',
          district: 'Taipei',
          cuisine: 'Italian',
          priceRange: [1, 3],
        },
        { page: 1, limit: 10 }
      )

      expect(mockEnv.mocks.db.prepare).toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return null when restaurant not found', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce(null)

      const result = await service.getById(999)

      expect(result).toBeNull()
    })

    it('should return restaurant with proper mapping', async () => {
      const mockRow = createMockRestaurantRow()
      mockEnv.mocks.statement.first.mockResolvedValueOnce(mockRow)

      const result = await service.getById(1)

      expect(result).not.toBeNull()
      expect(result!.id).toBe(1)
      expect(result!.name).toBe('Test Restaurant')
      expect(result!.photos).toEqual([])
      expect(result!.tags).toHaveLength(2)
    })
  })

  describe('getNearby', () => {
    it('should return nearby restaurants', async () => {
      const mockRow = createMockRestaurantRow({ distance: 1.5 })
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [mockRow] })

      const result = await service.getNearby({
        lat: 25.0339,
        lng: 121.5645,
        radius: 5,
        limit: 10,
      })

      expect(result).toHaveLength(1)
      expect(result[0].distance).toBe(1.5)
    })

    it('should limit results to max 50', async () => {
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: [] })

      await service.getNearby({
        lat: 25.0339,
        lng: 121.5645,
        limit: 100,
      })

      expect(mockEnv.mocks.db.prepare).toHaveBeenCalled()
    })
  })

  describe('getAllTags', () => {
    it('should return all tags', async () => {
      const mockTags = [
        { id: 1, name: 'Tag1', category: 'food', color: 'red', is_positive: true },
        { id: 2, name: 'Tag2', category: 'service', color: 'blue', is_positive: false },
      ]
      mockEnv.mocks.statement.all.mockResolvedValueOnce({ results: mockTags })

      const result = await service.getAllTags()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Tag1')
    })
  })

  describe('exists', () => {
    it('should return true when restaurant exists', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ id: 1 })

      const result = await service.exists(1)

      expect(result).toBe(true)
    })

    it('should return false when restaurant does not exist', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce(null)

      const result = await service.exists(999)

      expect(result).toBe(false)
    })
  })
})
