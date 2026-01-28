import { describe, it, expect } from 'vitest'
import {
  parseTagsData,
  mapToRestaurant,
  mapFavoriteToRestaurant,
  mapVisitToRestaurant,
  mapToRestaurants,
} from '../../src/mappers/restaurant.mapper'
import { createMockRestaurantRow } from '../setup'

describe('Restaurant Mapper', () => {
  describe('parseTagsData', () => {
    it('should return empty array for null or undefined', () => {
      expect(parseTagsData(null)).toEqual([])
      expect(parseTagsData(undefined)).toEqual([])
      expect(parseTagsData('')).toEqual([])
      expect(parseTagsData('   ')).toEqual([])
    })

    it('should parse single tag correctly', () => {
      const result = parseTagsData('1:美味:food:green:1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        name: '美味',
        category: 'food',
        color: 'green',
        is_positive: true,
      })
    })

    it('should parse multiple tags correctly', () => {
      const result = parseTagsData('1:美味:food:green:1,2:快速:service:blue:0')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('美味')
      expect(result[0].is_positive).toBe(true)
      expect(result[1].name).toBe('快速')
      expect(result[1].is_positive).toBe(false)
    })

    it('should handle tags with missing optional fields', () => {
      const result = parseTagsData('1:美味:::1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        name: '美味',
        category: null,
        color: null,
        is_positive: true,
      })
    })

    it('should filter out invalid tags', () => {
      const result = parseTagsData('invalid:tag:data,1:Valid:cat:col:1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Valid')
    })
  })

  describe('mapToRestaurant', () => {
    it('should map basic restaurant row correctly', () => {
      const row = createMockRestaurantRow()
      const result = mapToRestaurant(row)

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test Restaurant')
      expect(result.photos).toEqual([])
      expect(result.tags).toHaveLength(2)
    })

    it('should parse photos JSON correctly', () => {
      const row = createMockRestaurantRow({
        photos: '["url1.jpg", "url2.jpg"]',
      })
      const result = mapToRestaurant(row)

      expect(result.photos).toEqual(['url1.jpg', 'url2.jpg'])
    })

    it('should include user state when userId is provided', () => {
      const row = createMockRestaurantRow({
        is_favorited: 1,
        is_visited: 0,
      })
      const result = mapToRestaurant(row, { userId: 'test-user' })

      expect(result.is_favorited).toBe(true)
      expect(result.is_visited).toBe(false)
    })

    it('should not include user state when userId is not provided', () => {
      const row = createMockRestaurantRow({
        is_favorited: 1,
        is_visited: 1,
      })
      const result = mapToRestaurant(row)

      expect(result.is_favorited).toBeUndefined()
      expect(result.is_visited).toBeUndefined()
    })

    it('should include distance when option is set', () => {
      const row = createMockRestaurantRow({ distance: 1.5678 })
      const result = mapToRestaurant(row, { includeDistance: true })

      expect(result.distance).toBe(1.57)
    })
  })

  describe('mapFavoriteToRestaurant', () => {
    it('should map favorite row with is_favorited=true', () => {
      const row = {
        ...createMockRestaurantRow(),
        favorited_at: '2024-01-15T10:00:00Z',
        is_visited: 0,
      }
      const result = mapFavoriteToRestaurant(row as any)

      expect(result.is_favorited).toBe(true)
      expect(result.favorited_at).toBe('2024-01-15T10:00:00Z')
      expect(result.is_visited).toBe(false)
    })
  })

  describe('mapVisitToRestaurant', () => {
    it('should map visit row with is_visited=true', () => {
      const row = {
        ...createMockRestaurantRow(),
        visited_at: '2024-01-15T10:00:00Z',
        is_favorited: 1,
      }
      const result = mapVisitToRestaurant(row as any)

      expect(result.is_visited).toBe(true)
      expect(result.visited_at).toBe('2024-01-15T10:00:00Z')
      expect(result.is_favorited).toBe(true)
    })
  })

  describe('mapToRestaurants', () => {
    it('should map multiple rows', () => {
      const rows = [
        createMockRestaurantRow({ id: 1 }),
        createMockRestaurantRow({ id: 2 }),
        createMockRestaurantRow({ id: 3 }),
      ]
      const result = mapToRestaurants(rows)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
      expect(result[2].id).toBe(3)
    })

    it('should pass options to each mapping', () => {
      const rows = [
        createMockRestaurantRow({ id: 1, is_favorited: 1 }),
        createMockRestaurantRow({ id: 2, is_favorited: 0 }),
      ]
      const result = mapToRestaurants(rows, { userId: 'test-user' })

      expect(result[0].is_favorited).toBe(true)
      expect(result[1].is_favorited).toBe(false)
    })
  })
})
