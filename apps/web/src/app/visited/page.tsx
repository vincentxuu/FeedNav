'use client'

import { useAuthSession } from '@/hooks/useAuthSession'
import { useQuery } from '@tanstack/react-query'
import { fetchRestaurants } from '@/queries/restaurants'
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants'
import { useMemo } from 'react'
import type { Restaurant } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import Header from '@/components/layout/Header'
import RestaurantGrid from '@/components/RestaurantGrid'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Footprints } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

export default function VisitedPage() {
  const { session, logout } = useAuthSession()
  const router = useRouter()
  const { toast } = useToast()

  const { visited, removeVisited, addVisited, isMutatingVisited } = useVisitedRestaurants(
    session?.user?.id
  )
  const {
    favorites,
    addFavorite,
    removeFavorite,
    isMutating: isMutatingFavorite,
  } = useFavorites(session?.user?.id)

  const { data: allRestaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: () => fetchRestaurants(),
  })

  const visitedRestaurants = useMemo(() => {
    if (!allRestaurants) return []
    return allRestaurants.filter((r) => r.is_visited)
  }, [allRestaurants])

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

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        session={session}
        handleLogout={handleLogout}
        favorites={favorites || []}
        visited={visited || []}
        searchTerm=""
        setSearchTerm={() => {}}
        sortBy="default"
        setSortBy={() => {}}
        filters={{
          district: 'all',
          cuisine: 'all',
          priceRange: [1, 4],
          tags: [],
          showOpenOnly: false,
        }}
        setFilters={() => {}}
        handleRandomSelect={() => {}}
      />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">
          我的美食足跡 ({visitedRestaurants.length})
        </h1>
        {visitedRestaurants.length > 0 ? (
          <RestaurantGrid
            isLoading={isLoadingRestaurants}
            error={null}
            restaurants={visitedRestaurants}
            session={session}
            onToggleFavorite={handleToggleFavorite}
            isMutatingFavorite={isMutatingFavorite}
            onToggleVisited={handleToggleVisited}
            isMutatingVisited={isMutatingVisited}
            onClearFilters={() => {}}
          />
        ) : (
          <EmptyState
            icon={Footprints}
            title="美食冒險等著你"
            description="吃過的餐廳會留下足跡，記錄你的美食旅程"
            action={{
              label: '開始探索',
              href: '/',
            }}
          />
        )}
      </main>
    </div>
  )
}
