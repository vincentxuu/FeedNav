"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useFavorites } from "@/hooks/useFavorites";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useToast } from "@/components/ui/use-toast";
import { useAuthSession } from "@/hooks/useAuthSession";
import Header from "@/components/layout/Header";
import RestaurantGrid from "@/components/RestaurantGrid";
import { Filters } from "@/components/FilterSheet";
import ActiveFilters from "@/components/ActiveFilters";
import RandomSelectorModal from "@/components/RandomSelectorModal";
import { fetchRestaurants } from "@/queries/restaurants";
import type { Restaurant } from "@/types";
import { AppPagination } from "@/components/AppPagination";
import { useVisitedRestaurants } from "@/hooks/useVisitedRestaurants";

const initialFilters: Filters = {
  district: "all",
  cuisine: "all",
  priceRange: [1, 4],
  tags: [],
  showOpenOnly: false,
};

const RESTAURANTS_PER_PAGE = 12;

export default function FavoritesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isRandomSelectorOpen, setRandomSelectorOpen] = useState(false);
  const [restaurantsForRandomSelect, setRestaurantsForRandomSelect] = useState<Restaurant[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const { session, isLoading: isLoadingSession, logout } = useAuthSession();

  useEffect(() => {
    if (!isLoadingSession && !session) {
      router.push('/auth');
    }
  }, [isLoadingSession, session, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, filters]);

  const {
    favorites,
    addFavorite,
    removeFavorite,
    isMutating: isMutatingFavorite,
  } = useFavorites(session?.user?.id);

  const {
    visited,
    addVisited,
    removeVisited,
    isMutatingVisited,
  } = useVisitedRestaurants(session?.user?.id);

  const { showOpenOnly: _showOpenOnly, ...backendFilters } = filters;

  const { data: filteredFromDB, isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ["restaurants", searchTerm, backendFilters, sortBy],
    queryFn: () => fetchRestaurants({ searchTerm, filters: backendFilters, sortBy }),
  });

  const { restaurants } = useRestaurants({
    allRestaurants: filteredFromDB,
    filters,
  });

  const favoriteRestaurants = restaurants.filter(r => r.is_favorited);

  const totalPages = Math.ceil(favoriteRestaurants.length / RESTAURANTS_PER_PAGE);
  const paginatedFavoriteRestaurants = favoriteRestaurants.slice(
    (currentPage - 1) * RESTAURANTS_PER_PAGE,
    currentPage * RESTAURANTS_PER_PAGE
  );

  const scrollToResults = () => {
    setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToResults();
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    scrollToResults();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleToggleFavorite = async (restaurantId: number, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await removeFavorite(restaurantId);
        toast({ title: "已從收藏移除" });
      } else {
        await addFavorite(restaurantId);
        toast({ title: "已加入收藏！" });
      }
    } catch {
      // Error toast is handled in the hook
    }
  };

  const handleToggleVisited = async (restaurantId: number, isVisited: boolean) => {
    try {
      if (isVisited) {
        await removeVisited(restaurantId);
        toast({ title: "已從美食足跡移除" });
      } else {
        await addVisited(restaurantId);
        toast({ title: "已加入美食足跡！" });
      }
    } catch {
      // Error toast is handled in the hook
    }
  };

  const handleRandomSelect = () => {
    if (favoriteRestaurants && favoriteRestaurants.length > 0) {
      setRestaurantsForRandomSelect(favoriteRestaurants);
      setRandomSelectorOpen(true);
    } else {
      toast({
        title: "沒有可選的餐廳",
        description: "您尚未收藏任何餐廳。",
      });
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setFilters(initialFilters);
    toast({
      title: "已清除所有篩選與搜尋條件",
    });
  };

  const handleClearFilter = (
    filterType: 'district' | 'cuisine' | 'priceRange' | 'tags' | 'showOpenOnly',
    value?: string
  ) => {
    const message = "已移除一個篩選條件";
    if (filterType === 'priceRange') {
      setFilters(prev => ({ ...prev, priceRange: [1, 4] }));
    } else if (filterType === 'tags' && value) {
      setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== value)}));
    } else if (filterType === 'district' || filterType === 'cuisine') {
      setFilters(prev => ({ ...prev, [filterType]: 'all' }));
    } else if (filterType === 'showOpenOnly') {
      setFilters(prev => ({ ...prev, showOpenOnly: false }));
    }
    toast({ title: message, duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filters={filters}
        setFilters={handleFiltersChange}
        session={session}
        handleRandomSelect={handleRandomSelect}
        handleLogout={handleLogout}
        favorites={favorites}
        visited={visited}
      />
      <main>
        <div id="main-content" className="container py-8 scroll-mt-20">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">我的收藏</h1>
            <p className="text-muted-foreground">您收藏的餐廳會顯示在這裡。</p>
          </div>
          <ActiveFilters
            filters={filters}
            showOnlyFavorites={false}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAllFilters}
          />
          <RestaurantGrid
            isLoading={isLoading}
            error={error}
            restaurants={paginatedFavoriteRestaurants}
            session={session}
            onToggleFavorite={handleToggleFavorite}
            isMutatingFavorite={isMutatingFavorite}
            onToggleVisited={handleToggleVisited}
            isMutatingVisited={isMutatingVisited}
            onClearFilters={handleClearAllFilters}
          />
          <AppPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-8"
          />
        </div>
      </main>
      <RandomSelectorModal
        isOpen={isRandomSelectorOpen}
        onOpenChange={setRandomSelectorOpen}
        restaurants={restaurantsForRandomSelect}
      />
    </div>
  );
}
