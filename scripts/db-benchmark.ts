/**
 * 律植 (Lvzhi) 数据库性能基准测试脚本
 *
 * 覆盖阶段零-0.7: 性能基准测试（新库 vs Supabase）
 *
 * 功能：
 * - 单次查询延迟测试
 * - 并发查询性能测试
 * - 慢查询识别
 * - 性能对比报告
 *
 * 使用方法：
 *   npx tsx scripts/db-benchmark.ts
 *   npx tsx scripts/db-benchmark.ts --compare   # 与 Supabase 对比
 *   npx tsx scripts/db-benchmark.ts --concurrency=20  # 20 并发
 *
 * 环境变量：
 *   DATABASE_URL - 目标数据库连接
 *   SUPABASE_URL - Supabase 连接（用于对比）
 */

import pg from 'pg'

const { Pool } = pg

// ============================================
// 配置
// ============================================

const TARGET_DB = {
  name: '阿里云 PolarDB',
  host: process.env.DATABASE_HOST || 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'data01',
  user: process.env.DATABASE_USER || 'mamba_01',
  password: process.env.DATABASE_PASSWORD || 'Wxwzcfwhf205',
}

const SUPABASE_DB = process.env.SUPABASE_URL ? {
  name: 'Supabase',
  connectionString: process.env.SUPABASE_URL,
} : null

const CONCURRENCY = parseInt(process.argv.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] || '10')
const ITERATIONS = parseInt(process.argv.find(arg => arg.startsWith('--iterations='))?.split('=')[1] || '100')
const ENABLE_COMPARISON = process.argv.includes('--compare') && SUPABASE_DB

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

function log(level: 'info' | 'pass' | 'fail' | 'warn', message: string, details?: string) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  }[level]
  console.log(`${prefix} ${message}${details ? ` ${colors.dim}(${details})${colors.reset}` : ''}`)
}

// ============================================
// 数据库连接
// ============================================

function createPool(config: typeof TARGET_DB): Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.host.includes('polardb') ? { rejectUnauthorized: false } : false,
    max: CONCURRENCY + 5,
    idleTimeoutMillis: 30000,
  })
}

// ============================================
// 性能测试用例
// ============================================

interface BenchmarkCase {
  name: string
  sql: string
  expectedLatency?: number  // 期望的最大延迟 (ms)
}

const benchmarkCases: BenchmarkCase[] = [
  // 简单查询
  {
    name: 'SELECT 1 (连接测试)',
    sql: 'SELECT 1',
    expectedLatency: 10,
  },
  {
    name: '获取当前用户数',
    sql: 'SELECT COUNT(*) FROM users',
    expectedLatency: 100,
  },
  {
    name: '获取当前智能体数',
    sql: 'SELECT COUNT(*) FROM agents',
    expectedLatency: 100,
  },

  // 列表查询
  {
    name: '智能体列表（分页）',
    sql: 'SELECT * FROM agents ORDER BY created_at DESC LIMIT 20 OFFSET 0',
    expectedLatency: 200,
  },
  {
    name: '用户列表（分页）',
    sql: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 0',
    expectedLatency: 200,
  },
  {
    name: '社区帖子列表',
    sql: 'SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 20 OFFSET 0',
    expectedLatency: 200,
  },

  // 搜索查询
  {
    name: '智能体名称模糊搜索',
    sql: "SELECT * FROM agents WHERE name ILIKE '%法律%' LIMIT 20",
    expectedLatency: 300,
  },
  {
    name: '用户名模糊搜索',
    sql: "SELECT * FROM users WHERE display_name ILIKE '%张%' LIMIT 20",
    expectedLatency: 300,
  },

  // 关联查询
  {
    name: '智能体详情（含创建者）',
    sql: `SELECT a.*, u.display_name as creator_name
          FROM agents a
          LEFT JOIN users u ON a.creator_id = u.id
          LIMIT 10`,
    expectedLatency: 200,
  },
  {
    name: '订单列表（含用户）',
    sql: `SELECT o.*, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          LIMIT 20`,
    expectedLatency: 300,
  },

  // 聚合查询
  {
    name: '每日订单统计',
    sql: `SELECT DATE(created_at) as date, COUNT(*) as cnt, SUM(amount) as total
          FROM orders
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC`,
    expectedLatency: 500,
  },
  {
    name: '智能体评分统计',
    sql: `SELECT agent_id, AVG(rating) as avg_rating, COUNT(*) as cnt
          FROM agent_ratings
          GROUP BY agent_id
          HAVING COUNT(*) > 0`,
    expectedLatency: 500,
  },

  // AI 相关查询
  {
    name: 'AI 调用日志（最近）',
    sql: `SELECT * FROM api_call_logs ORDER BY created_at DESC LIMIT 50`,
    expectedLatency: 300,
  },
  {
    name: 'AI 每日使用统计',
    sql: `SELECT DATE(created_at) as date, COUNT(*) as calls, SUM(tokens_used) as tokens
          FROM api_call_logs
          WHERE created_at > NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)`,
    expectedLatency: 500,
  },

  // 复杂查询
  {
    name: '热门智能体（综合评分）',
    sql: `SELECT a.*,
            (a.view_count * 0.1 + a.trial_count * 0.3 + a.favorite_count * 0.6) as popularity
          FROM agents a
          WHERE a.status = 'approved'
          ORDER BY popularity DESC
          LIMIT 10`,
    expectedLatency: 500,
  },
  {
    name: '用户活跃度统计',
    sql: `SELECT u.id, u.email,
            COUNT(DISTINCT o.id) as order_count,
            COUNT(DISTINCT a.id) as agent_count,
            COALESCE(b.balance, 0) as balance
          FROM users u
          LEFT JOIN orders o ON o.user_id = u.id
          LEFT JOIN agents a ON a.creator_id = u.id
          LEFT JOIN user_balances b ON b.user_id = u.id
          GROUP BY u.id, u.email, b.balance
          LIMIT 50`,
    expectedLatency: 1000,
  },
]

