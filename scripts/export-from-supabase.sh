#!/bin/bash
# ============================================
# 律植 - 数据库导出脚本
# 从 Supabase 导出数据到本地文件
# 
# 使用方法：
#   1. 安装 pg_dump (PostgreSQL 客户端工具)
#   2. 设置环境变量或直接修改下方配置
#   3. 运行: chmod +x scripts/export-from-supabase.sh && ./scripts/export-from-supabase.sh
# ============================================

set -e

# 配置区域 - 请根据您的 Supabase 项目填写
# ----------------------------------------

# Supabase 项目 ID (从 Supabase Dashboard URL 获取: https://supabase.com/dashboard/project/<PROJECT_ID>)
SUPABASE_PROJECT_ID="kqtpdsgwkvzinonkprcl"

# Supabase 数据库密码 (您提供的密码)
SUPABASE_DB_PASSWORD="Wxwzcfwhf205"

# 导出文件保存路径
EXPORT_DIR="./data-exports"
EXPORT_FILE="${EXPORT_DIR}/supabase-export-$(date +%Y%m%d-%H%M%S).dump"

# ============================================
# 颜色输出
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 前置检查
# ============================================

check_dependencies() {
    log_info "检查依赖..."
    
    # 检查 pg_dump
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump 未安装"
        echo ""
        echo "请安装 PostgreSQL 客户端工具:"
        echo "  macOS: brew install postgresql@15"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  CentOS/RHEL: sudo yum install postgresql"
        exit 1
    fi
    
    # 检查 psql
    if ! command -v psql &> /dev/null; then
        log_warn "psql 未安装，部分功能可能不可用"
    fi
    
    log_success "依赖检查完成"
}

# ============================================
# 创建导出目录
# ============================================

prepare_export_dir() {
    log_info "准备导出目录..."
    
    mkdir -p "$EXPORT_DIR"
    
    log_success "导出目录: $EXPORT_DIR"
}

# ============================================
# 测试数据库连接
# ============================================

test_connection() {
    log_info "测试 Supabase 数据库连接..."
    
    # Supabase 连接格式: db.<project_id>.supabase.co
    PGHOST="db.${SUPABASE_PROJECT_ID}.supabase.co"
    PGPORT="5432"
    PGUSER="postgres"
    PGDATABASE="postgres"
    
    # 测试连接
    if PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT version();" &> /dev/null; then
        log_success "数据库连接成功"
    else
        log_error "数据库连接失败"
        echo ""
        echo "请检查以下配置:"
        echo "  - SUPABASE_PROJECT_ID: $SUPABASE_PROJECT_ID"
        echo "  - SUPABASE_DB_PASSWORD: [已设置]"
        echo ""
        echo "您可能需要:"
        echo "  1. 在 Supabase Dashboard 启用 Direct SQL 访问"
        echo "  2. 配置 Connection Pooling (推荐 PgBouncer)"
        echo "  3. 检查 IP 白名单设置"
        exit 1
    fi
}

# ============================================
# 列出所有表
# ============================================

list_tables() {
    log_info "获取数据库表列表..."
    
    PGHOST="db.${SUPABASE_PROJECT_ID}.supabase.co"
    PGPORT="5432"
    PGUSER="postgres"
    PGDATABASE="postgres"
    
    echo ""
    echo "=== 数据库中的表 ==="
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_schema, table_name;" 2>/dev/null || true
    echo ""
}

# ============================================
# 执行导出
# ============================================

export_data() {
    log_info "开始导出数据..."
    log_info "导出文件: $EXPORT_FILE"
    
    PGHOST="db.${SUPABASE_PROJECT_ID}.supabase.co"
    PGPORT="5432"
    PGUSER="postgres"
    PGDATABASE="postgres"
    
    # pg_dump 选项说明:
    #   -Fc: 自定义格式（压缩，pg_restore 可选择性恢复）
    #   --no-owner: 不导出对象所有者
    #   --no-acl: 不导出访问控制权限
    #   --no-securities: 不导出安全标签
    #   --no-comments: 不导出注释
    #   --data-only: 只导出数据，不导出结构
    #   --section=data: 导出数据部分
    
    # 首先尝试使用 PgBouncer 连接（Supabase 推荐方式）
    # 如果失败，使用直接连接
    
    export_cmd() {
        PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            --no-owner \
            --no-acl \
            --no-comments \
            --format=custom \
            --compress=9 \
            --file="$EXPORT_FILE"
    }
    
    if export_cmd; then
        log_success "数据导出成功"
        
        # 显示文件大小
        FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
        log_info "导出文件大小: $FILE_SIZE"
    else
        log_error "数据导出失败"
        echo ""
        echo "常见问题及解决方案:"
        echo ""
        echo "1. 连接超时"
        echo "   - Supabase 使用 PgBouncer 进行连接池"
        echo "   - 可能需要配置 Connection Pooling"
        echo "   - 参考: https://supabase.com/docs/guides/database/connecting-to-postgres"
        echo ""
        echo "2. IP 未白名单"
        echo "   - 在 Supabase Dashboard → Settings → Database → Connection Pooling"
        echo "   - 添加您的 IP 到白名单"
        echo ""
        echo "3. 使用 Supabase CLI"
        echo "   - 安装: npm install -g supabase"
        echo "   - 登录: supabase login"
        echo "   - 链接项目: supabase link --project-ref $SUPABASE_PROJECT_ID"
        echo "   - 导出: supabase db dump -f backup.sql"
        exit 1
    fi
}

# ============================================
# 生成验证脚本
# ============================================

