import { Restaurant, UserFavorite } from '@/types'

export function getSimilarRestaurants(
  restaurant: Restaurant,
  restaurants: Restaurant[],
  favorites: UserFavorite[]
): Restaurant[] {
  if (!restaurants) return []

  const favoriteRestaurantIds = new Set(favorites.map((f) => f.restaurant_id))

  const recommendations: Restaurant[] = []
  const addedIds = new Set<string>([restaurant.id])

  // 1. By cuisine
  const byCuisine = restaurants.filter(
    (r) => r.cuisine === restaurant.cuisine && !addedIds.has(r.id)
  )
  byCuisine.forEach((r) => {
    recommendations.push(r)
    addedIds.add(r.id)
  })

  // 2. By district, if needed
  if (recommendations.length < 3) {
    const byDistrict = restaurants.filter(
      (r) => r.district === restaurant.district && !addedIds.has(r.id)
    )
    byDistrict.forEach((r) => {
      if (recommendations.length < 3) {
        recommendations.push(r)
        addedIds.add(r.id)
      }
    })
  }

  // 3. By top rating as fallback, if needed
  if (recommendations.length < 3) {
    const sortedByRating = [...restaurants].sort((a, b) => b.rating - a.rating)
    const byRating = sortedByRating.filter((r) => !addedIds.has(r.id))

    byRating.forEach((r) => {
      if (recommendations.length < 3) {
        recommendations.push(r)
        addedIds.add(r.id)
      }
    })
  }

  return recommendations.slice(0, 3).map((r) => ({
    ...r,
    is_favorited: favoriteRestaurantIds.has(parseInt(r.id, 10)),
  }))
}
