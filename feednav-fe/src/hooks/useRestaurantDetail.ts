"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@/types";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { fetchRestaurants } from "@/queries/restaurants";
import { getSimilarRestaurants } from "@/lib/recommendations";
import { useVisitedRestaurants } from "@/hooks/useVisitedRestaurants";

export const useRestaurantDetail = (id: string) => {
  const { toast } = useToast();
  const { session, user } = useAuthSession();

  const { data: restaurants, isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: () => fetchRestaurants()
  });

  const restaurant = useMemo(() => {
    return restaurants?.find(r => r.id === id);
  }, [restaurants, id]);

  const { favorites, addFavorite, removeFavorite, isMutating } = useFavorites(user?.id);
  const { visited: _visited, addVisited, removeVisited, isMutatingVisited } = useVisitedRestaurants(user?.id);

  const isFavorited = useMemo(() => {
    return restaurant?.is_favorited ?? false;
  }, [restaurant]);

  const isVisited = useMemo(() => {
    return restaurant?.is_visited ?? false;
  }, [restaurant]);

  const toggleFavorite = async (restaurantId: number, isFavorited: boolean) => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "登入後才能收藏餐廳喔！",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorited) {
        await removeFavorite(restaurantId);
        toast({
          title: "已取消收藏",
        });
      } else {
        await addFavorite(restaurantId);
        toast({
          title: "已收藏！",
        });
      }
    } catch {
      // The useFavorites hook handles error toasts
    }
  };

  const toggleVisited = async (restaurantId: number, isVisited: boolean) => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "登入後才能標記喔！",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isVisited) {
        await removeVisited(restaurantId);
        toast({
          title: "已從美食足跡移除",
        });
      } else {
        await addVisited(restaurantId);
        toast({
          title: "已加入美食足跡！",
        });
      }
    } catch {
      // The useVisitedRestaurants hook handles error toasts
    }
  };

  const similarRestaurants = useMemo(() => {
    if (!restaurant || !restaurants) return [];
    return getSimilarRestaurants(restaurant, restaurants, favorites);
  }, [restaurant, restaurants, favorites]);

  return {
    restaurant,
    similarRestaurants,
    isFavorited,
    isVisited,
    isLoading,
    error,
    session,
    user,
    isMutating,
    isMutatingVisited,
    toggleFavorite,
    toggleVisited,
  };
};
