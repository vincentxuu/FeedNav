'use client'

import { useState, useEffect } from 'react'

export interface Coordinates {
  latitude: number
  longitude: number
}

interface GeolocationState {
  loading: boolean
  error: GeolocationPositionError | { message: string } | null
  coordinates: Coordinates | null
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    coordinates: null,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if we're in a browser environment and geolocation is supported
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setState({
        loading: false,
        error: { message: 'Geolocation is not supported by this browser.' },
        coordinates: null,
      })
      return
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      })
    }

    const onError = (error: GeolocationPositionError) => {
      setState({
        loading: false,
        error,
        coordinates: null,
      })
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  }, [mounted])

  return state
}
