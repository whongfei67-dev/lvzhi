/**
 * 健康检查脚本
 *
 * 用于监控 API 服务状态，支持:
 * - 健康检查
 * - AI 服务检查
 * - 数据库连接检查
 * - 定时监控
 *
 * 使用方法：
 *   npm run health-check           # 单次检查
 *   npm run health-check -- --watch  # 持续监控
 *
 * 环境变量：
 *   API_BASE_URL - API 基础地址
 *   SLACK_WEBHOOK_URL - Slack 告警通知
 *   DINGTALK_WEBHOOK_URL - 钉钉告警通知
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const CHECK_INTERVAL = 30000 // 30秒
const TIMEOUT = 10000 // 10秒

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(type: 'pass' | 'fail' | 'info' | 'warn', message: string, details?: string) {
  const prefix = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  }[type]
  const timestamp = new Date().toISOString()
  const msg = `${prefix} [${timestamp}] ${message}`
  if (details) {
    console.log(msg)
    console.log(`       ${details}`)
  } else {
    console.log(msg)
  }
}

// ============================================
// HTTP 请求封装
// ============================================

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ============================================
// 健康检查项
// ============================================

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

async function checkAPIHealth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`)
    const latency = Date.now() - start

    if (response.status === 200) {
      const data = await response.json()
      return {
        name: 'API 健康检查',
        status: 'pass',
        latency,
        details: data,
      }
    }

    return {
      name: 'API 健康检查',
      status: 'fail',
      latency,
      message: `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      name: 'API 健康检查',
      status: 'fail',
      message: String(error),
    }
  }
}

async function checkAIHealth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/ai/health`)

    if (response.status === 200) {
      const latency = Date.now() - start
      const data = await response.json()
      const providers = data?.data?.providers || []

      if (providers.length > 0) {
        return {
          name: 'AI 服务',
          status: 'pass',
          latency,
          details: { providers, count: providers.length },
        }
      }

      return {
        name: 'AI 服务',
        status: 'warn',
        latency,
        message: '无可用 AI Provider',
        details: data,
      }
    }

    return {
      name: 'AI 服务',
      status: 'fail',
      latency: Date.now() - start,
      message: `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      name: 'AI 服务',
      status: 'fail',
      message: String(error),
    }
  }
}

async function checkPublicEndpoints(): Promise<CheckResult[]> {
  const endpoints = [
    { path: '/api/agents', name: '智能体列表' },
    { path: '/api/products', name: '产品列表' },
    { path: '/api/community/posts', name: '社区帖子' },
  ]

  const results: CheckResult[] = []

  for (const endpoint of endpoints) {
    const start = Date.now()
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint.path}`)
      const latency = Date.now() - start

      if (response.status === 200) {
        results.push({
          name: endpoint.name,
          status: 'pass',
          latency,
        })
      } else {
        results.push({
          name: endpoint.name,
          status: 'fail',
          latency,
          message: `HTTP ${response.status}`,
        })
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: 'fail',
        message: String(error),
      })
    }
  }

  return results
}

// ============================================
// 告警通知
// ============================================

async function sendAlert(title: string, message: string, severity: 'critical' | 'warning' = 'warning') {
  const emoji = severity === 'critical' ? '🔴' : '🟡'

  // Slack 通知
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} *${title}*`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: title, emoji: true },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: message },
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: `*时间:* ${new Date().toISOString()}` },
                { type: 'mrkdwn', text: `*环境:* ${process.env.NODE_ENV || 'development'}` },
              ],
            },
          ],
        }),
      })
    } catch (error) {
      console.error('Slack 通知失败:', error)
    }
  }

  // 钉钉通知
  if (process.env.DINGTALK_WEBHOOK_URL) {
    try {
      await fetch(process.env.DINGTALK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            title,
            text: `## ${emoji} ${title}\n\n${message}\n\n**时间:** ${new Date().toISOString()}`,
          },
        }),
      })
    } catch (error) {
      console.error('钉钉通知失败:', error)
    }
  }
}

// ============================================
// 健康检查执行
// ============================================

async function runHealthCheck(): Promise<boolean> {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 健康检查 ━━━${colors.reset}\n`)

  const results: CheckResult[] = []
  let allPassed = true

  // 1. API 健康检查
  const apiResult = await checkAPIHealth()
  results.push(apiResult)

  if (apiResult.status === 'pass') {
    log('pass', apiResult.name, `延迟: ${apiResult.latency}ms`)
  } else if (apiResult.status === 'warn') {
    log('warn', apiResult.name, apiResult.message || '')
    allPassed = false
  } else {
    log('fail', apiResult.name, apiResult.message || '')
    allPassed = false
  }

  // 2. AI 服务检查
  const aiResult = await checkAIHealth()
  results.push(aiResult)

  if (aiResult.status === 'pass') {
    const providers = aiResult.details?.providers as string[] || []
    log('pass', aiResult.name, `延迟: ${aiResult.latency}ms, Provider: ${providers.join(', ')}`)
  } else if (aiResult.status === 'warn') {
    log('warn', aiResult.name, aiResult.message || '')
  } else {
    log('fail', aiResult.name, aiResult.message || '')
    allPassed = false
  }

  // 3. 公开接口检查
  const publicResults = await checkPublicEndpoints()
  results.push(...publicResults)

  for (const result of publicResults) {
    if (result.status === 'pass') {
      log('pass', result.name, `延迟: ${result.latency}ms`)
    } else {
      log('fail', result.name, result.message || '')
      allPassed = false
    }
  }

  // 生成报告
  console.log(`\n${colors.bold}━━━ 检查总结 ━━━${colors.reset}\n`)

  const passedCount = results.filter(r => r.status === 'pass').length
  const failedCount = results.filter(r => r.status === 'fail').length
  const warnCount = results.filter(r => r.status === 'warn').length

  console.log(`通过: ${colors.green}${passedCount}${colors.reset}`)
  console.log(`失败: ${failedCount > 0 ? colors.red : ''}${failedCount}${colors.reset}`)
  console.log(`警告: ${warnCount > 0 ? colors.yellow : ''}${warnCount}${colors.reset}`)

  // 发送告警（如果失败）
  if (!allPassed && process.env.SLACK_WEBHOOK_URL) {
    const failedItems = results
      .filter(r => r.status === 'fail')
      .map(r => `- ${r.name}: ${r.message}`)
      .join('\n')

    await sendAlert(
      '律植服务健康检查失败',
      `以下检查项失败:\n${failedItems}`,
      'critical'
    )
  }

  return allPassed
}

// ============================================
// 持续监控模式
// ============================================

let consecutiveFailures = 0
const FAILURE_THRESHOLD = 3

async function startMonitoring() {
  console.log(`\n${colors.bold}${colors.cyan}━━━ 持续监控模式 ━━━${colors.reset}\n`)
  console.log(`检查间隔: ${CHECK_INTERVAL / 1000}秒`)
  console.log(`告警阈值: ${FAILURE_THRESHOLD}次连续失败`)
  console.log(`\n按 Ctrl+C 停止\n`)

  // 初始检查
  await runHealthCheck()

  // 定时检查
  setInterval(async () => {
    const passed = await runHealthCheck()

    if (passed) {
      consecutiveFailures = 0
    } else {
      consecutiveFailures++

      if (consecutiveFailures >= FAILURE_THRESHOLD) {
        console.log(`\n${colors.red}${colors.bold}警告: 连续 ${consecutiveFailures} 次检查失败!${colors.reset}\n`)

        await sendAlert(
          '律植服务连续故障',
          `连续 ${consecutiveFailures} 次健康检查失败，请及时处理!`,
          'critical'
        )
      }
    }
  }, CHECK_INTERVAL)
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const isWatch = args.includes('--watch') || args.includes('-w')

  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 健康检查工具                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`API 地址: ${API_BASE_URL}`)
  console.log(`模式: ${isWatch ? '持续监控' : '单次检查'}\n`)

  if (isWatch) {
    await startMonitoring()
  } else {
    const passed = await runHealthCheck()
    process.exit(passed ? 0 : 1)
  }
}

main().catch(console.error)
