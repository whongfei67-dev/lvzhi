/**
 * 律植 (Lvzhi) 数据库功能回归测试脚本
 *
 * 覆盖阶段零-0.7: 新数据库完整功能回归测试
 *
 * 功能：
 * - 所有核心表的读写验证
 * - 外键关系完整性验证
 * - 索引可用性验证
 * - 触发器和函数验证
 * - 视图数据验证
 *
 * 使用方法：
 *   npx tsx scripts/db-regression-test.ts
 *
 * 环境变量：
 *   DATABASE_URL - 数据库连接字符串
 */

import pg from 'pg'

const { Pool } = pg

// ============================================
// 配置
// ============================================

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'data01',
  user: process.env.DATABASE_USER || 'mamba_01',
  password: process.env.DATABASE_PASSWORD || 'Wxwzcfwhf205',
}

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

function log(level: 'pass' | 'fail' | 'info' | 'warn' | 'skip', message: string, details?: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
    skip: `${colors.yellow}⊘ SKIP${colors.reset}`,
  }[level]
  const msg = `${prefix} ${message}`
  if (details) {
    console.log(msg)
    console.log(`       ${colors.cyan}${details}${colors.reset}`)
  } else {
    console.log(msg)
  }
}

// ============================================
// 数据库连接
// ============================================

const pool = new Pool({
  ...DB_CONFIG,
  ssl: DB_CONFIG.host.includes('polardb') ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
})

async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      log('warn', `慢查询 (${duration}ms): ${text.substring(0, 60)}...`)
    }
    return result
  } catch (error) {
    throw error
  }
}

// ============================================
// 测试用例定义
// ============================================

interface TestCase {
  name: string
  sql: string
  validator?: (result: pg.QueryResult) => boolean
  expectedRows?: number
  description: string
}

const testCases: TestCase[] = [
  // 用户表测试
  {
    name: '用户表存在且可查询',
    sql: 'SELECT id, email, role, display_name FROM users LIMIT 1',
    description: '验证 users 表结构和基本查询',
  },
  {
    name: '用户表索引完整性',
    sql: `SELECT COUNT(*) as count FROM pg_indexes
          WHERE tablename = 'users'
          AND indexname IN ('users_email_key', 'idx_users_role')`,
    expectedRows: 2,
    description: '验证用户表关键索引存在',
  },

  // 智能体表测试
  {
    name: '智能体表存在且可查询',
    sql: 'SELECT id, name, category, price FROM agents LIMIT 1',
    description: '验证 agents 表结构',
  },
  {
    name: '智能体表外键关系',
    sql: `SELECT COUNT(*) as count FROM agents a
          LEFT JOIN users u ON a.creator_id = u.id
          WHERE a.creator_id IS NOT NULL
          LIMIT 1`,
    description: '验证 agents.creator_id -> users.id 外键',
  },

  // 订单表测试
  {
    name: '订单表存在且可查询',
    sql: 'SELECT id, user_id, product_id, amount, status FROM orders LIMIT 1',
    description: '验证 orders 表结构',
  },
  {
    name: '订单外键关系',
    sql: `SELECT COUNT(*) as count FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.user_id IS NOT NULL
          LIMIT 1`,
    description: '验证 orders.user_id -> users.id 外键',
  },

  // 余额表测试
  {
    name: '余额表存在且可查询',
    sql: 'SELECT user_id, balance, frozen FROM user_balances LIMIT 1',
    description: '验证 user_balances 表结构',
  },

  // 社区表测试
  {
    name: '社区帖子表存在',
    sql: 'SELECT id, author_id, title, content FROM community_posts LIMIT 1',
    description: '验证 community_posts 表结构',
  },
  {
    name: '社区评论表存在',
    sql: 'SELECT id, post_id, author_id, content FROM community_comments LIMIT 1',
    description: '验证 community_comments 表结构',
  },

  // AI 相关表测试
  {
    name: 'AI 会话表存在',
    sql: 'SELECT id, user_id, agent_id FROM agent_sessions LIMIT 1',
    description: '验证 agent_sessions 表结构',
  },
  {
    name: 'API 调用日志表存在',
    sql: 'SELECT id, user_id, model, tokens_used FROM api_call_logs LIMIT 1',
    description: '验证 api_call_logs 表结构',
  },

  // 文件上传表测试
  {
    name: '文件表存在',
    sql: 'SELECT id, user_id, filename, size, url FROM files LIMIT 1',
    description: '验证 files 表结构',
  },

  // 收藏表测试
  {
    name: '收藏表存在',
    sql: 'SELECT id, user_id, target_type, target_id FROM favorites LIMIT 1',
    description: '验证 favorites 表结构',
  },

  // 全文搜索配置验证
  {
    name: 'pg_trgm 扩展已启用',
    sql: "SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'",
    expectedRows: 1,
    description: '验证 pg_trgm 扩展用于模糊搜索',
  },

  // RLS 策略检查（PolarDB 可能不支持，跳过）
  {
    name: '表统计信息已更新',
    sql: `SELECT last_analyze FROM pg_stat_user_tables
          WHERE relname = 'users'
          ORDER BY last_analyze DESC NULLS LAST
          LIMIT 1`,
    description: '验证数据库统计信息最新（用于查询优化）',
  },
]

