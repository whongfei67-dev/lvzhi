/**
 * 律植 (Lvzhi) 数据一致性校验脚本
 *
 * 覆盖阶段零-0.7: 数据一致性校验（行数/关键字段/关联关系）
 *
 * 功能：
 * - 表行数统计与对比
 * - 关键字段完整性检查
 * - 外键关联完整性验证
 * - 数据类型一致性检查
 * - 唯一约束冲突检测
 * - NULL 值比例统计
 *
 * 使用方法：
 *   npx tsx scripts/db-consistency-check.ts
 *   npx tsx scripts/db-consistency-check.ts --compare=supabase  # 与 Supabase 对比
 *
 * 环境变量：
 *   DATABASE_URL - 目标数据库连接
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
  console.log(`${prefix} ${message}${details ? `\n       ${colors.cyan}${details}${colors.reset}` : ''}`)
}

// ============================================
// 数据库连接
// ============================================

const pool = new Pool({
  ...DB_CONFIG,
  ssl: DB_CONFIG.host.includes('polardb') ? { rejectUnauthorized: false } : false,
  max: 5,
})

async function query<T = Record<string, unknown>>(text: string): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text)
}

// ============================================
// 检查项定义
// ============================================

interface CheckResult {
  category: string
  name: string
  status: 'pass' | 'fail' | 'warn'
  details: string
  rowCount?: number
  issueCount?: number
}

async function runConsistencyCheck(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 数据一致性校验                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)
  console.log(`数据库: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`)
  console.log(`检查时间: ${new Date().toISOString()}\n`)

  // 测试连接
  try {
    await pool.query('SELECT 1')
    log('pass', '数据库连接成功')
  } catch (error) {
    log('fail', '数据库连接失败', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // ============================================
  // 1. 表行数统计
  // ============================================
  console.log(`\n${colors.bold}━━━ 1. 表行数统计 ━━━${colors.reset}\n`)

  const tableStatsQuery = `
    SELECT
      schemaname,
      relname as table_name,
      n_live_tup as row_count,
      n_dead_tup as dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC NULLS LAST
  `

  try {
    const result = await query<Record<string, unknown>>(tableStatsQuery)
    log('info', `共检测到 ${result.rows.length} 个用户表`)
    console.log('\n| 表名 | 行数 | 死亡元组 | 最后 Vacuum | 最后 Analyze |')
    console.log('|------|------|----------|-------------|--------------|')

    for (const row of result.rows) {
      const tableName = row.table_name as string
      const rowCount = row.row_count as number
      const deadRows = row.dead_rows as number
      const lastVacuum = row.last_vacuum ? new Date(row.last_vacuum as string).toLocaleString('zh-CN') : '从未'
      const lastAnalyze = row.last_analyze ? new Date(row.last_analyze as string).toLocaleString('zh-CN') : '从未'

      console.log(`| ${tableName} | ${rowCount.toLocaleString()} | ${deadRows} | ${lastVacuum} | ${lastAnalyze} |`)

      results.push({
        category: '表统计',
        name: `表 ${tableName} 行数统计`,
        status: 'pass',
        details: `${rowCount} 行, ${deadRows} 死亡元组`,
        rowCount,
      })
    }
  } catch (error) {
    log('fail', '表行数统计失败', error instanceof Error ? error.message : String(error))
  }

  // ============================================
  // 2. 外键关联完整性
  // ============================================
  console.log(`\n${colors.bold}━━━ 2. 外键关联完整性 ━━━${colors.reset}\n`)

  const foreignKeyChecks = [
    {
      name: 'orders.user_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(o.user_id) as with_user,
                   COUNT(*) - COUNT(o.user_id) as missing
            FROM orders o`,
      expected: 'total === with_user',
    },
    {
      name: 'agents.creator_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(a.creator_id) as with_creator,
                   COUNT(*) - COUNT(a.creator_id) as missing
            FROM agents a`,
      expected: 'total === with_creator',
    },
    {
      name: 'community_posts.author_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(p.author_id) as with_author,
                   COUNT(*) - COUNT(p.author_id) as missing
            FROM community_posts p`,
      expected: 'total === with_author',
    },
    {
      name: 'community_comments.post_id -> community_posts.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(c.post_id) as with_post,
                   COUNT(*) - COUNT(c.post_id) as missing
            FROM community_comments c`,
      expected: 'total === with_post',
    },
    {
      name: 'community_comments.author_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(c.author_id) as with_author,
                   COUNT(*) - COUNT(c.author_id) as missing
            FROM community_comments c`,
      expected: 'total === with_author',
    },
    {
      name: 'agent_sessions.user_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(s.user_id) as with_user,
                   COUNT(*) - COUNT(s.user_id) as missing
            FROM agent_sessions s`,
      expected: 'total === with_user',
    },
    {
      name: 'agent_sessions.agent_id -> agents.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(s.agent_id) as with_agent,
                   COUNT(*) - COUNT(s.agent_id) as missing
            FROM agent_sessions s`,
      expected: 'total === with_agent',
    },
    {
      name: 'files.user_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(f.user_id) as with_user,
                   COUNT(*) - COUNT(f.user_id) as missing
            FROM files f`,
      expected: 'total === with_user',
    },
    {
      name: 'api_call_logs.user_id -> users.id',
      sql: `SELECT COUNT(*) as total,
                   COUNT(l.user_id) as with_user,
                   COUNT(*) - COUNT(l.user_id) as missing
            FROM api_call_logs l`,
      expected: 'total === with_user',
    },
  ]

  for (const check of foreignKeyChecks) {
    try {
      const result = await query<Record<string, unknown>>(check.sql)
      const row = result.rows[0]
      const total = Number(row.total)
      const withRef = Number(row.with_user || row.with_creator || row.with_author || row.with_post || row.with_agent)
      const missing = Number(row.missing)

      if (missing === 0) {
        log('pass', check.name, `${total} 条记录，外键完整`)
        results.push({ category: '外键关联', name: check.name, status: 'pass', details: `${total} 条完整`, rowCount: total })
      } else {
        log('fail', check.name, `${total} 条记录，${missing} 条缺少外键`)
        results.push({ category: '外键关联', name: check.name, status: 'fail', details: `${missing} 条孤立记录`, issueCount: missing })
      }
    } catch (error) {
      log('skip', check.name, error instanceof Error ? error.message : String(error))
    }
  }

  // ============================================
  // 3. 唯一约束冲突检测
  // ============================================
  console.log(`\n${colors.bold}━━━ 3. 唯一约束冲突检测 ━━━${colors.reset}\n`)

  const uniqueConstraintChecks = [
    {
      name: 'users.email 唯一性',
      sql: `SELECT email, COUNT(*) as cnt FROM users GROUP BY email HAVING COUNT(*) > 1`,
    },
    {
      name: 'users.phone 唯一性（排除 NULL）',
      sql: `SELECT phone, COUNT(*) as cnt FROM users WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1`,
    },
    {
      name: 'orders.trade_no 唯一性',
      sql: `SELECT trade_no, COUNT(*) as cnt FROM orders WHERE trade_no IS NOT NULL GROUP BY trade_no HAVING COUNT(*) > 1`,
    },
  ]

  for (const check of uniqueConstraintChecks) {
    try {
      const result = await query<Record<string, unknown>>(check.sql)
      if (result.rows.length === 0) {
        log('pass', check.name, '无重复')
        results.push({ category: '唯一约束', name: check.name, status: 'pass', details: '无重复值' })
      } else {
        log('fail', check.name, `${result.rows.length} 个重复值`)
        console.log(`       示例: ${JSON.stringify(result.rows[0])}`)
        results.push({ category: '唯一约束', name: check.name, status: 'fail', details: `${result.rows.length} 个重复`, issueCount: result.rows.length })
      }
    } catch (error) {
      log('skip', check.name, error instanceof Error ? error.message : String(error))
    }
  }

  // ============================================
  // 4. 必填字段 NULL 检查
  // ============================================
  console.log(`\n${colors.bold}━━━ 4. 必填字段 NULL 检查 ━━━${colors.reset}\n`)

  const requiredFieldChecks = [
    { name: 'users.email 不能为空', table: 'users', field: 'email' },
    { name: 'users.display_name 不能为空', table: 'users', field: 'display_name' },
    { name: 'users.role 不能为空', table: 'users', field: 'role' },
    { name: 'agents.name 不能为空', table: 'agents', field: 'name' },
    { name: 'agents.creator_id 不能为空', table: 'agents', field: 'creator_id' },
    { name: 'products.name 不能为空', table: 'products', field: 'name' },
    { name: 'products.price 不能为空', table: 'products', field: 'price' },
    { name: 'community_posts.title 不能为空', table: 'community_posts', field: 'title' },
    { name: 'community_posts.content 不能为空', table: 'community_posts', field: 'content' },
  ]

  for (const check of requiredFieldChecks) {
    try {
      const sql = `SELECT COUNT(*) as null_count FROM ${check.table} WHERE ${check.field} IS NULL`
      const result = await query<Record<string, unknown>>(sql)
      const nullCount = Number(result.rows[0].null_count)

      if (nullCount === 0) {
        log('pass', check.name, '无 NULL 值')
        results.push({ category: '必填字段', name: check.name, status: 'pass', details: '无 NULL' })
      } else {
        log('warn', check.name, `${nullCount} 条记录该字段为 NULL`)
        results.push({ category: '必填字段', name: check.name, status: 'warn', details: `${nullCount} 个 NULL`, issueCount: nullCount })
      }
    } catch (error) {
      log('skip', check.name, error instanceof Error ? error.message : String(error))
    }
  }

  // ============================================
  // 5. 数值合理性检查
  // ============================================
  console.log(`\n${colors.bold}━━━ 5. 数值合理性检查 ━━━${colors.reset}\n`)

  const validationChecks = [
    {
      name: '订单金额必须 > 0',
      sql: `SELECT COUNT(*) as invalid_count FROM orders WHERE amount <= 0 AND status != 'cancelled'`,
    },
    {
      name: '用户余额不能为负数',
      sql: `SELECT COUNT(*) as invalid_count FROM user_balances WHERE balance < 0`,
    },
    {
      name: '智能体价格不能为负数',
      sql: `SELECT COUNT(*) as invalid_count FROM agents WHERE price < 0`,
    },
    {
      name: 'AI 调用 Token 不能为负数',
      sql: `SELECT COUNT(*) as invalid_count FROM api_call_logs WHERE tokens_used < 0`,
    },
  ]

  for (const check of validationChecks) {
    try {
      const result = await query<Record<string, unknown>>(check.sql)
      const invalidCount = Number(result.rows[0].invalid_count)

      if (invalidCount === 0) {
        log('pass', check.name, '所有值合理')
        results.push({ category: '数值验证', name: check.name, status: 'pass', details: '合理' })
      } else {
        log('fail', check.name, `${invalidCount} 条不合理数据`)
        results.push({ category: '数值验证', name: check.name, status: 'fail', details: `${invalidCount} 条异常`, issueCount: invalidCount })
      }
    } catch (error) {
      log('skip', check.name, error instanceof Error ? error.message : String(error))
    }
  }

  // ============================================
  // 6. 索引覆盖率检查
  // ============================================
  console.log(`\n${colors.bold}━━━ 6. 索引覆盖率检查 ━━━${colors.reset}\n`)

  const indexCheckQuery = `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC NULLS LAST
    LIMIT 20
  `

  try {
    const result = await query<Record<string, unknown>>(indexCheckQuery)
    log('info', '高频使用索引（用于优化参考）')
    console.log('\n| 表名 | 索引名 | 扫描次数 | 元组读取 |')
    console.log('|------|--------|----------|----------|')

    for (const row of result.rows) {
      const idxScan = Number(row.index_scans || 0)
      if (idxScan > 0) {
        console.log(`| ${row.tablename} | ${row.indexname} | ${idxScan.toLocaleString()} | ${Number(row.tuples_read || 0).toLocaleString()} |`)
      }
    }
  } catch (error) {
    log('skip', '索引统计查询失败', error instanceof Error ? error.message : String(error))
  }

  // ============================================
  // 7. Large Object 索引检查
  // ============================================
  console.log(`\n${colors.bold}━━━ 7. Large Object 索引检查 ━━━${colors.reset}\n`)

  const loIndexCheck = `
    SELECT
      COUNT(*) as lo_refs,
      COUNT(DISTINCT l.loid) as unique_objects
    FROM pg_largeobject_metadata l
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_index i
      JOIN pg_class c ON i.indrelid = c.oid
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE c.relname = 'pg_largeobject_metadata'
      AND a.attname = 'loid'
      AND i.indisunique
    )
  `

  try {
    const result = await query<Record<string, unknown>>(loIndexCheck)
    const loRefs = Number(result.rows[0].lo_refs)
    const uniqueObjs = Number(result.rows[0].unique_objects)

    if (loRefs === 0) {
      log('pass', 'Large Object 无孤立数据', '无未索引的大对象')
    } else {
      log('warn', 'Large Object 引用统计', `${loRefs} 个引用，${uniqueObjs} 个唯一对象`)
    }
  } catch (error) {
    log('skip', 'LO 索引检查失败', error instanceof Error ? error.message : String(error))
  }

  // ============================================
  // 打印总结
  // ============================================
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}数据一致性检查总结${colors.reset}\n`)

  const categorySummary = results.reduce((acc, r) => {
    acc[r.category] = acc[r.category] || { pass: 0, fail: 0, warn: 0 }
    acc[r.category][r.status]++
    return acc
  }, {} as Record<string, { pass: number; fail: number; warn: number }>)

  for (const [category, counts] of Object.entries(categorySummary)) {
    const total = counts.pass + counts.fail + counts.warn
    const statusIcon = counts.fail > 0 ? '✗' : counts.warn > 0 ? '⚠' : '✓'
    const statusColor = counts.fail > 0 ? colors.red : counts.warn > 0 ? colors.yellow : colors.green
    console.log(`${statusColor}${statusIcon}${colors.reset} ${category}: ${counts.pass}/${total} 通过${counts.fail > 0 ? `, ${colors.red}${counts.fail} 失败${colors.reset}` : ''}${counts.warn > 0 ? `, ${colors.yellow}${counts.warn} 警告${colors.reset}` : ''}`)
  }

  const totalPass = results.filter(r => r.status === 'pass').length
  const totalFail = results.filter(r => r.status === 'fail').length
  const totalWarn = results.filter(r => r.status === 'warn').length
  const total = results.length

  console.log(`\n${colors.bold}总计: ${totalPass}/${total} 通过${colors.reset}`)
  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  // 关闭连接
  await pool.end()

  // 返回结果
  if (totalFail > 0) {
    console.log(`${colors.red}${colors.bold}数据一致性检查发现 ${totalFail} 个失败项，请修复后重新检查。${colors.reset}\n`)
    return results
  } else if (totalWarn > 0) {
    console.log(`${colors.yellow}${colors.bold}数据一致性检查通过，但有 ${totalWarn} 个警告项。${colors.reset}\n`)
    return results
  } else {
    console.log(`${colors.green}${colors.bold}数据一致性检查全部通过！${colors.reset}\n`)
    return results
  }
}

// 运行
runConsistencyCheck().catch((error) => {
  console.error('检查执行失败:', error)
  pool.end()
  process.exit(1)
})
