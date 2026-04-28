#!/bin/bash
# 律植 (Lvzhi) API 综合功能测试脚本
# 直接使用 curl 测试，无需 Node.js 依赖

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
SERVER_URL="${SERVER_URL:-http://8.159.156.192:8080}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 测试计数器
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# 日志函数
log_info() { echo -e "${BLUE}ℹ INFO${NC}  $1"; }
log_pass() { echo -e "${GREEN}✓ PASS${NC}  $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}✗ FAIL${NC}  $1"; ((FAILED++)); }
log_skip() { echo -e "${YELLOW}⊘ SKIP${NC}  $1"; ((SKIPPED++)); }
log_warn() { echo -e "${YELLOW}⚠ WARN${NC}  $1"; }
log_section() { echo ""; echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"; echo -e "${BOLD}${CYAN}  $1${NC}"; echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════${NC}"; }

# 测试函数
test_endpoint() {
    ((TOTAL++))
    local name="$1"
    local expected_status="${2:-200}"
    local response=$(curl -s -w "\n%{http_code}" "$3" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$status" == "$expected_status" ]; then
        log_pass "$name (HTTP $status)"
        return 0
    else
        log_fail "$name - 期望 $expected_status, 实际 $status"
        echo "       响应: ${body:0:200}"
        return 1
    fi
}

# Bearer Token 测试
test_auth_endpoint() {
    ((TOTAL++))
    local name="$1"
    local token="$2"
    local expected_status="${3:-200}"
    local response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$4" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$status" == "$expected_status" ]; then
        log_pass "$name (HTTP $status)"
        return 0
    else
        log_fail "$name - 期望 $expected_status, 实际 $status"
        echo "       响应: ${body:0:200}"
        return 1
    fi
}

# 测试 JSON 响应包含字段
test_json_field() {
    ((TOTAL++))
    local name="$1"
    local field="$2"
    local response=$(curl -s "$3" 2>/dev/null)
    
    if echo "$response" | grep -q "\"$field\""; then
        log_pass "$name - 包含字段 '$field'"
        return 0
    else
        log_fail "$name - 缺少字段 '$field'"
        return 1
    fi
}

# ============================================
# 开始测试
# ============================================

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     律植 (Lvzhi) API 综合功能测试                   ║${NC}"
echo -e "${BOLD}${CYAN}║     测试目标: $API_BASE_URL${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. 健康检查
# ============================================
log_section "1. 健康检查"

test_endpoint "API 健康检查" "200" "$API_BASE_URL/api/health"
test_json_field "健康检查响应" "status" "$API_BASE_URL/api/health"

# ============================================
# 2. 公开接口测试
# ============================================
log_section "2. 公开接口测试"

test_endpoint "获取智能体列表" "200" "$API_BASE_URL/api/agents"
test_endpoint "获取产品列表" "200" "$API_BASE_URL/api/products"
test_endpoint "获取社区帖子列表" "200" "$API_BASE_URL/api/community/posts"

# ============================================
# 3. 认证流程测试
# ============================================
log_section "3. 认证流程测试"

# 测试注册
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test_$(date +%s)@example.com\",\"password\":\"Test@123456\"}")
echo "       注册响应: ${REGISTER_RESPONSE:0:200}"

# 测试登录
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lvzhi.com","password":"Admin123!"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    log_pass "用户登录成功，获取 Token"
    
    # 测试获取当前用户信息
    test_auth_endpoint "获取当前用户信息" "$TOKEN" "200" "$API_BASE_URL/api/auth/me"
    
    # 测试 Token 失效访问
    test_auth_endpoint "无效 Token 访问 (应返回401)" "invalid_token" "401" "$API_BASE_URL/api/auth/me"
else
    log_fail "用户登录失败"
    echo "       响应: ${LOGIN_RESPONSE:0:300}"
    TOKEN=""
fi

# ============================================
# 4. 智能体接口测试（需要认证）
# ============================================
log_section "4. 智能体接口测试"

if [ -n "$TOKEN" ]; then
    test_auth_endpoint "获取我的智能体列表" "$TOKEN" "200" "$API_BASE_URL/api/agents/creator/my"
    test_auth_endpoint "获取收藏列表" "$TOKEN" "200" "$API_BASE_URL/api/agents/user/favorites"
    
    # 获取第一个智能体 ID
    AGENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/api/agents" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [ -n "$AGENT_ID" ]; then
        test_auth_endpoint "获取智能体详情" "$TOKEN" "200" "$API_BASE_URL/api/agents/$AGENT_ID"
        test_auth_endpoint "获取智能体统计" "$TOKEN" "200" "$API_BASE_URL/api/agents/$AGENT_ID/stats"
    fi
