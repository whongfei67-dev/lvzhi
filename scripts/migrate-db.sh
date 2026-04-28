#!/usr/bin/env bash
# ============================================
# 律植 - 数据库迁移脚本
# 从 Supabase 迁移到阿里云 PolarDB
#
# 使用方法：
#   1. 设置环境变量（见 .env.migration.example）
#   2. 运行: bash scripts/migrate-db.sh
# ============================================

set -e

echo "============================================"
echo "  律植 - 数据库迁移工具"
echo "============================================"
echo ""
echo "此脚本将帮助您完成从 Supabase 到阿里云 PolarDB 的数据迁移"
echo ""

# 1. 检查环境
echo "步骤 1: 检查环境..."

if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "警告: psql 未安装，某些功能可能不可用"
fi

if ! command -v pg_dump &> /dev/null; then
    echo "警告: pg_dump 未安装，某些功能可能不可用"
fi

echo "Node.js: $(node --version)"
echo "psql: $(command -v psql &> /dev/null && echo "已安装" || echo "未安装")"
echo "pg_dump: $(command -v pg_dump &> /dev/null && echo "已安装" || echo "未安装")"
echo ""

# 2. 检查环境变量
echo "步骤 2: 检查环境变量..."

# Supabase 配置
if [ -z "$SUPABASE_URL" ]; then
    echo "  SUPABASE_URL: 未设置"
    read -p "请输入 Supabase URL (例如: https://xxxx.supabase.co): " SUPABASE_URL
    export SUPABASE_URL
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "  SUPABASE_SERVICE_KEY: 未设置"
    read -p "请输入 Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    export SUPABASE_SERVICE_KEY
fi

# 阿里云配置
if [ -z "$ALIYUN_HOST" ]; then
    echo "  ALIYUN_HOST: 未设置"
    read -p "请输入阿里云 PolarDB 主机地址: " ALIYUN_HOST
    export ALIYUN_HOST
fi

if [ -z "$ALIYUN_PASSWORD" ]; then
    echo "  ALIYUN_PASSWORD: 未设置"
    read -s -p "请输入阿里云数据库密码: " ALIYUN_PASSWORD
    echo ""
    export ALIYUN_PASSWORD
fi

echo ""
echo "配置摘要:"
echo "  Supabase: ${SUPABASE_URL}"
echo "  阿里云: ${ALIYUN_HOST}:${ALIYUN_PORT:-5432}/${ALIYUN_DB:-lvzhi}"
echo ""

read -p "继续? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

# 3. 导出数据
echo ""
echo "步骤 3: 从 Supabase 导出数据..."
echo "运行: node scripts/export-supabase-api.mjs"

node scripts/export-supabase-api.mjs

echo ""

# 4. 导入数据
echo ""
echo "步骤 4: 导入数据到阿里云 PolarDB..."
echo "运行: ALIYUN_PASSWORD=$ALIYUN_PASSWORD node scripts/import-to-aliyun.mjs"

ALIYUN_PASSWORD=$ALIYUN_PASSWORD node scripts/import-to-aliyun.mjs

echo ""

# 5. 完成
echo "============================================"
echo "  迁移完成!"
echo "============================================"
