"use client";

/* eslint-disable no-unused-vars */
import { Restaurant } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ImageOff, Check } from "lucide-react";
import type { Session } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface RestaurantCardProps {
  restaurant: Restaurant & { distance?: number };
  session: Session | null;
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void;
  isMutatingFavorite: boolean;
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void;
  isMutatingVisited: boolean;
  index?: number;
}

const RestaurantCard = ({ restaurant, session, onToggleFavorite, isMutatingFavorite, onToggleVisited, isMutatingVisited, index = 0 }: RestaurantCardProps) => {
  const priceDisplay = "$".repeat(restaurant.price_level);
  const { toast } = useToast();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      toast({
        title: "請先登入",
        description: "登入後即可收藏您喜愛的餐廳。",
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push('/auth')}>
            前往登入
          </Button>
        ),
      });
      return;
    }
    onToggleFavorite(parseInt(restaurant.id, 10), !!restaurant.is_favorited);
  }

  const handleVisitedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      toast({
        title: "請先登入",
        description: "登入後即可記錄您的美食足跡。",
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push('/auth')}>
            前往登入
          </Button>
        ),
      });
      return;
    }
    onToggleVisited(parseInt(restaurant.id, 10), !!restaurant.is_visited);
  }
  
  const favoriteButton = (
     <Button
      variant="ghost"
      size="icon"
      className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
      onClick={handleFavoriteClick}
      disabled={session ? isMutatingFavorite : false}
      aria-label="收藏"
    >
      <Heart className={`w-4 h-4 transition-all ${session && restaurant.is_favorited ? 'text-red-500 fill-current' : 'text-white'}`} />
    </Button>
  );

  const visitedButton = (
    <Button
      variant="ghost"
      size="icon"
      className="bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
      onClick={handleVisitedClick}
      disabled={session ? isMutatingVisited : false}
      aria-label="吃過了"
    >
      <Check className={`w-5 h-5 transition-all ${session && restaurant.is_visited ? 'text-green-400' : 'text-white'}`} />
    </Button>
  );

  return (
    <Link 
      href={`/restaurant/${restaurant.id}`} 
      className="flex h-full group animate-fade-in"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <Card className="flex flex-col h-full w-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:scale-[1.02]">
        <div className="relative">
          {imageError ? (
            <div className="w-full h-40 bg-muted flex items-center justify-center">
              <ImageOff className="w-10 h-10 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={restaurant.image_url || '/placeholder-restaurant.jpg'}
              alt={restaurant.name}
              width={400}
              height={160}
              className="object-cover w-full h-40"
              onError={handleImageError}
              unoptimized
            />
          )}
          <div className="absolute top-2 right-2">{session ? favoriteButton : <Tooltip><TooltipTrigger asChild>{favoriteButton}</TooltipTrigger><TooltipContent><p>登入即可收藏</p></TooltipContent></Tooltip>}</div>
          <div className="absolute top-2 left-2">{session ? visitedButton : <Tooltip><TooltipTrigger asChild>{visitedButton}</TooltipTrigger><TooltipContent><p>登入以標記「吃過了」</p></TooltipContent></Tooltip>}</div>
        </div>
        <CardContent className="p-3 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-base leading-tight truncate pr-1">{restaurant.name}</h3>
            <div className="flex items-center shrink-0">
              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {restaurant.district} · {restaurant.cuisine} · {priceDisplay}
            {restaurant.distance !== undefined && ` · 距離 ${restaurant.distance.toFixed(1)} 公里`}
          </p>
          <div className="flex-grow" />
          <div className="mt-2 min-h-[52px]">
            {/* Expanded view on hover */}
            <div className="hidden flex-wrap gap-1 group-hover:flex">
              {restaurant.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
            {/* Collapsed view by default */}
            <div className="flex flex-wrap gap-1 group-hover:hidden">
              {restaurant.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {restaurant.tags.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal px-1.5 py-0.5">
                  +{restaurant.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RestaurantCard;