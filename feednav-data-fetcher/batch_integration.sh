#!/bin/bash

# FeedNav 批次資料整合腳本
# 執行資料收集 → 資料整合 → 部署到 Cloudflare D1

set -e  # 遇到錯誤立即停止

# 設定路徑
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATAFETCHER_DIR="$SCRIPT_DIR"
SERVERLESS_DIR="$SCRIPT_DIR/../feednav-serverless"
TEMP_DB="$DATAFETCHER_DIR/temp_import.db"
TEMP_SQL="$DATAFETCHER_DIR/import.sql"

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

    # 檢查 sqlite3 是否可用
    if ! command -v sqlite3 &> /dev/null; then
        log_error "sqlite3 未安裝"
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

# 執行資料收集
collect_data() {
    log_info "開始收集餐廳資料..."

    cd "$DATAFETCHER_DIR"

    # 執行資料收集，收集所有未完成的區域
    # --pending: 只收集未完成的區域
    # 設定 30 分鐘逾時
    timeout 1800 python main.py --pending || {
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

# 整合資料到臨時資料庫
integrate_data() {
    local json_file="$1"

    log_info "開始資料整合到臨時資料庫..."

    cd "$DATAFETCHER_DIR"

    # 清理舊的臨時檔案
    rm -f "$TEMP_DB" "$TEMP_SQL"

    # 執行資料整合到臨時 SQLite
    python integrate_data.py "$json_file" "$TEMP_DB" || {
        log_error "資料整合失敗"
        exit 1
    }

    log_success "資料整合完成"
}

# 匯出 SQL
export_sql() {
    log_info "匯出 SQL..."

    if [ ! -f "$TEMP_DB" ]; then
        log_error "臨時資料庫不存在"
        exit 1
    fi

    # 清空輸出檔案
    > "$TEMP_SQL"

    # 1. 匯出 restaurants（直接使用 .dump 的 INSERT 語句）
    log_info "匯出餐廳資料..."
    sqlite3 "$TEMP_DB" .dump | grep "^INSERT INTO restaurants " >> "$TEMP_SQL"

    # 2. 匯出 restaurant_tags，使用 tag name 子查詢（解決 tag_id 不同步問題）
    # 格式：INSERT OR IGNORE INTO restaurant_tags ... SELECT ... FROM tags WHERE name = '...';
    # 使用 INSERT OR IGNORE 避免重複匯入時的 UNIQUE constraint 錯誤
    log_info "匯出標籤關聯（使用 tag name 映射）..."
    sqlite3 "$TEMP_DB" "
        SELECT 'INSERT OR IGNORE INTO restaurant_tags (restaurant_id, tag_id) SELECT ' ||
               rt.restaurant_id || ', id FROM tags WHERE name = ''' ||
               REPLACE(t.name, '''', '''''') || ''';'
        FROM restaurant_tags rt
        JOIN tags t ON rt.tag_id = t.id;
    " >> "$TEMP_SQL"

    # 統計匯出的資料筆數
    local restaurant_count=$(grep -c "^INSERT INTO restaurants" "$TEMP_SQL" 2>/dev/null || echo "0")
    local tag_relation_count=$(grep -c "^INSERT INTO restaurant_tags" "$TEMP_SQL" 2>/dev/null || echo "0")

    log_success "SQL 匯出完成: $TEMP_SQL"
    log_info "  餐廳: $restaurant_count 筆, 標籤關聯: $tag_relation_count 筆"
}

# 驗證臨時資料庫
validate_database() {
    log_info "驗證資料庫完整性..."

    if [ ! -f "$TEMP_DB" ]; then
        log_error "臨時資料庫不存在"
        exit 1
    fi

    # 獲取統計資訊
    RESTAURANT_COUNT=$(sqlite3 "$TEMP_DB" "SELECT COUNT(*) FROM restaurants;" 2>/dev/null || echo "0")
    TAG_COUNT=$(sqlite3 "$TEMP_DB" "SELECT COUNT(*) FROM tags;" 2>/dev/null || echo "0")

    log_success "資料庫驗證完成"
    log_info "餐廳數量: $RESTAURANT_COUNT"
    log_info "標籤數量: $TAG_COUNT"
}

# 部署到 Cloudflare D1
deploy_to_cloudflare() {
    local env="${1:-preview}"  # 預設為 preview 環境

    log_info "部署到 Cloudflare D1 ($env)..."

    cd "$SERVERLESS_DIR"

    # 檢查 pnpm 是否可用（用於執行專案內的 wrangler）
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 不可用，無法執行 wrangler"
        return 1
    fi

    # 根據環境選擇資料庫
    if [ "$env" = "production" ]; then
        DB_NAME="feednav-db"
        WRANGLER_ENV="-e production"
    else
        DB_NAME="feednav-db-preview"
        WRANGLER_ENV=""
    fi

    # 上傳到 D1（使用 pnpm exec 確保使用專案內的 wrangler 版本）
    pnpm exec wrangler d1 execute "$DB_NAME" --remote --file="$TEMP_SQL" $WRANGLER_ENV -y || {
        log_warning "Cloudflare 部署失敗"
        return 1
    }

    log_success "Cloudflare D1 部署完成 ($env)"
}

# 清理暫存檔案
cleanup() {
    log_info "清理暫存檔案..."

    cd "$DATAFETCHER_DIR"

    # 刪除臨時檔案
    rm -f "$TEMP_DB" "$TEMP_SQL"

    # 保留最新的 3 個 JSON 檔案，刪除其他
    ls -t taipei_restaurants_*.json 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true

    log_success "清理完成"
}

# 顯示使用說明
show_usage() {
    echo "使用方式: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  --skip-collection    跳過資料收集，使用現有 JSON 檔案"
    echo "  --preview            部署到 Preview 環境 (預設)"
    echo "  --production         部署到 Production 環境"
    echo "  --no-deploy          不部署到 Cloudflare"
    echo "  --help               顯示此說明"
    echo ""
    echo "範例:"
    echo "  $0                        # 收集資料並部署到 Preview"
    echo "  $0 --skip-collection      # 使用現有資料部署到 Preview"
    echo "  $0 --production           # 收集資料並部署到 Production"
}

# 主要執行流程
main() {
    local skip_collection=false
    local deploy_env="preview"
    local do_deploy=true

    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-collection)
                skip_collection=true
                shift
                ;;
            --preview)
                deploy_env="preview"
                shift
                ;;
            --production)
                deploy_env="production"
                shift
                ;;
            --no-deploy)
                do_deploy=false
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "未知選項: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    log_info "開始 FeedNav 批次資料整合..."
    log_info "時間: $(date)"
    log_info "部署環境: $deploy_env"

    check_prerequisites

    if [ "$skip_collection" != "true" ]; then
        collect_data
    else
        log_info "跳過資料收集"
    fi

    LATEST_JSON=$(find_latest_json)
    integrate_data "$LATEST_JSON"
    validate_database
    export_sql

    if [ "$do_deploy" = "true" ]; then
        deploy_to_cloudflare "$deploy_env"
    else
        log_info "跳過 Cloudflare 部署"
    fi

    cleanup

    log_success "批次整合完成！"
    log_info "結束時間: $(date)"
}

# 處理中斷信號
trap 'log_error "程序被中斷"; cleanup; exit 1' INT TERM

# 執行主程序
main "$@"
