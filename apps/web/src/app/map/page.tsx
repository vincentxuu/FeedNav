'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Restaurant } from '@/types'
import { fetchRestaurantsByBounds, type MapBounds } from '@/queries/restaurants'
import { useFavorites } from '@/hooks/useFavorites'
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants'
import { useAuthSession } from '@/hooks/useAuthSession'
import RestaurantMap from '@/components/RestaurantMap'
import Header from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import FilterSheet from '@/components/FilterSheet'
import ActiveFilters from '@/components/ActiveFilters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutGrid } from 'lucide-react'
import { useAppFilters } from '@/hooks/useAppFilters'

export default function MapPage() {
  const { session, logout } = useAuthSession()
  const [mounted, setMounted] = useState(false)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounce bounds changes to avoid too many API calls
  useEffect(() => {
    if (!mapBounds) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedBounds(mapBounds)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [mapBounds])

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    handleClearAllFilters,
    handleClearFilter,
  } = useAppFilters()

  // Fetch restaurants based on map bounds
  const {
    data: restaurantsFromDB = [],
    isLoading: isLoadingRestaurants,
    isFetching,
  } = useQuery<Restaurant[]>({
    queryKey: ['restaurants-bounds', debouncedBounds],
    queryFn: () => fetchRestaurantsByBounds(debouncedBounds!, 300),
    enabled: !!debouncedBounds,
    staleTime: 30000, // Cache for 30 seconds
  })

  const { favorites } = useFavorites(session?.user?.id)
  const { visited } = useVisitedRestaurants(session?.user?.id)

  // Filter restaurants based on search term and filters
  const filteredRestaurants = restaurantsFromDB.filter((restaurant) => {
    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        restaurant.name?.toLowerCase().includes(search) ||
        restaurant.address?.toLowerCase().includes(search) ||
        restaurant.description?.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // District filter
    if (filters.district && filters.district !== 'all') {
      if (restaurant.district !== filters.district) return false
    }

    // Cuisine filter
    if (filters.cuisine && filters.cuisine !== 'all') {
      if (restaurant.cuisine_type !== filters.cuisine) return false
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      if (restaurant.price_level < min || restaurant.price_level > max) return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const restaurantTags = restaurant.tags?.map((t) => t.name) || []
      const hasAllTags = filters.tags.every((tag) => restaurantTags.includes(tag))
      if (!hasAllTags) return false
    }

    return true
  })

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex h-screen max-h-screen flex-col bg-background">
      <Header
        session={session}
        handleLogout={handleLogout}
        favorites={favorites || []}
        visited={visited || []}
      />
      <div className="flex flex-grow overflow-hidden">
        <aside className="hidden w-80 flex-shrink-0 space-y-4 overflow-y-auto border-r p-4 lg:flex lg:flex-col">
          <div className="p-2">
            <h2 className="text-xl font-bold">地圖瀏覽</h2>
            <p className="text-sm text-muted-foreground">
              透過地圖探索美食，或使用篩選器精準尋找。
            </p>
          </div>
          <div className="relative p-2">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋餐廳名稱..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-grow p-2">
            <FilterSheet
              filters={filters}
              onFiltersChange={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
            <div className="mt-4">
              <ActiveFilters
                filters={filters}
                onClearFilter={handleClearFilter}
                onClearAll={handleClearAllFilters}
                showOnlyFavorites={false}
              />
            </div>
          </div>
          <div className="p-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <LayoutGrid className="mr-2 h-4 w-4" />
                切換列表模式
              </Link>
            </Button>
          </div>
        </aside>
        <main className="relative flex-1">
          {mounted ? (
            <RestaurantMap
              restaurants={filteredRestaurants}
              onBoundsChange={handleBoundsChange}
              isLoading={isFetching}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-gray-100" />
          )}
          <div className="absolute left-4 top-4 z-10 lg:hidden">
            <FilterSheet
              filters={filters}
              onFiltersChange={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
          <div className="absolute bottom-4 right-4 z-10 lg:hidden">
            <Button variant="secondary" asChild className="w-full shadow-lg">
              <Link href="/">
                <LayoutGrid className="mr-2 h-4 w-4" />
                列表模式
              </Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
