import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RestaurantSearchFilters } from '@feednav/shared'
import api from './api'

// Query Keys
export const queryKeys = {
  restaurants: {
    all: ['restaurants'] as const,
    search: (filters?: RestaurantSearchFilters) =>
      [...queryKeys.restaurants.all, 'search', filters] as const,
    detail: (id: string) => [...queryKeys.restaurants.all, 'detail', id] as const,
    nearby: (lat: number, lng: number) =>
      [...queryKeys.restaurants.all, 'nearby', lat, lng] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    list: (page?: number) => [...queryKeys.favorites.all, 'list', page] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: (page?: number) => [...queryKeys.visits.all, 'list', page] as const,
    stats: ['visits', 'stats'] as const,
  },
  tags: ['tags'] as const,
}

// Restaurant Queries
export function useRestaurants(filters?: RestaurantSearchFilters) {
  return useQuery({
    queryKey: queryKeys.restaurants.search(filters),
    queryFn: () => api.searchRestaurants(filters ?? {}),
  })
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id),
    queryFn: () => api.getRestaurant(id),
    enabled: !!id,
  })
}

export function useNearbyRestaurants(lat: number, lng: number, radius = 5) {
  return useQuery({
    queryKey: queryKeys.restaurants.nearby(lat, lng),
    queryFn: () => api.getNearbyRestaurants(lat, lng, radius),
    enabled: !!lat && !!lng,
  })
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api.getTags(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Favorites Queries & Mutations
export function useFavorites(page = 1) {
  return useQuery({
    queryKey: queryKeys.favorites.list(page),
    queryFn: () => api.getFavorites(page),
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (restaurantId: number) => api.addFavorite(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all })
    },
    onError: (error) => {
      console.error('Failed to add favorite:', error)
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (restaurantId: number) => api.removeFavorite(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all })
    },
    onError: (error) => {
      console.error('Failed to remove favorite:', error)
    },
  })
}

// Visits Queries & Mutations
export function useVisits(page = 1) {
  return useQuery({
    queryKey: queryKeys.visits.list(page),
    queryFn: () => api.getVisits(page),
  })
}

export function useVisitStats() {
  return useQuery({
    queryKey: queryKeys.visits.stats,
    queryFn: () => api.getVisitStats(),
  })
}

export function useAddVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (restaurantId: number) => api.addVisit(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
    },
    onError: (error) => {
      console.error('Failed to add visit:', error)
    },
  })
}

export function useRemoveVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (restaurantId: number) => api.removeVisit(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all })
    },
    onError: (error) => {
      console.error('Failed to remove visit:', error)
    },
  })
}
