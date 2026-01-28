#!/bin/bash

# FeedNav Serverless 初始化設置腳本

set -e

echo "🔧 初始化 FeedNav Serverless 專案..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請先安裝 Node.js"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 請先安裝 npm"
    exit 1
fi

# 安裝 Wrangler (如果不存在)
if ! command -v wrangler &> /dev/null; then
    echo "📦 安裝 Wrangler CLI..."
    npm install -g wrangler
fi

# 安裝專案依賴
echo "📦 安裝專案依賴..."
npm install

# 檢查 Cloudflare 登入狀態
echo "🔐 檢查 Cloudflare 登入狀態..."
if ! wrangler whoami > /dev/null 2>&1; then
    echo "🔐 請登入 Cloudflare..."
    wrangler login
fi

# 創建 D1 數據庫
echo "🗃️ 創建 D1 數據庫..."
DB_OUTPUT=$(wrangler d1 create feednav-db 2>&1 || true)
if echo "$DB_OUTPUT" | grep -q "already exists"; then
    echo "ℹ️ D1 數據庫已存在"
else
    echo "$DB_OUTPUT"
    echo "⚠️ 請將上面的 database_id 複製到 wrangler.toml 中"
fi

# 創建 KV 命名空間
echo "🗄️ 創建 KV 命名空間..."
KV_OUTPUT=$(wrangler kv:namespace create "KV" 2>&1 || true)
if echo "$KV_OUTPUT" | grep -q "already exists"; then
    echo "ℹ️ KV 命名空間已存在"
else
    echo "$KV_OUTPUT"
    echo "⚠️ 請將上面的 KV id 複製到 wrangler.toml 中"
fi

# 初始化本地數據庫
echo "🗃️ 初始化本地數據庫 schema..."
wrangler d1 execute feednav-db --local --file=schema.sql

# 設置 JWT Secret
echo "🔐 設置 JWT Secret..."
if ! wrangler secret list 2>/dev/null | grep -q "JWT_SECRET"; then
    echo "請輸入 JWT Secret (建議使用強密碼):"
    wrangler secret put JWT_SECRET
else
    echo "ℹ️ JWT Secret 已設置"
fi

# 設置 BCRYPT_ROUNDS (可選)
echo "🔐 設置 BCRYPT_ROUNDS..."
if ! wrangler secret list 2>/dev/null | grep -q "BCRYPT_ROUNDS"; then
    echo "設置 BCRYPT 加密輪數 (預設: 10):"
    wrangler secret put BCRYPT_ROUNDS
else
    echo "ℹ️ BCRYPT_ROUNDS 已設置"
fi

echo "✅ 初始化完成!"
echo ""
echo "🚀 接下來可以："
echo "  1. 運行 'npm run dev' 開始本地開發"
echo "  2. 運行 'npm run deploy' 部署到 Cloudflare"
echo "  3. 查看 README.md 了解更多用法"