/* eslint-disable no-unused-vars */
import React from 'react';
import { Restaurant } from '@/types';
import type { Session } from '@/types';
import RestaurantCard from '@/components/RestaurantCard';

interface SimilarRestaurantsProps {
  restaurants: Restaurant[];
  session: Session | null;
  onToggleFavorite: (restaurantId: number, isFavorited: boolean) => void;
  isMutatingFavorite: boolean;
  onToggleVisited: (restaurantId: number, isVisited: boolean) => void;
  isMutatingVisited: boolean;
}

const SimilarRestaurants: React.FC<SimilarRestaurantsProps> = ({
  restaurants,
  session,
  onToggleFavorite,
  isMutatingFavorite,
  onToggleVisited,
  isMutatingVisited,
}) => {
  if (restaurants.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 animate-fade-in" style={{ animationDelay: '1000ms', animationFillMode: 'backwards' }}>
      <h2 className="text-2xl font-bold tracking-tight mb-6">您可能也會喜歡</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {restaurants.map((resto, index) => (
          <RestaurantCard
            key={resto.id}
            restaurant={resto}
            session={session}
            onToggleFavorite={onToggleFavorite}
            isMutatingFavorite={isMutatingFavorite}
            onToggleVisited={onToggleVisited}
            isMutatingVisited={isMutatingVisited}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarRestaurants;