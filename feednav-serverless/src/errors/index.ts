export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toResponse() {
    return {
      success: false,
      error: this.errorCode,
      message: this.message,
    }
  }
}

// 預定義錯誤
export const Errors = {
  // 認證錯誤 (401)
  UNAUTHORIZED: () => new ApiError(401, 'UNAUTHORIZED', '未授權的請求'),
  INVALID_TOKEN: () => new ApiError(401, 'INVALID_TOKEN', '無效的 Token'),
  TOKEN_EXPIRED: () => new ApiError(401, 'TOKEN_EXPIRED', 'Token 已過期'),
  INVALID_CREDENTIALS: () => new ApiError(401, 'INVALID_CREDENTIALS', '電子郵件地址或密碼錯誤'),

  // 授權錯誤 (403)
  FORBIDDEN: () => new ApiError(403, 'FORBIDDEN', '沒有權限執行此操作'),
  ADMIN_REQUIRED: () => new ApiError(403, 'ADMIN_REQUIRED', '需要管理員權限'),

  // 資源錯誤 (404)
  NOT_FOUND: (resource: string) => new ApiError(404, 'NOT_FOUND', `${resource}不存在`),
  USER_NOT_FOUND: () => new ApiError(404, 'USER_NOT_FOUND', '用戶不存在'),
  RESTAURANT_NOT_FOUND: () => new ApiError(404, 'RESTAURANT_NOT_FOUND', '餐廳不存在'),

  // 驗證錯誤 (400)
  VALIDATION_ERROR: (message: string) => new ApiError(400, 'VALIDATION_ERROR', message),
  INVALID_ID: () => new ApiError(400, 'INVALID_ID', '無效的 ID'),
  MISSING_COORDINATES: () => new ApiError(400, 'MISSING_COORDINATES', '請提供有效的經緯度座標'),

  // 衝突錯誤 (409)
  EMAIL_EXISTS: () => new ApiError(409, 'EMAIL_EXISTS', '此電子郵件已被註冊'),
  ALREADY_EXISTS: (resource: string) => new ApiError(409, 'ALREADY_EXISTS', `${resource}已存在`),

  // 速率限制 (429)
  TOO_MANY_REQUESTS: (retryAfter?: number) =>
    new ApiError(
      429,
      'TOO_MANY_REQUESTS',
      retryAfter ? `請求過於頻繁，請在 ${retryAfter} 秒後再試` : '請求過於頻繁，請稍後再試'
    ),

  // 伺服器錯誤 (500)
  INTERNAL_ERROR: () => new ApiError(500, 'INTERNAL_ERROR', '伺服器發生錯誤'),
} as const
