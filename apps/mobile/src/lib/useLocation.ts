import { useState, useEffect, useCallback, useRef } from 'react'
import * as Location from 'expo-location'
import { MAP_CONFIG } from '@feednav/shared'

// Constants
const LOCATION_CONFIG = {
  WATCH_TIME_INTERVAL: 10000, // 10 seconds
  WATCH_DISTANCE_INTERVAL: 50, // 50 meters
} as const

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

// Helper function to check permission
async function checkPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync()
  return status === 'granted'
}

// Helper function to get default location
function getDefaultLocation(): LocationState {
  return {
    latitude: MAP_CONFIG.DEFAULT_CENTER.lat,
    longitude: MAP_CONFIG.DEFAULT_CENTER.lng,
    accuracy: null,
    timestamp: Date.now(),
  }
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const isMounted = useRef(true)

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      const granted = status === 'granted'

      if (isMounted.current) {
        setHasPermission(granted)
        if (!granted) {
          setError('需要位置權限才能顯示附近餐廳')
        }
      }

      return granted
    } catch {
      if (isMounted.current) {
        setError('無法請求位置權限')
        setHasPermission(false)
      }
      return false
    }
  }, [])

  const getCurrentLocation = useCallback(async () => {
    try {
      if (isMounted.current) {
        setIsLoading(true)
        setError(null)
      }

      const granted = await checkPermission()

      if (!granted) {
        if (isMounted.current) {
          setHasPermission(false)
          setLocation(getDefaultLocation())
        }
        return
      }

      if (isMounted.current) {
        setHasPermission(true)
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      if (isMounted.current) {
        setLocation({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          timestamp: result.timestamp,
        })
      }
    } catch (err) {
      if (isMounted.current) {
        setLocation(getDefaultLocation())
        setError(err instanceof Error ? err.message : '無法取得目前位置')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
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
    isMounted.current = true
    getCurrentLocation()

    return () => {
      isMounted.current = false
    }
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
  const [location, setLocation] = useState<LocationState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const isMounted = useRef(true)

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      const granted = status === 'granted'

      if (isMounted.current) {
        setHasPermission(granted)
        if (!granted) {
          setError('需要位置權限才能顯示附近餐廳')
        }
      }

      return granted
    } catch {
      if (isMounted.current) {
        setError('無法請求位置權限')
        setHasPermission(false)
      }
      return false
    }
  }, [])

  const refreshLocation = useCallback(async () => {
    try {
      if (isMounted.current) {
        setIsLoading(true)
        setError(null)
      }

      const granted = await checkPermission()

      if (!granted) {
        if (isMounted.current) {
          setHasPermission(false)
          setLocation(getDefaultLocation())
        }
        return
      }

      if (isMounted.current) {
        setHasPermission(true)
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      if (isMounted.current) {
        setLocation({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          timestamp: result.timestamp,
        })
      }
    } catch (err) {
      if (isMounted.current) {
        setLocation(getDefaultLocation())
        setError(err instanceof Error ? err.message : '無法取得目前位置')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Initial location fetch and watch setup
  useEffect(() => {
    isMounted.current = true
    let subscription: Location.LocationSubscription | null = null

    const initLocation = async () => {
      if (!isMounted.current) return

      setIsLoading(true)

      const granted = await checkPermission()

      if (!isMounted.current) return

      if (!granted) {
        setHasPermission(false)
        setLocation(getDefaultLocation())
        setIsLoading(false)
        return
      }

      setHasPermission(true)

      // Get initial location
      try {
        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (isMounted.current) {
          setLocation({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
            timestamp: result.timestamp,
          })
        }
      } catch (err) {
        if (isMounted.current) {
          setLocation(getDefaultLocation())
          setError(err instanceof Error ? err.message : '無法取得目前位置')
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }

      // Start watching if enabled
      if (enabled && isMounted.current) {
        try {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: LOCATION_CONFIG.WATCH_TIME_INTERVAL,
              distanceInterval: LOCATION_CONFIG.WATCH_DISTANCE_INTERVAL,
            },
            (newLocation) => {
              if (isMounted.current) {
                setLocation({
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  accuracy: newLocation.coords.accuracy,
                  timestamp: newLocation.timestamp,
                })
                setIsWatching(true)
              }
            }
          )
        } catch (err) {
          if (isMounted.current) {
            setError(err instanceof Error ? err.message : '無法啟動位置追蹤')
          }
        }
      }
    }

    initLocation()

    return () => {
      isMounted.current = false
      if (subscription) {
        subscription.remove()
      }
      setIsWatching(false)
    }
  }, [enabled])

  return {
    location,
    error,
    isLoading,
    hasPermission,
    requestPermission,
    refreshLocation,
    isWatching,
  }
}
