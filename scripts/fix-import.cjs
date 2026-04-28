/**
 * 诊断并修复数据导入问题
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

async function diagnoseAndImport() {
  const client = new Client(ALIYUN_CONFIG);
  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云\n');

    const results = { success: 0, errors: 0, skipped: 0 };

    for (const [tableName, rows] of Object.entries(exportData.tables)) {
      if (!rows || rows.length === 0) continue;

      // 跳过空表
      const { rows: [{ exists }] } = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) as exists",
        [tableName]
      );
      
      if (!exists) {
        console.log(`  ⚠️ ${tableName}: 表不存在，跳过`);
        results.skipped++;
        continue;
      }

      // 逐行插入，使用单个INSERT
      let tableSuccess = 0;
      let tableErrors = 0;

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((col, i) => `$${i + 1}`);
        
        const params = columns.map(col => {
          const val = row[col];
          if (val === null) return null;
          if (typeof val === 'object') return JSON.stringify(val);
          return val;
        });

        try {
          await client.query(
            `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING`,
            params
          );
          tableSuccess++;
        } catch (err) {
          if (tableErrors === 0) { // 只打印第一次错误
            console.log(`  ⚠️ ${tableName}.${columns[0]}: ${err.message.substring(0, 80)}`);
          }
          tableErrors++;
        }
      }

      if (tableSuccess > 0) {
        results.success += tableSuccess;
        console.log(`  ✅ ${tableName}: ${tableSuccess} 行`);
      }
      if (tableErrors > 0) {
        results.errors += tableErrors;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`导入完成: ${results.success} 成功, ${results.errors} 错误, ${results.skipped} 跳过`);
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
    
    const total = verifyRows.reduce((sum, r) => sum + parseInt(r.count), 0);
    console.log(`\n📊 阿里云数据库总计: ${total} 行数据`);

  } finally {
    await client.end();
  }
}

diagnoseAndImport().catch(console.error);
