"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

import { useAuthSession } from "@/hooks/useAuthSession";
import { useHomePageData } from "@/hooks/useHomePageData";

import Header from "@/components/layout/Header";
import RestaurantGrid from "@/components/RestaurantGrid";
import ActiveFilters from "@/components/ActiveFilters";
import RandomSelectorModal from "@/components/RandomSelectorModal";
import HeroSection from "@/components/HeroSection";
import CuratedSections from "@/components/CuratedSections";
import NearbyRestaurants from "@/components/NearbyRestaurants";
import { AppPagination } from "@/components/AppPagination";
import type { Restaurant, UserVisitedRestaurant } from "@/types";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const { session, logout } = useAuthSession();

  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    handleFiltersChange,
    allRestaurants,
    paginatedRestaurants,
    isLoading,
    error,
    isMutatingFavorite,
    handleToggleFavorite,
    hasActiveSearchOrFilters,
    nearbyRestaurants,
    isLoadingLocation,
    locationError,
    favorites,
    visited,
    totalPages,
    currentPage,
    handlePageChange,
    handleClearAllFilters,
    handleClearFilter,
    filteredRestaurants,
    isMutatingVisited,
    handleToggleVisited,
  } = useHomePageData(session);

  const [isRandomSelectorOpen, setRandomSelectorOpen] = useState(false);
  const [restaurantsForRandomSelect, setRestaurantsForRandomSelect] = useState<(Restaurant & { distance?: number })[]>([]);

  const openRandomSelector = (restaurants: (Restaurant & { distance?: number })[]) => {
    if (restaurants && restaurants.length > 0) {
      setRestaurantsForRandomSelect(restaurants);
      setRandomSelectorOpen(true);
    } else {
      toast({
        title: "沒有可選的餐廳",
        description: "請嘗試放寬您的篩選條件。",
      });
    }
  };

  const handleHeaderRandomSelect = () => {
    openRandomSelector(filteredRestaurants);
  };

  const handleHeroRandomSelect = () => {
    const selectionPool = (nearbyRestaurants && nearbyRestaurants.length > 0) ? nearbyRestaurants : (filteredRestaurants || []);
    openRandomSelector(selectionPool);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
        handleRandomSelect={handleHeaderRandomSelect}
        handleLogout={handleLogout}
        favorites={favorites}
        visited={visited}
      />
      <main>
        {!hasActiveSearchOrFilters && (
          <>
            <HeroSection onRandomSelect={handleHeroRandomSelect} />
            <div className="container">
              <NearbyRestaurants
                restaurants={nearbyRestaurants}
                session={session}
                onToggleFavorite={handleToggleFavorite}
                isMutatingFavorite={isMutatingFavorite}
                onToggleVisited={handleToggleVisited}
                isMutatingVisited={isMutatingVisited}
                isLoadingLocation={isLoadingLocation}
                locationError={locationError}
              />
            </div>
            <CuratedSections
              restaurants={allRestaurants || []}
              favorites={favorites}
              visited={visited as UserVisitedRestaurant[]}
              session={session}
              onToggleFavorite={handleToggleFavorite}
              isMutatingFavorite={isMutatingFavorite}
              onToggleVisited={handleToggleVisited}
              isMutatingVisited={isMutatingVisited}
            />
          </>
        )}
        <div id="main-content" className="container py-8 scroll-mt-20">
          <ActiveFilters
            filters={filters}
            showOnlyFavorites={false}
            onClearFilter={handleClearFilter}
            onClearAll={handleClearAllFilters}
          />
          <RestaurantGrid
            isLoading={isLoading}
            error={error}
            restaurants={paginatedRestaurants}
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
