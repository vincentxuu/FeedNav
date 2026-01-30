/* eslint-disable no-unused-vars */
import { Restaurant } from '@/types'
import type { Session } from '@/types'
import RestaurantCard from '@/components/RestaurantCard'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'
import type { LucideIcon } from 'lucide-react'

interface RestaurantGridProps {
  isLoading: boolean
  error: Error | null
  restaurants: Restaurant[]
  session: Session | null
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void
  isMutatingFavorite: boolean
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void
  isMutatingVisited: boolean
  onClearFilters: () => void
  emptyState?: {
    icon: LucideIcon
    title: string
    description: string
    action?: {
      label: string
      href?: string
      onClick?: () => void
    }
  }
}

const RestaurantGrid = ({
  isLoading,
  error,
  restaurants,
  session,
  onToggleFavorite,
  isMutatingFavorite,
  onToggleVisited,
  isMutatingVisited,
  onClearFilters,
  emptyState,
}: RestaurantGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-destructive">無法載入餐廳資料，請稍後再試。</p>
  }

  if (restaurants.length === 0) {
    if (emptyState) {
      return (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      )
    }
    return (
      <div className="flex flex-col items-center space-y-4 py-16 text-center">
        <SearchX className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">找不到符合條件的餐廳</h2>
          <p className="text-muted-foreground">試試調整篩選條件，或許會有意外發現</p>
        </div>
        <Button onClick={onClearFilters}>清除所有篩選條件</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {restaurants.map((restaurant, i) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          session={session}
          onToggleFavorite={onToggleFavorite}
          isMutatingFavorite={isMutatingFavorite}
          onToggleVisited={onToggleVisited}
          isMutatingVisited={isMutatingVisited}
          index={i}
        />
      ))}
    </div>
  )
}

export default RestaurantGrid
