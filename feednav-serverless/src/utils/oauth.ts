import type { 
  GoogleTokenResponse, 
  GoogleUserInfo, 
  DiscordTokenResponse, 
  DiscordUser 
} from '../types'

// Google OAuth 函數
export async function exchangeGoogleCode(
  code: string, 
  clientId: string, 
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Google token exchange error:', errorData)
    throw new Error(`Google token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userInfoUrl = `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
  
  const response = await fetch(userInfoUrl)
  
  if (!response.ok) {
    const errorData = await response.text()
    console.error('Google user info error:', errorData)
    throw new Error(`Failed to get Google user info: ${response.statusText}`)
  }

  return response.json()
}

export function getGoogleAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  })

  if (state) {
    params.append('state', state)
  }

  return `${authUrl}?${params.toString()}`
}

// Discord OAuth 函數
export async function exchangeDiscordCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<DiscordTokenResponse> {
  const tokenUrl = 'https://discord.com/api/oauth2/token'
  
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Discord token exchange error:', errorData)
    throw new Error(`Discord token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getDiscordUserInfo(accessToken: string): Promise<DiscordUser> {
  const userInfoUrl = 'https://discord.com/api/users/@me'
  
  const response = await fetch(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    console.error('Discord user info error:', errorData)
    throw new Error(`Failed to get Discord user info: ${response.statusText}`)
  }

  return response.json()
}

export function getDiscordAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const authUrl = 'https://discord.com/api/oauth2/authorize'
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email'
  })

  if (state) {
    params.append('state', state)
  }

  return `${authUrl}?${params.toString()}`
}

export function getDiscordAvatarUrl(userId: string, avatarHash?: string): string | undefined {
  if (!avatarHash) return undefined
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`
}

// 通用 OAuth 工具函數
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}