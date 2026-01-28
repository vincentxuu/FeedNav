import { nanoid } from 'nanoid'
import { hashPassword, verifyPassword } from '../utils/hash'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import { JWT_CONFIG } from '../constants'
import type { Env, User } from '../types'
import { createUserRepository, UserRepository } from '../repositories'

export interface RegisterResult {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
  }
}

export interface LoginResult {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name?: string
    avatar?: string
  }
}

export interface RefreshResult {
  token: string
  refreshToken: string
}

export class AuthService {
  private userRepo: UserRepository

  constructor(private env: Env) {
    this.userRepo = createUserRepository(env)
  }

  async register(email: string, password: string): Promise<RegisterResult> {
    const exists = await this.userRepo.exists(email)
    if (exists) {
      throw new AuthError('EMAIL_EXISTS', '該電子郵件地址已被註冊', 409)
    }

    const userId = nanoid()
    const rounds = parseInt(this.env.BCRYPT_ROUNDS || '10')
    const passwordHash = await hashPassword(password, rounds)

    await this.userRepo.create({
      id: userId,
      email,
      passwordHash,
    })

    const token = await generateToken(
      { sub: userId, email },
      this.env.JWT_SECRET,
      this.env.JWT_ISSUER
    )
    const refreshToken = generateRefreshToken()

    await this.env.KV.put(`refresh_token:${refreshToken}`, JSON.stringify({ userId, email }), {
      expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    })

    return {
      token,
      refreshToken,
      user: { id: userId, email },
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.getByEmail(email)
    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', '電子郵件地址或密碼錯誤', 401)
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      throw new AuthError('INVALID_CREDENTIALS', '電子郵件地址或密碼錯誤', 401)
    }

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

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    const tokenData = await this.env.KV.get(`refresh_token:${refreshToken}`)
    if (!tokenData) {
      throw new AuthError('INVALID_REFRESH_TOKEN', '無效的刷新令牌', 401)
    }

    const { userId, email } = JSON.parse(tokenData)

    const token = await generateToken(
      { sub: userId, email },
      this.env.JWT_SECRET,
      this.env.JWT_ISSUER
    )
    const newRefreshToken = generateRefreshToken()

    await this.env.KV.delete(`refresh_token:${refreshToken}`)
    await this.env.KV.put(`refresh_token:${newRefreshToken}`, JSON.stringify({ userId, email }), {
      expirationTtl: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    })

    return {
      token,
      refreshToken: newRefreshToken,
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.env.KV.delete(`refresh_token:${refreshToken}`)
    }
  }

  async getMe(userId: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userRepo.getByIdWithoutPassword(userId)
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', '用戶不存在', 404)
    }
    return user
  }
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function createAuthService(env: Env): AuthService {
  return new AuthService(env)
}
