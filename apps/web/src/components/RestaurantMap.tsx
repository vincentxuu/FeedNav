import React, { useEffect, useRef, useState } from 'react'
import { Restaurant } from '@/types'
import ReactDOMServer from 'react-dom/server'
import type * as LeafletType from 'leaflet'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  className?: string
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
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletType.Map | null>(null)
  const markers = useRef<LeafletType.MarkerClusterGroup | null>(null)
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<typeof LeafletType | null>(null)

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

    map.current = L.map(mapContainer.current).setView([25.0478, 121.5319], 12) // 預設台北市中心

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map.current)

    markers.current = L.markerClusterGroup()
    map.current.addLayer(markers.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        markers.current = null
      }
    }
  }, [mounted, L])

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

    if (validRestaurants.length > 0) {
      const bounds = markers.current.getBounds()
      if (bounds.isValid()) {
        map.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    } else {
      map.current.setView([25.0478, 121.5319], 12)
    }
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

  return <div ref={mapContainer} className={`${className} z-0`} />
}

const RestaurantMap: React.FC<RestaurantMapProps> = (props) => {
  return <RestaurantMapComponent {...props} />
}

export default RestaurantMap
