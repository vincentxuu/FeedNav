import React from "react";
import { Restaurant } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Check } from "lucide-react";
import type { Session } from "@/types";

interface RestaurantHeaderProps {
  restaurant: Restaurant;
  session: Session | null;
  isFavorited: boolean;
  isMutating: boolean;
  onToggleFavorite: () => void;
  isVisited: boolean;
  isMutatingVisited: boolean;
  onToggleVisited: () => void;
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
      <div className="flex items-start justify-between animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-2">{restaurant.name}</h1>
        {session && (
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onToggleVisited}
              disabled={isMutatingVisited}
              aria-label="吃過了"
            >
              <Check className={`w-7 h-7 transition-all ${isVisited ? 'text-green-500' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onToggleFavorite}
              disabled={isMutating}
              aria-label="收藏"
            >
              <Heart className={`w-7 h-7 transition-all ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mb-2 text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
        <span>{restaurant.district}</span>
        <span>·</span>
        <span>{"$".repeat(restaurant.price_level)}</span>
      </div>

      <div className="flex items-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <div className="flex items-center">
          <Star className="w-5 h-5 mr-1 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-foreground">{restaurant.rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {restaurant.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
};

export default RestaurantHeader;