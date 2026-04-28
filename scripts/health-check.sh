#!/bin/bash
# ============================================
# 律植 - Docker 健康检查脚本
# 检查所有容器状态
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "律植 Docker 容器健康检查"
echo "========================================"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 运行正常${NC}\n"

# 检查容器状态
check_container() {
    local name=$1
    local expected_status=${2:-"running"}
    
    if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null)
        if [ "$status" = "$expected_status" ]; then
            echo -e "${GREEN}✓${NC} $name: $status"
            return 0
        else
            echo -e "${RED}✗${NC} $name: $status (期望: $expected_status)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $name: 不存在"
        return 1
    fi
}

# 检查 API 健康检查端点
check_api_health() {
    local url=${1:-"http://localhost:4000/health"}
    local name=$2
    
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name 健康检查通过"
        return 0
    else
        echo -e "${RED}✗${NC} $name 健康检查失败"
        return 1
    fi
}

failed=0

echo "--- 容器状态 ---"
check_container "lvzhi-api" || ((failed++))
check_container "lvzhi-web" || ((failed++))
check_container "lvzhi-nginx" || ((failed++))
check_container "lvzhi-postgres" || ((failed++))
check_container "lvzhi-redis" || ((failed++))

echo ""
echo "--- API 健康检查 ---"
check_api_health "http://localhost:4000/health" "API" || ((failed++))
check_api_health "http://localhost:3000" "Web" || ((failed++))

echo ""
echo "--- 资源使用 ---"
echo "容器数量: $(docker ps -q | wc -l)"
echo "CPU 使用: $(docker stats --no-stream --format "CPU: {{.CPUPerc}}")"
echo "内存使用: $(docker stats --no-stream --format "内存: {{.MemPerc}}")"

echo ""
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}========================================"
    echo -e "所有检查通过! ✓${NC}"
    echo -e "========================================"
    exit 0
else
    echo -e "${RED}========================================"
    echo -e "有 $failed 项检查失败 ✗${NC}"
    echo -e "========================================"
    exit 1
fi
