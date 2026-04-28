/**
 * 添加所有缺失的列
 */

const { Client } = require('pg');

const ALIYUN_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: false,
};

// 所有缺失的列
const MISSING_COLUMNS = [
  // data_archives
  { table: 'data_archives', column: 'source_table', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "source_table" text;' },
  { table: 'data_archives', column: 'archive_name', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "archive_name" text;' },
  { table: 'data_archives', column: 'record_count', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "record_count" integer;' },
  { table: 'data_archives', column: 'date_range', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "date_range" jsonb;' },
  { table: 'data_archives', column: 'compression_type', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "compression_type" text;' },
  { table: 'data_archives', column: 'file_size_bytes', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "file_size_bytes" bigint;' },
  { table: 'data_archives', column: 'archived_by', sql: 'ALTER TABLE "data_archives" ADD COLUMN IF NOT EXISTS "archived_by" uuid;' },
  
  // data_audit_logs
  { table: 'data_audit_logs', column: 'operation', sql: 'ALTER TABLE "data_audit_logs" ADD COLUMN IF NOT EXISTS "operation" text;' },
  { table: 'data_audit_logs', column: 'old_data', sql: 'ALTER TABLE "data_audit_logs" ADD COLUMN IF NOT EXISTS "old_data" jsonb;' },
  { table: 'data_audit_logs', column: 'new_data', sql: 'ALTER TABLE "data_audit_logs" ADD COLUMN IF NOT EXISTS "new_data" jsonb;' },
  { table: 'data_audit_logs', column: 'changed_fields', sql: 'ALTER TABLE "data_audit_logs" ADD COLUMN IF NOT EXISTS "changed_fields" text;' },
  { table: 'data_audit_logs', column: 'performed_at', sql: 'ALTER TABLE "data_audit_logs" ADD COLUMN IF NOT EXISTS "performed_at" timestamptz;' },
  
  // data_quality_results
  { table: 'data_quality_results', column: 'records_checked', sql: 'ALTER TABLE "data_quality_results" ADD COLUMN IF NOT EXISTS "records_checked" integer;' },
  { table: 'data_quality_results', column: 'records_failed', sql: 'ALTER TABLE "data_quality_results" ADD COLUMN IF NOT EXISTS "records_failed" integer;' },
  { table: 'data_quality_results', column: 'failure_rate', sql: 'ALTER TABLE "data_quality_results" ADD COLUMN IF NOT EXISTS "failure_rate" numeric;' },
  { table: 'data_quality_results', column: 'details', sql: 'ALTER TABLE "data_quality_results" ADD COLUMN IF NOT EXISTS "details" jsonb;' },
  
  // javascript_challenges
  { table: 'javascript_challenges', column: 'challenge_token', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "challenge_token" text;' },
  { table: 'javascript_challenges', column: 'challenge_type', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "challenge_type" text;' },
  { table: 'javascript_challenges', column: 'expected_result', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "expected_result" text;' },
  { table: 'javascript_challenges', column: 'actual_result', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "actual_result" text;' },
  { table: 'javascript_challenges', column: 'passed', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "passed" boolean;' },
  { table: 'javascript_challenges', column: 'response_time_ms', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "response_time_ms" integer;' },
  { table: 'javascript_challenges', column: 'completed_at', sql: 'ALTER TABLE "javascript_challenges" ADD COLUMN IF NOT EXISTS "completed_at" timestamptz;' },
  
  // upload_behavior_analysis
  { table: 'upload_behavior_analysis', column: 'time_window', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "time_window" timestamptz;' },
  { table: 'upload_behavior_analysis', column: 'total_uploads', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "total_uploads" integer;' },
  { table: 'upload_behavior_analysis', column: 'total_size_mb', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "total_size_mb" numeric;' },
  { table: 'upload_behavior_analysis', column: 'unique_file_types', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "unique_file_types" text;' },
  { table: 'upload_behavior_analysis', column: 'avg_file_size_mb', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "avg_file_size_mb" numeric;' },
  { table: 'upload_behavior_analysis', column: 'suspicious_patterns', sql: 'ALTER TABLE "upload_behavior_analysis" ADD COLUMN IF NOT EXISTS "suspicious_patterns" text;' },
];

async function addMissingColumns() {
  const client = new Client(ALIYUN_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云\n');

    let successCount = 0;
    let failCount = 0;

    for (const col of MISSING_COLUMNS) {
      process.stdout.write(`  ${col.table}.${col.column}... `);
      
      try {
        await client.query(col.sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('❌');
        console.log(`    错误: ${err.message.substring(0, 60)}`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`添加完成: ${successCount} 成功, ${failCount} 失败`);
    console.log('='.repeat(60));

  } finally {
    await client.end();
  }
}

addMissingColumns().catch(console.error);
