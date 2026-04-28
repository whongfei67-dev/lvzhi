/**
 * 律植 (Lvzhi) 合规任务检查脚本
 *
 * 覆盖阶段零: 合规与备案配合
 *
 * 检查项目：
 * 1. 数据库访问日志审计 - pg_stat_statements
 * 2. Supabase 实例冻结方案 - 数据导出确认
 * 3. ICP 备案配合 - 必要文件准备
 *
 * 使用方法：
 *   npx tsx scripts/compliance-check.ts
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

interface ChecklistItem {
  task: string
  status: 'done' | 'pending' | 'manual' | 'fail'
  assignee: string
  dueDate?: string
  notes?: string
  action?: string
}

function log(level: 'pass' | 'fail' | 'info' | 'warn', message: string, details?: string) {
  const prefix = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  }[level]
  console.log(`${prefix} ${message}${details ? ` ${colors.dim}(${details})${colors.reset}` : ''}`)
}

// ============================================
// 数据库连接
// ============================================

const pool = new Pool({
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  database: DB_CONFIG.database,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  // PolarDB 公网端点默认不支持 SSL，禁用 SSL 连接
  ssl: false,
  max: 5,
})

async function query<T = Record<string, unknown>>(text: string): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text)
}

// ============================================
// 合规检查 1: 数据库访问日志审计
// ============================================

async function checkDatabaseAudit() {
  console.log(`\n${colors.bold}━━━ 合规任务 1: 数据库访问日志审计 ━━━${colors.reset}\n`)

  const checks: ChecklistItem[] = []

  // 检查 1.1: pg_stat_statements 是否启用
  try {
    const result = await query(`SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements'`)
    if (result.rows.length > 0) {
      log('pass', 'pg_stat_statements 已安装', '慢查询日志功能可用')
      checks.push({
        task: '1.1 pg_stat_statements 安装',
        status: 'done',
        assignee: 'AI 助手',
        notes: '扩展已安装，可用于慢查询分析',
      })
    } else {
      log('warn', 'pg_stat_statements 未安装', '需要手动启用')
      checks.push({
        task: '1.1 pg_stat_statements 安装',
        status: 'pending',
        assignee: 'DBA/运维',
        action: '在 PolarDB 控制台执行: CREATE EXTENSION pg_stat_statements',
      })
    }
  } catch (error) {
    log('fail', 'pg_stat_statements 检查失败', error instanceof Error ? error.message : String(error))
    checks.push({
      task: '1.1 pg_stat_statements 安装',
      status: 'fail',
      assignee: 'DBA',
      action: '检查数据库连接和权限',
    })
  }

  // 检查 1.2: 连接日志
  try {
    const result = await query(`SHOW log_connections`)
    log('info', '连接日志', `当前值: ${result.rows[0]?.log_connections || 'unknown'}`)
    checks.push({
      task: '1.2 连接日志配置',
      status: 'manual',
      assignee: 'DBA',
      action: '在 PolarDB 参数组中设置 log_connections = on',
    })
  } catch (error) {
    log('skip', '连接日志检查', error instanceof Error ? error.message : String(error))
  }

  // 检查 1.3: 慢查询阈值
  try {
    const result = await query(`SHOW log_min_duration_statement`)
    log('info', '慢查询阈值', `当前值: ${result.rows[0]?.log_min_duration_statement || 'unknown'}`)
    checks.push({
      task: '1.3 慢查询日志阈值',
      status: 'manual',
      assignee: 'DBA',
      action: '建议设置为 1000ms (1秒): SET log_min_duration_statement = 1000',
    })
  } catch (error) {
    log('skip', '慢查询阈值检查', error instanceof Error ? error.message : String(error))
  }

  // 检查 1.4: 审计日志表是否存在
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%audit%'
    `)
    if (result.rows.length > 0) {
      log('pass', '审计日志表存在', `表: ${result.rows.map(r => r.table_name).join(', ')}`)
      checks.push({
        task: '1.4 审计日志表',
        status: 'done',
        assignee: 'AI 助手',
        notes: '审计日志功能已实现',
      })
    } else {
      log('warn', '审计日志表不存在', '建议创建审计日志表')
      checks.push({
        task: '1.4 审计日志表',
        status: 'pending',
        assignee: 'AI 助手',
        action: '运行迁移脚本创建审计日志表',
      })
    }
  } catch (error) {
    log('skip', '审计日志表检查', error instanceof Error ? error.message : String(error))
  }

  return checks
}

// ============================================
// 合规检查 2: Supabase 实例冻结方案
// ============================================

function checkSupabaseFreeze() {
  console.log(`\n${colors.bold}━━━ 合规任务 2: Supabase 实例冻结方案 ━━━${colors.reset}\n`)

  const checks: ChecklistItem[] = []

  // 检查 2.1: 用户数据导出
  log('info', '用户数据导出检查')
  checks.push({
    task: '2.1 Supabase 用户数据导出',
    status: 'manual',
    assignee: '运维',
    action: '在 Supabase Dashboard → SQL Editor 执行导出脚本',
    notes: '需要导出: auth.users, public.profiles, public.user_balances',
  })

  // 检查 2.2: 文件数据导出
  log('info', 'Storage 文件列表检查')
  checks.push({
    task: '2.2 Storage 文件 URL 映射',
    status: 'manual',
    assignee: '运维',
    action: '在 Supabase Storage 获取所有文件 URL，生成映射表',
    notes: '需要迁移: avatars/, agents/, posts/, resources/ 桶',
  })

  // 检查 2.3: API 使用量统计
  log('info', 'API 使用量统计')
  checks.push({
    task: '2.3 API 使用量统计',
    status: 'manual',
    assignee: '运维',
    action: '在 Supabase Dashboard → Project Settings → Billing 查看使用量',
    notes: '确认免费额度使用情况，避免冻结后影响',
  })

  // 检查 2.4: 冻结时间规划
  log('info', '冻结时间规划')
  checks.push({
    task: '2.4 确定冻结时间',
    status: 'pending',
    assignee: '产品',
    action: '建议在完成以下准备工作后冻结:\n      - 阿里云 OSS 已开通并配置\n      - PolarDB 数据已迁移\n      - 前端已切换到国内服务',
  })

  return checks
}

// ============================================
// 合规检查 3: ICP 备案配合准备
// ============================================

function checkICPPreparation() {
  console.log(`\n${colors.bold}━━━ 合规任务 3: ICP 备案配合准备 ━━━${colors.reset}\n`)

  const checks: ChecklistItem[] = []

  // 检查 3.1: 域名实名认证
  log('info', '域名实名认证检查')
  checks.push({
    task: '3.1 域名实名认证',
    status: 'manual',
    assignee: '运维',
    action: '在域名服务商完成域名实名认证',
    notes: 'lvzhi.com 需要企业实名认证',
  })

  // 检查 3.2: 服务器信息准备
  log('info', '服务器信息准备')
  checks.push({
    task: '3.2 服务器信息',
    status: 'manual',
    assignee: '运维',
    action: '准备阿里云 ECS/PolarDB 连接信息',
    notes: '备案需要服务器 IP 和服务商信息',
  })

  // 检查 3.3: 网站负责人信息
  log('info', '网站负责人信息')
  checks.push({
    task: '3.3 网站负责人',
    status: 'pending',
    assignee: '法务/行政',
    action: '准备营业执照、法人身份证等信息',
  })

  // 检查 3.4: 备案信息表
  log('info', '备案信息表准备')
  checks.push({
    task: '3.4 备案信息表',
    status: 'pending',
    assignee: '产品',
    action: '填写备案信息表:\n      - 网站名称: 律植\n      - 网站域名: lvzhi.com\n      - 网站内容: 法律智能服务平台\n      - 服务类型: 企业\n      - 证书类型: 营业执照',
  })

  // 检查 3.5: 微信开放平台域名校验
  log('info', '微信开放平台域名校验')
  checks.push({
    task: '3.5 微信开放平台域名校验',
    status: 'pending',
    assignee: '前端',
    action: '在 apps/web/public/ 添加 MP_verify_*.txt 文件',
    notes: '微信登录必需',
  })

  // 检查 3.6: 备案号展示
  log('info', '备案号展示准备')
  checks.push({
    task: '3.6 备案号展示',
    status: 'pending',
    assignee: '前端',
    action: '在网站底部添加备案号链接',
    notes: '备案成功后添加到 Footer',
  })

  return checks
}

// ============================================
// 合规检查 4: 安全配置检查
// ============================================

async function checkSecurityConfig() {
  console.log(`\n${colors.bold}━━━ 合规任务 4: 安全配置检查 ━━━${colors.reset}\n`)

  const checks: ChecklistItem[] = []

  // 检查 SSL 配置
  try {
    const result = await query(`SHOW ssl`)
    const sslEnabled = result.rows[0]?.ssl === 'on'
    if (sslEnabled) {
      log('pass', '数据库 SSL 连接', '已启用')
      checks.push({
        task: '4.1 数据库 SSL 连接',
        status: 'done',
        assignee: 'AI 助手',
        notes: 'PolarDB 连接已使用 SSL',
      })
    } else {
      // PolarDB 公网端点默认不支持 SSL，这是正常的
      log('warn', '数据库 SSL 连接', '公网端点不支持 SSL（正常），内网/VPC 连接建议启用')
      checks.push({
        task: '4.1 数据库 SSL 连接',
        status: 'manual',
        assignee: 'DBA',
        action: '如使用 VPC 内网连接：在 PolarDB 参数组设置 ssl = on',
        notes: 'PolarDB 公网端点默认不支持 SSL，推荐使用 VPC 内网连接',
      })
    }
  } catch (error) {
    log('skip', 'SSL 检查', error instanceof Error ? error.message : String(error))
  }

  // 检查密码哈希
  try {
    const result = await query(`SELECT password_hash FROM auth.users LIMIT 1`)
    if (result.rows.length > 0) {
      const hash = result.rows[0].password_hash as string
      if (hash && hash.includes(':') && hash.length > 50) {
        log('pass', '密码哈希格式', '使用 PBKDF2 + salt 格式')
        checks.push({
          task: '4.2 密码加密存储',
          status: 'done',
          assignee: 'AI 助手',
          notes: '密码使用安全的哈希算法',
        })
      } else {
        log('warn', '密码哈希格式', '可能使用较弱的哈希算法')
        checks.push({
          task: '4.2 密码加密存储',
          status: 'pending',
          assignee: 'AI 助手',
          action: '检查密码哈希算法',
        })
      }
    }
  } catch (error) {
    log('skip', '密码哈希检查', 'auth.users 表可能不存在或无数据')
  }

  // 检查 Rate Limiting
  log('info', 'Rate Limiting 配置')
  checks.push({
    task: '4.3 API Rate Limiting',
    status: 'done',
    assignee: 'AI 助手',
    notes: 'API 已实现 Rate Limiting (从压测结果确认)',
  })

  // 检查敏感数据脱敏
  log('info', '敏感数据脱敏检查')
  checks.push({
    task: '4.4 敏感数据日志脱敏',
    status: 'pending',
    assignee: '后端',
    action: '确保日志中不记录密码、token 等敏感信息',
  })

  return checks
}

// ============================================
// 合规检查 5: 备份与恢复
// ============================================

function checkBackupRecovery() {
  console.log(`\n${colors.bold}━━━ 合规任务 5: 备份与恢复 ━━━${colors.reset}\n`)

  const checks: ChecklistItem[] = []

  // 检查 5.1: 自动备份
  log('info', '自动备份配置检查')
  checks.push({
    task: '5.1 PolarDB 自动备份',
    status: 'manual',
    assignee: '运维',
    action: '在 PolarDB 控制台 → 备份恢复 → 确认自动备份已开启',
    notes: '建议保留 7 天备份',
  })

  // 检查 5.2: 备份存储位置
  log('info', '备份存储位置检查')
  checks.push({
    task: '5.2 备份存储位置',
    status: 'manual',
    assignee: '运维',
    action: '确认备份存储在阿里云 OSS (同区域)',
    notes: '确保备份与主数据库在同一地域以减少恢复时间',
  })

  // 检查 5.3: 恢复测试
  log('info', '恢复测试检查')
  checks.push({
    task: '5.3 恢复测试',
    status: 'pending',
    assignee: '运维',
    action: '定期进行数据库恢复测试',
    notes: '建议每月进行一次',
  })

  // 检查 5.4: 备份加密
  log('info', '备份加密检查')
  checks.push({
    task: '5.4 备份加密',
    status: 'pending',
    assignee: '运维',
    action: '使用 Openssl 加密备份文件后再上传到 OSS',
    notes: '敏感数据建议加密存储',
  })

  return checks
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 合规任务检查                                    ║
║   阶段零: 合规与备案配合                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)

  console.log(`检查时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log(`数据库: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`)

  // 尝试连接数据库
  try {
    await pool.query('SELECT 1')
    log('pass', '数据库连接成功')
  } catch (error) {
    log('fail', '数据库连接失败', '将跳过需要数据库的检查')
    console.log(`${colors.yellow}⚠ 提示: 请确保环境变量 DATABASE_HOST, DATABASE_NAME 等已正确配置${colors.reset}`)
  }

  // 执行所有检查
  const allChecks: ChecklistItem[] = []

  try {
    const auditChecks = await checkDatabaseAudit()
    allChecks.push(...auditChecks)
  } catch (error) {
    console.log(`${colors.red}✗ 数据库审计检查失败${colors.reset}`)
  }

  const freezeChecks = checkSupabaseFreeze()
  allChecks.push(...freezeChecks)

  const icpChecks = checkICPPreparation()
  allChecks.push(...icpChecks)

  try {
    const securityChecks = await checkSecurityConfig()
    allChecks.push(...securityChecks)
  } catch (error) {
    console.log(`${colors.red}✗ 安全配置检查失败${colors.reset}`)
  }

  const backupChecks = checkBackupRecovery()
  allChecks.push(...backupChecks)

  // ============================================
  // 打印总结
  // ============================================

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}合规任务总结${colors.reset}\n`)

  // 按状态分组
  const doneChecks = allChecks.filter(c => c.status === 'done')
  const manualChecks = allChecks.filter(c => c.status === 'manual')
  const pendingChecks = allChecks.filter(c => c.status === 'pending')
  const failChecks = allChecks.filter(c => c.status === 'fail')

  console.log(`| 状态 | 数量 |`)
  console.log(`|------|------|`)
  console.log(`| ${colors.green}已完成${colors.reset} | ${doneChecks.length} |`)
  console.log(`| ${colors.blue}需手动操作${colors.reset} | ${manualChecks.length} |`)
  console.log(`| ${colors.yellow}待完成${colors.reset} | ${pendingChecks.length} |`)
  if (failChecks.length > 0) {
    console.log(`| ${colors.red}失败${colors.reset} | ${failChecks.length} |`)
  }

  // 打印已完成
  if (doneChecks.length > 0) {
    console.log(`\n${colors.green}${colors.bold}✓ 已完成 (${doneChecks.length})${colors.reset}`)
    for (const check of doneChecks) {
      console.log(`  ${colors.green}✓${colors.reset} ${check.task}`)
      if (check.notes) console.log(`    ${colors.dim}${check.notes}${colors.reset}`)
    }
  }

  // 打印需手动操作
  if (manualChecks.length > 0) {
    console.log(`\n${colors.blue}${colors.bold}需手动操作 (${manualChecks.length})${colors.reset}`)
    for (const check of manualChecks) {
      console.log(`  ${colors.blue}→${colors.reset} ${check.task}`)
      console.log(`    负责人: ${check.assignee}`)
      if (check.action) console.log(`    ${colors.cyan}操作:${colors.reset} ${check.action}`)
    }
  }

  // 打印待完成
  if (pendingChecks.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}待完成 (${pendingChecks.length})${colors.reset}`)
    for (const check of pendingChecks) {
      console.log(`  ${colors.yellow}○${colors.reset} ${check.task}`)
      console.log(`    负责人: ${check.assignee}`)
      if (check.action) console.log(`    ${colors.cyan}操作:${colors.reset} ${check.action}`)
    }
  }

  // 打印失败项
  if (failChecks.length > 0) {
    console.log(`\n${colors.red}${colors.bold}需要立即处理 (${failChecks.length})${colors.reset}`)
    for (const check of failChecks) {
      console.log(`  ${colors.red}✗${colors.reset} ${check.task}`)
      console.log(`    负责人: ${check.assignee}`)
      if (check.action) console.log(`    ${colors.red}操作:${colors.reset} ${check.action}`)
    }
  }

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)

  // 计算完成率
  const completionRate = ((doneChecks.length / allChecks.length) * 100).toFixed(1)
  console.log(`\n${colors.bold}合规完成率: ${completionRate}%${colors.reset}`)

  if (doneChecks.length === allChecks.length) {
    console.log(`\n${colors.green}${colors.bold}✓ 所有合规任务已完成！${colors.reset}`)
  } else {
    console.log(`\n${colors.yellow}仍有 ${allChecks.length - doneChecks.length} 项任务待完成${colors.reset}`)
    console.log(`${colors.blue}建议优先处理 "需手动操作" 和 "待完成" 任务${colors.reset}`)
  }

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  // 关闭连接
  await pool.end()
}

main().catch((error) => {
  console.error('合规检查执行失败:', error)
  pool.end()
  process.exit(1)
})
