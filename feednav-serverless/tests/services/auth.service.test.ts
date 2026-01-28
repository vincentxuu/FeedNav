import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService, AuthError } from '../../src/services/auth.service'
import { createMockEnv, createMockUser } from '../setup'

vi.mock('../../src/utils/hash', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../src/utils/jwt', () => ({
  generateToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('mock-user-id'),
}))

describe('AuthService', () => {
  let service: AuthService
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv = createMockEnv()
    service = new AuthService(mockEnv.env as any)
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce(null)
      mockEnv.mocks.statement.run.mockResolvedValueOnce({ meta: { changes: 1 } })

      const result = await service.register('test@example.com', 'password123')

      expect(result.token).toBe('mock-jwt-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw error when email already exists', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce({ id: 'existing-id' })

      await expect(
        service.register('existing@example.com', 'password123')
      ).rejects.toThrow(AuthError)

      try {
        await service.register('existing@example.com', 'password123')
      } catch (error) {
        expect((error as AuthError).code).toBe('EMAIL_EXISTS')
        expect((error as AuthError).status).toBe(409)
      }
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = createMockUser()
      mockEnv.mocks.statement.first.mockResolvedValueOnce(mockUser)

      const result = await service.login('test@example.com', 'password123')

      expect(result.token).toBe('mock-jwt-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw error when user not found', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce(null)

      await expect(
        service.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow(AuthError)

      try {
        await service.login('nonexistent@example.com', 'password123')
      } catch (error) {
        expect((error as AuthError).code).toBe('INVALID_CREDENTIALS')
        expect((error as AuthError).status).toBe(401)
      }
    })

    it('should throw error when password is incorrect', async () => {
      const mockUser = createMockUser()
      mockEnv.mocks.statement.first.mockResolvedValueOnce(mockUser)

      const { verifyPassword } = await import('../../src/utils/hash')
      vi.mocked(verifyPassword).mockResolvedValueOnce(false)

      await expect(
        service.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(AuthError)
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      mockEnv.mocks.kv._store.set(
        'refresh_token:valid-refresh-token',
        JSON.stringify({ userId: 'test-user-id', email: 'test@example.com' })
      )

      const result = await service.refreshToken('valid-refresh-token')

      expect(result.token).toBe('mock-jwt-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
    })

    it('should throw error for invalid refresh token', async () => {
      await expect(
        service.refreshToken('invalid-refresh-token')
      ).rejects.toThrow(AuthError)

      try {
        await service.refreshToken('invalid-refresh-token')
      } catch (error) {
        expect((error as AuthError).code).toBe('INVALID_REFRESH_TOKEN')
        expect((error as AuthError).status).toBe(401)
      }
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      mockEnv.mocks.kv._store.set('refresh_token:test-token', 'data')

      await service.logout('test-token')

      expect(mockEnv.mocks.kv.delete).toHaveBeenCalledWith('refresh_token:test-token')
    })

    it('should handle empty refresh token', async () => {
      await expect(service.logout('')).resolves.not.toThrow()
    })
  })

  describe('getMe', () => {
    it('should return user without password hash', async () => {
      const mockUser = createMockUser()
      const { password_hash, ...userWithoutPassword } = mockUser
      mockEnv.mocks.statement.first.mockResolvedValueOnce(userWithoutPassword)

      const result = await service.getMe('test-user-id')

      expect(result.id).toBe('test-user-id')
      expect(result.email).toBe('test@example.com')
      expect((result as any).password_hash).toBeUndefined()
    })

    it('should throw error when user not found', async () => {
      mockEnv.mocks.statement.first.mockResolvedValueOnce(null)

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(AuthError)

      try {
        await service.getMe('nonexistent-id')
      } catch (error) {
        expect((error as AuthError).code).toBe('USER_NOT_FOUND')
        expect((error as AuthError).status).toBe(404)
      }
    })
  })
})
