/**
 * 从 JSON 导出文件导入数据到 PolarDB
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false }
};

// 导入顺序很重要（外键依赖）
const IMPORT_ORDER = [
  // 1. 用户相关（无外键依赖）
  'profiles',
  'lawyer_profiles',
  'recruiter_profiles',
  'seeker_profiles',
  
  // 2. 内容相关
  'agents',
  'agent_demos',
  'agent_favorites',
  'agent_ratings',
  'jobs',
  'community_posts',
  'comments',
  'likes',
  
  // 3. 业务相关
  'applications',
  'orders',
  'user_balances',
  'balance_transactions',
  'coupons',
  'user_coupons',
  'coupon_usages',
  'subscriptions',
  'subscription_history',
  
  // 4. 社交相关
  'user_follows',
  
  // 5. API 相关
  'api_credentials',
  'api_usage_stats',
  'api_call_logs',
  
  // 6. 其他
  'products',
  'promo_orders',
  'platform_inquiries',
  'email_verifications',
  'password_resets',
  'oauth_connections',
  'login_history',
  'user_sessions',
  'user_permissions',
  'role_permissions',
  'permissions',
];

// 需要清理旧数据的表
const TABLES_TO_TRUNCATE = [
  'profiles',
  'agents',
  'agent_demos',
  'agent_favorites',
  'agent_ratings',
  'jobs',
  'community_posts',
  'comments',
  'likes',
  'applications',
  'orders',
  'user_balances',
  'balance_transactions',
  'coupons',
  'user_coupons',
  'coupon_usages',
  'subscriptions',
  'subscription_history',
  'user_follows',
  'api_credentials',
  'api_usage_stats',
  'api_call_logs',
  'products',
  'promo_orders',
  'platform_inquiries',
  'email_verifications',
  'password_resets',
  'oauth_connections',
  'login_history',
  'user_sessions',
  'user_permissions',
  'lawyer_profiles',
  'recruiter_profiles',
  'seeker_profiles',
];

async function run() {
  const client = new Client(CONFIG);
  const exportFile = path.join(__dirname, '..', 'data-exports', 'supabase-export-full-2026-03-29T11-43-13-364Z.json');

  try {
    await client.connect();
    console.log('✅ 连接 PolarDB 成功\n');

    // 读取导出文件
    console.log('📁 读取导出文件...');
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    console.log(`   导出时间: ${exportData.exported_at}`);
    console.log(`   表数量: ${Object.keys(exportData.tables).length}\n`);

    // 统计导出数据量
    let totalExported = 0;
    for (const tableName of IMPORT_ORDER) {
      if (exportData.tables[tableName]) {
        totalExported += exportData.tables[tableName].length;
      }
    }
    console.log(`📊 待导入记录总数: ${totalExported}\n`);

    // 确认操作
    console.log('='.repeat(60));
    console.log('⚠️  即将执行以下操作:');
    console.log('='.repeat(60));
    console.log('   1. 清空以下表的数据:');
    TABLES_TO_TRUNCATE.slice(0, 5).forEach(t => console.log(`      - ${t}`));
    console.log(`      ... 共 ${TABLES_TO_TRUNCATE.length} 个表`);
    console.log('   2. 从导出文件导入数据\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('确认执行? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('操作已取消');
      return;
    }

    // 开始导入
    console.log('\n开始导入...\n');

    for (const tableName of IMPORT_ORDER) {
      const data = exportData.tables[tableName];
      if (!data || data.length === 0) {
        console.log(`  ⏭️  ${tableName}: 无数据，跳过`);
        continue;
      }

      try {
        // 跳过没有数据的表
        if (data.length === 0) continue;

        // 获取表的列信息
        const columns = Object.keys(data[0]);
        
        // 构建 INSERT 语句
        const values = data.map((row, idx) => {
          const vals = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          return `(${vals.join(', ')})`;
        }).join(', ');

        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}`;

        // 执行插入
        await client.query(insertSQL);
        console.log(`  ✅ ${tableName}: 导入 ${data.length} 条`);

      } catch (err) {
        // 某些表可能不存在或有其他问题，跳过
        if (err.code === '42P01') {
          console.log(`  ⚠️  ${tableName}: 表不存在，跳过`);
        } else if (err.code === '23505') {
          console.log(`  ⚠️  ${tableName}: 重复键，跳过`);
        } else {
          console.log(`  ❌ ${tableName}: ${err.message.substring(0, 50)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('导入完成！');
    console.log('='.repeat(60));

    // 验证结果
    console.log('\n验证导入结果...\n');
    
    const verificationTables = ['profiles', 'agents', 'jobs', 'community_posts'];
    for (const table of verificationTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} 条`);
      } catch (err) {
        console.log(`  ${table}: 查询失败`);
      }
    }

  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
  } finally {
    await client.end();
  }
}

run();
