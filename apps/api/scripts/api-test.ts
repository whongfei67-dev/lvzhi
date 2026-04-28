/**
 * 律植 API 自动化测试脚本
 *
 * 用法:
 *   npx tsx scripts/api-test.ts
 *   npx tsx scripts/api-test.ts --test=auth
 *   npx tsx scripts/api-test.ts --test=security
 *   npx tsx scripts/api-test.ts --test=all
 *
 * 环境变量:
 *   API_BASE_URL - API 基础地址 (默认: http://localhost:3001)
 *   TEST_ADMIN_EMAIL - 管理员邮箱
 *   TEST_ADMIN_PASSWORD - 管理员密码
 */

import crypto from 'crypto'

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Test@123456'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test@123456'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(type: 'pass' | 'fail' | 'info' | 'warn', message: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
  }[type]
  console.log(`${prefix} ${message}`)
}

// HTTP 请求封装
async function request(
  method: string,
  path: string,
  options: {
    body?: unknown
    headers?: Record<string, string>
    expectedStatus?: number[]
  } = {}
): Promise<{
  status: number
  data: unknown
  headers: Headers
}> {
  const { body, headers = {}, expectedStatus } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let data: unknown
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (expectedStatus && !expectedStatus.includes(response.status)) {
    log('fail', `${method} ${path} - Expected status ${expectedStatus.join('|')}, got ${response.status}`)
    console.log(`       Response: ${JSON.stringify(data).slice(0, 200)}`)
  }

  return {
    status: response.status,
    data,
    headers: response.headers,
  }
}

// 生成测试数据
function generateTestEmail() {
  return `test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@example.com`
}

function generateTestPhone() {
  return `138${String(Date.now()).slice(-8)}`
}

// ============================================
// 测试用例
// ============================================

// ============================================
// 1. 认证测试
// ============================================
async function testAuth() {
  console.log(`\n${colors.cyan}━━━ 认证测试 ━━━${colors.reset}\n`)

  // 1.1 注册
  log('info', '测试用户注册...')
  const registerEmail = generateTestEmail()
  const registerResult = await request('POST', '/api/auth/register', {
    body: {
      email: registerEmail,
      password: 'Test@123456',
      nickname: 'Test User',
    },
    expectedStatus: [200, 201],
  })

  if (registerResult.status >= 200 && registerResult.status < 300) {
    log('pass', '用户注册成功')
  } else {
    log('fail', `用户注册失败: ${JSON.stringify(registerResult.data)}`)
  }

  // 1.2 登录
  log('info', '测试用户登录...')
  const loginResult = await request('POST', '/api/auth/login', {
    body: {
      email: registerEmail,
      password: 'Test@123456',
    },
    expectedStatus: [200],
  })

  let token = ''
  if (loginResult.status === 200 && loginResult.data && typeof registerResult.data === 'object') {
    const data = registerResult.data as { data?: { token?: string } }
    token = data.data?.token || ''
    log('pass', '用户登录成功')
  } else {
    log('fail', `用户登录失败: ${JSON.stringify(loginResult.data)}`)
    return { token: '' }
  }

  // 1.3 获取当前用户
  log('info', '测试获取当前用户...')
  const meResult = await request('GET', '/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })

  if (meResult.status === 200) {
    log('pass', '获取当前用户成功')
  } else {
    log('fail', `获取当前用户失败: ${JSON.stringify(meResult.data)}`)
  }

  // 1.4 登出
  log('info', '测试登出...')
  const logoutResult = await request('POST', '/api/auth/logout', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })

  if (logoutResult.status === 200) {
    log('pass', '登出成功')
  } else {
    log('fail', `登出失败: ${JSON.stringify(logoutResult.data)}`)
  }

  return { token }
}

