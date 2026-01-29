-- 餐廳表
CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT,
  category TEXT DEFAULT '餐廳',
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
  scenario_tags TEXT DEFAULT '[]',
  has_wifi INTEGER,
  has_power_outlet INTEGER,
  seat_type TEXT DEFAULT '[]',
  avg_visit_duration INTEGER,
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

-- 評論表（預留）
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  rating REAL,
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_district ON restaurants(district);
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visited_user ON user_visited_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

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

-- 為 users 表添加新欄位（如果不存在）
-- 注意：SQLite 的 ALTER TABLE 有限制，我們使用 IF NOT EXISTS 語法
-- 如果表已存在這些欄位，這些語句會被忽略

-- 檢查並添加 name 欄位
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  is_email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 如果是新表，複製舊數據
INSERT OR IGNORE INTO users_new (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at FROM users WHERE EXISTS (SELECT 1 FROM users);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider, provider_id);

-- 插入基礎標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('米其林推薦', 'award', '#FFD700', 1),
('寵物友善', 'pet_policy', '#4CAF50', 1),
('禁止寵物', 'pet_policy', '#F44336', 0),
('素食可用', 'dietary', '#8BC34A', 1),
('衛生良好', 'hygiene', '#2196F3', 1),
('衛生不佳', 'hygiene', '#F44336', 0),
('服務優質', 'service', '#9C27B0', 1),
('服務不佳', 'service', '#F44336', 0),
('出餐快速', 'service', '#4CAF50', 1),
('出餐較慢', 'service', '#FF9800', 0),
('環境安靜', 'environment', '#00BCD4', 1),
('環境吵雜', 'environment', '#FF5722', 0),
('浪漫氛圍', 'environment', '#E91E63', 1),
('親子友善', 'environment', '#FF9800', 1),
('電子支付', 'payment', '#2196F3', 1),
('僅收現金', 'payment', '#FFC107', 0),
('多元支付', 'payment', '#4CAF50', 1),
('通風良好', 'air_quality', '#4CAF50', 1),
('通風不佳', 'air_quality', '#F44336', 0),
('禁菸環境', 'air_quality', '#2196F3', 1),
('允許吸菸', 'air_quality', '#FF9800', 0);

-- 插入情境標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('聚餐適合', 'scenario', '#FF6B6B', 1),
('一個人也適合', 'scenario', '#4ECDC4', 1),
('飲控友善', 'scenario', '#45B7D1', 1),
('適合工作', 'scenario', '#96CEB4', 1),
('約會適合', 'scenario', '#DDA0DD', 1),
('適合獨食', 'occasion', '#4ECDC4', 1),
('適合聚餐', 'occasion', '#FF6B6B', 1),
('適合商務', 'occasion', '#607D8B', 1);

-- 插入設施標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('有包廂', 'facility', '#FFD93D', 1),
('有吧台', 'facility', '#6BCB77', 1),
('有插座', 'facility', '#4D96FF', 1),
('有Wi-Fi', 'facility', '#FF6B6B', 1),
('有戶外座位', 'facility', '#81C784', 1),
('有投影設備', 'facility', '#7986CB', 1),
('可訂位', 'facility', '#4DB6AC', 1),
('無障礙設施', 'accessibility', '#2196F3', 1),
('有兒童座椅', 'accessibility', '#9C27B0', 1);

-- 插入價格感受標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('CP值高', 'price_perception', '#4CAF50', 1),
('價格偏貴', 'price_perception', '#FF9800', 0),
('份量大', 'price_perception', '#8BC34A', 1),
('份量少', 'price_perception', '#FFC107', 0);

-- 插入等候與停車標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('需要排隊', 'waiting', '#FF5722', 0),
('免排隊', 'waiting', '#4CAF50', 1),
('建議訂位', 'waiting', '#2196F3', 1),
('停車方便', 'parking', '#4CAF50', 1),
('停車困難', 'parking', '#F44336', 0);

-- 插入用餐限制標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('用餐限時', 'dining_rules', '#FF9800', 0),
('有低消', 'dining_rules', '#FFC107', 0),
('不限時', 'dining_rules', '#4CAF50', 1);

-- 插入氛圍標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('景觀優美', 'ambiance', '#00BCD4', 1),
('網美打卡', 'ambiance', '#E91E63', 1),
('復古風格', 'ambiance', '#795548', 1);