import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(8, '密碼長度至少8個字符').max(100, '密碼長度不能超過100個字符'),
})

export const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(1, '請輸入密碼'),
})

export const searchSchema = z.object({
  searchTerm: z.string().optional(),
  sortBy: z
    .enum(['default', 'rating_desc', 'price_asc', 'price_desc'])
    .optional()
    .default('default'),
  district: z.string().optional(),
  cuisine: z.string().optional(),
  priceRange: z.tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(5)]).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '請提供refresh token'),
})

export const favoriteSchema = z.object({
  restaurant_id: z.number().int().positive(),
})

export const visitedSchema = z.object({
  restaurant_id: z.number().int().positive(),
})

export const reviewSchema = z.object({
  restaurant_id: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
})
