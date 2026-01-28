'use client'

/* eslint-disable no-unused-vars */
import { Restaurant } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Heart, ImageOff, Check } from 'lucide-react'
import type { Session } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface RestaurantCardProps {
  restaurant: Restaurant & { distance?: number }
  session: Session | null
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void
  isMutatingFavorite: boolean
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void
  isMutatingVisited: boolean
  index?: number
}

const RestaurantCard = ({
  restaurant,
  session,
  onToggleFavorite,
  isMutatingFavorite,
  onToggleVisited,
  isMutatingVisited,
  index = 0,
}: RestaurantCardProps) => {
  const priceDisplay = '$'.repeat(restaurant.price_level)
  const { toast } = useToast()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      toast({
        title: '請先登入',
        description: '登入後即可收藏您喜愛的餐廳。',
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push('/auth')}>
            前往登入
          </Button>
        ),
      })
      return
    }
    onToggleFavorite(parseInt(restaurant.id, 10), !!restaurant.is_favorited)
  }

  const handleVisitedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      toast({
        title: '請先登入',
        description: '登入後即可記錄您的美食足跡。',
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push('/auth')}>
            前往登入
          </Button>
        ),
      })
      return
    }
    onToggleVisited(parseInt(restaurant.id, 10), !!restaurant.is_visited)
  }

  const favoriteButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
      onClick={handleFavoriteClick}
      disabled={session ? isMutatingFavorite : false}
      aria-label="收藏"
    >
      <Heart
        className={`h-4 w-4 transition-all ${session && restaurant.is_favorited ? 'fill-current text-red-500' : 'text-white'}`}
      />
    </Button>
  )

  const visitedButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
      onClick={handleVisitedClick}
      disabled={session ? isMutatingVisited : false}
      aria-label="吃過了"
    >
      <Check
        className={`h-5 w-5 transition-all ${session && restaurant.is_visited ? 'text-green-400' : 'text-white'}`}
      />
    </Button>
  )

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="animate-fade-in group flex h-full"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <Card className="flex h-full w-full flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02] group-hover:shadow-xl">
        <div className="relative">
          {imageError ? (
            <div className="flex h-40 w-full items-center justify-center bg-muted">
              <ImageOff className="h-10 w-10 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={restaurant.image_url || '/placeholder-restaurant.jpg'}
              alt={restaurant.name}
              width={400}
              height={160}
              className="h-40 w-full object-cover"
              onError={handleImageError}
              unoptimized
            />
          )}
          <div className="absolute right-2 top-2">
            {session ? (
              favoriteButton
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>{favoriteButton}</TooltipTrigger>
                <TooltipContent>
                  <p>登入即可收藏</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="absolute left-2 top-2">
            {session ? (
              visitedButton
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>{visitedButton}</TooltipTrigger>
                <TooltipContent>
                  <p>登入以標記「吃過了」</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <CardContent className="flex flex-grow flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate pr-1 text-base font-semibold leading-tight">
              {restaurant.name}
            </h3>
            <div className="flex shrink-0 items-center">
              <Star className="mr-1 h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {restaurant.district} · {restaurant.cuisine} · {priceDisplay}
            {restaurant.distance !== undefined && ` · 距離 ${restaurant.distance.toFixed(1)} 公里`}
          </p>
          <div className="flex-grow" />
          <div className="mt-2 min-h-[52px]">
            {/* Expanded view on hover */}
            <div className="hidden flex-wrap gap-1 group-hover:flex">
              {restaurant.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-1.5 py-0.5 text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
            {/* Collapsed view by default */}
            <div className="flex flex-wrap gap-1 group-hover:hidden">
              {restaurant.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="px-1.5 py-0.5 text-xs font-normal">
                  {tag}
                </Badge>
              ))}
              {restaurant.tags.length > 3 && (
                <Badge variant="outline" className="px-1.5 py-0.5 text-xs font-normal">
                  +{restaurant.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default RestaurantCard
