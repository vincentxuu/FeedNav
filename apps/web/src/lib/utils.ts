import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RestaurantPhoto } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 從照片資料中提取可用的 URL
 * photos 可能是字串或物件 (含 photo_reference 或 url)
 */
export function getPhotoUrl(photo: RestaurantPhoto | string | undefined): string | null {
  if (!photo) return null
  if (typeof photo === 'string') return photo
  // 物件格式：優先使用 url，photo_reference 需要後端代理才能使用
  if (photo.url) return photo.url
  // photo_reference 目前無法直接使用，需要 Google API key
  return null
}
