/**
 * PolarDB 数据完整性检查脚本
 * 检查表结构、数据量、关键字段
 */

const { Client } = require('pg');

const CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false }
};

// 核心表及预期字段（从 001_initial_schema.sql 提取）
const TABLES_TO_CHECK = [
  { name: 'profiles', expectedColumns: ['id', 'role', 'display_name', 'avatar_url', 'bio', 'phone', 'verified', 'created_at', 'status', 'email'] },
  { name: 'agents', expectedColumns: ['id', 'creator_id', 'name', 'description', 'category', 'price', 'status', 'created_at'] },
  { name: 'agent_demos', expectedColumns: ['id', 'agent_id', 'demo_content', 'created_at'] },
  { name: 'agent_favorites', expectedColumns: ['id', 'user_id', 'agent_id', 'created_at'] },
  { name: 'agent_ratings', expectedColumns: ['id', 'agent_id', 'user_id', 'rating', 'comment', 'created_at'] },
  { name: 'jobs', expectedColumns: ['id', 'recruiter_id', 'title', 'description', 'status', 'created_at'] },
  { name: 'applications', expectedColumns: ['id', 'job_id', 'seeker_id', 'status', 'applied_at'] },
  { name: 'lawyer_profiles', expectedColumns: ['user_id', 'bar_number', 'law_firm', 'specialty', 'years_experience', 'verified_at'] },
  { name: 'community_posts', expectedColumns: ['id', 'user_id', 'title', 'content', 'category', 'status', 'created_at'] },
  { name: 'comments', expectedColumns: ['id', 'user_id', 'target_id', 'target_type', 'content', 'created_at'] },
  { name: 'likes', expectedColumns: ['id', 'user_id', 'target_id', 'target_type', 'created_at'] },
  { name: 'orders', expectedColumns: ['id', 'user_id', 'product_id', 'amount', 'status', 'created_at'] },
  { name: 'user_balances', expectedColumns: ['user_id', 'balance', 'updated_at'] },
  { name: 'user_follows', expectedColumns: ['follower_id', 'following_id', 'created_at'] },
  { name: 'api_credentials', expectedColumns: ['user_id', 'api_key', 'daily_limit', 'used_today', 'created_at'] },
  { name: 'api_usage_stats', expectedColumns: ['user_id', 'date', 'total_calls', 'success_calls', 'failed_calls'] },
  { name: 'coupons', expectedColumns: ['id', 'code', 'type', 'value', 'min_amount', 'status', 'valid_from', 'valid_until'] },
  { name: 'user_coupons', expectedColumns: ['user_id', 'coupon_id', 'used_at', 'order_id'] },
  { name: 'subscriptions', expectedColumns: ['id', 'user_id', 'plan', 'status', 'started_at', 'expires_at'] },
  { name: 'uploaded_files', expectedColumns: ['id', 'user_id', 'file_name', 'file_path', 'file_size', 'created_at'] },
];

