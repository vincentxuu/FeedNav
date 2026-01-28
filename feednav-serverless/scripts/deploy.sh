#!/bin/bash

# FeedNav Serverless 部署腳本

set -e

echo "🚀 開始部署 FeedNav Serverless API..."

# 檢查是否已登入 Cloudflare
if ! wrangler whoami > /dev/null 2>&1; then
    echo "❌ 請先登入 Cloudflare: wrangler login"
    exit 1
fi

# 類型檢查
echo "🔍 進行類型檢查..."
npm run type-check

# 創建 D1 數據庫 (如果不存在)
echo "📦 檢查 D1 數據庫..."
if ! wrangler d1 list | grep -q "feednav-db"; then
    echo "📦 創建 D1 數據庫..."
    wrangler d1 create feednav-db
    echo "⚠️ 請更新 wrangler.toml 中的 database_id"
    exit 1
fi

# 創建 KV 命名空間 (如果不存在)
echo "🗄️ 檢查 KV 命名空間..."
if ! wrangler kv:namespace list | grep -q "KV"; then
    echo "🗄️ 創建 KV 命名空間..."
    wrangler kv:namespace create "KV"
    echo "⚠️ 請更新 wrangler.toml 中的 KV id"
    exit 1
fi

# 執行數據庫 schema
echo "🗃️ 更新數據庫 schema..."
wrangler d1 execute feednav-db --file=schema.sql

# 檢查必要的 secrets
echo "🔐 檢查 Environment Secrets..."
if ! wrangler secret list | grep -q "JWT_SECRET"; then
    echo "⚠️ 缺少 JWT_SECRET，請設置: wrangler secret put JWT_SECRET"
    exit 1
fi

# 部署到生產環境
echo "🚢 部署到生產環境..."
wrangler deploy --env production

echo "✅ 部署完成!"
echo "🌐 API 端點: https://feednav-api.your-subdomain.workers.dev"
echo "📊 查看日誌: wrangler tail --env production"