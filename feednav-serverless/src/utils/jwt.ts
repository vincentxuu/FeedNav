import * as jose from 'jose'
import { nanoid } from 'nanoid'
import { JWT_CONFIG } from '../constants'
import type { JWTPayload } from '../types'

export async function generateToken(
  payload: { sub: string; email: string },
  secret: string,
  issuer: string = 'feednav-api'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)

  const jwt = await new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(`${JWT_CONFIG.ACCESS_TOKEN_EXPIRY}s`)
    .sign(secretKey)

  return jwt
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(secret)
  const { payload } = await jose.jwtVerify(token, secretKey)

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}

export function generateRefreshToken(): string {
  return nanoid(32)
}
