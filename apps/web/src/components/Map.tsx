import React, { useEffect, useRef, useState, useMemo } from 'react'
import type * as LeafletType from 'leaflet'

interface MapProps {
  longitude?: number
  latitude?: number
  zoom?: number
}

const MapComponent: React.FC<MapProps> = ({ longitude, latitude, zoom = 15 }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletType.Map | null>(null)
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<typeof LeafletType | null>(null)

  // 如果沒有座標，預設顯示台北市中心
  const mapCenter = useMemo(
    () => [latitude || 25.033, longitude || 121.5654] as [number, number],
    [latitude, longitude]
  )
  const mapZoom = longitude ? zoom : 10

  useEffect(() => {
    setMounted(true)

    if (typeof window !== 'undefined') {
      // Dynamically import Leaflet on client side
      import('leaflet').then(async (leaflet) => {
        // Import CSS
        await import('leaflet/dist/leaflet.css')

        // Import icons
        const icon = (await import('leaflet/dist/images/marker-icon.png')).default
        const iconShadow = (await import('leaflet/dist/images/marker-shadow.png')).default
        const iconRetina = (await import('leaflet/dist/images/marker-icon-2x.png')).default

        // Fix Leaflet default icon path issue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: iconRetina,
          iconUrl: icon,
          shadowUrl: iconShadow,
        })

        setL(leaflet)
      })
    }
  }, [])

  useEffect(() => {
    if (!mounted || !L || !mapContainer.current) return

    // 如果地圖實例已存在，先將其移除，避免重複渲染
    if (map.current) {
      map.current.remove()
    }

    // 初始化地圖
    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: false, // 禁用滾輪縮放，以獲得更好的頁面滾動體驗
    }).setView(mapCenter, mapZoom)

    // 加入 CartoDB Positron 圖層 (更簡潔的風格)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map.current)

    // 如果有座標，則新增標記
    if (longitude && latitude) {
      L.marker(mapCenter).addTo(map.current)
    }

    // 在元件卸載時清理資源
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mounted, L, longitude, latitude, zoom, mapCenter, mapZoom])

  // Show loading placeholder during SSR and initial mount
  if (!mounted || !L) {
    return (
      <div className="flex h-96 w-full animate-pulse items-center justify-center bg-gray-100">
        <div className="text-gray-500">載入地圖中...</div>
      </div>
    )
  }

  return <div ref={mapContainer} className="h-96 w-full" />
}

const Map: React.FC<MapProps> = (props) => {
  return <MapComponent {...props} />
}

export default Map
