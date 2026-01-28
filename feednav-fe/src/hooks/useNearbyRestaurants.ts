
"use client";

import { useMemo } from 'react';
import { Restaurant, UserFavorite, UserVisitedRestaurant } from '@/types';
import { Coordinates } from './useGeolocation';
import { calculateDistance } from '@/lib/location';

interface Props {
    restaurants: Restaurant[];
    userLocation: Coordinates | null;
    favorites: UserFavorite[];
    visited: UserVisitedRestaurant[];
    count?: number;
}

export const useNearbyRestaurants = ({ restaurants, userLocation, favorites, visited, count = 4 }: Props) => {
    const nearbyRestaurants = useMemo(() => {
        if (!userLocation || !restaurants || restaurants.length === 0) {
            return [];
        }
        
        const favoriteRestaurantIds = new Set(favorites.map((f) => f.restaurant_id));
        const visitedRestaurantIds = new Set(visited.map((v) => v.restaurant_id));

        const restaurantsWithDistance = restaurants
          .filter(r => r.latitude != null && r.longitude != null)
          .map(r => ({
            ...r,
            is_favorited: favoriteRestaurantIds.has(parseInt(r.id, 10)),
            is_visited: visitedRestaurantIds.has(parseInt(r.id, 10)),
            distance: calculateDistance(userLocation.latitude, userLocation.longitude, r.latitude!, r.longitude!) 
        }));

        const sorted = restaurantsWithDistance.sort((a, b) => a.distance - b.distance);
        
        return sorted.slice(0, count);

    }, [restaurants, userLocation, favorites, visited, count]);

    return { nearbyRestaurants };
}
