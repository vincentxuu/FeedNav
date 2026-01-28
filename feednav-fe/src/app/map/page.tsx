'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Restaurant } from '@/types'
import { fetchRestaurants } from '@/queries/restaurants'
import { useFavorites } from '@/hooks/useFavorites'
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants'
import { useRestaurants } from '@/hooks/useRestaurants'
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

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const {
    data: restaurantsFromDB,
    isLoading: isLoadingRestaurants,
    error: restaurantsError,
  } = useQuery<Restaurant[]>({
    queryKey: ['restaurants', searchTerm, filters, sortBy],
    queryFn: () => fetchRestaurants({ searchTerm, filters, sortBy }),
  })

  const { favorites } = useFavorites(session?.user?.id)
  const { visited } = useVisitedRestaurants(session?.user?.id)

  const { restaurants: filteredRestaurants } = useRestaurants({
    allRestaurants: restaurantsFromDB,
    filters,
  })

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
            <RestaurantMap restaurants={filteredRestaurants} />
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
