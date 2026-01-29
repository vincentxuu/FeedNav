-- Migration: Add Missing Tags
-- Created: 2026-01-29
-- Description: Add tags that are used by data fetcher but missing from production

-- 服務相關標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('出餐快速', 'service', '#4CAF50', 1),
('出餐較慢', 'service', '#FF9800', 0),
('服務不佳', 'service', '#F44336', 0);

-- 環境相關標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('環境安靜', 'environment', '#00BCD4', 1),
('環境吵雜', 'environment', '#FF5722', 0),
('浪漫氛圍', 'environment', '#E91E63', 1),
('親子友善', 'environment', '#FF9800', 1);

-- 衛生相關標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('衛生不佳', 'hygiene', '#F44336', 0);

-- 空氣品質標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('通風良好', 'air_quality', '#4CAF50', 1);

-- 支付方式標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('電子支付', 'payment', '#2196F3', 1);

-- 情境/場合標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('適合商務', 'occasion', '#607D8B', 1),
('適合獨食', 'occasion', '#4ECDC4', 1),
('適合聚餐', 'occasion', '#FF6B6B', 1);

-- 設施標籤
INSERT OR IGNORE INTO tags (name, category, color, is_positive) VALUES
('可訂位', 'facility', '#4DB6AC', 1),
('有戶外座位', 'facility', '#81C784', 1);
