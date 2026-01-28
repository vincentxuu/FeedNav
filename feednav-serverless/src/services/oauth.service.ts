import { nanoid } from 'nanoid'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  getGoogleAuthUrl,
  exchangeDiscordCode,
  getDiscordUserInfo,
  getDiscordAuthUrl,
  getDiscordAvatarUrl,
  generateOAuthState,
  validateEmail,
} from '../utils/oauth'
import { JWT_CONFIG } from '../constants'
import type { Env, User, OAuthUser, SocialAccount } from '../types'
import {
  createUserRepository,
  createSocialAccountRepository,
  UserRepository,
  SocialAccountRepository,
} from '../repositories'

export interface OAuthInitResult {
  authUrl: string
  state: string
}

export interface OAuthCallbackResult {
  token: string
  refreshToken: string
  isNewUser: boolean
  user: User
}

export class OAuthService {
  private userRepo: UserRepository
  private socialAccountRepo: SocialAccountRepository

  constructor(private env: Env) {
    this.userRepo = createUserRepository(env)
    this.socialAccountRepo = createSocialAccountRepository(env)
  }

  async initGoogle(baseUrl: string): Promise<OAuthInitResult> {
    if (!this.env.GOOGLE_CLIENT_ID) {
      throw new OAuthError('GOOGLE_NOT_CONFIGURED', 'Google OAuth 未配置', 500)
    }

    const redirectUri = `${baseUrl}/api/oauth/google/callback`
    const state = generateOAuthState()

    await this.env.KV.put(
      `oauth_state:${state}`,
      JSON.stringify({
        provider: 'google',
        timestamp: Date.now(),
      }),
      { expirationTtl: 600 }
    )

    const authUrl = getGoogleAuthUrl(this.env.GOOGLE_CLIENT_ID, redirectUri, state)

    return { authUrl, state }
  }

  async handleGoogleCallback(
    code: string,
    state: string,
    baseUrl: string
  ): Promise<OAuthCallbackResult> {
    if (!this.env.GOOGLE_CLIENT_ID || !this.env.GOOGLE_CLIENT_SECRET) {
      throw new OAuthError('GOOGLE_NOT_CONFIGURED', 'Google OAuth 未配置', 500)
    }

    await this.validateState(state, 'google')

    const redirectUri = `${baseUrl}/api/oauth/google/callback`

    const tokenResponse = await exchangeGoogleCode(
      code,
      this.env.GOOGLE_CLIENT_ID,
      this.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const googleUser = await getGoogleUserInfo(tokenResponse.access_token)

    if (!validateEmail(googleUser.email)) {
      throw new OAuthError('INVALID_EMAIL', '無效的電子郵件地址', 400)
    }

    const authResult = await this.handleOAuthUser({
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      provider: 'google',
      provider_id: googleUser.id,
    })

    const tokens = await this.generateAuthTokens(authResult.user)

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      isNewUser: authResult.isNewUser,
      user: authResult.user,
    }
  }

  async initDiscord(baseUrl: string): Promise<OAuthInitResult> {
    if (!this.env.DISCORD_CLIENT_ID) {
      throw new OAuthError('DISCORD_NOT_CONFIGURED', 'Discord OAuth 未配置', 500)
    }

    const redirectUri = `${baseUrl}/api/oauth/discord/callback`
    const state = generateOAuthState()

    await this.env.KV.put(
      `oauth_state:${state}`,
      JSON.stringify({
        provider: 'discord',
        timestamp: Date.now(),
      }),
      { expirationTtl: 600 }
    )

    const authUrl = getDiscordAuthUrl(this.env.DISCORD_CLIENT_ID, redirectUri, state)

    return { authUrl, state }
  }

