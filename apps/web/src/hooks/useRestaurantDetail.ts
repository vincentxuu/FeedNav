'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Restaurant } from '@/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useFavorites } from '@/hooks/useFavorites'
import { useToast } from '@/hooks/use-toast'
import { fetchRestaurants } from '@/queries/restaurants'
import { getSimilarRestaurants } from '@/lib/recommendations'
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants'
import { apiClient } from '@/lib/api-client'

export const useRestaurantDetail = (id: string) => {
  const { toast } = useToast()
  const { session, user } = useAuthSession()

  // Fetch single restaurant by ID
  const {
    data: restaurantData,
    isLoading: isLoadingRestaurant,
    error: restaurantError,
  } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const response = await apiClient.getRestaurant(id)
      if (!response.success || !response.data) {
        throw new Error('Restaurant not found')
      }
      return response.data
    },
  })

  // Fetch all restaurants for similar recommendations
  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: () => fetchRestaurants(),
  })

  const restaurant = restaurantData?.restaurant as Restaurant | undefined
  const isLoading = isLoadingRestaurant
  const error = restaurantError

  const { favorites, addFavorite, removeFavorite, isMutating } = useFavorites(user?.id)
  const {
    visited: _visited,
    addVisited,
    removeVisited,
    isMutatingVisited,
  } = useVisitedRestaurants(user?.id)

  const isFavorited = useMemo(() => {
    return restaurant?.is_favorited ?? false
  }, [restaurant])

  const isVisited = useMemo(() => {
    return restaurant?.is_visited ?? false
  }, [restaurant])

  const toggleFavorite = async (restaurantId: number, isFavorited: boolean) => {
    if (!user) {
      toast({
        title: '請先登入',
        description: '登入後才能收藏餐廳喔！',
        variant: 'destructive',
      })
      return
    }

    try {
      if (isFavorited) {
        await removeFavorite(restaurantId)
        toast({
          title: '已取消收藏',
        })
      } else {
        await addFavorite(restaurantId)
        toast({
          title: '已收藏！',
        })
      }
    } catch {
      // The useFavorites hook handles error toasts
    }
  }

  const toggleVisited = async (restaurantId: number, isVisited: boolean) => {
    if (!user) {
      toast({
        title: '請先登入',
        description: '登入後才能標記喔！',
        variant: 'destructive',
      })
      return
    }

    try {
      if (isVisited) {
        await removeVisited(restaurantId)
        toast({
          title: '已從美食足跡移除',
        })
      } else {
        await addVisited(restaurantId)
        toast({
          title: '已加入美食足跡！',
        })
      }
    } catch {
      // The useVisitedRestaurants hook handles error toasts
    }
  }

  const similarRestaurants = useMemo(() => {
    if (!restaurant || !restaurants) return []
    return getSimilarRestaurants(restaurant, restaurants, favorites)
  }, [restaurant, restaurants, favorites])

  return {
    restaurant,
    similarRestaurants,
    isFavorited,
    isVisited,
    isLoading,
    error,
    session,
    user,
    isMutating,
    isMutatingVisited,
    toggleFavorite,
    toggleVisited,
  }
}
