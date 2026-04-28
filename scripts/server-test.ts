/**
 * 律植 (Lvzhi) 服务器综合功能测试
 *
 * 直接执行命令：
 *   npx tsx scripts/server-test.ts
 *
 * 测试覆盖：
 * - API 健康检查
 * - 公开接口测试
 * - 用户认证流程
 * - AI 服务测试
 */

import crypto from 'crypto'

// ============================================
// 配置 - 指向你的服务器
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://8.159.156.192:8080'
const TEST_TIMEOUT = 30000

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  details?: string
  duration: number
}

function log(level: 'pass' | 'fail' | 'info' | 'warn' | 'skip', message: string, details?: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
    skip: `${colors.yellow}⊘ SKIP${colors.reset}`,
  }[level]
  console.log(`${prefix} ${message}${details ? ` (${details}ms)${colors.reset}` : ''}`)
}

// ============================================
// 工具函数
// ============================================

function generateUniqueId(): string {
  return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function generateTestEmail(): string {
  return `server_test_${generateUniqueId()}@example.com`
}

async function request<T = unknown>(
  method: string,
  path: string,
  options: {
    body?: unknown
    headers?: Record<string, string>
    expectedStatus?: number[]
    timeout?: number
  } = {}
): Promise<{ status: number; data: T; duration: number }> {
  const { body, headers = {}, expectedStatus, timeout = TEST_TIMEOUT } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const start = Date.now()
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
    const duration = Date.now() - start

    let data: unknown
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (expectedStatus && !expectedStatus.includes(response.status)) {
      log('fail', `${method} ${path}`, `期望: ${expectedStatus.join('|')}, 实际: ${response.status}`)
      console.log(`       ${JSON.stringify(data).slice(0, 200)}`)
    }

    return { status: response.status, data: data as T, duration }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ============================================
// 测试项目
// ============================================

async function testHealthCheck(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const start = Date.now()

  // 1.1 健康检查
  try {
    const result = await request('GET', '/health', { timeout: 5000 })
    results.push({
      name: 'API 健康检查',
      status: result.status === 200 ? 'pass' : 'fail',
      details: result.status === 200 ? JSON.stringify(result.data).slice(0, 100) : `HTTP ${result.status}`,
      duration: result.duration,
    })
  } catch (error) {
    results.push({
      name: 'API 健康检查',
      status: 'fail',
      details: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    })
  }

  // 1.2 AI 健康检查
  const aiStart = Date.now()
  try {
    const result = await request('GET', '/api/ai/health', { timeout: 5000 })
    results.push({
      name: 'AI 服务检查',
      status: result.status === 200 ? 'pass' : 'fail',
      details: result.status === 200 ? `HTTP 200` : `HTTP ${result.status}`,
      duration: result.duration,
    })
  } catch (error) {
    results.push({
      name: 'AI 服务检查',
      status: 'fail',
      details: error instanceof Error ? error.message : String(error),
      duration: Date.now() - aiStart,
    })
  }

  return results
}

async function testPublicEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const endpoints = [
    { path: '/api/agents', name: '智能体列表' },
    { path: '/api/products', name: '产品列表' },
    { path: '/api/community/posts', name: '社区帖子' },
  ]

  for (const endpoint of endpoints) {
    const start = Date.now()
    try {
      const result = await request('GET', endpoint.path, { timeout: 10000 })
      results.push({
        name: endpoint.name,
        status: result.status === 200 ? 'pass' : 'fail',
        details: result.status === 200 ? `HTTP 200` : `HTTP ${result.status}`,
        duration: result.duration,
      })
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: 'fail',
        details: error instanceof Error ? error.message : String(error),
        duration: Date.now() - start,
      })
    }
  }

  return results
}