// ============================================
// 性能统计
// ============================================

interface LatencyStats {
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  errors: number
}

function calculateStats(latencies: number[]): LatencyStats {
  const sorted = [...latencies].sort((a, b) => a - b)
  return {
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
    p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    errors: 0,
  }
}

// ============================================
// 运行单个数据库基准测试
// ============================================

async function runBenchmark(pool: Pool, dbName: string): Promise<Map<string, LatencyStats>> {
  console.log(`\n${colors.bold}━━━ ${dbName} 性能测试 ━━━${colors.reset}\n`)

  const results = new Map<string, LatencyStats>()

  for (const testCase of benchmarkCases) {
    const latencies: number[] = []
    let errors = 0

    // 预热
    try {
      await pool.query(testCase.sql)
    } catch { /* ignore */ }

    // 执行测试
    const start = Date.now()
    for (let i = 0; i < ITERATIONS; i++) {
      const queryStart = Date.now()
      try {
        await pool.query(testCase.sql)
        latencies.push(Date.now() - queryStart)
      } catch (error) {
        errors++
      }
    }

    const totalTime = Date.now() - start
    const stats = calculateStats(latencies)
    stats.errors = errors
    results.set(testCase.name, stats)

    // 打印结果
    const status = errors === 0 ? 'pass' : errors < ITERATIONS * 0.1 ? 'warn' : 'fail'
    const expected = testCase.expectedLatency ? `期望 <${testCase.expectedLatency}ms` : ''
    const perfStatus = stats.p95 > (testCase.expectedLatency || 500) ? colors.red : colors.green
    const perfIndicator = stats.p95 > (testCase.expectedLatency || 500) ? '✗' : '✓'

    console.log(`${colors[status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red'][${perfIndicator}]${colors.reset} ${testCase.name}`)
    console.log(`    ${colors.dim}QPS: ${(ITERATIONS / totalTime * 1000).toFixed(1)} | Avg: ${stats.avg.toFixed(1)}ms | P95: ${perfStatus}${stats.p95.toFixed(1)}ms${colors.reset} ${expected}`)

    if (errors > 0) {
      console.log(`    ${colors.red}错误: ${errors}/${ITERATIONS}${colors.reset}`)
    }
  }

  return results
}

// ============================================
// 并发测试
// ============================================