// ============================================
// 2. 安全测试
// ============================================
async function testSecurity() {
  console.log(`\n${colors.cyan}━━━ 安全测试 ━━━${colors.reset}\n`)

  let token = ''

  // 2.1 未登录访问受保护接口 → 401
  log('info', '测试未登录访问受保护接口...')
  const unauthorizedResult = await request('GET', '/api/auth/me', {
    expectedStatus: [401],
  })

  if (unauthorizedResult.status === 401) {
    log('pass', '未登录访问返回 401 ✓')
  } else {
    log('fail', `未授权访问未正确返回 401，当前: ${unauthorizedResult.status}`)
  }

  // 2.2 无效 Token → 401
  log('info', '测试无效 Token...')
  const invalidTokenResult = await request('GET', '/api/auth/me', {
    headers: { Authorization: 'Bearer invalid_token_12345' },
    expectedStatus: [401],
  })

  if (invalidTokenResult.status === 401) {
    log('pass', '无效 Token 返回 401 ✓')
  } else {
    log('fail', `无效 Token 未正确返回 401，当前: ${invalidTokenResult.status}`)
  }

  // 2.3 普通用户访问管理员接口 → 403
  log('info', '测试普通用户访问管理员接口...')
  // 先注册并登录普通用户
  const registerEmail = generateTestEmail()
  await request('POST', '/api/auth/register', {
    body: {
      email: registerEmail,
      password: 'Test@123456',
      nickname: 'Normal User',
    },
  })

  const loginResult = await request('POST', '/api/auth/login', {
    body: {
      email: registerEmail,
      password: 'Test@123456',
    },
  })

  if (loginResult.status === 200 && loginResult.data && typeof loginResult.data === 'object') {
    const data = loginResult.data as { data?: { token?: string } }
    token = data.data?.token || ''
  }

  // 尝试访问管理员接口（获取所有用户）
  const adminResult = await request('GET', '/api/users', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [403],
  })

  if (adminResult.status === 403) {
    log('pass', '普通用户访问管理员接口返回 403 ✓')
  } else {
    log('fail', `普通用户访问管理员接口未返回 403，当前: ${adminResult.status}`)
  }

  // 2.4 SQL 注入测试
  log('info', '测试 SQL 注入防护...')
  const sqlInjectionTests = [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1; DELETE FROM profiles WHERE 1=1",
  ]

  for (const payload of sqlInjectionTests) {
    const injectionResult = await request('POST', '/api/auth/login', {
      body: {
        email: payload,
        password: 'anything',
      },
    })

    // SQL 注入应该被拒绝或返回空数据
    if (injectionResult.status !== 200 || injectionResult.data === null) {
      log('pass', `SQL 注入防护生效: ${payload.slice(0, 20)}...`)
    } else {
      log('warn', `可能的 SQL 注入漏洞: ${payload.slice(0, 20)}...`)
    }
  }

  // 2.5 XSS 测试（在用户昵称中）
  log('info', '测试 XSS 防护...')
  const xssPayload = '<script>alert(1)</script>'
  const xssResult = await request('POST', '/api/auth/register', {
    body: {
      email: generateTestEmail(),
      password: 'Test@123456',
      nickname: xssPayload,
    },
  })

  if (xssResult.status >= 200 && xssResult.status < 300) {
    // 注册成功，验证昵称是否被转义存储
    const loginResult = await request('POST', '/api/auth/login', {
      body: {
        email: (xssResult.data as { data?: { email?: string } })?.data?.email || '',
        password: 'Test@123456',
      },
    })

    if (loginResult.status === 200) {
      const meResult = await request('GET', '/api/auth/me', {
        headers: { Authorization: ((loginResult.data as { data?: { token?: string } })?.data?.token || '') },
      })

      if (meResult.status === 200 && typeof meResult.data === 'object') {
        const data = meResult.data as { data?: { nickname?: string } }
        if (data.data?.nickname?.includes('<script>')) {
          log('warn', '昵称中包含未转义的脚本标签，可能存在 XSS 风险')
        } else {
          log('pass', 'XSS 防护生效 ✓')
        }
      }
    }
  }

  // 2.6 暴力登录防护测试
  log('info', '测试暴力登录防护...')
  const failedAttempts: number[] = []
  for (let i = 0; i < 6; i++) {
    const result = await request('POST', '/api/auth/login', {
      body: {
        email: TEST_ADMIN_EMAIL,
        password: 'wrong_password_123',
      },
    })
    failedAttempts.push(result.status)
  }

  // 第6次应该被限流或封禁
  if (failedAttempts[5] === 429 || failedAttempts[5] === 423) {
    log('pass', '暴力登录防护生效 ✓')
  } else if (failedAttempts[5] === 401) {
    log('warn', '登录失败但未被限流，请检查限流配置')
  } else {
    log('info', `登录响应状态: ${failedAttempts.join(', ')}`)
  }

  // 2.7 频率限制测试
  log('info', '测试 API 频率限制...')
  const rateLimitResults: number[] = []
  for (let i = 0; i < 15; i++) {
    const result = await request('GET', '/api/agents')
    rateLimitResults.push(result.status)
  }

  const has429 = rateLimitResults.includes(429)
  if (has429) {
    log('pass', '频率限制生效 ✓')
  } else {
    log('warn', '请求 15 次未触发限流，请检查 rate-limit 配置')
  }

  return { token }
}

