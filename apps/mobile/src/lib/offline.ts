import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState, useCallback } from 'react'
import type { Restaurant } from '@feednav/shared'

const CACHE_KEYS = {
  RESTAURANTS: 'cache:restaurants',
  FAVORITES: 'cache:favorites',
  RECENT_SEARCHES: 'cache:recent_searches',
  USER_PREFERENCES: 'cache:user_preferences',
} as const

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// Network status hook
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected)
      setIsInternetReachable(state.isInternetReachable)
    })

    return () => unsubscribe()
  }, [])

  return {
    isConnected,
    isInternetReachable,
    isOffline: isConnected === false,
  }
}

// Generic cache functions
async function setCache<T>(key: string, data: T, expiryMs = CACHE_EXPIRY_MS): Promise<void> {
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + expiryMs,
  }
  await AsyncStorage.setItem(key, JSON.stringify(cacheItem))
}

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key)
    if (!cached) return null

    const cacheItem: CacheItem<T> = JSON.parse(cached)

    // Check if cache has expired
    if (Date.now() > cacheItem.expiresAt) {
      await AsyncStorage.removeItem(key)
      return null
    }

    return cacheItem.data
  } catch {
    return null
  }
}

async function removeCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(key)
}

// Restaurant cache
export async function cacheRestaurants(restaurants: Restaurant[]): Promise<void> {
  await setCache(CACHE_KEYS.RESTAURANTS, restaurants)
}

export async function getCachedRestaurants(): Promise<Restaurant[] | null> {
  return getCache<Restaurant[]>(CACHE_KEYS.RESTAURANTS)
}

// Favorites cache
export async function cacheFavorites(favorites: Restaurant[]): Promise<void> {
  await setCache(CACHE_KEYS.FAVORITES, favorites)
}

export async function getCachedFavorites(): Promise<Restaurant[] | null> {
  return getCache<Restaurant[]>(CACHE_KEYS.FAVORITES)
}

// Recent searches
export async function addRecentSearch(term: string): Promise<void> {
  const searches = (await getCache<string[]>(CACHE_KEYS.RECENT_SEARCHES)) ?? []
  const filtered = searches.filter((s) => s !== term)
  const updated = [term, ...filtered].slice(0, 10) // Keep last 10
  await setCache(CACHE_KEYS.RECENT_SEARCHES, updated, 7 * 24 * 60 * 60 * 1000) // 7 days
}

export async function getRecentSearches(): Promise<string[]> {
  return (await getCache<string[]>(CACHE_KEYS.RECENT_SEARCHES)) ?? []
}

export async function clearRecentSearches(): Promise<void> {
  await removeCache(CACHE_KEYS.RECENT_SEARCHES)
}

// User preferences
interface UserPreferences {
  favoriteDistricts: string[]
  favoriteCuisines: string[]
  preferredPriceRange: [number, number] | null
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = (await getCache<UserPreferences>(CACHE_KEYS.USER_PREFERENCES)) ?? {
    favoriteDistricts: [],
    favoriteCuisines: [],
    preferredPriceRange: null,
  }
  const updated = { ...current, ...prefs }
  await setCache(CACHE_KEYS.USER_PREFERENCES, updated, 30 * 24 * 60 * 60 * 1000) // 30 days
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  return getCache<UserPreferences>(CACHE_KEYS.USER_PREFERENCES)
}

// Clear all cache
export async function clearAllCache(): Promise<void> {
  const keys = Object.values(CACHE_KEYS)
  await AsyncStorage.multiRemove(keys)
}

// Hook for offline-first data
export function useOfflineData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    cacheTime?: number
    enabled?: boolean
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const { isOffline } = useNetworkStatus()

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to fetch from network first
      if (!isOffline) {
        const freshData = await fetchFn()
        setData(freshData)
        setIsFromCache(false)
        await setCache(key, freshData, options?.cacheTime)
        return
      }

      // Fall back to cache if offline
      const cached = await getCache<T>(key)
      if (cached) {
        setData(cached)
        setIsFromCache(true)
      } else {
        setError(new Error('無網路連線且沒有快取資料'))
      }
    } catch (err) {
      // On error, try to use cache
      const cached = await getCache<T>(key)
      if (cached) {
        setData(cached)
        setIsFromCache(true)
      } else {
        setError(err instanceof Error ? err : new Error('未知錯誤'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, fetchFn, isOffline, options?.cacheTime])

  useEffect(() => {
    if (options?.enabled !== false) {
      refetch()
    }
  }, [options?.enabled])

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch,
  }
}
