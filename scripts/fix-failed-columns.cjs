/**
 * 修复失败的列添加
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

// 修复列
const FIXES = [
  // agents 表
  { table: 'agents', column: 'file_size_bytes', sql: 'ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "file_size_bytes" bigint DEFAULT 0;' },
  { table: 'agents', column: 'download_count', sql: 'ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "download_count" integer DEFAULT 0;' },
  // profiles 表
  { table: 'profiles', column: 'follower_count', sql: 'ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "follower_count" integer DEFAULT 0;' },
  { table: 'profiles', column: 'following_count', sql: 'ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "following_count" integer DEFAULT 0;' },
];

async function fixFailedColumns() {
  const client = new Client(ALIYUN_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云 PolarDB\n');

    let successCount = 0;
    let failCount = 0;

    for (const fix of FIXES) {
      process.stdout.write(`  添加列: ${fix.table}.${fix.column}... `);
      
      try {
        await client.query(fix.sql);
        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('❌');
        console.log(`  ❌ 错误: ${err.message}`);
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

fixFailedColumns().catch(console.error);
