'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { Session } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyRestaurants } from '@/hooks/useNearbyRestaurants'
import { fetchRestaurants } from '@/queries/restaurants'
import { Filters } from '@/components/FilterSheet'
import { Restaurant } from '@/types'
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants'
import { useAppFilters } from '@/hooks/useAppFilters'

const RESTAURANTS_PER_PAGE = 12

export const useHomePageData = (session: Session | null) => {
  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    handleClearAllFilters,
    handleClearFilter,
    initialFilters,
  } = useAppFilters()

  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, filters])

  const {
    favorites,
    addFavorite,
    removeFavorite,
    isMutating: isMutatingFavorite,
  } = useFavorites(session?.user?.id)

  const { visited, addVisited, removeVisited, isMutatingVisited } = useVisitedRestaurants(
    session?.user?.id
  )

  const { showOpenOnly: _showOpenOnly, ...backendFilters } = filters

  const {
    data: restaurantsFromDB,
    isLoading,
    error,
  } = useQuery<Restaurant[]>({
    queryKey: ['restaurants', searchTerm, sortBy, backendFilters],
    queryFn: () => fetchRestaurants({ searchTerm, sortBy, filters: backendFilters }),
  })

  const { restaurants: filteredRestaurants } = useRestaurants({
    allRestaurants: restaurantsFromDB,
    filters,
  })

  const {
    coordinates: userLocation,
    loading: isLoadingLocation,
    error: locationError,
  } = useGeolocation()

  const { nearbyRestaurants } = useNearbyRestaurants({
    restaurants: restaurantsFromDB || [],
    userLocation,
    favorites,
    visited,
  })

  const hasActiveSearchOrFilters = useMemo(() => {
    const isFiltersChanged =
      filters.district !== initialFilters.district ||
      filters.cuisine !== initialFilters.cuisine ||
      filters.priceRange[0] !== initialFilters.priceRange[0] ||
      filters.priceRange[1] !== initialFilters.priceRange[1] ||
      filters.tags.length > 0 ||
      filters.showOpenOnly !== initialFilters.showOpenOnly

    return searchTerm !== '' || sortBy !== 'default' || isFiltersChanged
  }, [searchTerm, sortBy, filters, initialFilters])

  const totalPages = Math.ceil(filteredRestaurants.length / RESTAURANTS_PER_PAGE)
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * RESTAURANTS_PER_PAGE,
    currentPage * RESTAURANTS_PER_PAGE
  )

  const scrollToResults = () => {
    setTimeout(() => {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 400, behavior: 'smooth' })
      }
    }, 0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    scrollToResults()
  }

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    scrollToResults()
  }

  const handleToggleFavorite = async (restaurantId: number, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await removeFavorite(restaurantId)
        toast({ title: '已從口袋名單移除' })
      } else {
        await addFavorite(restaurantId)
        toast({ title: '已加入口袋名單！' })
      }
    } catch {
      // Error toast is handled in the hook
    }
  }

  const handleToggleVisited = async (restaurantId: number, isVisited: boolean) => {
    try {
      if (isVisited) {
        await removeVisited(restaurantId)
        toast({ title: '已從美食足跡移除' })
      } else {
        await addVisited(restaurantId)
        toast({ title: '已加入美食足跡！' })
      }
    } catch {
      // Error toast is handled in the hook
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    handleFiltersChange,
    allRestaurants: restaurantsFromDB,
    paginatedRestaurants,
    isLoading,
    error,
    isMutatingFavorite,
    handleToggleFavorite,
    hasActiveSearchOrFilters,
    nearbyRestaurants,
    isLoadingLocation,
    locationError,
    favorites,
    visited,
    totalPages,
    currentPage,
    handlePageChange,
    handleClearAllFilters,
    handleClearFilter,
    filteredRestaurants,
    isMutatingVisited,
    handleToggleVisited,
  }
}
