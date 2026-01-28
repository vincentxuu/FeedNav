/* eslint-disable no-unused-vars */
import { useMemo } from "react";
import { Restaurant, UserFavorite, UserVisitedRestaurant } from "@/types";
import type { Session } from "@/types";
import RestaurantCard from "@/components/RestaurantCard";
import { Flame, Sparkles, Award } from "lucide-react";

interface CuratedSectionsProps {
  restaurants: Restaurant[];
  favorites: UserFavorite[];
  visited: UserVisitedRestaurant[];
  session: Session | null;
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void;
  isMutatingFavorite: boolean;
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void;
  isMutatingVisited: boolean;
}

interface CuratedSectionProps extends CuratedSectionsProps {
  title: string;
  icon: React.ReactNode;
  restaurants: Restaurant[];
}

const CuratedSection = ({ title, icon, restaurants, ...rest }: CuratedSectionProps) => (
  <div className="space-y-4">
    <h2 className="flex items-center text-2xl font-bold tracking-tight">
      {icon}
      <span className="ml-2">{title}</span>
    </h2>
    {restaurants.length > 0 ? (
      <div className="grid grid-flow-col auto-cols-[260px] gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {restaurants.map((r, i) => (
          <RestaurantCard key={r.id} restaurant={r} {...rest} index={i} />
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground">暫無此類餐廳。</p>
    )}
  </div>
);

export const CuratedSections = ({ restaurants, favorites, visited, ...rest }: CuratedSectionsProps) => {
  const enrichedRestaurants = useMemo(() => {
    if (!restaurants) return [];
    const favoriteRestaurantIds = new Set(favorites.map((f) => f.restaurant_id));
    const visitedRestaurantIds = new Set(visited.map((v) => v.restaurant_id));
    return restaurants.map((r) => ({
      ...r,
      is_favorited: favoriteRestaurantIds.has(parseInt(r.id, 10)),
      is_visited: visitedRestaurantIds.has(parseInt(r.id, 10)),
    }));
  }, [restaurants, favorites, visited]);

  const hotRestaurants = useMemo(() => {
    if (!favorites || favorites.length === 0 || !enrichedRestaurants) return [];
    const favoriteCounts: Record<number, number> = favorites.reduce((acc, fav) => {
      acc[fav.restaurant_id] = (acc[fav.restaurant_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return [...enrichedRestaurants]
      .sort((a, b) => (favoriteCounts[parseInt(b.id, 10)] || 0) - (favoriteCounts[parseInt(a.id, 10)] || 0))
      .slice(0, 10);
  }, [enrichedRestaurants, favorites]);

  const newRestaurants = useMemo(() => {
    // NOTE: This is a simulation. Once we move to a database,
    // we can sort by the restaurant's creation date.
    if (!enrichedRestaurants) return [];
    return enrichedRestaurants.slice(-10).reverse();
  }, [enrichedRestaurants]);

  const michelinRestaurants = useMemo(() => {
    if (!enrichedRestaurants) return [];
    return enrichedRestaurants.filter(r => r.tags.some(tag => tag.includes('米其林')));
  }, [enrichedRestaurants]);

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <div className="container space-y-12">
      {hotRestaurants.length > 0 && <CuratedSection title="本週熱門排行" icon={<Flame className="text-red-500" />} restaurants={hotRestaurants} favorites={favorites} visited={visited} {...rest} />}
      {newRestaurants.length > 0 && <CuratedSection title="新進駐店家" icon={<Sparkles className="text-yellow-500" />} restaurants={newRestaurants} favorites={favorites} visited={visited} {...rest} />}
      {michelinRestaurants.length > 0 && <CuratedSection title="米其林精選" icon={<Award className="text-blue-500" />} restaurants={michelinRestaurants} favorites={favorites} visited={visited} {...rest} />}
    </div>
  );
};

export default CuratedSections;