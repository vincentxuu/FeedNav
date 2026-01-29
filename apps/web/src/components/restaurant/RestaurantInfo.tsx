import React from 'react'
import { Restaurant } from '@/types'
import { MapPin, Phone, Globe, Clock, Utensils, Info } from 'lucide-react'

interface RestaurantInfoProps {
  restaurant: Restaurant
}

interface OpeningHoursPeriod {
  open: { day: number; time: string }
  close?: { day: number; time: string }
}

interface OpeningHoursData {
  open_now?: boolean
  periods?: OpeningHoursPeriod[]
  weekday_text?: string[]
}

const DAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

function formatTime(time: string): string {
  const hours = time.slice(0, 2)
  const minutes = time.slice(2, 4)
  return `${hours}:${minutes}`
}

function formatOpeningHours(openingHoursStr: string | undefined): string | null {
  if (!openingHoursStr) return null

  try {
    const data: OpeningHoursData = JSON.parse(openingHoursStr)

    // If weekday_text is available, use it directly
    if (data.weekday_text && data.weekday_text.length > 0) {
      return data.weekday_text.join('\n')
    }

    // Otherwise, format from periods
    if (!data.periods || data.periods.length === 0) return null

    // Group periods by day
    const dayPeriods: Map<number, string[]> = new Map()

    for (const period of data.periods) {
      const day = period.open.day
      const openTime = formatTime(period.open.time)
      const closeTime = period.close ? formatTime(period.close.time) : '24:00'

      if (!dayPeriods.has(day)) {
        dayPeriods.set(day, [])
      }
      dayPeriods.get(day)!.push(`${openTime} - ${closeTime}`)
    }

    // Format output
    const lines: string[] = []
    for (let day = 0; day < 7; day++) {
      const periods = dayPeriods.get(day)
      if (periods && periods.length > 0) {
        lines.push(`${DAY_NAMES[day]}: ${periods.join(', ')}`)
      } else {
        lines.push(`${DAY_NAMES[day]}: 休息`)
      }
    }

    return lines.join('\n')
  } catch {
    // If parsing fails, return original string if it doesn't look like JSON
    if (!openingHoursStr.startsWith('{')) {
      return openingHoursStr
    }
    return null
  }
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
    { id: 'hours', icon: Clock, label: '營業時間', value: formatOpeningHours(restaurant.opening_hours), isParagraph: true },
    { id: 'cuisine', icon: Utensils, label: '菜系', value: restaurant.cuisine_type },
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
