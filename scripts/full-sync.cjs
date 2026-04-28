/**
 * 完整数据同步 - 解决所有导入问题
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

// 缺失的表
const MISSING_TABLES = [
  // antibot_stats - 单行统计表
  `CREATE TABLE IF NOT EXISTS "antibot_stats" (
    "detections_24h" text DEFAULT '0',
    "blocked_24h" text DEFAULT '0',
    "honeypot_triggers_24h" text DEFAULT '0',
    "unique_bot_ips_24h" text DEFAULT '0',
    "avg_risk_score_24h" numeric,
    "active_signatures" text DEFAULT '0',
    "active_traps" text DEFAULT '0'
  );`,
  // data_management_stats
  `CREATE TABLE IF NOT EXISTS "data_management_stats" (
    "total_backups" text DEFAULT '0',
    "recent_backups" text DEFAULT '0',
    "total_backup_size" text,
    "total_exports" text DEFAULT '0',
    "pending_exports" text DEFAULT '0',
    "audit_logs_24h" text DEFAULT '0',
    "active_quality_checks" text DEFAULT '0',
    "recent_quality_failures" text DEFAULT '0'
  );`,
  // download_upload_stats
  `CREATE TABLE IF NOT EXISTS "download_upload_stats" (
    "downloads_24h" text DEFAULT '0',
    "unique_downloaders_24h" text DEFAULT '0',
    "uploads_24h" text DEFAULT '0',
    "suspicious_uploads_24h" text DEFAULT '0',
    "anomalies_24h" text DEFAULT '0',
    "pending_critical_reviews" text DEFAULT '0'
  );`,
  // top_creators
  `CREATE TABLE IF NOT EXISTS "top_creators" (
    "id" uuid PRIMARY KEY,
    "display_name" text,
    "avatar_url" text,
    "bio" text,
    "is_verified" boolean DEFAULT false,
    "follower_count" integer DEFAULT 0,
    "agent_count" text DEFAULT '0',
    "total_favorites" text DEFAULT '0',
    "post_count" text DEFAULT '0',
    "total_revenue" text DEFAULT '0',
    "influence_score" text DEFAULT '0.0',
    "created_at" timestamptz DEFAULT now()
  );`,
  // user_stats
  `CREATE TABLE IF NOT EXISTS "user_stats" (
    "user_id" uuid PRIMARY KEY,
    "display_name" text,
    "role" text,
    "follower_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "balance" text DEFAULT '0',
    "agent_count" text DEFAULT '0',
    "total_favorites" text DEFAULT '0',
    "post_count" text DEFAULT '0',
    "total_post_likes" text DEFAULT '0',
    "total_revenue" text DEFAULT '0',
    "order_count" text DEFAULT '0'
  );`,
];

// 序列化数组值
function serializeValue(val) {
  if (val === null) return null;
  if (Array.isArray(val)) {
    return JSON.stringify(val);
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val;
}

async function fullSync() {
  const client = new Client(ALIYUN_CONFIG);
  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云\n');

    // 1. 创建缺失的表
    console.log('📋 步骤1: 创建缺失的表...');
    for (const sql of MISSING_TABLES) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/);
      const tableName = match[1];
      try {
        await client.query(sql);
        console.log(`  ✅ ${tableName}`);
      } catch (err) {
        console.log(`  ⚠️ ${tableName}: ${err.message.substring(0, 50)}`);
      }
    }

    // 2. 禁用外键约束以加快导入
    console.log('\n📋 步骤2: 导入数据...');
    await client.query('SET session_replication_role = replica;');

    const results = { success: 0, errors: 0 };

    for (const [tableName, rows] of Object.entries(exportData.tables)) {
      if (!rows || rows.length === 0) continue;

      const { rows: [{ exists }] } = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) as exists",
        [tableName]
      );
      
      if (!exists) continue;

      let tableSuccess = 0;
      let tableErrors = 0;

      for (const row of rows) {
        const columns = Object.keys(row);
        const params = columns.map((col, i) => `$${i + 1}`);
        
        const serializedParams = columns.map(col => serializeValue(row[col]));

        try {
          await client.query(
            `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${params.join(', ')}) ON CONFLICT DO NOTHING`,
            serializedParams
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
        results.success += tableSuccess;
        console.log(`  ✅ ${tableName}: ${tableSuccess} 行`);
      }
      results.errors += tableErrors;
    }

    // 3. 重新启用外键约束
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('\n' + '='.repeat(60));
    console.log(`导入完成: ${results.success} 成功, ${results.errors} 错误`);
    console.log('='.repeat(60));

    // 4. 验证
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

fullSync().catch(console.error);
