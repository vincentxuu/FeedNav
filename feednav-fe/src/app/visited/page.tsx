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
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
        toast({ title: '已從收藏移除' })
      } else {
        await addFavorite(restaurantId)
        toast({ title: '已加入收藏！' })
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
          <div className="flex flex-col items-center space-y-4 py-16 text-center">
            <h2 className="text-2xl font-semibold">還沒有任何美食足跡</h2>
            <p className="text-muted-foreground">快去探索美食，並將它們標記為「吃過了」吧！</p>
            <Button asChild>
              <Link href="/">開始探索</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
