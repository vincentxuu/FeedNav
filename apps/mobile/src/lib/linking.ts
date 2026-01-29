import { Linking } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import { router } from 'expo-router'

// URL scheme: feednav://
// Universal link: https://feednav.cc

export const LINKING_PREFIX = ExpoLinking.createURL('/')
export const UNIVERSAL_LINK_PREFIX = 'https://feednav.cc'

// Deep link configuration for Expo Router
export const linking = {
  prefixes: [LINKING_PREFIX, UNIVERSAL_LINK_PREFIX],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          map: 'map',
          favorites: 'favorites',
          profile: 'profile',
        },
      },
      'restaurant/[id]': 'restaurant/:id',
      'auth/login': 'auth/login',
      'auth/register': 'auth/register',
      nearby: 'nearby',
      visits: 'visits',
      settings: 'settings',
    },
  },
}

// Handle incoming deep links
export function handleDeepLink(url: string): void {
  const parsed = ExpoLinking.parse(url)

  if (parsed.path) {
    // Navigate based on path
    if (parsed.path.startsWith('restaurant/')) {
      const id = parsed.path.replace('restaurant/', '')
      router.push(`/restaurant/${id}`)
    } else if (parsed.path === 'favorites') {
      router.push('/(tabs)/favorites')
    } else if (parsed.path === 'map') {
      router.push('/(tabs)/map')
    } else if (parsed.path === 'nearby') {
      router.push('/nearby')
    } else if (parsed.path === 'auth/login') {
      router.push('/auth/login')
    } else if (parsed.path === 'auth/register') {
      router.push('/auth/register')
    } else if (parsed.path === 'auth/callback') {
      router.push('/auth/callback')
    }
  }

  // Handle query parameters
  if (parsed.queryParams) {
    // Example: feednav://search?q=拉麵
    if (parsed.queryParams.q) {
      // Navigate to search with query
      router.push({
        pathname: '/(tabs)',
        params: { search: parsed.queryParams.q as string },
      })
    }
  }
}

// Generate shareable links
export function generateRestaurantLink(restaurantId: string): string {
  return `${UNIVERSAL_LINK_PREFIX}/restaurant/${restaurantId}`
}

export function generateAppLink(path: string): string {
  return ExpoLinking.createURL(path)
}

// Open external URL
export async function openURL(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  }
}

// Open Google Maps with directions
export function openGoogleMapsDirections(lat: number, lng: number, label?: string): void {
  const url = `https://maps.google.com/?daddr=${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ''}`
  openURL(url)
}

// Open Apple Maps with directions (iOS only)
export function openAppleMapsDirections(lat: number, lng: number, label?: string): void {
  const url = `maps://?daddr=${lat},${lng}${label ? `&q=${encodeURIComponent(label)}` : ''}`
  openURL(url)
}

// Open phone dialer
export function openPhoneDialer(phoneNumber: string): void {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  openURL(`tel:${cleaned}`)
}

// Open email client
export function openEmailClient(email: string, subject?: string, body?: string): void {
  let url = `mailto:${email}`
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  if (params.length > 0) url += `?${params.join('&')}`
  openURL(url)
}