// ============================================
// 3. 核心功能测试
// ============================================
async function testCoreFeatures(token: string) {
  console.log(`\n${colors.cyan}━━━ 核心功能测试 ━━━${colors.reset}\n`)

  // 3.1 智能体列表
  log('info', '测试获取智能体列表...')
  const agentsResult = await request('GET', '/api/agents', {
    expectedStatus: [200],
  })

  if (agentsResult.status === 200) {
    log('pass', '获取智能体列表成功')
    const data = agentsResult.data as { data?: { items?: unknown[] } }
    log('info', `当前智能体数量: ${data.data?.items?.length || 0}`)
  } else {
    log('fail', `获取智能体列表失败: ${JSON.stringify(agentsResult.data)}`)
  }

  // 3.2 创建智能体（创作者）
  log('info', '测试创建智能体...')
  const createAgentResult = await request('POST', '/api/agents', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: '测试智能体',
      description: '这是一个测试智能体',
      category: 'legal',
      price: 10,
      config: {
        model: 'glm-4',
        temperature: 0.7,
        max_tokens: 2000,
      },
    },
    expectedStatus: [200, 201],
  })

  let agentId = ''
  if (createAgentResult.status >= 200 && createAgentResult.status < 300) {
    log('pass', '创建智能体成功')
    agentId = (createAgentResult.data as { data?: { id?: string } })?.data?.id || ''
  } else {
    log('fail', `创建智能体失败: ${JSON.stringify(createAgentResult.data)}`)
  }

  // 3.3 获取智能体详情
  if (agentId) {
    log('info', '测试获取智能体详情...')
    const agentDetailResult = await request(`GET`, `/api/agents/${agentId}`, {
      expectedStatus: [200],
    })

    if (agentDetailResult.status === 200) {
      log('pass', '获取智能体详情成功')
    } else {
      log('fail', `获取智能体详情失败: ${JSON.stringify(agentDetailResult.data)}`)
    }
  }

  // 3.4 AI 对话
  log('info', '测试 AI 对话...')
  const chatResult = await request('POST', '/api/ai/chat', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      agent_id: agentId || 'default-agent-id',
      messages: [{ role: 'user', content: '你好，请介绍一下自己' }],
    },
    expectedStatus: [200],
  })

  if (chatResult.status === 200) {
    log('pass', 'AI 对话成功')
    const data = chatResult.data as { data?: { message?: { content?: string } } }
    log('info', `AI 回复: ${(data.data?.message?.content || '').slice(0, 100)}...`)
  } else {
    log('fail', `AI 对话失败: ${JSON.stringify(chatResult.data)}`)
  }

  // 3.5 社区帖子
  log('info', '测试获取社区帖子列表...')
  const postsResult = await request('GET', '/api/community/posts', {
    expectedStatus: [200],
  })

  if (postsResult.status === 200) {
    log('pass', '获取社区帖子列表成功')
  } else {
    log('fail', `获取社区帖子列表失败: ${JSON.stringify(postsResult.data)}`)
  }

  // 3.6 余额查询
  log('info', '测试查询余额...')
  const balanceResult = await request('GET', '/api/balance', {
    headers: { Authorization: `Bearer ${token}` },
    expectedStatus: [200],
  })

  if (balanceResult.status === 200) {
    log('pass', '查询余额成功')
    const data = balanceResult.data as { data?: { balance?: number } }
    log('info', `当前余额: ${data.data?.balance || 0}`)
  } else {
    log('fail', `查询余额失败: ${JSON.stringify(balanceResult.data)}`)
  }

  return { agentId }
}

