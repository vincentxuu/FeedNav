-- Migration: Initial Schema
-- Created: 2026-01-28
-- Description: Creates all base tables for FeedNav

-- 餐廳表
CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT,
  cuisine_type TEXT,
  rating REAL,
  price_level INTEGER,
  photos TEXT DEFAULT '[]',
  address TEXT,
  phone TEXT,
  website TEXT,
  opening_hours TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 標籤表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  color TEXT,
  is_positive INTEGER DEFAULT 1
);

-- 餐廳標籤關聯
CREATE TABLE IF NOT EXISTS restaurant_tags (
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (restaurant_id, tag_id)
);

-- 使用者表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  is_email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, restaurant_id)
);

-- 造訪記錄表
CREATE TABLE IF NOT EXISTS user_visited_restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, restaurant_id)
);

-- 評論表
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  rating REAL,
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 社交帳戶表
CREATE TABLE IF NOT EXISTS social_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN ('google', 'discord')),
  provider_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  provider_avatar TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_district ON restaurants(district);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visited_user ON user_visited_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider, provider_id);

-- 插入預設標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('米其林推薦', 'award', 'yellow', 1),
('寵物友善', 'amenity', 'green', 1),
('素食可用', 'dietary', 'lightgreen', 1),
('衛生良好', 'quality', 'blue', 1),
('服務優質', 'service', 'purple', 1),
('價格合理', 'price', 'orange', 1),
('環境舒適', 'atmosphere', 'teal', 1),
('停車方便', 'parking', 'gray', 1),
('營業時間長', 'hours', 'pink', 1),
('外送服務', 'delivery', 'indigo', 1);
