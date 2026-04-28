/**
 * 修复失败的表创建 - 处理复杂数据类型
 * 解决 PolarDB 兼容性问题
 */

const { Client } = require('pg');

const ALIYUN_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: false,
  connectionTimeoutMillis: 30000,
};

// 失败的表 SQL 定义
const TABLES_SQL = [
  // captcha_verifications - 有 inet 类型
  `CREATE TABLE IF NOT EXISTS "captcha_verifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "session_id" text NOT NULL,
    "ip_address" varchar(45) NOT NULL,
    "challenge_type" text NOT NULL,
    "success" boolean NOT NULL,
    "attempts" integer DEFAULT 1,
    "created_at" timestamptz DEFAULT now()
  );`,

  // data_access_controls
  `CREATE TABLE IF NOT EXISTS "data_access_controls" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "resource_type" text NOT NULL,
    "resource_id" uuid,
    "access_level" text NOT NULL,
    "rate_limit_per_minute" integer,
    "rate_limit_per_hour" integer,
    "rate_limit_per_day" integer,
    "require_captcha" boolean DEFAULT false,
    "require_javascript" boolean DEFAULT false,
    "allowed_user_agents" text,
    "blocked_user_agents" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
  );`,

  // data_archives
  `CREATE TABLE IF NOT EXISTS "data_archives" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "table_name" text NOT NULL,
    "archive_type" text NOT NULL,
    "retention_days" integer,
    "archive_path" text,
    "status" text DEFAULT 'pending',
    "error_message" text,
    "created_at" timestamptz DEFAULT now(),
    "archived_at" timestamptz,
    "metadata" jsonb
  );`,

  // data_audit_logs - 有 ARRAY 类型
  `CREATE TABLE IF NOT EXISTS "data_audit_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid,
    "action" text NOT NULL,
    "table_name" text NOT NULL,
    "record_id" uuid,
    "changes" jsonb,
    "ip_address" varchar(45),
    "user_agent" text,
    "created_at" timestamptz DEFAULT now()
  );`,

  // data_masking_rules - 有 ARRAY 类型
  `CREATE TABLE IF NOT EXISTS "data_masking_rules" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "table_name" text NOT NULL,
    "column_name" text NOT NULL,
    "masking_type" text NOT NULL,
    "masking_pattern" text,
    "apply_to_roles" text,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now()
  );`,

  // data_quality_results
  `CREATE TABLE IF NOT EXISTS "data_quality_results" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "check_id" uuid NOT NULL,
    "table_name" text NOT NULL,
    "column_name" text,
    "check_type" text NOT NULL,
    "passed" boolean NOT NULL,
    "error_message" text,
    "severity" text DEFAULT 'warning',
    "checked_at" timestamptz DEFAULT now(),
    "metadata" jsonb
  );`,

  // javascript_challenges
  `CREATE TABLE IF NOT EXISTS "javascript_challenges" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "session_id" text NOT NULL,
    "ip_address" varchar(45) NOT NULL,
    "challenge_code" text NOT NULL,
    "solution_hash" text NOT NULL,
    "attempts" integer DEFAULT 0,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "solved_at" timestamptz
  );`,

  // upload_behavior_analysis
  `CREATE TABLE IF NOT EXISTS "upload_behavior_analysis" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid,
    "ip_address" varchar(45),
    "file_type" text,
    "file_size" bigint,
    "upload_result" text,
    "risk_score" numeric(3,2),
    "flags" text,
    "analyzed_at" timestamptz DEFAULT now()
  );`
];

async function fixFailedTables() {
  const client = new Client(ALIYUN_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云 PolarDB\n');

    let successCount = 0;
    let failCount = 0;

    for (const sql of TABLES_SQL) {
      // 提取表名
      const match = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/);
      const tableName = match ? match[1] : 'unknown';
      
      process.stdout.write(`  创建表: ${tableName}... `);
      
      try {
        await client.query(sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('❌');
        console.log(`  ❌ 错误: ${err.message}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`创建完成: ${successCount} 成功, ${failCount} 失败`);
    console.log('='.repeat(60));

  } finally {
    await client.end();
  }
}

fixFailedTables().catch(console.error);
