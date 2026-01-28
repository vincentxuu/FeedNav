/* eslint-disable no-unused-vars */
import { Restaurant } from '@/types'
import type { Session } from '@/types'
import RestaurantCard from './RestaurantCard'
import { Loader2, MapPinOff } from 'lucide-react'

interface NearbyRestaurantsProps {
  restaurants: (Restaurant & { distance?: number })[]
  session: Session | null
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void
  isMutatingFavorite: boolean
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void
  isMutatingVisited: boolean
  isLoadingLocation: boolean
  locationError: GeolocationPositionError | { message: string } | null
}

const NearbyRestaurants = ({
  restaurants,
  session,
  onToggleFavorite,
  isMutatingFavorite,
  onToggleVisited,
  isMutatingVisited,
  isLoadingLocation,
  locationError,
}: NearbyRestaurantsProps) => {
  if (isLoadingLocation) {
    return (
      <div className="py-8">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">您附近的餐廳</h2>
        <div className="rounded-lg bg-muted py-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">正在取得您的位置...</p>
        </div>
      </div>
    )
  }

  if (locationError) {
    // Silently fail if user denies permission, but show a message for other errors.
    if (locationError.message.includes('denied')) return null

    return (
      <div className="py-8">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">您附近的餐廳</h2>
        <div className="rounded-lg bg-muted py-8 text-center">
          <MapPinOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">無法取得您的位置資訊</p>
          <p className="mt-1 text-xs text-muted-foreground">{locationError.message}</p>
        </div>
      </div>
    )
  }

  if (!restaurants || restaurants.length === 0) {
    return null // Don't show the section if no nearby restaurants found
  }

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">您附近的餐廳</h2>
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
    </div>
  )
}

export default NearbyRestaurants
