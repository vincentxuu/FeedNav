#!/bin/bash

# FeedNav 批次資料整合腳本
# 執行資料收集 → 資料整合 → 部署到 Cloudflare

set -e  # 遇到錯誤立即停止

# 設定路徑
DATAFETCHER_DIR="/Users/xiaoxu/Projects/FeedNav/FeedNav-DataFetcher"
SERVERLESS_DIR="/Users/xiaoxu/Projects/FeedNav/FeedNav-Serverless"
DATABASE_PATH="$SERVERLESS_DIR/database.db"
BACKUP_DIR="$DATAFETCHER_DIR/backups"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查必要檔案和目錄
check_prerequisites() {
    log_info "檢查執行環境..."
    
    if [ ! -d "$DATAFETCHER_DIR" ]; then
        log_error "DataFetcher 目錄不存在: $DATAFETCHER_DIR"
        exit 1
    fi
    
    if [ ! -d "$SERVERLESS_DIR" ]; then
        log_error "Serverless 目錄不存在: $SERVERLESS_DIR"
        exit 1
    fi
    
    if [ ! -f "$DATAFETCHER_DIR/.env" ]; then
        log_error "找不到 .env 檔案: $DATAFETCHER_DIR/.env"
        exit 1
    fi
    
    # 檢查 Python 依賴
    cd "$DATAFETCHER_DIR"
    if ! python -c "import googlemaps, geopy" 2>/dev/null; then
        log_warning "缺少 Python 依賴，嘗試安裝..."
        pip install -r requirements.txt
    fi
    
    log_success "環境檢查完成"
}

# 備份現有資料庫
backup_database() {
    if [ -f "$DATABASE_PATH" ]; then
        log_info "備份現有資料庫..."
        
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/database_backup_$(date +%Y%m%d_%H%M%S).db"
        cp "$DATABASE_PATH" "$BACKUP_FILE"
        
        log_success "資料庫已備份至: $BACKUP_FILE"
    else
        log_warning "資料庫檔案不存在，跳過備份"
    fi
}

# 執行資料收集
collect_data() {
    log_info "開始收集餐廳資料..."
    
    cd "$DATAFETCHER_DIR"
    
    # 執行資料收集，設定逾時
    timeout 1800 python main.py || {
        log_error "資料收集失敗或逾時"
        exit 1
    }
    
    log_success "資料收集完成"
}

# 找到最新的 JSON 檔案
find_latest_json() {
    cd "$DATAFETCHER_DIR"
    
    LATEST_JSON=$(ls -t taipei_restaurants_*.json 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_JSON" ]; then
        log_error "找不到資料檔案"
        exit 1
    fi
    
    log_info "找到最新資料檔案: $LATEST_JSON"
    echo "$LATEST_JSON"
}

# 整合資料到資料庫
integrate_data() {
    local json_file="$1"
    
    log_info "開始資料整合..."
    
    cd "$DATAFETCHER_DIR"
    
    # 執行資料整合
    python integrate_data.py "$json_file" "$DATABASE_PATH" || {
        log_error "資料整合失敗"
        exit 1
    }
    
    log_success "資料整合完成"
}

# 驗證資料庫
validate_database() {
    log_info "驗證資料庫完整性..."
    
    if [ ! -f "$DATABASE_PATH" ]; then
        log_error "資料庫檔案不存在"
        exit 1
    fi
    
    # 檢查資料庫是否可以正常開啟
    sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM restaurants;" > /dev/null || {
        log_error "資料庫損壞或無法讀取"
        exit 1
    }
    
    # 獲取統計資訊
    RESTAURANT_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM restaurants;")
    TAG_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM tags;")
    
    log_success "資料庫驗證完成"
    log_info "餐廳數量: $RESTAURANT_COUNT"
    log_info "標籤數量: $TAG_COUNT"
}

# 部署到 Cloudflare (可選)
deploy_to_cloudflare() {
    if [ "$DEPLOY_TO_CLOUDFLARE" = "true" ]; then
        log_info "部署到 Cloudflare..."
        
        cd "$SERVERLESS_DIR"
        
        # 檢查 wrangler 是否可用
        if ! command -v npx &> /dev/null; then
            log_warning "npx 不可用，跳過 Cloudflare 部署"
            return
        fi
        
        # 上傳資料庫到 D1
        npx wrangler d1 execute feednav-db --file="$DATABASE_PATH" --remote || {
            log_warning "Cloudflare 部署失敗，但本地整合已完成"
            return
        }
        
        log_success "Cloudflare 部署完成"
    else
        log_info "跳過 Cloudflare 部署 (設定 DEPLOY_TO_CLOUDFLARE=true 以啟用)"
    fi
}

# 清理暫存檔案
cleanup() {
    log_info "清理暫存檔案..."
    
    cd "$DATAFETCHER_DIR"
    
    # 保留最新的 3 個 JSON 檔案，刪除其他
    ls -t taipei_restaurants_*.json 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
    
    # 清理超過 30 天的備份檔案
    find "$BACKUP_DIR" -name "database_backup_*.db" -mtime +30 -delete 2>/dev/null || true
    
    log_success "清理完成"
}

# 主要執行流程
main() {
    log_info "開始 FeedNav 批次資料整合..."
    log_info "時間: $(date)"
    
    # 從環境變數讀取設定（可選）
    DEPLOY_TO_CLOUDFLARE=${DEPLOY_TO_CLOUDFLARE:-false}
    SKIP_COLLECTION=${SKIP_COLLECTION:-false}
    
    check_prerequisites
    backup_database
    
    if [ "$SKIP_COLLECTION" != "true" ]; then
        collect_data
    else
        log_info "跳過資料收集 (SKIP_COLLECTION=true)"
    fi
    
    LATEST_JSON=$(find_latest_json)
    integrate_data "$LATEST_JSON"
    validate_database
    deploy_to_cloudflare
    cleanup
    
    log_success "批次整合完成！"
    log_info "結束時間: $(date)"
}

# 處理中斷信號
trap 'log_error "程序被中斷"; exit 1' INT TERM

# 執行主程序
main "$@"