async function testAuthFlow(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const start = Date.now()
  const testEmail = generateTestEmail()
  const testPassword = 'Test@123456'

  try {
    // 2.1 注册
    const regResult = await request('POST', '/api/auth/register', {
      body: { email: testEmail, password: testPassword, display_name: '服务器测试' },
      timeout: 15000,
    })

    if (regResult.status >= 200 && regResult.status < 300) {
      const data = regResult.data as { data?: { access_token?: string; user?: { id?: string } } }
      const token = data.data?.access_token

      results.push({
        name: '用户注册',
        status: 'pass',
        details: token ? `Token 长度: ${token.length}` : '无 Token',
        duration: regResult.duration,
      })

      if (token) {
        // 2.2 登录
        const loginResult = await request('POST', '/api/auth/login', {
          body: { email: testEmail, password: testPassword },
          timeout: 15000,
        })
        results.push({
          name: '用户登录',
          status: loginResult.status === 200 ? 'pass' : 'fail',
          duration: loginResult.duration,
        })

        // 2.3 获取用户信息
        const meResult = await request('GET', '/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        results.push({
          name: '获取用户信息',
          status: meResult.status === 200 ? 'pass' : 'fail',
          duration: meResult.duration,
        })

        // 2.4 AI 模型列表
        const modelsResult = await request('GET', '/api/ai/models', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        results.push({
          name: 'AI 模型列表',
          status: modelsResult.status === 200 ? 'pass' : 'fail',
          duration: modelsResult.duration,
        })

        // 2.5 AI 对话测试
        const chatResult = await request('POST', '/api/ai/chat', {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            agent_id: 'test-agent',
            messages: [{ role: 'user', content: '你好' }],
          },
          timeout: 60000,
        })
        results.push({
          name: 'AI 对话测试',
          status: chatResult.status === 200 ? 'pass' : 'fail',
          details: `HTTP ${chatResult.status}`,
          duration: chatResult.duration,
        })
      }
    } else {
      results.push({
        name: '用户注册',
        status: 'fail',
        details: `HTTP ${regResult.status}: ${JSON.stringify(regResult.data).slice(0, 100)}`,
        duration: regResult.duration,
      })
    }
  } catch (error) {
    results.push({
      name: '认证流程',
      status: 'fail',
      details: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    })
  }

  return results
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 服务器综合功能测试                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`测试时间: ${new Date().toLocaleString()}\n`)

  const allResults: TestResult[] = []
  const totalStart = Date.now()

  // 1. 健康检查
  console.log(`\n${colors.bold}${colors.cyan}━━━ 1. 健康检查 ━━━${colors.reset}\n`)
  const healthResults = await testHealthCheck()
  allResults.push(...healthResults)

  // 2. 公开接口
  console.log(`\n${colors.bold}${colors.cyan}━━━ 2. 公开接口测试 ━━━${colors.reset}\n`)
  const publicResults = await testPublicEndpoints()
  allResults.push(...publicResults)

  // 3. 认证流程
  console.log(`\n${colors.bold}${colors.cyan}━━━ 3. 认证与 AI 测试 ━━━${colors.reset}\n`)
  const authResults = await testAuthFlow()
  allResults.push(...authResults)

  // 打印结果
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}测试结果总结${colors.reset}\n`)

  for (const result of allResults) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘'
    const color = result.status === 'pass' ? colors.green : result.status === 'fail' ? colors.red : colors.yellow
    console.log(`  ${color}${icon}${colors.reset} ${result.name}${result.details ? ` ${colors.dim}(${result.details})${colors.reset}` : ''}`)
  }

  // 统计
  const passed = allResults.filter(r => r.status === 'pass').length
  const failed = allResults.filter(r => r.status === 'fail').length
  const skipped = allResults.filter(r => r.status === 'skip').length
  const total = allResults.length

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.green}✓ 通过: ${passed}${colors.reset}`)
  console.log(`${colors.red}✗ 失败: ${failed}${colors.reset}`)
  console.log(`${colors.yellow}⊘ 跳过: ${skipped}${colors.reset}`)
  console.log(`\n${colors.bold}总计: ${passed}/${total} 通过${colors.reset}`)
  console.log(`${colors.bold}总耗时: ${Date.now() - totalStart}ms${colors.reset}`)
  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  if (failed > 0) {
    console.log(`${colors.red}${colors.bold}⚠ 部分测试失败，请检查失败的测试项。${colors.reset}\n`)
  } else {
    console.log(`${colors.green}${colors.bold}✓ 所有测试通过！${colors.reset}\n`)
  }
}

main().catch((error) => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
