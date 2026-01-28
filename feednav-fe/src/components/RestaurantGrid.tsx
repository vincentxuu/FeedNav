/* eslint-disable no-unused-vars */
import { Restaurant } from "@/types";
import type { Session } from "@/types";
import RestaurantCard from "@/components/RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestaurantGridProps {
  isLoading: boolean;
  error: Error | null;
  restaurants: Restaurant[];
  session: Session | null;
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void;
  isMutatingFavorite: boolean;
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void;
  isMutatingVisited: boolean;
  onClearFilters: () => void;
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
}: RestaurantGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    );
  }

  if (error) {
    return <p className="text-center text-destructive">無法載入餐廳資料，請稍後再試。</p>;
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center space-y-4">
        <SearchX className="w-16 h-16 text-muted-foreground" />
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">找不到符合條件的餐廳</h2>
          <p className="text-muted-foreground">請嘗試調整或清除您的搜尋與篩選條件。</p>
        </div>
        <Button onClick={onClearFilters}>清除所有篩選條件</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  );
};

export default RestaurantGrid;