-- Migration: Add Category and Scenario Tags
-- Created: 2026-01-29
-- Description: Add category classification and scenario tags support

-- 新增 category 欄位 (餐廳/甜點/咖啡廳)
ALTER TABLE restaurants ADD COLUMN category TEXT DEFAULT '餐廳';

-- 新增 scenario_tags 欄位 (JSON 格式的情境標籤)
ALTER TABLE restaurants ADD COLUMN scenario_tags TEXT DEFAULT '[]';

-- 建立 category 索引
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category);

-- 插入情境標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
-- 情境標籤 (scenario)
('聚餐適合', 'scenario', '#FF6B6B', 1),
('一個人也適合', 'scenario', '#4ECDC4', 1),
('飲控友善', 'scenario', '#45B7D1', 1),
('適合工作', 'scenario', '#96CEB4', 1),
('約會適合', 'scenario', '#DDA0DD', 1);

-- 插入設施標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('有包廂', 'facility', '#FFD93D', 1),
('有吧台', 'facility', '#6BCB77', 1),
('有插座', 'facility', '#4D96FF', 1),
('有Wi-Fi', 'facility', '#FF6B6B', 1);

-- 插入價格感受標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('CP值高', 'price_perception', '#4CAF50', 1),
('價格偏貴', 'price_perception', '#FF9800', 0),
('份量大', 'price_perception', '#8BC34A', 1),
('份量少', 'price_perception', '#FFC107', 0);

-- 插入等候標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('需要排隊', 'waiting', '#FF5722', 0),
('免排隊', 'waiting', '#4CAF50', 1),
('建議訂位', 'waiting', '#2196F3', 1);

-- 插入停車標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('停車方便', 'parking', '#4CAF50', 1),
('停車困難', 'parking', '#F44336', 0);

-- 插入用餐限制標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('用餐限時', 'dining_rules', '#FF9800', 0),
('有低消', 'dining_rules', '#FFC107', 0),
('不限時', 'dining_rules', '#4CAF50', 1);

-- 插入無障礙設施標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('無障礙設施', 'accessibility', '#2196F3', 1),
('有兒童座椅', 'accessibility', '#9C27B0', 1);

-- 插入氛圍標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('景觀優美', 'ambiance', '#00BCD4', 1),
('網美打卡', 'ambiance', '#E91E63', 1),
('復古風格', 'ambiance', '#795548', 1);