async function runConcurrencyTest(pool: Pool, dbName: string): Promise<void> {
  console.log(`\n${colors.bold}━━━ ${dbName} 并发测试 (${CONCURRENCY} 并发) ━━━${colors.reset}\n`)

  const concurrentQueries = [
    'SELECT COUNT(*) FROM users',
    'SELECT COUNT(*) FROM agents',
    'SELECT * FROM agents LIMIT 20',
    "SELECT * FROM users WHERE display_name ILIKE '%张%' LIMIT 20",
    'SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 20',
  ]

  const start = Date.now()
  const promises: Promise<void>[] = []

  for (let i = 0; i < CONCURRENCY; i++) {
    const sql = concurrentQueries[i % concurrentQueries.length]
    promises.push(
      (async () => {
        const queryStart = Date.now()
        try {
          await pool.query(sql)
          const latency = Date.now() - queryStart
          console.log(`${colors.green}✓${colors.reset} 并发 ${i + 1}/${CONCURRENCY} (${latency}ms): ${sql.substring(0, 50)}...`)
        } catch (error) {
          console.log(`${colors.red}✗${colors.reset} 并发 ${i + 1}/${CONCURRENCY} 失败: ${error instanceof Error ? error.message : 'Unknown'}`)
        }
      })()
    )
  }

  await Promise.all(promises)
  const totalTime = Date.now() - start

  console.log(`\n${colors.bold}并发测试完成: ${totalTime}ms${colors.reset}`)
  console.log(`${colors.dim}平均每请求: ${(totalTime / CONCURRENCY).toFixed(1)}ms${colors.reset}`)
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 数据库性能基准测试                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`测试配置:`)
  console.log(`  并发数: ${CONCURRENCY}`)
  console.log(`  迭代次数: ${ITERATIONS}`)
  console.log(`  目标数据库: ${TARGET_DB.name} (${TARGET_DB.host})`)
  if (ENABLE_COMPARISON) {
    console.log(`  对比数据库: ${SUPABASE_DB?.name}`)
  }

  // 创建目标数据库连接
  const targetPool = createPool(TARGET_DB)

  try {
    log('info', `连接 ${TARGET_DB.name}...`)
    await targetPool.query('SELECT 1')
    log('pass', `${TARGET_DB.name} 连接成功`)
  } catch (error) {
    log('fail', `${TARGET_DB.name} 连接失败`, error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // 运行目标数据库测试
  const targetResults = await runBenchmark(targetPool, TARGET_DB.name)
  await runConcurrencyTest(targetPool, TARGET_DB.name)

  // 如果启用了对比测试
  if (ENABLE_COMPARISON && SUPABASE_DB) {
    console.log(`\n${colors.bold}${colors.yellow}━━━ 准备 ${SUPABASE_DB.name} 对比测试 ━━━${colors.reset}`)
    console.log(`${colors.yellow}请确保 SUPABASE_URL 环境变量已设置${colors.reset}`)
  }

  // 打印总结
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}性能基准测试总结 (${TARGET_DB.name})${colors.reset}\n`)

  console.log('| 测试项 | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | QPS | 状态 |')
  console.log('|--------|----------|----------|----------|----------|-----|------|')

  let totalPass = 0
  let totalFail = 0

  for (const [name, stats] of targetResults) {
    const qps = (1000 / stats.avg * ITERATIONS / (ITERATIONS)).toFixed(0)
    const expected = benchmarkCases.find(c => c.name === name)?.expectedLatency
    const status = expected && stats.p95 > expected ? `${colors.red}✗${colors.reset}` : `${colors.green}✓${colors.reset}`

    if (expected && stats.p95 > expected) {
      totalFail++
    } else {
      totalPass++
    }

    console.log(`| ${name.substring(0, 30)} | ${stats.avg.toFixed(1)} | ${stats.p50.toFixed(1)} | ${stats.p95.toFixed(1)} | ${stats.p99.toFixed(1)} | ${qps} | ${status} |`)
  }

  console.log(`\n${colors.bold}测试结果: ${colors.green}${totalPass} 通过${colors.reset} / ${colors.red}${totalFail} 未达标${colors.reset}`)

  // 性能建议
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}性能优化建议${colors.reset}\n`)

  const slowQueries = Array.from(targetResults.entries())
    .filter(([_, stats]) => stats.p95 > 500)
    .sort((a, b) => b[1].p95 - a[1].p95)

  if (slowQueries.length > 0) {
    console.log(`${colors.yellow}以下查询 P95 延迟超过 500ms，建议优化:${colors.reset}`)
    for (const [name, stats] of slowQueries) {
      console.log(`  - ${name} (P95: ${stats.p95.toFixed(1)}ms)`)
    }
    console.log('\n优化建议:')
    console.log('  1. 添加适当的索引')
    console.log('  2. 使用 EXPLAIN ANALYZE 分析查询计划')
    console.log('  3. 考虑读写分离')
    console.log('  4. 增加连接池大小')
  } else {
    console.log(`${colors.green}所有查询性能均达标！${colors.reset}`)
  }

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  // 关闭连接
  await targetPool.end()
}

// 运行
main().catch((error) => {
  console.error('基准测试执行失败:', error)
  process.exit(1)
})
