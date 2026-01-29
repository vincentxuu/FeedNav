import React from 'react'
import { Restaurant } from '@/types'
import Map from '@/components/Map'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

interface RestaurantMapSectionProps {
  restaurant: Restaurant
}

const RestaurantMapSection: React.FC<RestaurantMapSectionProps> = ({ restaurant }) => {
  return (
    <div
      className="animate-fade-in relative h-full min-h-[300px]"
      style={{ animationDelay: `800ms`, animationFillMode: 'backwards' }}
    >
      <Map latitude={restaurant.latitude} longitude={restaurant.longitude} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute right-4 top-4">
        <Button asChild size="sm" variant="secondary" className="shadow-md">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin className="mr-2 h-4 w-4" />在 Google Maps 中開啟
          </a>
        </Button>
      </div>
    </div>
  )
}

export default RestaurantMapSection
