'use client'

import { useMemo } from 'react'
import { Restaurant } from '@/types'
import { Filters } from '@/components/FilterSheet'
import { isRestaurantOpen } from '@/lib/time'

interface UseRestaurantsProps {
  allRestaurants: Restaurant[] | undefined
  filters?: Filters
}

export const useRestaurants = ({ allRestaurants, filters }: UseRestaurantsProps) => {
  const processedRestaurants = useMemo(() => {
    if (!allRestaurants) return []

    // Backend now provides enriched data, so client-side merging is no longer needed.
    const enrichedRestaurants = allRestaurants

    // "Show open only" filter is complex and remains on the client-side for now.
    if (filters?.showOpenOnly) {
      return enrichedRestaurants.filter((r) => isRestaurantOpen(r.opening_hours))
    }

    return enrichedRestaurants
  }, [allRestaurants, filters])

  return {
    restaurants: processedRestaurants,
  }
}
