import { apiClient } from '@/lib/api-client'
import type { Restaurant } from '@/types'
import type { Filters } from '@/components/FilterSheet'

interface FetchRestaurantsParams {
  searchTerm?: string
  filters?: Omit<Filters, 'showOpenOnly'>
  sortBy?: string
}

// Note: Using serverless API to handle filtering/sorting on the backend.
// This improves performance and scalability for large datasets.
export const fetchRestaurants = async ({
  searchTerm = '',
  filters,
  sortBy = 'default',
}: FetchRestaurantsParams = {}): Promise<Restaurant[]> => {
  try {
    const response = await apiClient.searchRestaurants({
      searchTerm,
      sortBy,
      district: filters?.district,
      cuisine: filters?.cuisine,
      priceRange: filters?.priceRange,
      tags: filters?.tags,
    })

    if (!response.success) {
      console.error('Error fetching restaurants from serverless API:', response.error)
      throw new Error(response.message || 'Could not load restaurant data.')
    }

    // The API returns data that should match the Restaurant type.
    // We ensure properties are in the correct type format.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data?.restaurants || []).map(
      (r: any): Restaurant => ({
        ...r,
        id: String(r.id),
        rating: Number(r.rating) || 0,
        price_level: Number(r.price_level) || 1,
        is_favorited: Boolean(r.is_favorited),
        is_visited: Boolean(r.is_visited),
      })
    )
  } catch (e) {
    console.error('Failed to fetch or parse restaurant data from serverless API:', e)
    throw new Error('Could not load restaurant data.')
  }
}
