/**
 * 用户数据迁移脚本
 * 
 * 功能：从 Supabase Auth 迁移用户数据到新的 Auth 系统
 * 
 * 使用方法：
 *   1. 复制到 scripts 目录
 *   2. 配置环境变量
 *   3. 运行: node migrate-users.ts
 */

import pg from 'pg'

const { Pool } = pg

// ============================================
// 配置
// ============================================

const config = {
  // 源数据库 (Supabase)
  source: {
    host: process.env.SUPABASE_DB_HOST || 'db.xxx.supabase.co',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || '',
  },
  // 目标数据库 (阿里云 PolarDB)
  target: {
    host: process.env.TARGET_DB_HOST || 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
    port: parseInt(process.env.TARGET_DB_PORT || '5432'),
    database: process.env.TARGET_DB_NAME || 'data01',
    user: process.env.TARGET_DB_USER || 'mamba_01',
    password: process.env.TARGET_DB_PASSWORD || '',
    ssl: true,
  },
  // 映射表 (Supabase user ID → 新 user ID)
  mappingTable: 'user_id_mapping',
}

// ============================================
// 数据库连接
// ============================================

const sourcePool = new Pool({
  host: config.source.host,
  port: config.source.port,
  database: config.source.database,
  user: config.source.user,
  password: config.source.password,
  ssl: { rejectUnauthorized: false },
})

const targetPool = new Pool({
  host: config.target.host,
  port: config.target.port,
  database: config.target.database,
  user: config.target.user,
  password: config.target.password,
  ssl: config.target.ssl ? { rejectUnauthorized: false } : false,
})

// ============================================
// 迁移函数
// ============================================

/**
 * 创建映射表
 */
async function createMappingTable() {
  console.log('📋 创建用户 ID 映射表...')
  
  await targetPool.query(`
    CREATE TABLE IF NOT EXISTS ${config.mappingTable} (
      id SERIAL PRIMARY KEY,
      old_user_id UUID NOT NULL,
      new_user_id UUID NOT NULL,
      migrated_at TIMESTAMP DEFAULT NOW(),
      email TEXT,
      UNIQUE(old_user_id)
    )
  `)
  
  console.log('✅ 映射表创建完成')
}

/**
 * 获取 Supabase 用户
 */
async function getSupabaseUsers(batch = 100, offset = 0) {
  const result = await sourcePool.query(`
    SELECT 
      id,
      email,
      phone,
      created_at,
      updated_at,
      email_confirmed_at,
      phone_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data
    FROM auth.users
    ORDER BY created_at
    LIMIT $1 OFFSET $2
  `, [batch, offset])
  
  return result.rows
}

/**
 * 迁移单个用户
 */