async function run() {
  const client = new Client(CONFIG);

  try {
    await client.connect();
    console.log('✅ 连接 PolarDB 成功\n');

    // 1. 检查表是否存在
    console.log('='.repeat(60));
    console.log('1. 检查表结构完整性');
    console.log('='.repeat(60));

    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tableResult.rows.map(r => r.table_name);
    console.log(`\n📊 PolarDB 中共有 ${existingTables.length} 个表\n`);

    let allTablesExist = true;
    for (const table of TABLES_TO_CHECK) {
      const exists = existingTables.includes(table.name);
      console.log(`  ${exists ? '✅' : '❌'} ${table.name}`);
      if (!exists) allTablesExist = false;
    }

    // 2. 检查关键表的字段
    console.log('\n' + '='.repeat(60));
    console.log('2. 检查关键表字段');
    console.log('='.repeat(60));

    for (const table of TABLES_TO_CHECK) {
      if (!existingTables.includes(table.name)) continue;

      const colResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table.name]);

      const columns = colResult.rows.map(r => r.column_name);
      const missing = table.expectedColumns.filter(c => !columns.includes(c));

      if (missing.length > 0) {
        console.log(`\n  ⚠️ ${table.name}: 缺少字段 [${missing.join(', ')}]`);
      }
    }

    // 3. 检查数据量
    console.log('\n' + '='.repeat(60));
    console.log('3. 检查各表数据量');
    console.log('='.repeat(60));

    const dataStats = [];
    for (const table of TABLES_TO_CHECK) {
      if (!existingTables.includes(table.name)) continue;

      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = parseInt(countResult.rows[0].count);

      dataStats.push({
        table: table.name,
        count,
        size: null
      });
    }

    // 按数据量排序显示
    dataStats.sort((a, b) => b.count - a.count);

    console.log('\n  表名                    数据量');
    console.log('  ' + '-'.repeat(40));
    dataStats.forEach(s => {
      const countStr = s.count.toString().padEnd(8);
      console.log(`  ${s.table.padEnd(24)} ${countStr}`);
    });

    // 4. 检查关键业务数据
    console.log('\n' + '='.repeat(60));
    console.log('4. 检查关键业务数据');
    console.log('='.repeat(60));

    // 4.1 用户角色分布
    const roleStats = await client.query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('\n  📌 用户角色分布:');
    roleStats.rows.forEach(r => {
      console.log(`     ${(r.role || 'null').padEnd(12)}: ${r.count} 人`);
    });

    // 4.2 智能体状态分布
    const agentStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM agents
      GROUP BY status
    `);
    console.log('\n  📌 智能体状态分布:');
    agentStats.rows.forEach(r => {
      console.log(`     ${(r.status || 'null').padEnd(12)}: ${r.count} 个`);
    });

    // 4.3 社区帖子状态
    const postStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM community_posts
      GROUP BY status
    `);
    console.log('\n  📌 社区帖子状态:');
    postStats.rows.forEach(r => {
      console.log(`     ${(r.status || 'null').padEnd(12)}: ${r.count} 篇`);
    });

    // 5. 检查关联完整性
    console.log('\n' + '='.repeat(60));
    console.log('5. 检查关联完整性');
    console.log('='.repeat(60));

    // 检查 agents.creator_id 是否都有对应的 profiles
    const orphanAgents = await client.query(`
      SELECT COUNT(*) as count
      FROM agents a
      LEFT JOIN profiles p ON a.creator_id = p.id
      WHERE p.id IS NULL
    `);
    const orphanCount = parseInt(orphanAgents.rows[0].count);
    console.log(`\n  ${orphanCount === 0 ? '✅' : '⚠️'} 智能体-创作者关联: ${orphanCount === 0 ? '完整' : `有 ${orphanCount} 条孤立数据`}`);

    // 检查律师认证情况
    const verifiedLawyers = await client.query(`
      SELECT COUNT(*) as count
      FROM lawyer_profiles
      WHERE verified_at IS NOT NULL
    `);
    console.log(`  ✅ 已认证律师: ${verifiedLawyers.rows[0].count} 人`);

    // 6. 综合评估
    console.log('\n' + '='.repeat(60));
    console.log('6. 数据完整性评估');
    console.log('='.repeat(60));

    const totalRecords = dataStats.reduce((sum, s) => sum + s.count, 0);
    const profilesCount = dataStats.find(s => s.table === 'profiles')?.count || 0;
    const agentsCount = dataStats.find(s => s.table === 'agents')?.count || 0;

    console.log(`\n  📊 总记录数: ${totalRecords.toLocaleString()} 条`);
    console.log(`  👥 用户数: ${profilesCount} 人`);
    console.log(`  🤖 智能体数: ${agentsCount} 个`);
    console.log(`  📋 表格数: ${existingTables.length} 个`);

    if (allTablesExist && orphanCount === 0 && profilesCount > 0) {
      console.log('\n  ✅ 结论: PolarDB 数据完整，可以投入使用');
    } else if (profilesCount > 0) {
      console.log('\n  ⚠️ 结论: 数据基本完整，但存在一些小问题');
    } else {
      console.log('\n  ❌ 结论: 数据可能未迁移或迁移失败');
    }

  } catch (error) {
    console.error('\n❌ 连接失败:', error.message);
    console.log('\n可能的原因:');
    console.log('  1. 网络无法访问阿里云 PolarDB');
    console.log('  2. 用户名/密码错误');
    console.log('  3. 数据库不存在');
    console.log('  4. SSL 证书问题');
  } finally {
    await client.end();
  }
}

run();