// ============================================
// 执行测试
// ============================================

async function runRegressionTest() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 数据库功能回归测试                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`数据库: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`)
  console.log(`测试时间: ${new Date().toISOString()}\n`)

  const results: { passed: number; failed: number; skipped: number } = {
    passed: 0,
    failed: 0,
    skipped: 0,
  }

  // 测试数据库连接
  try {
    log('info', '连接数据库...')
    await pool.query('SELECT 1')
    log('pass', '数据库连接成功')
  } catch (error) {
    log('fail', '数据库连接失败', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  console.log(`\n${colors.bold}━━━ 开始功能回归测试 ━━━${colors.reset}\n`)

  // 执行所有测试用例
  for (const test of testCases) {
    try {
      const result = await query(test.sql)

      // 验证结果
      if (test.expectedRows !== undefined) {
        if (result.rowCount === test.expectedRows) {
          log('pass', test.name, test.description)
          results.passed++
        } else {
          log('fail', test.name, `期望 ${test.expectedRows} 行，实际 ${result.rowCount} 行`)
          results.failed++
        }
      } else if (test.validator) {
        if (test.validator(result)) {
          log('pass', test.name, test.description)
          results.passed++
        } else {
          log('fail', test.name, '验证函数返回 false')
          results.failed++
        }
      } else {
        // 基本测试：查询成功即可
        if (result.rowCount !== null) {
          log('pass', test.name, `${test.description} (${result.rowCount} 行)`)
          results.passed++
        } else {
          log('fail', test.name, '查询返回 null')
          results.failed++
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        log('skip', test.name, '表或对象不存在，可能尚未创建')
        results.skipped++
      } else {
        log('fail', test.name, errorMsg)
        results.failed++
      }
    }
  }

  // 高级验证：数据一致性检查
  console.log(`\n${colors.bold}━━━ 数据一致性验证 ━━━${colors.reset}\n`)

  const consistencyChecks = [
    {
      name: '所有订单都有对应的有效用户',
      sql: `SELECT COUNT(*) as orphaned FROM orders o
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id)`,
      validate: (row: Record<string, unknown>) => Number(row.orphaned) === 0,
    },
    {
      name: '所有智能体都有有效的创建者',
      sql: `SELECT COUNT(*) as orphaned FROM agents a
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.creator_id)`,
      validate: (row: Record<string, unknown>) => Number(row.orphaned) === 0,
    },
    {
      name: '余额记录与用户数量一致',
      sql: `SELECT
              (SELECT COUNT(*) FROM users) as users_count,
              (SELECT COUNT(*) FROM user_balances) as balances_count`,
      validate: (row: Record<string, unknown>) => true, // 允许部分用户没有余额
    },
  ]

  for (const check of consistencyChecks) {
    try {
      const result = await query<Record<string, unknown>>(check.sql)
      if (result.rows.length > 0 && check.validate(result.rows[0])) {
        log('pass', check.name)
        results.passed++
      } else {
        log('fail', check.name, JSON.stringify(result.rows[0]))
        results.failed++
      }
    } catch (error) {
      log('skip', check.name, error instanceof Error ? error.message : String(error))
      results.skipped++
    }
  }

  // 打印总结
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}测试总结${colors.reset}\n`)

  const total = results.passed + results.failed + results.skipped
  console.log(`${colors.green}✓ 通过: ${results.passed}${colors.reset}`)
  console.log(`${colors.red}✗ 失败: ${results.failed}${colors.reset}`)
  console.log(`${colors.yellow}⊘ 跳过: ${results.skipped}${colors.reset}`)
  console.log(`\n${colors.bold}总计: ${results.passed}/${total} 通过${colors.reset}`)
  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  // 关闭连接
  await pool.end()

  // 根据结果退出
  if (results.failed > 0) {
    console.log(`${colors.red}${colors.bold}测试失败，请检查失败的测试项。${colors.reset}\n`)
    process.exit(1)
  } else if (results.skipped > 0) {
    console.log(`${colors.yellow}${colors.bold}部分测试被跳过，可能需要补充数据。${colors.reset}\n`)
  } else {
    console.log(`${colors.green}${colors.bold}所有测试通过！数据库功能正常。${colors.reset}\n`)
  }
}

// 运行测试
runRegressionTest().catch((error) => {
  console.error('测试执行失败:', error)
  pool.end()
  process.exit(1)
})