async function migrateUser(user) {
  const client = await targetPool.connect()
  
  try {
    // 检查是否已迁移
    const existing = await client.query(
      `SELECT new_user_id FROM ${config.mappingTable} WHERE old_user_id = $1`,
      [user.id]
    )
    
    if (existing.rows.length > 0) {
      return { skipped: true, newUserId: existing.rows[0].new_user_id }
    }
    
    // 在事务中执行迁移
    await client.query('BEGIN')
    
    // 1. 创建用户 (profiles 表)
    const newUserResult = await client.query(`
      INSERT INTO profiles (
        id, 
        email, 
        phone,
        display_name,
        avatar_url,
        role,
        verified,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = NOW()
      RETURNING id
    `, [
      user.id,
      user.email,
      user.phone || null,
      user.raw_user_meta_data?.display_name || user.email?.split('@')[0] || '用户',
      user.raw_user_meta_data?.avatar_url || null,
      user.raw_app_meta_data?.role || 'seeker',
      user.email_confirmed_at ? true : false,
      user.created_at,
      user.updated_at || user.created_at,
    ])
    
    const newUserId = newUserResult.rows[0].id
    
    // 2. 创建余额记录
    await client.query(`
      INSERT INTO balances (user_id, balance, frozen)
      VALUES ($1, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `, [newUserId])
    
    // 3. 记录映射关系
    await client.query(`
      INSERT INTO ${config.mappingTable} (old_user_id, new_user_id, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (old_user_id) DO NOTHING
    `, [user.id, newUserId, user.email])
    
    await client.query('COMMIT')
    
    return { migrated: true, newUserId, email: user.email }
    
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * 迁移所有用户
 */
async function migrateAllUsers() {
  console.log('\n🚀 开始迁移用户数据...\n')
  
  const batchSize = 100
  let offset = 0
  let totalMigrated = 0
  let totalSkipped = 0
  let totalFailed = 0
  
  // 确保映射表存在
  await createMappingTable()
  
  while (true) {
    const users = await getSupabaseUsers(batchSize, offset)
    
    if (users.length === 0) break
    
    console.log(`📦 处理批次 ${offset / batchSize + 1} (${users.length} 个用户)`)
    
    for (const user of users) {
      try {
        const result = await migrateUser(user)
        if (result.migrated) {
          totalMigrated++
          console.log(`  ✅ 迁移: ${result.email} → ${result.newUserId}`)
        } else if (result.skipped) {
          totalSkipped++
          console.log(`  ⏭️ 跳过: ${user.email} (已迁移)`)
        }
      } catch (error) {
        totalFailed++
        console.log(`  ❌ 失败: ${user.email} - ${error.message}`)
      }
    }
    
    offset += batchSize
    
    // 每批之间稍作延迟，避免压力过大
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return { totalMigrated, totalSkipped, totalFailed }
}

/**
 * 生成迁移报告
 */
async function generateReport() {
  console.log('\n📊 迁移报告\n')
  
  // 总览
  const totalResult = await targetPool.query(`
    SELECT 
      COUNT(*) as total_mapped,
      COUNT(DISTINCT email) as unique_emails
    FROM ${config.mappingTable}
  `)
  
  console.log(`映射记录总数: ${totalResult.rows[0].total_mapped}`)
  console.log(`唯一邮箱数: ${totalResult.rows[0].unique_emails}`)
  
  // 最近的迁移记录
  const recentResult = await targetPool.query(`
    SELECT old_user_id, new_user_id, email, migrated_at
    FROM ${config.mappingTable}
    ORDER BY migrated_at DESC
    LIMIT 10
  `)
  
  console.log('\n最近迁移的 10 个用户:')
  for (const row of recentResult.rows) {
    console.log(`  ${row.email} → ${row.new_user_id} (${row.migrated_at})`)
  }
}

/**
 * 导出映射表 (用于后续表关联更新)
 */
async function exportMapping() {
  console.log('\n📤 导出映射表...')
  
  const result = await targetPool.query(`
    SELECT old_user_id, new_user_id, email
    FROM ${config.mappingTable}
    ORDER BY migrated_at
  `)
  
  const mapping = {}
  for (const row of result.rows) {
    mapping[row.old_user_id] = {
      new_user_id: row.new_user_id,
      email: row.email,
    }
  }
  
  console.log(JSON.stringify(mapping, null, 2))
  
  return mapping
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) 用户数据迁移脚本                       ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  
  // 检查环境变量
  if (!process.env.SUPABASE_DB_PASSWORD || !process.env.TARGET_DB_PASSWORD) {
    console.log('\n❌ 错误: 请设置必要的环境变量')
    console.log('   SUPABASE_DB_PASSWORD - Supabase 数据库密码')
    console.log('   TARGET_DB_PASSWORD - 目标数据库密码')
    console.log('\n可选环境变量:')
    console.log('   SUPABASE_DB_HOST - Supabase 数据库地址')
    console.log('   TARGET_DB_HOST - 目标数据库地址')
    process.exit(1)
  }
  
  try {
    // 测试连接
    console.log('\n🔌 测试数据库连接...')
    await sourcePool.query('SELECT 1')
    console.log('  ✅ 源数据库 (Supabase) 连接成功')
    await targetPool.query('SELECT 1')
    console.log('  ✅ 目标数据库 (PolarDB) 连接成功')
    
    // 执行迁移
    const stats = await migrateAllUsers()
    
    // 生成报告
    await generateReport()
    
    // 导出映射表
    await exportMapping()
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                   迁移完成!                                   ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝')
    console.log(`\n📈 统计:`)
    console.log(`   成功迁移: ${stats.totalMigrated}`)
    console.log(`   跳过: ${stats.totalSkipped}`)
    console.log(`   失败: ${stats.totalFailed}`)
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await sourcePool.end()
    await targetPool.end()
  }
}

// 运行
main().catch(console.error)

// 导出供其他脚本使用
export { migrateUser, exportMapping }
