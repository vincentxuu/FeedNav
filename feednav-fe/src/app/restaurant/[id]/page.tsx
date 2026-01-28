"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageOff } from "lucide-react";
import RestaurantHeader from "@/components/restaurant/RestaurantHeader";
import RestaurantInfo from "@/components/restaurant/RestaurantInfo";
import RestaurantMapSection from "@/components/restaurant/RestaurantMapSection";
import SimilarRestaurants from "@/components/restaurant/SimilarRestaurants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantDetailSkeleton from "@/components/restaurant/RestaurantDetailSkeleton";
import RestaurantNotFound from "@/components/restaurant/RestaurantNotFound";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import { useState, use } from "react";

interface RestaurantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { id } = use(params);
  const {
    restaurant,
    similarRestaurants,
    isFavorited,
    isVisited,
    isLoading,
    error,
    session,
    isMutating,
    isMutatingVisited,
    toggleFavorite,
    toggleVisited,
  } = useRestaurantDetail(id);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleHeaderToggleFavorite = () => {
    if (!restaurant) return;
    toggleFavorite(parseInt(restaurant.id, 10), isFavorited);
  }

  const handleHeaderToggleVisited = () => {
    if (!restaurant) return;
    toggleVisited(parseInt(restaurant.id, 10), isVisited);
  }

  if (isLoading) {
    return <RestaurantDetailSkeleton />;
  }

  if (error) {
    return <div className="text-center py-16 text-destructive">無法載入餐廳資料。</div>;
  }

  if (!restaurant) {
    return <RestaurantNotFound />;
  }

  const hasCoordinates = restaurant.latitude != null && restaurant.longitude != null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container py-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Link>
        </Button>
      </header>
      <main className="container pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-lg mb-8 bg-muted">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-16 h-16 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={restaurant.image_url || '/placeholder-restaurant.jpg'}
                alt={restaurant.name}
                width={800}
                height={320}
                className="w-full h-full object-cover"
                onError={handleImageError}
                unoptimized
              />
            )}
          </div>

          <div className="mb-8">
              <RestaurantHeader
                restaurant={restaurant}
                session={session}
                isFavorited={isFavorited}
                isMutating={isMutating}
                onToggleFavorite={handleHeaderToggleFavorite}
                isVisited={isVisited}
                isMutatingVisited={isMutatingVisited}
                onToggleVisited={handleHeaderToggleVisited}
              />
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 items-start">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>詳細資訊</CardTitle>
                </CardHeader>
                <CardContent>
                  <RestaurantInfo restaurant={restaurant} />
                </CardContent>
              </Card>
            </div>
            {hasCoordinates && (
              <div className="h-full">
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>餐廳位置</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow">
                    <RestaurantMapSection restaurant={restaurant} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <SimilarRestaurants
            restaurants={similarRestaurants}
            session={session}
            onToggleFavorite={toggleFavorite}
            isMutatingFavorite={isMutating}
            onToggleVisited={toggleVisited}
            isMutatingVisited={isMutatingVisited}
          />
        </div>
      </main>
    </div>
  );
}
