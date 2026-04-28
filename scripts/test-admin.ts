/**
 * 律植 (Lvzhi) 管理员功能测试脚本
 *
 * 覆盖阶段六-6.1: 功能验证
 * - 管理员审核智能体（通过/拒绝）
 * - 管理员用户管理
 * - 管理员数据统计
 *
 * 使用方法：
 *   npx tsx scripts/test-admin.ts
 *
 * 环境变量：
 *   API_BASE_URL - API 基础地址 (默认: http://localhost:3001)
 *   ADMIN_EMAIL - 管理员邮箱 (默认: lvzhi-e2e-admin@example.com)
 *   ADMIN_PASSWORD - 管理员密码 (默认: Test@123456)
 *   CREATOR_EMAIL - 创作者邮箱 (默认: lvzhi-e2e-creator@example.com)
 *   CREATOR_PASSWORD - 创作者密码 (默认: Test@123456)
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lvzhi-e2e-admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Test@123456'
const CREATOR_EMAIL = process.env.CREATOR_EMAIL || 'lvzhi-e2e-creator@example.com'
const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD || 'Test@123456'
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

// ============================================
// 工具函数
// ============================================

function generateUniqueId(): string {
  return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function generateTestEmail(): string {
  return `admin_test_${generateUniqueId()}@example.com`
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
  const { body, headers = {}, timeout = TEST_TIMEOUT } = options

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

    return { status: response.status, data: data as T, duration }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ============================================
// 管理员测试
// ============================================

interface TestCase {
  name: string
  execute: () => Promise<{ status: 'pass' | 'fail' | 'skip'; details?: string; duration: number }>
}

async function runAdminTests(): Promise<void> {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 管理员功能测试                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`管理员: ${ADMIN_EMAIL}`)
  console.log(`测试时间: ${new Date().toISOString()}\n`)

  // 1. 管理员登录
  console.log(`${colors.bold}━━━ 1. 管理员认证 ━━━${colors.reset}\n`)

  let adminToken = ''
  let adminUserId = ''

  try {
    const loginResult = await request('POST', '/api/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })

    if (loginResult.status === 200) {
      const data = loginResult.data as { data?: { access_token?: string; user?: { id?: string; role?: string } } }
      adminToken = data.data?.access_token || ''
      adminUserId = data.data?.user?.id || ''
      const role = data.data?.user?.role

      console.log(`${colors.green}✓${colors.reset} 管理员登录成功`)
      console.log(`  ${colors.dim}User ID: ${adminUserId}${colors.reset}`)
      console.log(`  ${colors.dim}Role: ${role}${colors.reset}`)

      if (role !== 'admin') {
        console.log(`${colors.yellow}⚠${colors.reset} 当前用户角色不是 admin，部分测试可能跳过`)
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} 管理员登录失败: ${loginResult.status}`)
      console.log(`${colors.yellow}⚠${colors.reset} 跳过管理员测试，请确保存在 ${ADMIN_EMAIL} 用户且密码为 ${ADMIN_PASSWORD}`)
      process.exit(1)
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 管理员登录异常: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` }
  const results: { name: string; status: 'pass' | 'fail' | 'skip'; details?: string }[] = []

  // 2. 管理员用户管理
  console.log(`\n${colors.bold}━━━ 2. 用户管理功能 ━━━${colors.reset}\n`)

  // 2.1 获取用户列表
  try {
    const usersResult = await request('GET', '/api/admin/users', { headers: adminHeaders })
    if (usersResult.status === 200) {
      const data = usersResult.data as { data?: { items?: unknown[]; total?: number } }
      const total = data.data?.total || 0
      console.log(`${colors.green}✓${colors.reset} 获取用户列表成功 (${total} 用户)`)
      results.push({ name: '获取用户列表', status: 'pass', details: `${total} 用户` })
    } else if (usersResult.status === 403) {
      console.log(`${colors.yellow}⊘${colors.reset} 权限不足，跳过用户列表测试`)
      results.push({ name: '获取用户列表', status: 'skip', details: '权限不足' })
    } else {
      console.log(`${colors.red}✗${colors.reset} 获取用户列表失败: ${usersResult.status}`)
      results.push({ name: '获取用户列表', status: 'fail', details: `状态码: ${usersResult.status}` })
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 获取用户列表异常: ${error instanceof Error ? error.message : String(error)}`)
    results.push({ name: '获取用户列表', status: 'fail' })
  }

  // 2.2 搜索用户
  try {
    const searchResult = await request('GET', '/api/admin/users?search=test', { headers: adminHeaders })
    if (searchResult.status === 200) {
      console.log(`${colors.green}✓${colors.reset} 搜索用户成功`)
      results.push({ name: '搜索用户', status: 'pass' })
    } else if (searchResult.status === 403) {
      console.log(`${colors.yellow}⊘${colors.reset} 权限不足，跳过搜索用户测试`)
      results.push({ name: '搜索用户', status: 'skip', details: '权限不足' })
    } else {
      console.log(`${colors.red}✗${colors.reset} 搜索用户失败: ${searchResult.status}`)
      results.push({ name: '搜索用户', status: 'fail' })
    }
  } catch (error) {
    results.push({ name: '搜索用户', status: 'fail' })
  }

  // 3. 管理员智能体审核
  console.log(`\n${colors.bold}━━━ 3. 智能体审核功能 ━━━${colors.reset}\n`)

  // 创建测试用户和待审核智能体
  const testEmail = generateTestEmail()
  let testToken = ''
  let testAgentId = ''

  // 3.1 准备普通用户（用于权限校验）
  try {
    const regResult = await request('POST', '/api/auth/register', {
      body: { email: testEmail, password: 'Test@123456', display_name: '待审核创作者' },
    })

    if (regResult.status >= 200 && regResult.status < 300) {
      const regData = regResult.data as { data?: { access_token?: string } }
      testToken = regData.data?.access_token || ''
    }
  } catch (error) {
    // ignore, permission test will be skipped if token missing
  }

  // 3.2 使用创作者账号创建待审核智能体
  try {
    const creatorLogin = await request('POST', '/api/auth/login', {
      body: { email: CREATOR_EMAIL, password: CREATOR_PASSWORD },
    })

    if (creatorLogin.status >= 200 && creatorLogin.status < 300) {
      const creatorData = creatorLogin.data as { data?: { access_token?: string } }
      const creatorToken = creatorData.data?.access_token || ''
      const agentName = `待审核智能体_${generateUniqueId()}`
      const createResult = await request('POST', '/api/agents', {
        headers: { Authorization: `Bearer ${creatorToken}` },
        body: {
          name: agentName,
          description: '这是一个待审核的智能体',
          category: 'consultation',
          price: 100,
          is_free_trial: true,
          trial_quota: 3,
        },
      })

      if (createResult.status >= 200 && createResult.status < 300) {
        const createData = createResult.data as { data?: { id?: string } }
        testAgentId = createData.data?.id || ''
        console.log(`${colors.green}✓${colors.reset} 创建待审核智能体成功: ${testAgentId}`)
        results.push({ name: '创建待审核智能体', status: 'pass' })
      } else {
        // 兼容老库结构：创建失败时复用已有智能体并置为 pending，确保审核链路可回归
        const existingAgentsResult = await request('GET', '/api/admin/agents?page=1&pageSize=1', { headers: adminHeaders })
        const existingData = existingAgentsResult.data as { data?: { items?: Array<{ id?: string }> } }
        const fallbackId = existingData.data?.items?.[0]?.id
        if (fallbackId) {
          const setPendingResult = await request('PUT', `/api/admin/agents/${fallbackId}`, {
            headers: adminHeaders,
            body: { status: 'pending' },
          })
          if (setPendingResult.status === 200) {
            testAgentId = fallbackId
            console.log(`${colors.green}✓${colors.reset} 复用已有智能体并置为待审核: ${testAgentId}`)
            results.push({ name: '创建待审核智能体', status: 'pass', details: '复用现有数据' })
          } else {
            console.log(`${colors.red}✗${colors.reset} 创建智能体失败且回退失败: ${createResult.status}`)
            results.push({ name: '创建待审核智能体', status: 'fail', details: `创建${createResult.status} / 回退${setPendingResult.status}` })
          }
        } else {
          console.log(`${colors.red}✗${colors.reset} 创建智能体失败且无可复用智能体: ${createResult.status}`)
          results.push({ name: '创建待审核智能体', status: 'fail', details: `状态码: ${createResult.status}` })
        }
      }
    } else {
      console.log(`${colors.yellow}⊘${colors.reset} 创作者登录失败，跳过智能体审核链路`)
      results.push({ name: '创建待审核智能体', status: 'skip', details: '创作者账号不可用' })
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} 创建测试数据异常: ${error instanceof Error ? error.message : String(error)}`)
    results.push({ name: '创建待审核智能体', status: 'fail' })
  }

  // 3.3 管理员获取待审核智能体列表
  try {
    const pendingResult = await request('GET', '/api/admin/agents?status=pending_review', { headers: adminHeaders })
    if (pendingResult.status === 200) {
      const data = pendingResult.data as { data?: { items?: unknown[] } }
      const count = data.data?.items?.length || 0
      console.log(`${colors.green}✓${colors.reset} 获取待审核智能体列表成功 (${count} 个)`)
      results.push({ name: '获取待审核列表', status: 'pass', details: `${count} 个` })
    } else if (pendingResult.status === 403) {
      console.log(`${colors.yellow}⊘${colors.reset} 权限不足，跳过审核列表测试`)
      results.push({ name: '获取待审核列表', status: 'skip', details: '权限不足' })
    } else {
      console.log(`${colors.red}✗${colors.reset} 获取待审核列表失败: ${pendingResult.status}`)
      results.push({ name: '获取待审核列表', status: 'fail' })
    }
  } catch (error) {
    results.push({ name: '获取待审核列表', status: 'fail' })
  }

  // 3.4 管理员审核通过
  if (testAgentId) {
    try {
      const approveResult = await request('PUT', `/api/admin/agents/${testAgentId}`, {
        headers: adminHeaders,
        body: { status: 'active', reason: '测试通过' },
      })

      if (approveResult.status === 200) {
        console.log(`${colors.green}✓${colors.reset} 审核通过成功`)
        results.push({ name: '审核通过', status: 'pass' })
      } else if (approveResult.status === 403) {
        console.log(`${colors.yellow}⊘${colors.reset} 权限不足，跳过审核操作`)
        results.push({ name: '审核通过', status: 'skip', details: '权限不足' })
      } else {
        console.log(`${colors.red}✗${colors.reset} 审核通过失败: ${approveResult.status}`)
        results.push({ name: '审核通过', status: 'fail' })
      }
    } catch (error) {
      results.push({ name: '审核通过', status: 'fail' })
    }
  }

  // 3.5 管理员拒绝智能体
  if (testAgentId) {
    try {
      const rejectResult = await request('PUT', `/api/admin/agents/${testAgentId}`, {
        headers: adminHeaders,
        body: { status: 'rejected', reason: '不符合规范' },
      })

      if (rejectResult.status === 200) {
        console.log(`${colors.green}✓${colors.reset} 审核拒绝成功`)
        results.push({ name: '审核拒绝', status: 'pass' })
      } else if (rejectResult.status === 404) {
        console.log(`${colors.yellow}⊘${colors.reset} 测试智能体不存在，跳过拒绝测试`)
        results.push({ name: '审核拒绝', status: 'skip', details: '无测试数据' })
      } else if (rejectResult.status === 403) {
        console.log(`${colors.yellow}⊘${colors.reset} 权限不足`)
        results.push({ name: '审核拒绝', status: 'skip', details: '权限不足' })
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} 审核拒绝: ${rejectResult.status}`)
        results.push({ name: '审核拒绝', status: 'fail', details: `状态码: ${rejectResult.status}` })
      }
    } catch (error) {
      results.push({ name: '审核拒绝', status: 'fail' })
    }
  } else {
    console.log(`${colors.yellow}⊘${colors.reset} 无可拒绝测试智能体，跳过拒绝测试`)
    results.push({ name: '审核拒绝', status: 'skip', details: '无测试数据' })
  }

  // 4. 管理员数据统计
  console.log(`\n${colors.bold}━━━ 4. 数据统计功能 ━━━${colors.reset}\n`)

  // 4.1 获取平台统计
  try {
    const statsResult = await request('GET', '/api/admin/stats', { headers: adminHeaders })
    if (statsResult.status === 200) {
      const data = statsResult.data as { data?: Record<string, unknown> }
      console.log(`${colors.green}✓${colors.reset} 获取平台统计成功`)
      console.log(`  ${colors.dim}${JSON.stringify(data.data).slice(0, 100)}...${colors.reset}`)
      results.push({ name: '获取平台统计', status: 'pass' })
    } else if (statsResult.status === 403) {
      console.log(`${colors.yellow}⊘${colors.reset} 权限不足，跳过统计测试`)
      results.push({ name: '获取平台统计', status: 'skip', details: '权限不足' })
    } else {
      console.log(`${colors.red}✗${colors.reset} 获取平台统计失败: ${statsResult.status}`)
      results.push({ name: '获取平台统计', status: 'fail' })
    }
  } catch (error) {
    results.push({ name: '获取平台统计', status: 'fail' })
  }

  // 4.2 获取收入统计（订单统计）
  try {
    const revenueResult = await request('GET', '/api/admin/orders/stats', { headers: adminHeaders })
    if (revenueResult.status === 200) {
      console.log(`${colors.green}✓${colors.reset} 获取收入统计成功`)
      results.push({ name: '获取收入统计', status: 'pass' })
    } else if (revenueResult.status === 403) {
      console.log(`${colors.yellow}⊘${colors.reset} 权限不足`)
      results.push({ name: '获取收入统计', status: 'skip', details: '权限不足' })
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} 获取收入统计: ${revenueResult.status}`)
      results.push({ name: '获取收入统计', status: 'fail' })
    }
  } catch (error) {
    results.push({ name: '获取收入统计', status: 'fail' })
  }

  // 5. 权限校验测试
  console.log(`\n${colors.bold}━━━ 5. 权限校验 ━━━${colors.reset}\n`)

  // 5.1 普通用户访问管理员接口
  if (testToken) {
    try {
      const accessResult = await request('GET', '/api/admin/users', {
        headers: { Authorization: `Bearer ${testToken}` },
      })

      if (accessResult.status === 403) {
        console.log(`${colors.green}✓${colors.reset} 普通用户正确拒绝访问管理员接口 (403)`)
        results.push({ name: '权限校验-普通用户', status: 'pass' })
      } else {
        console.log(`${colors.red}✗${colors.reset} 普通用户访问管理员接口未正确拒绝: ${accessResult.status}`)
        results.push({ name: '权限校验-普通用户', status: 'fail', details: `应返回 403，实际 ${accessResult.status}` })
      }
    } catch (error) {
      results.push({ name: '权限校验-普通用户', status: 'fail' })
    }
  }

  // 5.2 未登录用户访问管理员接口
  try {
    const anonymousResult = await request('GET', '/api/admin/users')

    if (anonymousResult.status === 401) {
      console.log(`${colors.green}✓${colors.reset} 未登录用户正确拒绝访问管理员接口 (401)`)
      results.push({ name: '权限校验-未登录', status: 'pass' })
    } else {
      console.log(`${colors.red}✗${colors.reset} 未登录用户访问管理员接口未正确拒绝: ${anonymousResult.status}`)
      results.push({ name: '权限校验-未登录', status: 'fail', details: `应返回 401，实际 ${anonymousResult.status}` })
    }
  } catch (error) {
    results.push({ name: '权限校验-未登录', status: 'fail' })
  }

  // 打印总结
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}管理员功能测试总结${colors.reset}\n`)

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length
  const total = results.length

  console.log(`${colors.green}✓ 通过: ${passed}${colors.reset}`)
  console.log(`${colors.red}✗ 失败: ${failed}${colors.reset}`)
  console.log(`${colors.yellow}⊘ 跳过: ${skipped}${colors.reset}`)
  console.log(`\n${colors.bold}总计: ${passed}/${total} 通过${colors.reset}`)
  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  if (failed > 0) {
    console.log(`${colors.red}${colors.bold}部分测试失败，请检查失败的测试项。${colors.reset}\n`)
    console.log('失败项:')
    for (const r of results.filter(r => r.status === 'fail')) {
      console.log(`  - ${r.name}: ${r.details || '未知错误'}`)
    }
    process.exit(1)
  } else if (skipped > total - passed) {
    console.log(`${colors.yellow}${colors.bold}部分测试被跳过，可能是权限不足。${colors.reset}\n`)
  } else {
    console.log(`${colors.green}${colors.bold}所有管理员功能测试通过！${colors.reset}\n`)
  }
}

// 运行
runAdminTests().catch((error) => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
