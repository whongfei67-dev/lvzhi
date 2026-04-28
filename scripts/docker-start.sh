#!/bin/bash
# ============================================
# 律植 - Docker Desktop 快速启动脚本
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║   律植 (Lvzhi) - Docker Desktop 快速启动脚本           ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 检查 Docker Desktop 是否运行
echo -e "${YELLOW}[1/5] 检查 Docker Desktop...${NC}"

if pgrep -x "Docker" > /dev/null 2>&1 || docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Desktop 正在运行"
else
    echo -e "${YELLOW}→${NC} Docker Desktop 未运行，正在启动..."
    open -a Docker

    # 等待 Docker 启动
    echo "等待 Docker Desktop 启动..."
    for i in {1..60}; do
        if docker info > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Docker Desktop 启动成功"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

# 2. 等待 Docker API 就绪
echo ""
echo -e "${YELLOW}[2/5] 检查 Docker API...${NC}"

for i in {1..30}; do
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker API 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Docker API 超时"
        exit 1
    fi
    sleep 1
done

# 3. 进入项目目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"
echo ""
echo -e "${YELLOW}[3/5] 项目目录: $(pwd)${NC}"

# 4. 检查配置文件
echo ""
echo -e "${YELLOW}[4/5] 检查配置文件...${NC}"

# 检查 deploy/.env
if [ -f "deploy/.env" ]; then
    echo -e "${GREEN}✓${NC} deploy/.env 存在"
else
    echo -e "${YELLOW}⚠${NC} deploy/.env 不存在，复制模板..."
    if [ -f "deploy/env.example" ]; then
        cp deploy/env.example deploy/.env
        echo -e "${YELLOW}请编辑 deploy/.env 填写必要的配置！${NC}"
    fi
fi

# 检查 .env.docker（构建用）
if [ -f ".env.docker" ]; then
    echo -e "${GREEN}✓${NC} .env.docker 存在"
else
    echo -e "${RED}✗${NC} .env.docker 不存在"
    echo "请在项目根目录创建 .env.docker 文件"
    exit 1
fi

# 5. 启动服务
echo ""
echo -e "${YELLOW}[5/5] 启动律植服务...${NC}"

# 使用两个环境文件：构建用 + 运行时用
docker compose --env-file .env.docker --env-file deploy/.env up -d

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║   ✓ 律植服务启动完成！                                   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "查看日志: docker compose --env-file .env.docker --env-file deploy/.env logs -f"
echo "停止服务: docker compose --env-file .env.docker --env-file deploy/.env down"
echo "查看状态: docker compose --env-file .env.docker --env-file deploy/.env ps"
echo ""
echo "访问服务:"
echo "  前端 (http): http://localhost"
echo "  后端 API:   http://localhost:3001"
echo ""

# 检查服务健康状态
echo -e "${YELLOW}服务状态:${NC}"
docker compose --env-file .env.docker --env-file deploy/.env ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"