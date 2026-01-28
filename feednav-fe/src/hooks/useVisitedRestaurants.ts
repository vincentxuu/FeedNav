"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserVisitedRestaurant, Restaurant } from '@/types';
import { useToast } from "@/hooks/use-toast";

const fetchVisited = async (userId: string | undefined): Promise<UserVisitedRestaurant[]> => {
  if (!userId) return [];
  const response = await apiClient.getVisits();
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch visited restaurants');
  }
  // Transform the API response to match UserVisitedRestaurant type
  return (response.data?.items || []).map((item: Restaurant) => ({
    id: parseInt(item.id, 10),
    user_id: userId,
    restaurant_id: parseInt(item.id, 10),
    created_at: item.is_visited ? new Date().toISOString() : undefined,
  }));
};

export const useVisitedRestaurants = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: visited, isLoading } = useQuery({
    queryKey: ['visited', userId],
    queryFn: () => fetchVisited(userId),
    enabled: !!userId,
  });

  const addVisitedMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      // Debug log for visited addition
      if (!userId) throw new Error("User not logged in");
      
      const response = await apiClient.addVisit(restaurantId);
      if (!response.success) {
        console.error('Error adding visited restaurant:', response.error);
        throw new Error(response.message || 'Failed to add visited restaurant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visited', userId] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
    onError: () => {
       toast({
        title: "標記為「吃過了」失敗",
        description: "請稍後再試一次。",
        variant: "destructive",
      });
    }
  });

  const removeVisitedMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
       if (!userId) throw new Error("User not logged in");
      
      const response = await apiClient.removeVisit(restaurantId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove visited restaurant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visited', userId] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
     onError: () => {
       toast({
        title: "取消「吃過了」標記失敗",
        description: "請稍後再試一次。",
        variant: "destructive",
      });
    }
  });

  return {
    visited: visited || [],
    isLoadingVisited: isLoading,
    addVisited: addVisitedMutation.mutateAsync,
    removeVisited: removeVisitedMutation.mutateAsync,
    isMutatingVisited: addVisitedMutation.isPending || removeVisitedMutation.isPending,
  };
};
