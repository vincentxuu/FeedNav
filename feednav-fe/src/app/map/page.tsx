"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Restaurant } from '@/types';
import { fetchRestaurants } from '@/queries/restaurants';
import { useFavorites } from '@/hooks/useFavorites';
import { useVisitedRestaurants } from '@/hooks/useVisitedRestaurants';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useAuthSession } from '@/hooks/useAuthSession';
import RestaurantMap from '@/components/RestaurantMap';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import FilterSheet from '@/components/FilterSheet';
import ActiveFilters from '@/components/ActiveFilters';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppFilters } from '@/hooks/useAppFilters';

export default function MapPage() {
    const { session, logout } = useAuthSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        handleClearAllFilters,
        handleClearFilter,
    } = useAppFilters();

    const { data: restaurantsFromDB, isLoading: isLoadingRestaurants, error: restaurantsError } = useQuery<Restaurant[]>({
        queryKey: ['restaurants', searchTerm, filters, sortBy],
        queryFn: () => fetchRestaurants({ searchTerm, filters, sortBy })
    });

    const { favorites, isLoading: isLoadingFavorites } = useFavorites(session?.user?.id);
    const { visited, isLoadingVisited } = useVisitedRestaurants(session?.user?.id);

    const { restaurants: filteredRestaurants } = useRestaurants({
        allRestaurants: restaurantsFromDB,
        filters,
    });

    const handleLogout = async () => {
        await logout();
    };

    const isLoading = isLoadingRestaurants || isLoadingFavorites || isLoadingVisited;

    const PageSkeleton = () => (
        <div className="flex flex-col h-screen">
            <div className="border-b p-4"><Skeleton className="h-8 w-48" /></div>
            <div className="flex-grow flex">
                <aside className="w-96 p-6 space-y-6 border-r hidden lg:block">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </aside>
                <main className="flex-1 relative">
                    <Skeleton className="absolute inset-0" />
                </main>
            </div>
        </div>
    );

    if (isLoading) {
        return <PageSkeleton />;
    }

    if (restaurantsError) {
        return <div>Error loading restaurants.</div>;
    }

    return (
        <div className="flex flex-col h-screen max-h-screen bg-background">
            <Header
                session={session}
                handleLogout={handleLogout}
                favorites={favorites || []}
                visited={visited || []}
            />
            <div className="flex-grow flex overflow-hidden">
                <aside className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r hidden lg:flex lg:flex-col">
                    <div className="p-2">
                        <h2 className="text-xl font-bold">地圖瀏覽</h2>
                        <p className="text-sm text-muted-foreground">透過地圖探索美食，或使用篩選器精準尋找。</p>
                    </div>
                    <div className="relative p-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜尋餐廳名稱..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="p-2 flex-grow">
                        <FilterSheet
                            filters={filters}
                            onFiltersChange={setFilters}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                        />
                         <div className="mt-4">
                            <ActiveFilters
                                filters={filters}
                                onClearFilter={handleClearFilter}
                                onClearAll={handleClearAllFilters}
                                showOnlyFavorites={false}
                            />
                        </div>
                    </div>
                    <div className="p-2">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/">
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                切換列表模式
                            </Link>
                        </Button>
                    </div>
                </aside>
                <main className="flex-1 relative">
                    {mounted ? (
                        <RestaurantMap restaurants={filteredRestaurants} />
                    ) : (
                        <div className="w-full h-full bg-gray-100 animate-pulse" />
                    )}
                    <div className="absolute top-4 left-4 z-10 lg:hidden">
                        <FilterSheet
                            filters={filters}
                            onFiltersChange={setFilters}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                        />
                    </div>
                     <div className="absolute bottom-4 right-4 z-10 lg:hidden">
                        <Button variant="secondary" asChild className="w-full shadow-lg">
                            <Link href="/">
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                列表模式
                            </Link>
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
