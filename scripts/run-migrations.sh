#!/bin/bash
# 数据库迁移脚本
# 使用方法: ./scripts/run-migrations.sh <数据库密码>

set -e

DB_HOST="lvzhi-prod.pg.polardb.rds.aliyuncs.com"
DB_PORT="5432"
DB_USER="mamba_01"
DB_NAME="data01"
DB_PASSWORD="${1:-}"

if [ -z "$DB_PASSWORD" ]; then
  echo "请提供数据库密码作为参数: $0 <密码>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

echo "=========================================="
echo "律植项目数据库迁移"
echo "=========================================="
echo "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 构建连接字符串
export PGPASSWORD="$DB_PASSWORD"
CONN_STRING="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# 迁移1：试用邀请表
echo "[1/3] 创建试用邀请表..."
psql $CONN_STRING -f "$MIGRATIONS_DIR/018_trial_invitations.sql"
echo "✅ 迁移1完成"
echo ""

# 迁移2：知识产权保护表
echo "[2/3] 创建知识产权保护表..."
psql $CONN_STRING -f "$MIGRATIONS_DIR/019_ip_protection.sql"
echo "✅ 迁移2完成"
echo ""

# 迁移3：律师认证表
echo "[3/3] 创建律师认证表..."
psql $CONN_STRING -f "$MIGRATIONS_DIR/020_lawyer_verification.sql"
echo "✅ 迁移3完成"
echo ""

echo "=========================================="
echo "🎉 所有迁移已完成！"
echo "=========================================="
echo ""
echo "现在可以重启后端服务了："
echo "  cd apps/api && pnpm restart"
