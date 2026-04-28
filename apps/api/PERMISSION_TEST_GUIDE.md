# ============================================
# 权限控制测试脚本
# ============================================

## 前置条件

确保 API 服务正在运行：
```bash
cd apps/api
npm run dev
```

## 测试场景

### 1. 游客访问测试

```bash
# 测试游客访问机会列表（应该返回 50% 限制的数据）
curl -X GET "http://localhost:4000/api/opportunities" \
  -H "Content-Type: application/json"

# 预期响应头：
# X-Content-Limited: true
# X-Visitor-Limited: true
```

### 2. 已登录用户测试

```bash
# 先登录获取 token
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 使用 token 访问
curl -X GET "http://localhost:4000/api/opportunities" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 预期：返回完整数据，无 X-Content-Limited 头
```

### 3. 创作者访问测试

```bash
# 使用创作者账号登录
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@example.com","password":"password"}'

# 访问创作者中心
curl -X GET "http://localhost:4000/api/creator/overview" \
  -H "Authorization: Bearer CREATOR_TOKEN"

# 预期：可以访问
```

### 4. 管理员访问测试

```bash
# 使用管理员账号登录
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 访问管理后台
curl -X GET "http://localhost:4000/api/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 预期：可以访问用户列表
```

### 5. 游客不能访问的接口

```bash
# 尝试创建机会（应返回 401）
curl -X POST "http://localhost:4000/api/opportunities" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'

# 预期响应：
# {"code":401,"message":"请先登录"}

# 尝试进入创作者中心（应返回 403）
curl -X GET "http://localhost:4000/api/creator/overview"

# 预期响应：
# {"code":403,"message":"只有创作者可以访问"}
```

## 自动化测试脚本

```bash
#!/bin/bash

API_BASE="http://localhost:4000"

echo "=== 权限控制测试 ==="

echo ""
echo "1. 测试游客访问机会列表..."
response=$(curl -s -w "\n%{http_code}" "$API_BASE/api/opportunities")
code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)
echo "状态码: $code"
if [[ "$body" == *"X-Content-Limited"* ]] || [[ "$code" == "200" ]]; then
  echo "✅ 游客可以访问公开内容"
else
  echo "❌ 测试失败"
fi

echo ""
echo "2. 测试游客创建机会（应拒绝）..."
response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/opportunities" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}')
code=$(echo "$response" | tail -1)
if [[ "$code" == "401" ]] || [[ "$code" == "403" ]]; then
  echo "✅ 游客被正确拒绝"
else
  echo "❌ 测试失败，状态码: $code"
fi

echo ""
echo "3. 测试邀请创建..."
response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/invitations" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id":"test","source_type":"skill","source_id":"test","invitation_type":"collaboration"}')
code=$(echo "$response" | tail -1)
if [[ "$code" == "401" ]] || [[ "$code" == "403" ]]; then
  echo "✅ 游客被正确拒绝"
else
  echo "❌ 测试失败，状态码: $code"
fi

echo ""
echo "=== 测试完成 ==="
```

## 关键验证点

| 验证项 | 预期结果 |
|--------|----------|
| 游客访问公开列表 | 返回 200，有 X-Content-Limited 头 |
| 游客访问详情（需权限字段） | 部分字段被过滤或返回 403 |
| 游客创建/修改/删除 | 返回 401 |
| client 访问工作台 | 返回 200 |
| visitor 访问创作者中心 | 返回 403 |
| 管理员访问管理后台 | 返回 200 |
| admin 访问创作者收益 | 返回 403 |
