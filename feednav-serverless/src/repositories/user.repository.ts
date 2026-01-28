import type { Env, User } from '../types'

export interface CreateUserData {
  id: string
  email: string
  passwordHash: string
}

export interface UpdateUserData {
  name?: string
  avatar?: string
  isEmailVerified?: boolean
}

export class UserRepository {
  constructor(private db: D1Database) {}

  async getById(id: string): Promise<User | null> {
    const result = await this.db
      .prepare(
        'SELECT id, email, password_hash, name, avatar, is_email_verified, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(id)
      .first<User>()
    return result
  }

  async getByIdWithoutPassword(
    id: string
  ): Promise<Omit<User, 'password_hash'> | null> {
    const result = await this.db
      .prepare(
        'SELECT id, email, name, avatar, is_email_verified, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(id)
      .first<Omit<User, 'password_hash'>>()
    return result
  }

  async getByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare(
        'SELECT id, email, password_hash, name, avatar, is_email_verified, created_at, updated_at FROM users WHERE email = ?'
      )
      .bind(email)
      .first<User>()
    return result
  }

  async create(data: CreateUserData): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO users (id, email, password_hash, is_email_verified) VALUES (?, ?, ?, 0)'
      )
      .bind(data.id, data.email, data.passwordHash)
      .run()
  }

  async createFromOAuth(
    id: string,
    email: string,
    name: string,
    avatar?: string | null
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (id, email, name, avatar, is_email_verified, password_hash)
         VALUES (?, ?, ?, ?, 1, '')`
      )
      .bind(id, email, name, avatar || null)
      .run()
  }

  async update(id: string, data: UpdateUserData): Promise<void> {
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }

    if (data.avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(data.avatar)
    }

    if (data.isEmailVerified !== undefined) {
      updates.push('is_email_verified = ?')
      values.push(data.isEmailVerified ? 1 : 0)
    }

    if (updates.length === 0) return

    updates.push("updated_at = datetime('now')")
    values.push(id)

    await this.db
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()
  }

  async updateFromOAuth(
    id: string,
    name: string,
    avatar?: string | null
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE users
         SET name = CASE WHEN name IS NULL OR name = '' THEN ? ELSE name END,
             avatar = CASE WHEN avatar IS NULL OR avatar = '' THEN ? ELSE avatar END,
             is_email_verified = 1,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(name, avatar || null, id)
      .run()
  }

  async exists(email: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT 1 FROM users WHERE email = ?')
      .bind(email)
      .first()
    return !!result
  }
}

export function createUserRepository(env: Env): UserRepository {
  return new UserRepository(env.DB)
}
