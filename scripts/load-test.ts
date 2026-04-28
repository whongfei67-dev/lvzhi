/**
 * 律植 (Lvzhi) Node.js 压测脚本
 * 
 * 使用方法:
 *   npx tsx scripts/load-test.ts
 *   npx tsx scripts/load-test.ts --scenario=home     # 只测试首页
 *   npx tsx scripts/load-test.ts --scenario=ai       # 只测试 AI
 *   npx tsx scripts/load-test.ts --scenario=all      # 测试所有
 *   npx tsx scripts/load-test.ts --vus=100 --duration=30
 *
 * 压测目标:
 *   QPS (API) ≥ 500
 *   QPS (AI) ≥ 50
 *   P95 延迟 ≤ 500ms
 *   P99 延迟 ≤ 2s
 *   错误率 ≤ 1%
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000'
const VUS = parseInt(process.env.VUS || '30', 10)  // 并发虚拟用户数
const DURATION = parseInt(process.env.DURATION || '30', 10)  // 持续时间(秒)
const WARMUP = 5  // 预热时间(秒)
const REQUEST_DELAY_MIN = 1000  // 最小请求间隔(ms)
const REQUEST_DELAY_MAX = 2000  // 最大请求间隔(ms)

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

// 性能指标
interface Metrics {
  total: number
  success: number
  failed: number
  errors: Map<string, number>
  durations: number[]
  startTime: number
  endTime: number
}

function createMetrics(): Metrics {
  return {
    total: 0,
    success: 0,
    failed: 0,
    errors: new Map(),
    durations: [],
    startTime: 0,
    endTime: 0,
  }
}

function addMetric(metrics: Metrics, duration: number, success: boolean, error?: string) {
  metrics.total++
  metrics.durations.push(duration)
  if (success) {
    metrics.success++
  } else {
    metrics.failed++
    if (error) {
      metrics.errors.set(error, (metrics.errors.get(error) || 0) + 1)
    }
  }
}

function calculatePercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

function printMetrics(name: string, metrics: Metrics) {
  const { total, success, failed, durations, errors, startTime, endTime } = metrics
  const elapsed = (endTime - startTime) / 1000
  const qps = total / elapsed

  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0
  const p50 = calculatePercentile(durations, 50)
  const p95 = calculatePercentile(durations, 95)
  const p99 = calculatePercentile(durations, 99)
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0

  console.log(`\n${colors.bold}${colors.cyan}═══ ${name} 压测结果 ═══${colors.reset}\n`)
  console.log(`${colors.green}✓ 成功: ${success}${colors.reset}`)
  console.log(`${colors.red}✗ 失败: ${failed}${colors.reset}`)
  console.log(`总计请求: ${total}`)
  console.log(`错误率: ${((failed / total) * 100).toFixed(2)}%`)
  console.log(`\n${colors.bold}性能指标:${colors.reset}`)
  console.log(`  QPS: ${qps.toFixed(2)}/s`)
  console.log(`  平均延迟: ${avgDuration.toFixed(2)}ms`)
  console.log(`  最小延迟: ${minDuration.toFixed(2)}ms`)
  console.log(`  P50: ${p50.toFixed(2)}ms`)
  console.log(`  P95: ${p95.toFixed(2)}ms`)
  console.log(`  P99: ${p99.toFixed(2)}ms`)
  console.log(`  最大延迟: ${maxDuration.toFixed(2)}ms`)

  if (errors.size > 0) {
    console.log(`\n${colors.red}${colors.bold}错误分布:${colors.reset}`)
    for (const [error, count] of errors.entries()) {
      console.log(`  ${error}: ${count}次`)
    }
  }

  // 性能评估
  console.log(`\n${colors.bold}性能评估:${colors.reset}`)
  const p95Pass = p95 <= 500
  const p99Pass = p99 <= 2000
  const errorRatePass = (failed / total) <= 0.01

  console.log(`  P95 ≤ 500ms: ${p95Pass ? colors.green + '✓ 通过' : colors.red + '✗ 未达标'} ${colors.reset}(${p95.toFixed(2)}ms)`)
  console.log(`  P99 ≤ 2000ms: ${p99Pass ? colors.green + '✓ 通过' : colors.red + '✗ 未达标'} ${colors.reset}(${p99.toFixed(2)}ms)`)
  console.log(`  错误率 ≤ 1%: ${errorRatePass ? colors.green + '✓ 通过' : colors.red + '✗ 未达标'} ${colors.reset}(${((failed / total) * 100).toFixed(2)}%)`)

  return { qps, avgDuration, p50, p95, p99, maxDuration, errorRate: (failed / total) * 100 }
}

// ============================================
// HTTP 工具
// ============================================

async function httpRequest(
  method: string,
  url: string,
  options: {
    body?: unknown
    headers?: Record<string, string>
    timeout?: number
  } = {}
): Promise<{ status: number; data: unknown; duration: number }> {
  const { body, headers = {}, timeout = 30000 } = options
  const start = Date.now()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
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
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }

    return { status: response.status, data, duration }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ============================================
// 测试场景
// ============================================

/**
 * 场景1: 首页 + 智能体列表
 * 测试公开接口的高并发性能
 */