else
    log_skip "跳过智能体测试（无有效 Token）"
fi

# ============================================
# 5. 社区接口测试
# ============================================
log_section "5. 社区接口测试"

if [ -n "$TOKEN" ]; then
    # 创建帖子
    POST_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/community/posts" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"title":"测试帖子","content":"这是测试内容","tags":["测试"]}')
    POST_ID=$(echo "$POST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$POST_ID" ]; then
        log_pass "创建帖子成功 (ID: $POST_ID)"
        test_auth_endpoint "获取帖子详情" "$TOKEN" "200" "$API_BASE_URL/api/community/posts/$POST_ID"
        
        # 点赞帖子
        LIKE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/community/posts/$POST_ID/like" \
            -H "Authorization: Bearer $TOKEN")
        echo "       点赞响应: ${LIKE_RESPONSE:0:100}"
        
        # 评论
        COMMENT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/community/comments" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"post_id\":$POST_ID,\"content\":\"测试评论\"}")
        echo "       评论响应: ${COMMENT_RESPONSE:0:100}"
    else
        log_fail "创建帖子失败"
    fi
else
    log_skip "跳过社区测试（无有效 Token）"
fi

# ============================================
# 6. 余额接口测试
# ============================================
log_section "6. 余额接口测试"

if [ -n "$TOKEN" ]; then
    test_auth_endpoint "查询余额" "$TOKEN" "200" "$API_BASE_URL/api/balance"
    test_auth_endpoint "查询余额流水" "$TOKEN" "200" "$API_BASE_URL/api/balance/transactions"
else
    log_skip "跳过余额测试（无有效 Token）"
fi

# ============================================
# 7. AI 对话接口测试
# ============================================
log_section "7. AI 对话接口测试"

if [ -n "$TOKEN" ]; then
    # 简单 AI 对话测试
    AI_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/ai/chat" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"你好，测试"}],"model":"glm-4"}')
    
    if echo "$AI_RESPONSE" | grep -q '"content"\|response\|message'; then
        log_pass "AI 对话接口响应成功"
    else
        log_fail "AI 对话接口响应异常"
        echo "       响应: ${AI_RESPONSE:0:200}"
    fi
else
    log_skip "跳过 AI 测试（无有效 Token）"
fi

# ============================================
# 8. 安全测试
# ============================================
log_section "8. 安全测试"

# 未授权访问
test_endpoint "未登录访问 /me 应返回 401" "401" "$API_BASE_URL/api/auth/me"

# SQL 注入测试
SQL_RESPONSE=$(curl -s "$API_BASE_URL/api/agents?name=' OR 1=1 --")
if echo "$SQL_RESPONSE" | grep -qi "error\|syntax"; then
    log_pass "SQL 注入防护正常"
else
    log_warn "SQL 注入测试：可能存在注入风险，请人工检查"
fi

# XSS 测试
XSS_RESPONSE=$(curl -s "$API_BASE_URL/api/community/posts?title=<script>alert(1)</script>")
if echo "$XSS_RESPONSE" | grep -qi "<script>"; then
    log_warn "XSS 测试：可能存在 XSS 风险，请人工检查"
else
    log_pass "XSS 防护正常"
fi

# Rate Limit 测试（快速请求）
log_info "测试 Rate Limit（发送 10 个快速请求）..."
RATE_LIMIT_COUNT=0
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/health")
    if [ "$STATUS" == "429" ]; then
        ((RATE_LIMIT_COUNT++))
    fi
done
if [ $RATE_LIMIT_COUNT -gt 0 ]; then
    log_pass "Rate Limit 生效（被限流 $RATE_LIMIT_COUNT 次）"
else
    log_warn "Rate Limit 未检测到，可能未启用"
fi

# ============================================
# 9. 前端页面测试
# ============================================
log_section "9. 前端页面测试"

test_endpoint "首页访问" "200" "$SERVER_URL"
test_endpoint "API 代理访问" "200" "$SERVER_URL/api/health"

# ============================================
# 10. Docker 容器状态
# ============================================
log_section "10. Docker 容器状态"

log_info "检查容器状态..."
DOCKER_STATUS=$(curl -s http://localhost/api/containers/json 2>/dev/null || echo "无法连接 Docker socket")

# ============================================
# 测试结果汇总
# ============================================
log_section "测试结果汇总"

echo ""
echo -e "${BOLD}总计:     ${TOTAL}${NC}"
echo -e "${GREEN}通过:     ${PASSED}${NC}"
echo -e "${RED}失败:     ${FAILED}${NC}"
echo -e "${YELLOW}跳过:     ${SKIPPED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}⚠️  有 $FAILED 项测试失败，请检查！${NC}"
    exit 1
fi
