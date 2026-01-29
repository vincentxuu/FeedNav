import { useState, useEffect, useCallback, useRef } from 'react'
import * as Location from 'expo-location'
import { MAP_CONFIG } from '@feednav/shared'
import { LOCATION_CONFIG } from './constants'

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

// Helper function to convert Location result to LocationState
function toLocationState(result: Location.LocationObject): LocationState {
  return {
    latitude: result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy: result.coords.accuracy,
    timestamp: result.timestamp,
  }
}

// Shared hook logic for location management
function useLocationBase() {
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

  const fetchCurrentLocation = useCallback(async (): Promise<LocationState | null> => {
    try {
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      return toLocationState(result)
    } catch (err) {
      throw err instanceof Error ? err : new Error('無法取得目前位置')
    }
  }, [])

  const initializeLocation = useCallback(async () => {
    if (!isMounted.current) return

    setIsLoading(true)
    setError(null)

    const granted = await checkPermission()

    if (!isMounted.current) return

    if (!granted) {
      setHasPermission(false)
      setLocation(getDefaultLocation())
      setIsLoading(false)
      return { granted: false }
    }

    setHasPermission(true)

    try {
      const locationState = await fetchCurrentLocation()
      if (isMounted.current && locationState) {
        setLocation(locationState)
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

    return { granted: true }
  }, [fetchCurrentLocation])

  return {
    location,
    setLocation,
    error,
    setError,
    isLoading,
    setIsLoading,
    hasPermission,
    setHasPermission,
    isMounted,
    requestPermission,
    fetchCurrentLocation,
    initializeLocation,
  }
}

export function useLocation(): UseLocationResult {
  const {
    location,
    error,
    isLoading,
    hasPermission,
    isMounted,
    requestPermission,
    initializeLocation,
  } = useLocationBase()

  const refreshLocation = useCallback(async () => {
    await initializeLocation()
  }, [initializeLocation])

  useEffect(() => {
    isMounted.current = true
    initializeLocation()

    return () => {
      isMounted.current = false
    }
  }, [initializeLocation])

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
  const {
    location,
    setLocation,
    error,
    setError,
    isLoading,
    hasPermission,
    isMounted,
    requestPermission,
    initializeLocation,
  } = useLocationBase()

  const [isWatching, setIsWatching] = useState(false)

  const refreshLocation = useCallback(async () => {
    await initializeLocation()
  }, [initializeLocation])

  useEffect(() => {
    isMounted.current = true
    let subscription: Location.LocationSubscription | null = null

    const init = async () => {
      const result = await initializeLocation()

      // Start watching if enabled and permission granted
      if (enabled && result?.granted && isMounted.current) {
        try {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: LOCATION_CONFIG.WATCH_INTERVAL_MS,
              distanceInterval: LOCATION_CONFIG.WATCH_DISTANCE_METERS,
            },
            (newLocation) => {
              if (isMounted.current) {
                setLocation(toLocationState(newLocation))
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

    init()

    return () => {
      isMounted.current = false
      if (subscription) {
        subscription.remove()
      }
      setIsWatching(false)
    }
  }, [enabled, initializeLocation, setLocation, setError])

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