// ============================================
// 错误记录（减少输出）
// ============================================
let errorCount = 0
const MAX_ERRORS_LOGGED = 5

function logError(msg: string) {
  if (errorCount < MAX_ERRORS_LOGGED) {
    console.log(msg)
    errorCount++
  }
}

async function scenarioHomeAndAgents(metrics: Metrics, token?: string) {
  const requests = [
    () => httpRequest('GET', `${API_BASE_URL}/health`),
    () => httpRequest('GET', `${API_BASE_URL}/api/agents?limit=20`),
    () => httpRequest('GET', `${API_BASE_URL}/api/agents?category=legal&limit=10`),
    () => httpRequest('GET', `${API_BASE_URL}/api/community/posts?limit=10`),
  ]

  for (const request of requests) {
    try {
      const result = await request()
      const success = result.status >= 200 && result.status < 400
      addMetric(metrics, result.duration, success)
      if (!success) {
        logError(`Request failed: ${result.status}`)
      }
    } catch (error) {
      addMetric(metrics, 0, false, error instanceof Error ? error.message : 'Unknown error')
      logError(`Request error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }
}

/**
 * 场景2: AI 对话
 * 测试 AI 接口的吞吐量和响应时间
 */
async function scenarioAIChat(metrics: Metrics, token: string) {
  try {
    const result = await httpRequest('POST', `${API_BASE_URL}/api/ai/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        agent_id: 'test-agent',
        messages: [{ role: 'user', content: '你好，请介绍一下法律咨询服务' }],
      },
      timeout: 60000,
    })

    addMetric(metrics, result.duration, result.status === 200)
  } catch (error) {
    addMetric(metrics, 60000, false, error instanceof Error ? error.message : 'AI request failed')
  }
}

/**
 * 场景3: 用户认证
 * 测试登录注册接口
 */
async function scenarioAuth(metrics: Metrics) {
  const email = `loadtest_${Date.now()}@example.com`
  const password = 'LoadTest@123'

  // 注册
  try {
    const regResult = await httpRequest('POST', `${API_BASE_URL}/api/auth/register`, {
      body: { email, password, display_name: 'LoadTest' },
    })
    addMetric(metrics, regResult.duration, regResult.status >= 200 && regResult.status < 300, 'Register failed')
  } catch (error) {
    addMetric(metrics, 0, false, 'Register error')
  }

  // 登录
  try {
    const loginResult = await httpRequest('POST', `${API_BASE_URL}/api/auth/login`, {
      body: { email, password },
    })
    addMetric(metrics, loginResult.duration, loginResult.status >= 200 && loginResult.status < 300, 'Login failed')
  } catch (error) {
    addMetric(metrics, 0, false, 'Login error')
  }
}

/**
 * 场景4: 社区写入
 * 测试评论、点赞等写入操作
 */
