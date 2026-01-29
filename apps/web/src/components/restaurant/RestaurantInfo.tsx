import React from 'react'
import { Restaurant } from '@/types'
import { MapPin, Phone, Globe, Clock, Utensils, Info } from 'lucide-react'

interface RestaurantInfoProps {
  restaurant: Restaurant
}

const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ restaurant }) => {
  const hasCoordinates = restaurant.latitude != null && restaurant.longitude != null
  const mapHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
    : restaurant.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`
      : undefined

  const phoneHref = restaurant.phone ? `tel:${restaurant.phone}` : undefined

  const detailItems = [
    { id: 'address', icon: MapPin, label: '地址', value: restaurant.address, href: mapHref },
    { id: 'phone', icon: Phone, label: '電話', value: restaurant.phone, href: phoneHref },
    {
      id: 'website',
      icon: Globe,
      label: '網站',
      value: restaurant.website,
      href: restaurant.website,
    },
    { id: 'hours', icon: Clock, label: '營業時間', value: restaurant.opening_hours },
    { id: 'cuisine', icon: Utensils, label: '菜系', value: restaurant.cuisine },
    {
      id: 'description',
      icon: Info,
      label: '描述',
      value: restaurant.description,
      isParagraph: true,
    },
  ]

  return (
    <div className="space-y-6">
      {detailItems.map((item, index) => {
        // Special case for address: show if we have address text OR a map link
        if (item.id === 'address' && !item.value && !item.href) {
          return null
        }
        // For all other items, hide if no value
        if (item.id !== 'address' && !item.value) {
          return null
        }

        return (
          <div
            key={index}
            className="animate-fade-in flex items-start"
            style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: 'backwards' }}
          >
            <item.icon className="mr-4 mt-1 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
              {item.isParagraph ? (
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">{item.value}</p>
              ) : item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {item.value || (item.id === 'address' ? '在 Google Maps 中開啟' : '')}
                </a>
              ) : (
                <p className="text-foreground/90">{item.value}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RestaurantInfo