// ============================================
// 4. 健康检查
// ============================================
async function testHealth() {
  console.log(`\n${colors.cyan}━━━ 健康检查 ━━━${colors.reset}\n`)

  // 4.1 API 健康检查
  log('info', '测试 API 健康检查...')
  const healthResult = await request('GET', '/health', {
    expectedStatus: [200],
  })

  if (healthResult.status === 200) {
    log('pass', 'API 服务健康 ✓')
  } else {
    log('fail', `API 服务异常: ${JSON.stringify(healthResult.data)}`)
  }

  // 4.2 AI 健康检查
  log('info', '测试 AI 服务健康检查...')
  const aiHealthResult = await request('GET', '/api/ai/health', {
    expectedStatus: [200],
  })

  if (aiHealthResult.status === 200) {
    log('pass', 'AI 服务健康 ✓')
    const data = aiHealthResult.data as { data?: { providers?: string[] } }
    log('info', `可用 AI 提供商: ${(data.data?.providers || []).join(', ')}`)
  } else {
    log('fail', `AI 服务异常: ${JSON.stringify(aiHealthResult.data)}`)
  }

  // 4.3 数据库连接检查
  log('info', '测试数据库连接...')
  const dbCheckResult = await request('GET', '/health', {
    expectedStatus: [200],
  })

  if (dbCheckResult.status === 200) {
    const data = dbCheckResult.data as { database?: string }
    if (data.database === 'connected') {
      log('pass', '数据库连接正常 ✓')
    } else {
      log('warn', `数据库状态: ${data.database}`)
    }
  }
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log(`\n${colors.cyan}律植 API 自动化测试${colors.reset}`)
  console.log(`${colors.cyan}================================${colors.reset}`)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`测试时间: ${new Date().toISOString()}\n`)

  const args = process.argv.slice(2)
  const testType = args.find(arg => arg.startsWith('--test='))?.split('=')[1] || 'all'

  let authToken = ''
  let agentId = ''

  try {
    // 健康检查
    await testHealth()

    // 根据测试类型执行
    if (testType === 'all' || testType === 'auth') {
      const authResult = await testAuth()
      authToken = authResult.token
    }

    if (testType === 'all' || testType === 'security') {
      await testSecurity()
    }

    if (testType === 'all' || testType === 'core') {
      // 需要先获取 token
      if (!authToken) {
        const loginResult = await request('POST', '/api/auth/login', {
          body: {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD,
          },
        })

        if (loginResult.status === 200 && typeof loginResult.data === 'object') {
          const data = loginResult.data as { data?: { token?: string } }
          authToken = data.data?.token || ''
        }
      }

      if (authToken) {
        const coreResult = await testCoreFeatures(authToken)
        agentId = coreResult.agentId
      } else {
        log('warn', '跳过核心功能测试（无有效 token）')
      }
    }

    console.log(`\n${colors.cyan}━━━ 测试完成 ━━━${colors.reset}\n`)
    console.log('提示:')
    console.log('  --test=auth     只运行认证测试')
    console.log('  --test=security 只运行安全测试')
    console.log('  --test=core     只运行核心功能测试')
    console.log('  --test=all      运行所有测试（默认）\n')

  } catch (error) {
    console.error('\n测试脚本执行错误:', error)
    process.exit(1)
  }
}

// 运行
main()
