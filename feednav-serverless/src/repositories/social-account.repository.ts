import type { Env, SocialAccount } from '../types'

export interface CreateSocialAccountData {
  userId: string
  provider: 'google' | 'discord'
  providerId: string
  providerEmail: string
  providerName: string
  providerAvatar?: string | null
}

export interface UpdateSocialAccountData {
  providerEmail?: string
  providerName?: string
  providerAvatar?: string | null
}

export class SocialAccountRepository {
  constructor(private db: D1Database) {}

  async getByProviderAndId(
    provider: 'google' | 'discord',
    providerId: string
  ): Promise<SocialAccount | null> {
    const result = await this.db
      .prepare('SELECT * FROM social_accounts WHERE provider = ? AND provider_id = ?')
      .bind(provider, providerId)
      .first<SocialAccount>()
    return result
  }

  async getByUserId(userId: string): Promise<SocialAccount[]> {
    const result = await this.db
      .prepare(
        `SELECT provider, provider_name, provider_email, provider_avatar, created_at
         FROM social_accounts
         WHERE user_id = ?
         ORDER BY created_at ASC`
      )
      .bind(userId)
      .all<SocialAccount>()
    return result.results
  }

  async create(data: CreateSocialAccountData): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO social_accounts
         (user_id, provider, provider_id, provider_email, provider_name, provider_avatar)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.userId,
        data.provider,
        data.providerId,
        data.providerEmail,
        data.providerName,
        data.providerAvatar || null
      )
      .run()
  }

  async update(id: number, data: UpdateSocialAccountData): Promise<void> {
    await this.db
      .prepare(
        `UPDATE social_accounts
         SET provider_email = ?, provider_name = ?, provider_avatar = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(data.providerEmail, data.providerName, data.providerAvatar || null, id)
      .run()
  }

  async remove(userId: string, provider: 'google' | 'discord'): Promise<number> {
    const result = await this.db
      .prepare('DELETE FROM social_accounts WHERE user_id = ? AND provider = ?')
      .bind(userId, provider)
      .run()
    return result.meta.changes
  }

  async count(userId: string): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM social_accounts WHERE user_id = ?')
      .bind(userId)
      .first<{ count: number }>()
    return result?.count || 0
  }
}

export function createSocialAccountRepository(env: Env): SocialAccountRepository {
  return new SocialAccountRepository(env.DB)
}
