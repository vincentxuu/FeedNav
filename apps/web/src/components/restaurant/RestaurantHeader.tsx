import React from 'react'
import { Restaurant } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Heart, Check } from 'lucide-react'
import type { Session } from '@/types'

interface RestaurantHeaderProps {
  restaurant: Restaurant
  session: Session | null
  isFavorited: boolean
  isMutating: boolean
  onToggleFavorite: () => void
  isVisited: boolean
  isMutatingVisited: boolean
  onToggleVisited: () => void
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurant,
  session,
  isFavorited,
  isMutating,
  onToggleFavorite,
  isVisited,
  isMutatingVisited,
  onToggleVisited,
}) => {
  return (
    <>
      <div
        className="animate-fade-in flex items-start justify-between"
        style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
      >
        <h1 className="mb-2 text-3xl font-bold tracking-tight lg:text-4xl">{restaurant.name}</h1>
        {session && (
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onToggleVisited}
              disabled={isMutatingVisited}
              aria-label="吃過了"
            >
              <Check
                className={`h-7 w-7 transition-all ${isVisited ? 'text-green-500' : 'text-muted-foreground'}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onToggleFavorite}
              disabled={isMutating}
              aria-label="收藏"
            >
              <Heart
                className={`h-7 w-7 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
              />
            </Button>
          </div>
        )}
      </div>
      <div
        className="animate-fade-in mb-2 flex items-center gap-4 text-muted-foreground"
        style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
      >
        <span>{restaurant.district}</span>
        <span>·</span>
        <span>{'$'.repeat(restaurant.price_level)}</span>
      </div>

      <div
        className="animate-fade-in mb-6 flex items-center gap-4"
        style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center">
          <Star className="mr-1 h-5 w-5 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold text-foreground">{restaurant.rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {restaurant.tags?.map((tag) => (
            <Badge key={tag.id || tag.name} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </>
  )
}

export default RestaurantHeader
