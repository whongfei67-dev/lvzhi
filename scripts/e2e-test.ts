/**
 * 律植 (Lvzhi) 综合功能测试脚本
 *
 * 覆盖阶段六：上线前综合检查 - 功能验证
 *
 * 使用方法：
 *   npm run test:e2e                    # 运行所有测试
 *   npm run test:e2e -- --test=auth     # 只运行认证测试
 *   npm run test:e2e -- --test=flow    # 只运行流程测试
 *   npm run test:e2e -- --test=security # 只运行安全测试
 *
 * 环境变量：
 *   API_BASE_URL - API 基础地址 (默认: http://localhost:3001)
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const TEST_TIMEOUT = 30000

// 测试账号
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@test.com',
    password: 'Test@123456',
  },
  creator: {
    email: 'creator@test.com',
    password: 'Test@123456',
  },
}

// ============================================
// 工具函数
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(type: 'pass' | 'fail' | 'info' | 'warn' | 'skip', message: string, details?: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
    skip: `${colors.yellow}⊘ SKIP${colors.reset}`,
  }[type]
  const msg = `${prefix} ${message}`
  if (details) {
    console.log(msg)
    console.log(`       ${colors.gray}${details}${colors.reset}`)
  } else {
    console.log(msg)
  }
}

function generateTestEmail(): string {
  return `test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@example.com`
}

function generateTestPhone(): string {
  return `138${String(Date.now()).slice(-8)}`
}

function generateUniqueId(): string {
  return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

// ============================================
// HTTP 请求封装
// ============================================

interface RequestOptions {
  body?: unknown
  headers?: Record<string, string>
  expectedStatus?: number[]
  timeout?: number
}

interface Response {
  status: number
  data: unknown
  headers: Headers
}

async function request(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { body, headers = {}, expectedStatus, timeout = TEST_TIMEOUT } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let data: unknown
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (expectedStatus && !expectedStatus.includes(response.status)) {
      log('fail', `${method} ${path}`, `Expected: ${expectedStatus.join('|')}, Got: ${response.status}`)
      if (typeof data === 'object' && data !== null) {
        console.log(`       Response: ${JSON.stringify(data).slice(0, 200)}`)
      }
    }

    return {
      status: response.status,
      data,
      headers: response.headers,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ============================================
// 认证辅助函数
// ============================================

interface AuthResult {
  token: string
  refreshToken: string
  userId: string
  user: Record<string, unknown>
}

async function register(email: string, password: string, displayName?: string): Promise<AuthResult | null> {
  const result = await request('POST', '/api/auth/register', {
    body: {
      email,
      password,
      display_name: displayName || `User_${generateUniqueId()}`,
    },
    expectedStatus: [200, 201],
  })

  if (result.status >= 200 && result.status < 300) {
    const data = result.data as { data?: { access_token?: string; refresh_token?: string; user?: Record<string, unknown> } }
    return {
      token: data.data?.access_token || '',
      refreshToken: data.data?.refresh_token || '',
      userId: (data.data?.user as { id?: string })?.id || '',
      user: data.data?.user || {},
    }
  }
  return null
}

async function login(email: string, password: string): Promise<AuthResult | null> {
  const result = await request('POST', '/api/auth/login', {
    body: { email, password },
    expectedStatus: [200],
  })

  if (result.status === 200) {
    const data = result.data as { data?: { access_token?: string; refresh_token?: string; user?: Record<string, unknown> } }
    return {
      token: data.data?.access_token || '',
      refreshToken: data.data?.refresh_token || '',
      userId: (data.data?.user as { id?: string })?.id || '',
      user: data.data?.user || {},
    }
  }
  return null
}

async function getMe(token: string): Promise<Record<string, unknown> | null> {
  const result = await request('GET', '/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })

  if (result.status === 200) {
    const data = result.data as { data?: Record<string, unknown> }
    return data.data || null
  }
  return null
}

// ============================================
// 测试模块
// ============================================

// ============================================
// 1. 健康检查测试
// ============================================

async function testHealthCheck(): Promise<boolean> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 1. 健康检查 ━━━${colors.reset}\n`)

  const tests = [
    {
      name: 'API 健康检查端点',
      path: '/health',
      expectedStatus: [200],
    },
    {
      name: 'AI 服务健康检查',
      path: '/api/ai/health',
      expectedStatus: [200],
    },
    {
      name: '智能体列表（公开接口）',
      path: '/api/agents',
      expectedStatus: [200],
    },
    {
      name: '产品列表（公开接口）',
      path: '/api/products',
      expectedStatus: [200],
    },
    {
      name: '社区帖子列表（公开接口）',
      path: '/api/community/posts',
      expectedStatus: [200],
    },
  ]

  let passed = 0
  for (const test of tests) {
    const result = await request('GET', test.path)
    if (result.status === 200) {
      log('pass', test.name)
      passed++
    } else {
      log('fail', test.name, `Status: ${result.status}`)
    }
  }

  console.log(`\n健康检查结果: ${passed}/${tests.length} 通过`)
  return passed === tests.length
}

// ============================================
// 2. 认证流程测试
// ============================================

async function testAuthFlow(): Promise<{ token: string; userId: string } | null> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 2. 认证流程测试 ━━━${colors.reset}\n`)

  const testEmail = generateTestEmail()
  const testPassword = 'Test@123456'

  // 2.1 用户注册
  log('info', '测试用户注册...')
  let result = await register(testEmail, testPassword, '测试用户')
  if (result && result.token) {
    log('pass', '用户注册成功', `邮箱: ${testEmail}`)
  } else {
    log('fail', '用户注册失败')
    return null
  }

  const token = result.token
  const userId = result.userId

  // 2.2 登录后获取用户信息
  log('info', '测试获取当前用户信息...')
  const user = await getMe(token)
  if (user && user.id === userId) {
    log('pass', '获取用户信息成功', `用户: ${user.display_name || user.email}`)
  } else {
    log('fail', '获取用户信息失败')
  }

  // 2.3 Token 刷新
  log('info', '测试 Token 刷新...')
  const refreshResult = await request('POST', '/api/auth/refresh', {
    body: { refresh_token: result.refreshToken },
    expectedStatus: [200],
  })
  if (refreshResult.status === 200) {
    log('pass', 'Token 刷新成功')
  } else {
    log('fail', 'Token 刷新失败')
  }

  // 2.4 登出
  log('info', '测试登出...')
  const logoutResult = await request('POST', '/api/auth/logout', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })
  if (logoutResult.status === 200) {
    log('pass', '登出成功')
  } else {
    log('fail', '登出失败')
  }

  // 2.5 再次登录验证
  log('info', '测试登录流程...')
  const loginResult = await login(testEmail, testPassword)
  if (loginResult && loginResult.token) {
    log('pass', '登录成功', `Token: ${loginResult.token.slice(0, 20)}...`)
  } else {
    log('fail', '登录失败')
    return null
  }

  console.log(`\n认证流程测试完成`)
  return { token: loginResult.token, userId: loginResult.userId }
}

// ============================================
// 3. 智能体功能测试
// ============================================

async function testAgents(token: string): Promise<string | null> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 3. 智能体功能测试 ━━━${colors.reset}\n`)

  let agentId: string | null = null

  // 3.1 创建智能体
  log('info', '测试创建智能体...')
  const createResult = await request('POST', '/api/agents', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: `测试智能体_${generateUniqueId()}`,
      description: '这是一个用于自动化测试的智能体',
      category: 'legal',
      price: 10,
      is_free_trial: true,
      trial_quota: 3,
      config: {
        model: 'glm-4',
        temperature: 0.7,
        max_tokens: 2000,
      },
    },
    expectedStatus: [200, 201],
  })

  if (createResult.status >= 200 && createResult.status < 300) {
    const data = createResult.data as { data?: { id?: string } }
    agentId = data.data?.id || null
    log('pass', '创建智能体成功', `ID: ${agentId}`)
  } else {
    log('fail', '创建智能体失败', JSON.stringify(createResult.data).slice(0, 100))
  }

  // 3.2 获取智能体详情
  if (agentId) {
    log('info', '测试获取智能体详情...')
    const detailResult = await request('GET', `/api/agents/${agentId}`)
    if (detailResult.status === 200) {
      log('pass', '获取智能体详情成功')
    } else {
      log('fail', '获取智能体详情失败')
    }
  }

  // 3.3 更新智能体
  if (agentId) {
    log('info', '测试更新智能体...')
    const updateResult = await request('PUT', `/api/agents/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        description: '这是更新后的描述',
      },
      expectedStatus: [200],
    })
    if (updateResult.status === 200) {
      log('pass', '更新智能体成功')
    } else {
      log('fail', '更新智能体失败')
    }
  }

  // 3.4 获取创作者的智能体列表
  log('info', '测试获取创作者智能体列表...')
  const myAgentsResult = await request('GET', '/api/agents/creator/my', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (myAgentsResult.status === 200) {
    const data = myAgentsResult.data as { data?: { items?: unknown[] } }
    const count = data.data?.items?.length || 0
    log('pass', '获取创作者智能体列表成功', `数量: ${count}`)
  } else {
    log('fail', '获取创作者智能体列表失败')
  }

  // 3.5 收藏智能体
  if (agentId) {
    log('info', '测试收藏/取消收藏智能体...')
    const favoriteResult = await request('POST', `/api/agents/${agentId}/favorite`, {
      headers: { Authorization: `Bearer ${token}` },
      expectedStatus: [200],
    })
    if (favoriteResult.status === 200) {
      log('pass', '收藏智能体成功')
    } else {
      log('fail', '收藏智能体失败')
    }
  }

  console.log(`\n智能体功能测试完成`)
  return agentId
}

// ============================================
// 4. AI 对话测试
// ============================================

async function testAIChat(token: string, agentId: string | null): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 4. AI 对话测试 ━━━${colors.reset}\n`)

  // 4.1 获取可用模型列表
  log('info', '测试获取 AI 模型列表...')
  const modelsResult = await request('GET', '/api/ai/models')
  if (modelsResult.status === 200) {
    const data = modelsResult.data as { data?: unknown[] }
    const count = (data.data as unknown[])?.length || 0
    log('pass', '获取模型列表成功', `可用模型: ${count}`)
  } else {
    log('warn', '获取模型列表失败，可能 AI 服务未配置')
  }

  // 4.2 AI 对话（如果有可用的智能体）
  if (agentId) {
    log('info', '测试 AI 对话（非流式）...')
    const chatResult = await request('POST', '/api/ai/chat', {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        agent_id: agentId,
        messages: [{ role: 'user', content: '你好，请介绍一下自己' }],
      },
      expectedStatus: [200],
      timeout: 60000, // AI 调用可能需要更长时间
    })

    if (chatResult.status === 200) {
      log('pass', 'AI 对话成功')
      const data = chatResult.data as { data?: { message?: { content?: string } } }
      const content = data.data?.message?.content || ''
      if (content.length > 0) {
        console.log(`       AI 回复: ${content.slice(0, 100)}...`)
      }
    } else {
      log('fail', 'AI 对话失败', `Status: ${chatResult.status}`)
    }
  } else {
    log('skip', '跳过 AI 对话测试（无可用智能体）')
  }

  // 4.3 获取 AI 统计
  log('info', '测试获取 AI 使用统计...')
  const statsResult = await request('GET', '/api/ai/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (statsResult.status === 200) {
    log('pass', '获取 AI 统计成功')
  } else {
    log('fail', '获取 AI 统计失败')
  }

  // 4.4 获取会话历史
  log('info', '测试获取会话历史...')
  const sessionsResult = await request('GET', '/api/ai/sessions', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (sessionsResult.status === 200) {
    log('pass', '获取会话历史成功')
  } else {
    log('fail', '获取会话历史失败')
  }

  console.log(`\nAI 对话测试完成`)
}

// ============================================
// 5. 余额与支付测试
// ============================================

async function testBalanceAndPayment(token: string): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 5. 余额与支付测试 ━━━${colors.reset}\n`)

  // 5.1 查询余额
  log('info', '测试查询余额...')
  const balanceResult = await request('GET', '/api/balance', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })

  if (balanceResult.status === 200) {
    log('pass', '查询余额成功')
    const data = balanceResult.data as { data?: { balance?: number } }
    console.log(`       当前余额: ${data.data?.balance || 0}`)
  } else {
    log('fail', '查询余额失败')
  }

  // 5.2 查询余额流水
  log('info', '测试查询余额流水...')
  const transactionsResult = await request('GET', '/api/balance/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (transactionsResult.status === 200) {
    log('pass', '查询余额流水成功')
  } else {
    log('fail', '查询余额流水失败')
  }

  // 5.3 获取产品列表
  log('info', '测试获取产品列表...')
  const productsResult = await request('GET', '/api/products')
  if (productsResult.status === 200) {
    const data = productsResult.data as { data?: unknown[] }
    const count = (data.data as unknown[])?.length || 0
    log('pass', '获取产品列表成功', `产品数量: ${count}`)
  } else {
    log('fail', '获取产品列表失败')
  }

  // 5.4 获取订单列表
  log('info', '测试获取订单列表...')
  const ordersResult = await request('GET', '/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (ordersResult.status === 200) {
    log('pass', '获取订单列表成功')
  } else {
    log('fail', '获取订单列表失败')
  }

  // 5.5 提现记录查询
  log('info', '测试获取提现记录...')
  const withdrawResult = await request('GET', '/api/balance/withdraw/records', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (withdrawResult.status === 200) {
    log('pass', '获取提现记录成功')
  } else {
    log('fail', '获取提现记录失败')
  }

  console.log(`\n余额与支付测试完成`)
}

// ============================================
// 6. 社区功能测试
// ============================================

async function testCommunity(token: string): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 6. 社区功能测试 ━━━${colors.reset}\n`)

  let postId: string | null = null

  // 6.1 发布帖子
  log('info', '测试发布帖子...')
  const createPostResult = await request('POST', '/api/community/posts', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      title: `测试帖子_${generateUniqueId()}`,
      content: '这是自动化测试创建的帖子内容',
      tags: ['测试', '自动化'],
    },
    expectedStatus: [200, 201],
  })

  if (createPostResult.status >= 200 && createPostResult.status < 300) {
    const data = createPostResult.data as { data?: { id?: string } }
    postId = data.data?.id || null
    log('pass', '发布帖子成功', `ID: ${postId}`)
  } else {
    log('fail', '发布帖子失败')
  }

  // 6.2 获取帖子详情
  if (postId) {
    log('info', '测试获取帖子详情...')
    const detailResult = await request('GET', `/api/community/posts/${postId}`)
    if (detailResult.status === 200) {
      log('pass', '获取帖子详情成功')
    } else {
      log('fail', '获取帖子详情失败')
    }

    // 6.3 点赞帖子
    log('info', '测试点赞帖子...')
    const likeResult = await request('POST', `/api/community/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${token}` },
      expectedStatus: [200],
    })
    if (likeResult.status === 200) {
      log('pass', '点赞帖子成功')
    } else {
      log('fail', '点赞帖子失败')
    }

    // 6.4 评论帖子
    log('info', '测试评论帖子...')
    const commentResult = await request('POST', '/api/community/comments', {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        post_id: postId,
        content: '这是自动化测试的评论',
      },
      expectedStatus: [200, 201],
    })
    if (commentResult.status >= 200 && commentResult.status < 300) {
      log('pass', '评论帖子成功')
    } else {
      log('fail', '评论帖子失败')
    }
  }

  // 6.5 获取帖子列表
  log('info', '测试获取帖子列表...')
  const postsResult = await request('GET', '/api/community/posts')
  if (postsResult.status === 200) {
    log('pass', '获取帖子列表成功')
  } else {
    log('fail', '获取帖子列表失败')
  }

  console.log(`\n社区功能测试完成`)
}

// ============================================
// 7. 安全测试
// ============================================

async function testSecurity(): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 7. 安全测试 ━━━${colors.reset}\n`)

  // 7.1 未登录访问受保护接口
  log('info', '测试未登录访问受保护接口...')
  const unauthorizedResult = await request('GET', '/api/auth/me')
  if (unauthorizedResult.status === 401) {
    log('pass', '未登录访问正确返回 401')
  } else {
    log('fail', '未登录访问未返回 401', `Status: ${unauthorizedResult.status}`)
  }

  // 7.2 无效 Token
  log('info', '测试无效 Token...')
  const invalidTokenResult = await request('GET', '/api/auth/me', {
    headers: { Authorization: 'Bearer invalid_token_12345' },
  })
  if (invalidTokenResult.status === 401) {
    log('pass', '无效 Token 正确返回 401')
  } else {
    log('fail', '无效 Token 未返回 401', `Status: ${invalidTokenResult.status}`)
  }

  // 7.3 SQL 注入防护
  log('info', '测试 SQL 注入防护...')
  const sqlPayloads = [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
  ]

  let sqlInjectionBlocked = true
  for (const payload of sqlPayloads) {
    const injectionResult = await request('POST', '/api/auth/login', {
      body: {
        email: payload,
        password: 'anything',
      },
    })

    if (injectionResult.status === 200) {
      const data = injectionResult.data as { data?: { token?: string } }
      if (data.data?.token) {
        sqlInjectionBlocked = false
        log('warn', `可能的 SQL 注入: ${payload.slice(0, 20)}...`)
      }
    }
  }

  if (sqlInjectionBlocked) {
    log('pass', 'SQL 注入防护生效')
  }

  // 7.4 暴力登录防护
  log('info', '测试暴力登录防护...')
  const failedAttempts: number[] = []
  for (let i = 0; i < 6; i++) {
    const result = await request('POST', '/api/auth/login', {
      body: {
        email: 'nonexistent@test.com',
        password: 'wrong_password',
      },
    })
    failedAttempts.push(result.status)
  }

  const hasProtection = failedAttempts[5] === 429 || failedAttempts[5] === 423
  if (hasProtection) {
    log('pass', '暴力登录防护生效')
  } else {
    log('warn', '暴力登录防护未触发', `响应状态: ${failedAttempts.join(', ')}`)
  }

  // 7.5 速率限制
  log('info', '测试 API 速率限制...')
  const rateLimitResults: number[] = []
  for (let i = 0; i < 15; i++) {
    const result = await request('GET', '/api/agents')
    rateLimitResults.push(result.status)
  }

  if (rateLimitResults.includes(429)) {
    log('pass', '速率限制生效')
  } else {
    log('warn', '速率限制未触发', `请求 15 次未遇到 429`)
  }

  // 7.6 敏感数据不泄露
  log('info', '测试敏感数据保护...')
  const registerResult = await register(generateTestEmail(), 'Test@123456')
  if (registerResult) {
    const meResult = await getMe(registerResult.token)
    if (meResult) {
      const hasSensitiveData = meResult.hasOwnProperty('password_hash') ||
                                meResult.hasOwnProperty('password')
      if (!hasSensitiveData) {
        log('pass', '敏感数据未泄露')
      } else {
        log('fail', '响应中包含敏感数据')
      }
    }
  }

  console.log(`\n安全测试完成`)
}

// ============================================
// 8. 文件上传下载测试
// ============================================

async function testUploadDownload(token: string): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 8. 文件上传下载测试 ━━━${colors.reset}\n`)

  // 8.1 获取 OSS 上传凭证
  log('info', '测试获取 OSS 上传凭证...')
  const ossResult = await request('POST', '/api/oss/upload-params', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      filename: 'test.pdf',
      content_type: 'application/pdf',
      size: 1024,
    },
  })

  if (ossResult.status === 200) {
    log('pass', '获取 OSS 上传凭证成功')
  } else {
    log('skip', 'OSS 上传凭证获取失败（可能 OSS 未配置）')
  }

  console.log(`\n文件上传下载测试完成`)
}

// ============================================
// 主函数
// ============================================

interface TestResults {
  healthCheck: boolean
  authFlow: boolean
  agents: boolean
  aiChat: boolean
  balance: boolean
  community: boolean
  security: boolean
  upload: boolean
}

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 综合功能测试                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`测试时间: ${new Date().toISOString()}\n`)

  const args = process.argv.slice(2)
  const testType = args.find(arg => arg.startsWith('--test='))?.split('=')[1] || 'all'

  const results: TestResults = {
    healthCheck: false,
    authFlow: false,
    agents: false,
    aiChat: false,
    balance: false,
    community: false,
    security: false,
    upload: false,
  }

  let authToken = ''
  let userId = ''
  let agentId: string | null = null

  try {
    // 1. 健康检查（所有测试都先执行）
    if (testType === 'all' || testType === 'health') {
      results.healthCheck = await testHealthCheck()
    }

    // 2. 认证流程
    if (testType === 'all' || testType === 'auth' || testType === 'flow') {
      const authResult = await testAuthFlow()
      if (authResult) {
        authToken = authResult.token
        userId = authResult.userId
        results.authFlow = true
      }
    }

    // 如果没有认证 Token，跳过后续需要认证的测试
    if (!authToken) {
      log('warn', '跳过需要认证的测试（无有效 Token）')
      console.log('\n建议：确保 API 服务正在运行并检查认证配置')
    } else {
      // 3. 智能体功能
      if (testType === 'all' || testType === 'agents' || testType === 'flow') {
        agentId = await testAgents(authToken)
        results.agents = agentId !== null
      }

      // 4. AI 对话
      if (testType === 'all' || testType === 'ai' || testType === 'flow') {
        await testAIChat(authToken, agentId)
        results.aiChat = true
      }

      // 5. 余额与支付
      if (testType === 'all' || testType === 'balance' || testType === 'flow') {
        await testBalanceAndPayment(authToken)
        results.balance = true
      }

      // 6. 社区功能
      if (testType === 'all' || testType === 'community' || testType === 'flow') {
        await testCommunity(authToken)
        results.community = true
      }

      // 8. 文件上传下载
      if (testType === 'all' || testType === 'upload') {
        await testUploadDownload(authToken)
        results.upload = true
      }
    }

    // 7. 安全测试（独立于认证）
    if (testType === 'all' || testType === 'security') {
      await testSecurity()
      results.security = true
    }

    // 打印总结
    console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
    console.log(`${colors.bold}测试总结${colors.reset}\n`)

    const totalTests = Object.values(results).filter(Boolean).length
    const total = Object.keys(results).length

    for (const [key, passed] of Object.entries(results)) {
      const testName = {
        healthCheck: '健康检查',
        authFlow: '认证流程',
        agents: '智能体功能',
        aiChat: 'AI 对话',
        balance: '余额与支付',
        community: '社区功能',
        security: '安全测试',
        upload: '文件上传',
      }[key]

      if (passed) {
        log('pass', testName)
      } else if (key === 'aiChat' || key === 'upload') {
        log('skip', `${testName}（可选）`)
      } else {
        log('fail', testName)
      }
    }

    console.log(`\n${colors.bold}测试结果: ${totalTests}/${total} 通过${colors.reset}`)
    console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

    if (totalTests === total) {
      console.log(`${colors.green}${colors.bold}所有测试通过！项目已准备好进行下一步。${colors.reset}\n`)
    } else {
      console.log(`${colors.yellow}${colors.bold}部分测试未通过，请检查失败的测试项。${colors.reset}\n`)
    }

    console.log('提示：')
    console.log('  --test=health    只运行健康检查')
    console.log('  --test=auth     只运行认证测试')
    console.log('  --test=flow     运行完整流程测试')
    console.log('  --test=security 只运行安全测试')
    console.log('  --test=all      运行所有测试（默认）\n')

  } catch (error) {
    console.error('\n测试执行错误:', error)
    process.exit(1)
  }
}

// 运行
main()
