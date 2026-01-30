'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { UserFavorite } from '@/types'
import { useToast } from '@/hooks/use-toast'

const fetchFavorites = async (userId: string | undefined): Promise<UserFavorite[]> => {
  if (!userId) return []
  const response = await apiClient.getFavorites()
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch favorites')
  }
  // Transform the API response to match UserFavorite type
  return (response.data?.items || []).map((item) => ({
    id: parseInt(item.id, 10),
    user_id: userId,
    restaurant_id: parseInt(item.id, 10),
    created_at: item.is_favorited ? new Date().toISOString() : undefined,
  }))
}

export const useFavorites = (userId: string | undefined) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => fetchFavorites(userId),
    enabled: !!userId,
  })

  const addFavoriteMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      // Debug log for favorite addition
      if (!userId) throw new Error('User not logged in')

      const response = await apiClient.addFavorite(restaurantId)
      if (!response.success) {
        console.error('Error adding favorite restaurant:', response.error)
        throw new Error(response.message || 'Failed to add favorite')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
    onError: () => {
      toast({
        title: '加入口袋名單失敗',
        description: '請稍後再試一次。',
        variant: 'destructive',
      })
    },
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      if (!userId) throw new Error('User not logged in')

      const response = await apiClient.removeFavorite(restaurantId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove favorite')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
    onError: () => {
      toast({
        title: '從口袋名單移除失敗',
        description: '請稍後再試一次。',
        variant: 'destructive',
      })
    },
  })

  return {
    favorites: favorites || [],
    isLoading,
    addFavorite: addFavoriteMutation.mutateAsync,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    isMutating: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  }
}