  async handleDiscordCallback(
    code: string,
    state: string,
    baseUrl: string
  ): Promise<OAuthCallbackResult> {
    if (!this.env.DISCORD_CLIENT_ID || !this.env.DISCORD_CLIENT_SECRET) {
      throw new OAuthError('DISCORD_NOT_CONFIGURED', 'Discord OAuth 未配置', 500)
    }

    await this.validateState(state, 'discord')

    const redirectUri = `${baseUrl}/api/oauth/discord/callback`

    const tokenResponse = await exchangeDiscordCode(
      code,
      this.env.DISCORD_CLIENT_ID,
      this.env.DISCORD_CLIENT_SECRET,
      redirectUri
    )

    const discordUser = await getDiscordUserInfo(tokenResponse.access_token)

    if (!discordUser.email || !validateEmail(discordUser.email)) {
      throw new OAuthError(
        'INVALID_EMAIL',
        '無法獲取有效的電子郵件地址，請確保您的 Discord 帳戶已驗證電子郵件',
        400
      )
    }

    const authResult = await this.handleOAuthUser({
      id: discordUser.id,
      email: discordUser.email,
      name: discordUser.global_name || discordUser.username,
      avatar: getDiscordAvatarUrl(discordUser.id, discordUser.avatar),
      provider: 'discord',
      provider_id: discordUser.id,
    })

    const tokens = await this.generateAuthTokens(authResult.user)

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      isNewUser: authResult.isNewUser,
      user: authResult.user,
    }
  }

  async getAccounts(userId: string): Promise<Partial<SocialAccount>[]> {
    return this.socialAccountRepo.getByUserId(userId)
  }

  async removeAccount(userId: string, provider: 'google' | 'discord'): Promise<void> {
    const accountCount = await this.socialAccountRepo.count(userId)
    const user = await this.userRepo.getById(userId)
    const hasPassword = user?.password_hash && user.password_hash.trim() !== ''

    if (accountCount <= 1 && !hasPassword) {
      throw new OAuthError(
        'CANNOT_REMOVE_LAST_AUTH',
        '無法移除最後一個認證方式，請先設置密碼或綁定其他帳戶',
        400
      )
    }

    const changes = await this.socialAccountRepo.remove(userId, provider)
    if (changes === 0) {
      throw new OAuthError('ACCOUNT_NOT_FOUND', '找不到要移除的帳戶', 404)
    }
  }

  private async validateState(
    state: string,
    expectedProvider: 'google' | 'discord'
  ): Promise<void> {
    const storedStateData = await this.env.KV.get(`oauth_state:${state}`)
    if (!storedStateData) {
      throw new OAuthError('INVALID_STATE', '認證狀態已過期或無效', 400)
    }

    const stateData = JSON.parse(storedStateData)
    if (stateData.provider !== expectedProvider) {
      throw new OAuthError('INVALID_PROVIDER', '無效的認證提供者', 400)
    }

    await this.env.KV.delete(`oauth_state:${state}`)
  }

  private async handleOAuthUser(oauthUser: OAuthUser): Promise<{ user: User; isNewUser: boolean }> {
    const existingSocial = await this.socialAccountRepo.getByProviderAndId(
      oauthUser.provider,
      oauthUser.provider_id
    )

    if (existingSocial) {
      await this.socialAccountRepo.update(existingSocial.id, {
        providerEmail: oauthUser.email,
        providerName: oauthUser.name,
        providerAvatar: oauthUser.avatar,
      })

      const user = await this.userRepo.getById(existingSocial.user_id)
      if (!user) {
        throw new OAuthError('USER_NOT_FOUND', 'Associated user not found', 500)
      }

      return { user, isNewUser: false }
    }

    let user = await this.userRepo.getByEmail(oauthUser.email)
    let isNewUser = false

    if (!user) {
      const userId = nanoid()
      await this.userRepo.createFromOAuth(userId, oauthUser.email, oauthUser.name, oauthUser.avatar)

      user = await this.userRepo.getById(userId)
      if (!user) {
        throw new OAuthError('USER_CREATE_FAILED', 'Failed to create user', 500)
      }

      isNewUser = true
    } else {
      await this.userRepo.updateFromOAuth(user.id, oauthUser.name, oauthUser.avatar)
    }

    await this.socialAccountRepo.create({
      userId: user.id,
      provider: oauthUser.provider,
      providerId: oauthUser.provider_id,
      providerEmail: oauthUser.email,
      providerName: oauthUser.name,
      providerAvatar: oauthUser.avatar,
    })

    return { user, isNewUser }
  }

  private async generateAuthTokens(user: User): Promise<{ token: string; refreshToken: string }> {
    const token = await generateToken(
      { sub: user.id, email: user.email },
      this.env.JWT_SECRET,
      this.env.JWT_ISSUER
    )
    const refreshToken = generateRefreshToken()

    await this.env.KV.put(
      `refresh_token:${refreshToken}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      { expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
    )

    return { token, refreshToken }
  }
}

export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'OAuthError'
  }
}

export function createOAuthService(env: Env): OAuthService {
  return new OAuthService(env)
}
