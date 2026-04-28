/**
 * 重新导入数据 - 正确处理所有数据类型
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ALIYUN_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: false,
};

const EXPORT_FILE = path.join(__dirname, '../data-exports/supabase-export-full-2026-03-29T11-43-13-364Z.json');

// 序列化值 - 处理特殊类型
function serializeValue(key, val, tableName) {
  if (val === null) return null;
  
  // JSONB 类型直接序列化
  if (tableName === 'agents' && (key === 'metadata' || key === 'demo_content')) {
    return JSON.stringify(val);
  }
  if (tableName === 'community_posts' && key === 'tags') {
    return JSON.stringify(val);
  }
  if (tableName === 'jobs' && key === 'specialty') {
    return JSON.stringify(val);
  }
  if (tableName === 'data_access_controls' && (key === 'condition' || key === 'allowed_user_agents' || key === 'blocked_user_agents')) {
    return JSON.stringify(val);
  }
  if (tableName === 'firewall_rules' && key === 'condition') {
    return JSON.stringify(val);
  }
  if (tableName === 'honeypot_traps' && key === 'trap_content') {
    return JSON.stringify(val);
  }
  if (tableName === 'file_scan_rules' && key === 'rule_condition') {
    return JSON.stringify(val);
  }
  if (tableName === 'javascript_challenges' && key === 'challenge_code') {
    return JSON.stringify(val);
  }
  
  // 数组类型
  if (Array.isArray(val)) {
    return JSON.stringify(val);
  }
  
  // 对象类型
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  
  return val;
}

async function reimport() {
  const client = new Client(ALIYUN_CONFIG);
  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云\n');

    // 禁用外键约束
    await client.query('SET session_replication_role = replica;');

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const [tableName, rows] of Object.entries(exportData.tables)) {
      if (!rows || rows.length === 0) continue;

      // 检查表是否存在
      const { rows: [{ exists }] } = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) as exists",
        [tableName]
      );
      
      if (!exists) {
        console.log(`  ⚠️ ${tableName}: 表不存在`);
        continue;
      }

      let tableSuccess = 0;
      let tableErrors = 0;

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((col, i) => `$${i + 1}`);
        
        // 特殊处理序列化
        const params = columns.map(col => serializeValue(col, row[col], tableName));

        try {
          await client.query(
            `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING`,
            params
          );
          tableSuccess++;
        } catch (err) {
          if (tableErrors === 0) {
            console.log(`  ⚠️ ${tableName}: ${err.message.substring(0, 60)}`);
          }
          tableErrors++;
        }
      }

      if (tableSuccess > 0) {
        console.log(`  ✅ ${tableName}: ${tableSuccess} 行`);
        totalSuccess += tableSuccess;
      }
      totalErrors += tableErrors;
    }

    // 重新启用外键约束
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('\n' + '='.repeat(60));
    console.log(`导入完成: ${totalSuccess} 成功, ${totalErrors} 错误`);
    console.log('='.repeat(60));

    // 验证
    const { rows: verifyRows } = await client.query(`
      SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int as count
      FROM (
        SELECT table_name, query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', table_name), false, true, '') as xml_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ) t
    `);
    
    const total = verifyRows.reduce((sum, r) => sum + parseInt(r.count || 0), 0);
    console.log(`\n📊 阿里云数据库总计: ${total} 行数据`);

  } finally {
    await client.end();
  }
}

reimport().catch(console.error);
