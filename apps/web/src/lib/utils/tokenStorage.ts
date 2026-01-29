import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getToken(): string | undefined {
  // 優先從 Cookie 取得
  const cookieToken = Cookies.get(TOKEN_KEY)
  if (cookieToken) return cookieToken

  // 備援從 localStorage 取得
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) || undefined
  }
  return undefined
}

export function setToken(token: string, expiresInDays = 1): void {
  // 同時存儲到 Cookie 和 localStorage
  Cookies.set(TOKEN_KEY, token, {
    expires: expiresInDays,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken(): void {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function getRefreshToken(): string | undefined {
  return (
    Cookies.get(REFRESH_TOKEN_KEY) ||
    (typeof window !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN_KEY) || undefined
      : undefined)
  )
}

export function setRefreshToken(token: string, expiresInDays = 30): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, {
    expires: expiresInDays,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}
