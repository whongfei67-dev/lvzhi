/**
 * 数据库表检查脚本
 * 
 * 检查数据库表是否存在，Schema 是否匹配
 */

import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  console.log('检查数据库表...\n')

  try {
    // 检查表列表
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log(`找到 ${tablesResult.rows.length} 个表:\n`)
    
    for (const row of tablesResult.rows) {
      console.log(`  - ${row.table_name}`)
    }

    // 检查关键表是否存在
    const requiredTables = ['users', 'agents', 'community_posts', 'profiles']
    console.log('\n关键表检查:')
    
    for (const table of requiredTables) {
      const exists = tablesResult.rows.some(r => r.table_name === table)
      console.log(`  ${exists ? '✓' : '✗'} ${table} ${exists ? '存在' : '不存在'}`)
    }

    // 如果 agents 存在，检查其结构
    if (tablesResult.rows.some(r => r.table_name === 'agents')) {
      console.log('\nagents 表结构:')
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'agents'
        ORDER BY ordinal_position
      `)
      for (const col of columns.rows) {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`)
      }
    }

    // 测试查询
    console.log('\n测试查询:')
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM agents')
      console.log(`  ✓ SELECT COUNT(*) FROM agents: ${result.rows[0].count}`)
    } catch (e) {
      console.log(`  ✗ SELECT COUNT(*) FROM agents 失败: ${e.message}`)
    }

  } catch (error) {
    console.error('错误:', error.message)
  }

  await pool.end()
}

main()
