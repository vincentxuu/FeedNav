import { vi } from 'vitest'

/**
 * Mock D1Database
 */
export function createMockD1Database() {
  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
  }

  const mockDb = {
    prepare: vi.fn().mockReturnValue(mockStatement),
    batch: vi.fn().mockResolvedValue([]),
    exec: vi.fn().mockResolvedValue({ results: [] }),
    dump: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  }

  return {
    db: mockDb as unknown as D1Database,
    statement: mockStatement,
  }
}

/**
 * Mock KVNamespace
 */
export function createMockKVNamespace() {
  const store = new Map<string, string>()

  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: '' })),
    getWithMetadata: vi.fn(async () => ({ value: null, metadata: null })),
    _store: store,
  } as unknown as KVNamespace & { _store: Map<string, string> }
}

/**
 * Create mock environment
 */
export function createMockEnv() {
  const { db, statement } = createMockD1Database()
  const kv = createMockKVNamespace()

  return {
    env: {
      DB: db,
      KV: kv,
      JWT_SECRET: 'test-jwt-secret',
      JWT_ISSUER: 'test-issuer',
      BCRYPT_ROUNDS: '4',
      CORS_ORIGIN: '*',
      ENVIRONMENT: 'test',
      FRONTEND_URL: 'http://localhost:5173',
    },
    mocks: {
      db,
      statement,
      kv,
    },
  }
}

/**
 * Create mock restaurant row
 */
export function createMockRestaurantRow(overrides = {}) {
  return {
    id: 1,
    name: 'Test Restaurant',
    district: 'Test District',
    cuisine_type: 'Chinese',
    rating: 4.5,
    price_level: 2,
    photos: '[]',
    address: '123 Test Street',
    phone: '123-456-7890',
    website: 'https://example.com',
    opening_hours: '09:00-22:00',
    description: 'A test restaurant',
    latitude: 25.0339,
    longitude: 121.5645,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags_data: '1:美味:food:green:1,2:快速:service:blue:1',
    is_favorited: 0,
    is_visited: 0,
    ...overrides,
  }
}

/**
 * Create mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    password_hash: '$2a$10$test-hash',
    name: 'Test User',
    avatar: 'https://example.com/avatar.png',
    is_email_verified: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}