async function scenarioWriteOperations(metrics: Metrics, token: string) {
  const requests = [
    // 发帖
    () => httpRequest('POST', `${API_BASE_URL}/api/community/posts`, {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: `LoadTest_${Date.now()}`,
        content: 'Load test content',
        tags: ['test'],
      },
    }),
    // 点赞
    () => httpRequest('POST', `${API_BASE_URL}/api/community/posts/1/like`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // 评论
    () => httpRequest('POST', `${API_BASE_URL}/api/community/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      body: { post_id: '1', content: 'Load test comment' },
    }),
  ]

  for (const request of requests) {
    try {
      const result = await request()
      addMetric(metrics, result.duration, result.status >= 200 && result.status < 400)
    } catch (error) {
      addMetric(metrics, 0, false, 'Write error')
    }
  }
}

/**
 * 获取测试 token
 */
async function getTestToken(): Promise<string | null> {
  try {
    const result = await httpRequest('POST', `${API_BASE_URL}/api/auth/login`, {
      body: { email: 'test@lvzhi.com', password: 'Test123456' },
    })

    if (result.status === 200 && result.data && typeof result.data === 'object') {
      const data = result.data as { data?: { access_token?: string } }
      return data.data?.access_token || null
    }
    return null
  } catch {
    return null
  }
}

// ============================================
// 虚拟用户模拟
// ============================================

interface VUSimulator {
  id: number
  running: boolean
  metrics: Metrics
}

async function runVUSimulator(simulator: VUSimulator, scenario: 'home' | 'ai' | 'auth' | 'write', token?: string) {
  const { id, metrics } = simulator

  while (simulator.running) {
    try {
      switch (scenario) {
        case 'home':
          await scenarioHomeAndAgents(metrics, token || undefined)
          break
        case 'ai':
          if (token) await scenarioAIChat(metrics, token)
          break
        case 'auth':
          await scenarioAuth(metrics)
          break
        case 'write':
          if (token) await scenarioWriteOperations(metrics, token)
          break
      }
    } catch (error) {
      // 记录错误但继续运行
      addMetric(metrics, 0, false, error instanceof Error ? error.message : 'Unknown error')
    }

    // 随机等待（模拟真实用户行为）
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MIN + Math.random() * (REQUEST_DELAY_MAX - REQUEST_DELAY_MIN)))
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const scenarioArg = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1] || 'all'
  const vusArg = parseInt(args.find(arg => arg.startsWith('--vus='))?.split('=')[1] || String(VUS), 10)
  const durationArg = parseInt(args.find(arg => arg.startsWith('--duration='))?.split('=')[1] || String(DURATION), 10)

  console.log(`
${colors.bold}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   律植 (Lvzhi) 性能压测                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`并发 VUS: ${vusArg}`)
  console.log(`持续时间: ${durationArg}秒`)
  console.log(`预热时间: ${WARMUP}秒`)
  console.log(`开始时间: ${new Date().toISOString()}\n`)

  // 获取测试 token
  console.log(`${colors.blue}正在获取测试 Token...${colors.reset}`)
  const token = await getTestToken()
  if (token) {
    console.log(`${colors.green}✓ Token 获取成功${colors.reset}\n`)
  } else {
    console.log(`${colors.yellow}⚠ 无法获取 Token，部分测试可能失败${colors.reset}\n`)
  }

  // 确定要运行的场景
  const scenarios = scenarioArg === 'all'
    ? ['home', 'ai', 'auth', 'write'] as const
    : [scenarioArg as 'home' | 'ai' | 'auth' | 'write']

  // 收集所有指标
  const allResults: ReturnType<typeof printMetrics>[] = []
  const startTime = Date.now()

  for (const scenario of scenarios) {
    console.log(`${colors.bold}${colors.yellow}━━━ 开始压测: ${scenario.toUpperCase()} ━━━${colors.reset}`)

    const metrics = createMetrics()
    const simulators: VUSimulator[] = []

    // 启动 VU 模拟器
    const vuCount = scenario === 'ai' ? Math.min(vusArg, 10) : vusArg // AI 测试减少并发

    for (let i = 0; i < vuCount; i++) {
      const simulator: VUSimulator = {
        id: i,
        running: true,
        metrics,
      }
      simulators.push(simulator)

      runVUSimulator(simulator, scenario, token || undefined).catch(() => {})
    }

    // 等待预热
    console.log(`预热中... (${WARMUP}秒)`)
    await new Promise(resolve => setTimeout(resolve, WARMUP * 1000))

    // 开始计时
    metrics.startTime = Date.now()
    console.log(`开始压测! (${durationArg}秒)`)

    // 等待压测完成
    await new Promise(resolve => setTimeout(resolve, durationArg * 1000))

    // 停止所有模拟器
    for (const sim of simulators) {
      sim.running = false
    }

    metrics.endTime = Date.now()

    // 打印结果
    const result = printMetrics(scenario.toUpperCase(), metrics)
    allResults.push(result)

    // 等待一点时间再进行下一个场景
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // 汇总报告
  const totalElapsed = (Date.now() - startTime) / 1000

  console.log(`
${colors.bold}${colors.green}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   压测完成汇总                                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`总耗时: ${totalElapsed.toFixed(0)}秒`)
  console.log('\n场景结果:')

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i]
    const result = allResults[i]
    console.log(`\n  ${colors.bold}${scenario.toUpperCase()}:${colors.reset}`)
    console.log(`    QPS: ${result.qps.toFixed(2)}/s`)
    console.log(`    P95: ${result.p95.toFixed(2)}ms`)
    console.log(`    P99: ${result.p99.toFixed(2)}ms`)
    console.log(`    错误率: ${result.errorRate.toFixed(2)}%`)
  }

  // 性能目标评估
  console.log(`\n${colors.bold}性能目标评估:${colors.reset}`)

  const homeResult = allResults[scenarios.indexOf('home')]
  const aiResult = allResults[scenarios.indexOf('ai')]

  if (homeResult) {
    const qpsPass = homeResult.qps >= 500
    console.log(`  首页 QPS ≥ 500: ${qpsPass ? colors.green + '✓ 通过' : colors.red + '✗ 未达标'} ${colors.reset}(${homeResult.qps.toFixed(2)})`)
  }

  if (aiResult) {
    const qpsPass = aiResult.qps >= 50
    console.log(`  AI QPS ≥ 50: ${qpsPass ? colors.green + '✓ 通过' : colors.red + '✗ 未达标'} ${colors.reset}(${aiResult.qps.toFixed(2)})`)
  }

  console.log('')
}

// 运行
main().catch((error) => {
  console.error('压测执行失败:', error)
  process.exit(1)
})
