import { useState, useEffect, useCallback } from 'react'
import * as Location from 'expo-location'
import { MAP_CONFIG } from '@feednav/shared'

interface LocationState {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
}

interface UseLocationResult {
  location: LocationState | null
  error: string | null
  isLoading: boolean
  hasPermission: boolean | null
  requestPermission: () => Promise<boolean>
  refreshLocation: () => Promise<void>
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      const granted = status === 'granted'
      setHasPermission(granted)

      if (!granted) {
        setError('需要位置權限才能顯示附近餐廳')
      }

      return granted
    } catch (err) {
      setError('無法請求位置權限')
      setHasPermission(false)
      return false
    }
  }, [])

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check permission first
      const { status } = await Location.getForegroundPermissionsAsync()

      if (status !== 'granted') {
        setHasPermission(false)
        // Use default location (Taipei)
        setLocation({
          latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
          longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
          accuracy: null,
          timestamp: Date.now(),
        })
        return
      }

      setHasPermission(true)

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp,
      })
    } catch (err) {
      // Fallback to default location
      setLocation({
        latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
        longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
        accuracy: null,
        timestamp: Date.now(),
      })

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('無法取得目前位置')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    if (hasPermission) {
      await getCurrentLocation()
    } else {
      const granted = await requestPermission()
      if (granted) {
        await getCurrentLocation()
      }
    }
  }, [hasPermission, requestPermission, getCurrentLocation])

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  return {
    location,
    error,
    isLoading,
    hasPermission,
    requestPermission,
    refreshLocation,
  }
}

export function useWatchLocation(enabled = true): UseLocationResult & { isWatching: boolean } {
  const baseResult = useLocation()
  const [isWatching, setIsWatching] = useState(false)

  useEffect(() => {
    if (!enabled || !baseResult.hasPermission) return

    let subscription: Location.LocationSubscription | null = null

    const startWatching = async () => {
      setIsWatching(true)
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 50, // 50 meters
        },
        (newLocation) => {
          // Update would happen through the base hook
        }
      )
    }

    startWatching()

    return () => {
      if (subscription) {
        subscription.remove()
      }
      setIsWatching(false)
    }
  }, [enabled, baseResult.hasPermission])

  return {
    ...baseResult,
    isWatching,
  }
}
