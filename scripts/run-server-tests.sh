#!/bin/bash
# ============================================
# 律植 (Lvzhi) 服务器端测试脚本
# 在阿里云服务器上运行此脚本进行综合测试
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 地址配置
API_HOST="${1:-http://localhost:3001}"
WEB_HOST="${2:-http://localhost:3002}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║   律植 (Lvzhi) 服务器端综合测试                               ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}测试配置:${NC}"
echo "  API 地址: $API_HOST"
echo "  Web 地址: $WEB_HOST"
echo ""

# ============================================
# 1. 健康检查
# ============================================

echo -e "${BLUE}━━━ 1. 健康检查 ━━━${NC}"

check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name: $response"
        return 0
    else
        echo -e "${RED}✗${NC} $name: $response (期望: $expected_status)"
        return 1
    fi
}

# API 健康检查
check_endpoint "API 健康端点" "$API_HOST/health" "200"

# Web 健康检查  
check_endpoint "Web 首页" "$WEB_HOST/" "200"

echo ""

# ============================================
# 2. 公开接口测试
# ============================================

echo -e "${BLUE}━━━ 2. 公开接口测试 ━━━${NC}"

check_endpoint "智能体列表" "$API_HOST/api/agents"
check_endpoint "产品列表" "$API_HOST/api/products"
check_endpoint "社区帖子" "$API_HOST/api/community/posts"
check_endpoint "创作者列表" "$API_HOST/api/creators"

echo ""

# ============================================
# 3. 认证接口测试
# ============================================

echo -e "${BLUE}━━━ 3. 认证接口测试 ━━━${NC}"

# 生成测试邮箱
TEST_EMAIL="test_$(date +%s)_$RANDOM@example.com"
TEST_PASSWORD="Test@123456"

echo "测试邮箱: $TEST_EMAIL"

# 3.1 用户注册
echo -e "${BLUE}测试用户注册...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_HOST/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"display_name\":\"测试用户\"}" \
    2>/dev/null || echo '{"code":0}')

if echo "$REGISTER_RESPONSE" | grep -q '"code":200\|"code":201'; then
    echo -e "${GREEN}✓${NC} 用户注册成功"
else
    echo -e "${RED}✗${NC} 用户注册失败"
    echo "响应: $REGISTER_RESPONSE"
fi

# 3.2 用户登录
echo -e "${BLUE}测试用户登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_HOST/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    2>/dev/null || echo '{"code":0}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓${NC} 用户登录成功"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗${NC} 用户登录失败"
    echo "响应: $LOGIN_RESPONSE"
fi

echo ""

# ============================================
# 4. 受保护接口测试
# ============================================

if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}━━━ 4. 受保护接口测试 ━━━${NC}"
    
    # 4.1 获取用户信息
    check_endpoint "获取用户信息" "$API_HOST/api/auth/me" "401"
    
    ME_RESPONSE=$(curl -s "$API_HOST/api/auth/me" \
        -H "Authorization: Bearer $TOKEN" \
        2>/dev/null || echo '{"code":0}')
    
    if echo "$ME_RESPONSE" | grep -q '"code":200'; then
        echo -e "${GREEN}✓${NC} Token 认证成功"
    else
        echo -e "${RED}✗${NC} Token 认证失败"
    fi
    
    # 4.2 余额查询
    BALANCE_RESPONSE=$(curl -s "$API_HOST/api/balance" \
        -H "Authorization: Bearer $TOKEN" \
        2>/dev/null || echo '{"code":0}')
    
    if echo "$BALANCE_RESPONSE" | grep -q '"code":200'; then
        echo -e "${GREEN}✓${NC} 余额查询成功"
    else
        echo -e "${YELLOW}⚠${NC} 余额查询失败"
    fi
    
    echo ""
fi

# ============================================
# 5. 安全测试
# ============================================

echo -e "${BLUE}━━━ 5. 安全测试 ━━━${NC}"

# 5.1 未授权访问
UNAUTHORIZED_RESPONSE=$(curl -s "$API_HOST/api/auth/me" 2>/dev/null || echo "")
if echo "$UNAUTHORIZED_RESPONSE" | grep -q '"code":401'; then
    echo -e "${GREEN}✓${NC} 未授权访问返回 401"
else
    echo -e "${RED}✗${NC} 未授权访问未正确拒绝"
fi

# 5.2 SQL 注入测试
echo -e "${BLUE}测试 SQL 注入防护...${NC}"
SQL_INJECTION=$(curl -s -X POST "$API_HOST/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"'"'"' OR '"'"'1'"'"'='"'"'1","password":"any"}' \
    2>/dev/null || echo "")

if echo "$SQL_INJECTION" | grep -q '"access_token"'; then
    echo -e "${RED}✗${NC} SQL 注入可能成功！"
else
    echo -e "${GREEN}✓${NC} SQL 注入被正确阻止"
fi

# 5.3 暴力登录防护
echo -e "${BLUE}测试暴力登录防护...${NC}"
for i in {1..10}; do
    RESULT=$(curl -s -X POST "$API_HOST/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"bruteforce'"$i"'@test.com","password":"wrong"}' \
        2>/dev/null || echo "")
    
    if echo "$RESULT" | grep -q '"code":429'; then
        echo -e "${GREEN}✓${NC} 暴力登录防护在第 $i 次尝试后触发"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠${NC} 连续 10 次登录失败未触发限流"
    fi
done

echo ""

# ============================================
# 6. Docker 容器状态
# ============================================

echo -e "${BLUE}━━━ 6. Docker 容器状态 ━━━${NC}"

docker ps --filter "name=lvzhi" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "无法获取 Docker 状态"

echo ""

# ============================================
# 测试总结
# ============================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}测试完成: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "提示："
echo "  - 如需运行完整的功能测试，请在本地运行: pnpm test:flows"
echo "  - 如需运行安全测试，请在本地运行: pnpm test:security:verify"
echo "  - 如需运行压测，请在服务器安装 k6 后运行: k6 run /opt/lvzhi/apps/api/load-test/scenarios.js"
echo ""