generate_verify_script() {
    log_info "生成验证脚本..."
    
    cat > "${EXPORT_DIR}/verify-export.sh" << 'VERIFY_EOF'
#!/bin/bash
# ============================================
# 数据库导出验证脚本
# ============================================

EXPORT_FILE="$1"

if [ -z "$EXPORT_FILE" ]; then
    echo "用法: ./verify-export.sh <dump-file>"
    exit 1
fi

echo "=== 验证导出文件 ==="
echo "文件: $EXPORT_FILE"
echo ""

if [ ! -f "$EXPORT_FILE" ]; then
    echo "错误: 文件不存在"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
echo "文件大小: $FILE_SIZE"

# 使用 pg_restore 列出内容（需要 PostgreSQL）
if command -v pg_restore &> /dev/null; then
    echo ""
    echo "=== 表列表 ==="
    pg_restore -l "$EXPORT_FILE" 2>/dev/null | grep -E "^\\w" | head -50 || echo "无法列出内容"
else
    echo ""
    echo "pg_restore 未安装，跳过内容验证"
fi

echo ""
echo "=== 验证完成 ==="
echo "请使用 pg_restore --list $EXPORT_FILE 查看完整表列表"
VERIFY_EOF

    chmod +x "${EXPORT_DIR}/verify-export.sh"
    log_success "验证脚本已生成: ${EXPORT_DIR}/verify-export.sh"
}

# ============================================
# 生成导入说明
# ============================================

generate_import_guide() {
    log_info "生成导入说明..."
    
    cat > "${EXPORT_DIR}/IMPORT_GUIDE.md" << 'GUIDE_EOF'
# 数据导入指南

## 从 Supabase 导出后导入到阿里云 PolarDB

### 方法一：使用 pg_restore（推荐，用于自定义格式 .dump 文件）

```bash
# 1. 连接到阿里云 PolarDB
PGPASSWORD="your_aliyun_password" pg_restore \
    -h "your-aliyun-host.pg.rds.aliyuncs.com" \
    -p 5432 \
    -U lvzhi \
    -d lvzhi \
    --no-owner \
    --no-acl \
    --data-only \
    --disable-triggers \
    --jobs=4 \
    supabase-export-*.dump

# 2. 重建索引和约束
psql -h your-aliyun-host.pg.rds.aliyuncs.com -U lvzhi -d lvzhi -c "ANALYZE;"
```

### 方法二：使用 psql（用于 SQL 格式文件）

```bash
# 1. 导入 SQL 文件
PGPASSWORD="your_aliyun_password" psql \
    -h "your-aliyun-host.pg.rds.aliyuncs.com" \
    -p 5432 \
    -U lvzhi \
    -d lvzhi \
    < supabase-export-*.sql
```

### 方法三：使用数据库适配器脚本

```bash
# 1. 设置环境变量
export SUPABASE_URL="https://kqtpdsgwkvzinonkprcl.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
export ALIYUN_HOST="your-aliyun-host.pg.rds.aliyuncs.com"
export ALIYUN_PORT="5432"
export ALIYUN_DB="lvzhi"
export ALIYUN_USER="lvzhi"
export ALIYUN_PASSWORD="your-password"

# 2. 运行迁移脚本
node scripts/migrate-from-supabase.mjs
```

## 注意事项

1. **数据冲突处理**
   - 使用 `--on-conflict-do-nothing` 或 `--disable-triggers` 处理外键冲突
   - 建议先清空目标数据库表（或使用空库）

2. **性能优化**
   - 使用 `--jobs=4` 并行导入（根据 CPU 核心数调整）
   - 临时禁用索引，导入完成后再重建

3. **验证导入结果**
   - 对比源和目标的表行数
   - 检查关键表的数据完整性

## 阿里云 PolarDB 连接信息配置

```bash
# 连接字符串格式
postgresql://username:password@host:port/database

# 示例
postgresql://lvzhi:Wxwzcfwhf205@pgm-xxxxxxxx.pg.rds.aliyuncs.com:5432/lvzhi
```
GUIDE_EOF

    log_success "导入指南已生成: ${EXPORT_DIR}/IMPORT_GUIDE.md"
}

# ============================================
# 主流程
# ============================================

main() {
    echo ""
    echo "============================================"
    echo "  律植 - Supabase 数据库导出工具"
    echo "============================================"
    echo ""
    
    check_dependencies
    prepare_export_dir
    test_connection
    list_tables
    export_data
    generate_verify_script
    generate_import_guide
    
    echo ""
    echo "============================================"
    echo "  导出完成!"
    echo "============================================"
    echo ""
    echo "下一步操作:"
    echo "  1. 查看导出文件: ls -la $EXPORT_DIR"
    echo "  2. 验证导出: ${EXPORT_DIR}/verify-export.sh $EXPORT_FILE"
    echo "  3. 阅读导入指南: cat ${EXPORT_DIR}/IMPORT_GUIDE.md"
    echo ""
}

# 运行
main
GUIDE_EOF

    log_success "导入说明已生成: ${EXPORT_DIR}/IMPORT_GUIDE.md"
}

# ============================================
# 主流程
# ============================================

main() {
    echo ""
    echo "============================================"
    echo "  律植 - Supabase 数据库导出工具"
    echo "============================================"
    echo ""
    
    check_dependencies
    prepare_export_dir
    test_connection
    list_tables
    export_data
    generate_verify_script
    generate_import_guide
    
    echo ""
    echo "============================================"
    echo "  导出完成!"
    echo "============================================"
    echo ""
    echo "下一步操作:"
    echo "  1. 查看导出文件: ls -la $EXPORT_DIR"
    echo "  2. 验证导出: ${EXPORT_DIR}/verify-export.sh $EXPORT_FILE"
    echo "  3. 阅读导入指南: cat ${EXPORT_DIR}/IMPORT_GUIDE.md"
    echo ""
}

# 运行
main
