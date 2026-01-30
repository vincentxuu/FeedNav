import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Restaurant } from '@/types'
import ReactDOMServer from 'react-dom/server'
import type * as LeafletType from 'leaflet'
import type { MapBounds } from '@/queries/restaurants'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  className?: string
  onBoundsChange?: (bounds: MapBounds) => void
  isLoading?: boolean
}

const RestaurantPopupContent: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => (
  <div className="w-48 p-1">
    <h4 className="mb-1 truncate text-base font-bold">{restaurant.name}</h4>
    <p className="mb-2 truncate text-sm text-muted-foreground">{restaurant.address}</p>
    <a
      href={`/restaurant/${restaurant.id}`}
      className="text-sm font-semibold text-primary hover:underline"
    >
      查看詳情 &rarr;
    </a>
  </div>
)

const RestaurantMapComponent: React.FC<RestaurantMapProps> = ({
  restaurants,
  className = 'h-full w-full',
  onBoundsChange,
  isLoading = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletType.Map | null>(null)
  const markers = useRef<LeafletType.MarkerClusterGroup | null>(null)
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<typeof LeafletType | null>(null)
  const initialBoundsEmitted = useRef(false)

  const onBoundsChangeRef = useRef(onBoundsChange)
  onBoundsChangeRef.current = onBoundsChange

  const emitBoundsChange = useCallback(() => {
    if (!map.current || !onBoundsChangeRef.current) return

    const bounds = map.current.getBounds()
    onBoundsChangeRef.current({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    })
  }, [])

  useEffect(() => {
    setMounted(true)

    if (typeof window !== 'undefined') {
      // Dynamically import Leaflet and its dependencies on client side
      const loadLeaflet = async () => {
        // First, import leaflet and CSS files
        const [leaflet] = await Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css'),
          import('leaflet.markercluster/dist/MarkerCluster.css'),
          import('leaflet.markercluster/dist/MarkerCluster.Default.css'),
        ])

        // Make Leaflet available globally so markercluster can attach to it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).L = leaflet

        // Import markercluster AFTER leaflet is globally available
        await import('leaflet.markercluster')

        // Fix Leaflet default icon path issue using CDN URLs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        setL(leaflet)
      }

      loadLeaflet()
    }
  }, [])

  useEffect(() => {
    if (!mounted || !L || !mapContainer.current || map.current) return

    map.current = L.map(mapContainer.current).setView([25.0478, 121.5319], 13) // 預設台北市中心

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map.current)

    markers.current = L.markerClusterGroup()
    map.current.addLayer(markers.current)

    // Emit initial bounds after map is ready
    if (onBoundsChange && !initialBoundsEmitted.current) {
      initialBoundsEmitted.current = true
      // Small delay to ensure map is fully initialized
      setTimeout(() => {
        emitBoundsChange()
      }, 100)
    }

    // Listen for map move/zoom events
    map.current.on('moveend', emitBoundsChange)

    return () => {
      if (map.current) {
        map.current.off('moveend', emitBoundsChange)
        map.current.remove()
        map.current = null
        markers.current = null
      }
    }
  }, [mounted, L, emitBoundsChange])

  useEffect(() => {
    if (!mounted || !L || !map.current || !markers.current) return

    markers.current.clearLayers()

    const validRestaurants = restaurants.filter((r) => r.latitude != null && r.longitude != null)

    validRestaurants.forEach((restaurant) => {
      const marker = L.marker([restaurant.latitude!, restaurant.longitude!])
      const popupContent = ReactDOMServer.renderToString(
        <RestaurantPopupContent restaurant={restaurant} />
      )
      marker.bindPopup(popupContent)
      markers.current!.addLayer(marker)
    })
  }, [mounted, L, restaurants])

  // Show loading placeholder during SSR and initial mount
  if (!mounted || !L) {
    return (
      <div
        className={`${className} z-0 flex animate-pulse items-center justify-center bg-gray-100`}
      >
        <div className="text-gray-500">載入地圖中...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className={`${className} z-0`} />
      {isLoading && (
        <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">載入餐廳中...</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="rounded-lg bg-white px-3 py-1.5 text-sm shadow-md">
          顯示 {restaurants.filter((r) => r.latitude != null && r.longitude != null).length} 間餐廳
        </div>
      </div>
    </div>
  )
}

const RestaurantMap: React.FC<RestaurantMapProps> = (props) => {
  return <RestaurantMapComponent {...props} />
}

export default RestaurantMap
