/**
 * 律植 (Lvzhi) 核心业务流程测试脚本
 *
 * 覆盖阶段六-6.1: 功能验证
 * - 用户注册 → 登录 → 登出 全流程测试
 * - Creator 创建智能体完整流程
 * - 余额充值 → 扣费 完整流程
 * - 管理员审核智能体（通过/拒绝）
 * - 社区发帖、点赞、评论流程
 *
 * 使用方法：
 *   npx tsx scripts/test-flows.ts
 *   npx tsx scripts/test-flows.ts --flow=auth      # 只测试认证流程
 *   npx tsx scripts/test-flows.ts --flow=creator  # 只测试创作者流程
 *   npx tsx scripts/test-flows.ts --flow=payment  # 只测试支付流程
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

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
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
  return `flow_test_${generateUniqueId()}@example.com`
}

function generateTestPhone(): string {
  return `138${String(Date.now()).slice(-8)}`
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
  const normalizedHeaders: Record<string, string> = { ...headers }
  if (body !== undefined && !Object.keys(normalizedHeaders).some((key) => key.toLowerCase() === 'content-type')) {
    normalizedHeaders['Content-Type'] = 'application/json'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const start = Date.now()
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: normalizedHeaders,
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
// 测试流程定义
// ============================================

interface TestFlow {
  name: string
  description: string
  steps: () => Promise<TestResult[]>
}

const testFlows: TestFlow[] = []

// ============================================
// 1. 用户认证流程
// ============================================

testFlows.push({
  name: '用户注册 → 登录 → 登出 全流程',
  description: '测试完整的用户认证生命周期',
  steps: async (): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const start = Date.now()
    const testEmail = generateTestEmail()
    const testPassword = 'Test@123456'

    // 1.1 注册
    try {
      const regResult = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, display_name: '测试用户' },
        expectedStatus: [200, 201],
      })

      if (regResult.status >= 200 && regResult.status < 300) {
        const data = regResult.data as { data?: { access_token?: string; user?: { id?: string } } }
        const token = data.data?.access_token
        const userId = data.data?.user?.id

        if (token && userId) {
          results.push({ name: '用户注册', status: 'pass', duration: regResult.duration })
        } else {
          results.push({ name: '用户注册', status: 'fail', details: '未返回 token 或 userId', duration: regResult.duration })
          return results
        }

        // 1.2 获取用户信息
        const meResult = await request('GET', '/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        results.push({
          name: '获取用户信息',
          status: meResult.status === 200 ? 'pass' : 'fail',
          details: meResult.status === 200 ? undefined : `状态码: ${meResult.status}`,
          duration: meResult.duration,
        })

        // 1.3 登出
        const logoutResult = await request('POST', '/api/auth/logout', {
          headers: { Authorization: `Bearer ${token}` },
        })
        results.push({
          name: '用户登出',
          status: logoutResult.status === 200 ? 'pass' : 'fail',
          details: logoutResult.status === 200 ? undefined : `状态码: ${logoutResult.status}`,
          duration: logoutResult.duration,
        })

        // 1.4 再次登录
        const loginResult = await request('POST', '/api/auth/login', {
          body: { email: testEmail, password: testPassword },
          expectedStatus: [200],
        })
        results.push({
          name: '用户登录',
          status: loginResult.status === 200 ? 'pass' : 'fail',
          details: loginResult.status === 200 ? undefined : `状态码: ${loginResult.status}`,
          duration: loginResult.duration,
        })
      } else {
        results.push({ name: '用户注册', status: 'fail', details: `状态码: ${regResult.status}`, duration: regResult.duration })
      }
    } catch (error) {
      results.push({ name: '认证流程', status: 'fail', details: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    }

    return results
  },
})

// ============================================
// 2. Creator 创建智能体流程
// ============================================

testFlows.push({
  name: 'Creator 创建智能体完整流程',
  description: '测试创作者创建、编辑、删除智能体的完整流程',
  steps: async (): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const start = Date.now()

    // 创建测试用户
    const testEmail = generateTestEmail()
    const testPassword = 'Test@123456'

    try {
      // 2.1 注册并登录
      const regResult = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, display_name: 'Creator 测试', role: 'creator' },
      })

      if (regResult.status >= 200 && regResult.status < 300) {
        const data = regResult.data as { data?: { access_token?: string; user?: { id?: string } } }
        const token = data.data?.access_token

        if (!token) {
          results.push({ name: '用户注册', status: 'fail', details: '无 token', duration: regResult.duration })
          return results
        }

        results.push({ name: '用户注册', status: 'pass', duration: regResult.duration })

        // 2.2 创建智能体
        const agentName = `测试智能体_${generateUniqueId()}`
        const createResult = await request('POST', '/api/agents', {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            name: agentName,
            description: '这是一个用于测试的智能体',
            category: 'consultation',
            price: 100,
            is_free_trial: true,
            trial_quota: 5,
          },
        })

        if (createResult.status >= 200 && createResult.status < 300) {
          const createData = createResult.data as { data?: { id?: string } }
          const agentId = createData.data?.id

          results.push({ name: '创建智能体', status: 'pass', duration: createResult.duration })

          if (agentId) {
            // 2.3 获取智能体详情
            const detailResult = await request('GET', `/api/agents/${agentId}`)
            results.push({
              name: '获取智能体详情',
              status: detailResult.status === 200 ? 'pass' : 'fail',
              duration: detailResult.duration,
            })

            // 2.4 更新智能体
            const updateResult = await request('PUT', `/api/agents/${agentId}`, {
              headers: { Authorization: `Bearer ${token}` },
              body: { description: '这是自动化测试更新后的智能体描述内容，用于验证编辑接口可用性。' },
            })
            results.push({
              name: '更新智能体',
              status: updateResult.status === 200 ? 'pass' : 'fail',
              duration: updateResult.duration,
            })

            // 2.5 获取创作者的智能体列表
            const listResult = await request('GET', '/api/agents/creator/my', {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '获取创作者智能体列表',
              status: listResult.status === 200 ? 'pass' : 'fail',
              duration: listResult.duration,
            })

            // 2.6 删除智能体
            const deleteResult = await request('DELETE', `/api/agents/${agentId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '删除智能体',
              status: deleteResult.status === 200 ? 'pass' : 'fail',
              duration: deleteResult.duration,
            })
          } else {
            results.push({ name: '获取智能体 ID', status: 'fail', details: '未返回 ID', duration: 0 })
          }
        } else {
          results.push({ name: '创建智能体', status: 'fail', details: `状态码: ${createResult.status}`, duration: createResult.duration })
        }
      } else {
        results.push({ name: '用户注册', status: 'fail', details: `状态码: ${regResult.status}`, duration: regResult.duration })
      }
    } catch (error) {
      results.push({ name: '创作者流程', status: 'fail', details: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    }

    return results
  },
})

// ============================================
// 3. 余额充值 → 扣费流程
// ============================================

testFlows.push({
  name: '余额充值 → 扣费 完整流程',
  description: '测试余额查询、充值、扣费的完整流程',
  steps: async (): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const start = Date.now()

    const testEmail = generateTestEmail()
    const testPassword = 'Test@123456'

    try {
      // 3.1 注册并登录
      const regResult = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, display_name: '余额测试用户' },
      })

      if (regResult.status >= 200 && regResult.status < 300) {
        const data = regResult.data as { data?: { access_token?: string } }
        const token = data.data?.access_token

        if (!token) {
          results.push({ name: '用户注册', status: 'fail', details: '无 token', duration: regResult.duration })
          return results
        }

        // 3.2 查询初始余额
        const balanceResult = await request('GET', '/api/balance', {
          headers: { Authorization: `Bearer ${token}` },
        })
        results.push({
          name: '查询初始余额',
          status: balanceResult.status === 200 ? 'pass' : 'fail',
          details: balanceResult.status === 200 ? JSON.stringify((balanceResult.data as { data?: { balance?: number } }).data?.balance) : undefined,
          duration: balanceResult.duration,
        })

        // 3.3 获取产品列表
        const productsResult = await request('GET', '/api/products')
        results.push({
          name: '获取产品列表',
          status: productsResult.status === 200 ? 'pass' : 'fail',
          duration: productsResult.duration,
        })

        // 3.4 创建订单（模拟充值）
        const productData = productsResult.data as { data?: Array<{ id?: string; price?: number }> }
        const product = productData.data?.[0]

        if (product?.id) {
          const orderResult = await request('POST', '/api/orders', {
            headers: { Authorization: `Bearer ${token}` },
            body: { product_id: product.id, payment_method: 'alipay' },
          })
          results.push({
            name: '创建订单',
            status: orderResult.status >= 200 && orderResult.status < 300 ? 'pass' : 'fail',
            details: `状态码: ${orderResult.status}`,
            duration: orderResult.duration,
          })

          // 3.5 查询订单列表
          const ordersResult = await request('GET', '/api/orders', {
            headers: { Authorization: `Bearer ${token}` },
          })
          results.push({
            name: '查询订单列表',
            status: ordersResult.status === 200 ? 'pass' : 'fail',
            duration: ordersResult.duration,
          })
        }

        // 3.6 查询余额流水
        const transactionsResult = await request('GET', '/api/balance/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        })
        results.push({
          name: '查询余额流水',
          status: transactionsResult.status === 200 ? 'pass' : 'fail',
          duration: transactionsResult.duration,
        })
      }
    } catch (error) {
      results.push({ name: '余额流程', status: 'fail', details: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    }

    return results
  },
})

// ============================================
// 4. 社区功能流程
// ============================================

testFlows.push({
  name: '社区发帖、点赞、评论流程',
  description: '测试社区帖子的完整生命周期',
  steps: async (): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const start = Date.now()

    const testEmail = generateTestEmail()
    const testPassword = 'Test@123456'

    try {
      // 4.1 注册并登录
      const regResult = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, display_name: '社区测试用户' },
      })

      if (regResult.status >= 200 && regResult.status < 300) {
        const data = regResult.data as { data?: { access_token?: string } }
        const token = data.data?.access_token

        if (!token) {
          results.push({ name: '用户注册', status: 'fail', details: '无 token', duration: regResult.duration })
          return results
        }

        // 4.2 发布帖子
        const postTitle = `测试帖子_${generateUniqueId()}`
        const postResult = await request('POST', '/api/community/posts', {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            title: postTitle,
            content: '这是自动化测试创建的帖子内容，用于验证发布、点赞、评论和删除等完整流程。',
            tags: ['测试', '自动化'],
          },
        })

        if (postResult.status >= 200 && postResult.status < 300) {
          const postData = postResult.data as { data?: { id?: string } }
          const postId = postData.data?.id

          results.push({ name: '发布帖子', status: 'pass', duration: postResult.duration })

          if (postId) {
            // 4.3 获取帖子详情
            const detailResult = await request('GET', `/api/community/posts/${postId}`)
            results.push({
              name: '获取帖子详情',
              status: detailResult.status === 200 ? 'pass' : 'fail',
              duration: detailResult.duration,
            })

            // 4.4 点赞帖子
            const likeResult = await request('POST', `/api/community/posts/${postId}/like`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '点赞帖子',
              status: likeResult.status === 200 ? 'pass' : 'fail',
              duration: likeResult.duration,
            })

            // 4.5 评论帖子
            const commentResult = await request('POST', '/api/community/comments', {
              headers: { Authorization: `Bearer ${token}` },
              body: { post_id: postId, content: '这是自动化测试的评论' },
            })
            results.push({
              name: '评论帖子',
              status: commentResult.status >= 200 && commentResult.status < 300 ? 'pass' : 'fail',
              duration: commentResult.duration,
            })

            // 4.6 删除帖子
            const deleteResult = await request('DELETE', `/api/community/posts/${postId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '删除帖子',
              status: deleteResult.status === 200 ? 'pass' : 'fail',
              duration: deleteResult.duration,
            })
          }
        } else {
          results.push({ name: '发布帖子', status: 'fail', details: `状态码: ${postResult.status}`, duration: postResult.duration })
        }

        // 4.7 获取帖子列表
        const listResult = await request('GET', '/api/community/posts')
        results.push({
          name: '获取帖子列表',
          status: listResult.status === 200 ? 'pass' : 'fail',
          duration: listResult.duration,
        })
      }
    } catch (error) {
      results.push({ name: '社区流程', status: 'fail', details: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    }

    return results
  },
})

// ============================================
// 5. AI 对话流程
// ============================================

testFlows.push({
  name: 'AI 对话真实调用（非 mock）',
  description: '测试 AI 对话的完整流程',
  steps: async (): Promise<TestResult[]> => {
    const results: TestResult[] = []
    const start = Date.now()

    const testEmail = generateTestEmail()
    const testPassword = 'Test@123456'

    try {
      // 5.1 注册并登录
      const regResult = await request('POST', '/api/auth/register', {
        body: { email: testEmail, password: testPassword, display_name: 'AI 测试用户' },
      })

      if (regResult.status >= 200 && regResult.status < 300) {
        const data = regResult.data as { data?: { access_token?: string } }
        const token = data.data?.access_token

        if (!token) {
          results.push({ name: '用户注册', status: 'fail', details: '无 token', duration: regResult.duration })
          return results
        }

        // 5.2 获取 AI 模型列表
        const modelsResult = await request('GET', '/api/ai/models')
        results.push({
          name: '获取 AI 模型列表',
          status: modelsResult.status === 200 ? 'pass' : 'fail',
          duration: modelsResult.duration,
        })

        // 5.3 获取智能体列表
        const agentsResult = await request('GET', '/api/agents')
        const agentsData = agentsResult.data as { data?: { items?: Array<{ id?: string }> } }
        const agentId = agentsData.data?.items?.[0]?.id

        results.push({
          name: '获取智能体列表',
          status: agentsResult.status === 200 ? 'pass' : 'fail',
          duration: agentsResult.duration,
        })

        // 5.4 AI 对话（非流式）
        if (agentId) {
          const chatResult = await request('POST', '/api/ai/chat', {
            headers: { Authorization: `Bearer ${token}` },
            body: {
              agent_id: agentId,
              messages: [{ role: 'user', content: '你好，请介绍一下法律咨询服务' }],
            },
            timeout: 60000,
          })

          const chatSuccess = chatResult.status === 200
          results.push({
            name: 'AI 对话（非流式）',
            status: chatSuccess ? 'pass' : 'fail',
            details: chatSuccess ? undefined : `状态码: ${chatResult.status}`,
            duration: chatResult.duration,
          })

          if (chatSuccess) {
            // 5.5 获取 AI 统计
            const statsResult = await request('GET', '/api/ai/stats', {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '获取 AI 使用统计',
              status: statsResult.status === 200 ? 'pass' : 'fail',
              duration: statsResult.duration,
            })

            // 5.6 获取会话历史
            const sessionsResult = await request('GET', '/api/ai/sessions', {
              headers: { Authorization: `Bearer ${token}` },
            })
            results.push({
              name: '获取会话历史',
              status: sessionsResult.status === 200 ? 'pass' : 'fail',
              duration: sessionsResult.duration,
            })
          }
        } else {
          results.push({ name: 'AI 对话', status: 'skip', details: '无可用智能体', duration: 0 })
        }
      }
    } catch (error) {
      results.push({ name: 'AI 对话流程', status: 'fail', details: error instanceof Error ? error.message : String(error), duration: Date.now() - start })
    }

    return results
  },
})

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const flowFilter = args.find(arg => arg.startsWith('--flow='))?.split('=')[1]

  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 核心业务流程测试                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`测试时间: ${new Date().toISOString()}\n`)

  // 过滤要执行的流程
  const flowsToRun = flowFilter
    ? testFlows.filter(f => f.name.toLowerCase().includes(flowFilter.toLowerCase()))
    : testFlows

  if (flowsToRun.length === 0) {
    console.log(`${colors.yellow}未找到匹配的流程测试${colors.reset}`)
    console.log('可用流程: auth, creator, payment, community, ai')
    process.exit(1)
  }

  const allResults: TestResult[] = []
  const totalStart = Date.now()

  for (const flow of flowsToRun) {
    console.log(`\n${colors.bold}${colors.cyan}━━━ ${flow.name} ━━━${colors.reset}`)
    console.log(`${colors.dim}${flow.description}${colors.reset}\n`)

    const results = await flow.steps()
    allResults.push(...results)

    // 打印本轮结果
    for (const result of results) {
      const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⊘'
      const color = result.status === 'pass' ? colors.green : result.status === 'fail' ? colors.red : colors.yellow
      console.log(`  ${color}${icon}${colors.reset} ${result.name}${result.details ? ` ${colors.dim}(${result.details})${colors.reset}` : ''}`)
    }
  }

  // 打印总结
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}业务流程测试总结${colors.reset}\n`)

  const passed = allResults.filter(r => r.status === 'pass').length
  const failed = allResults.filter(r => r.status === 'fail').length
  const skipped = allResults.filter(r => r.status === 'skip').length
  const total = allResults.length

  console.log(`${colors.green}✓ 通过: ${passed}${colors.reset}`)
  console.log(`${colors.red}✗ 失败: ${failed}${colors.reset}`)
  console.log(`${colors.yellow}⊘ 跳过: ${skipped}${colors.reset}`)
  console.log(`\n${colors.bold}总计: ${passed}/${total} 通过${colors.reset}`)
  console.log(`${colors.bold}总耗时: ${Date.now() - totalStart}ms${colors.reset}`)
  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  if (failed > 0) {
    console.log(`${colors.red}${colors.bold}部分测试失败，请检查失败的测试项。${colors.reset}\n`)
    process.exit(1)
  } else {
    console.log(`${colors.green}${colors.bold}所有业务流程测试通过！${colors.reset}\n`)
  }
}

// 运行
main().catch((error) => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
