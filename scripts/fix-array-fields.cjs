/**
 * 修复数组字段导入问题
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

async function fixArrayFields() {
  const client = new Client(ALIYUN_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ 已连接到阿里云\n');

    // 修复 agents 表 tags 字段
    console.log('📋 修复 agents 表...');
    const agents = await client.query('SELECT id, tags FROM agents WHERE tags IS NOT NULL');
    for (const row of agents.rows) {
      try {
        const tags = JSON.parse(row.tags);
        await client.query('UPDATE agents SET tags = $1 WHERE id = $2', [JSON.stringify(tags), row.id]);
        console.log(`  ✅ agents.${row.id.slice(0,8)} tags 修复`);
      } catch (e) {
        // 如果已经是正确格式则跳过
      }
    }

    // 修复 community_posts 表 tags 字段
    console.log('\n📋 修复 community_posts 表...');
    const posts = await client.query('SELECT id, tags FROM community_posts WHERE tags IS NOT NULL');
    for (const row of posts.rows) {
      try {
        const tags = JSON.parse(row.tags);
        await client.query('UPDATE community_posts SET tags = $1 WHERE id = $2', [JSON.stringify(tags), row.id]);
        console.log(`  ✅ community_posts.${row.id.slice(0,8)} tags 修复`);
      } catch (e) {
        // 如果已经是正确格式则跳过
      }
    }

    // 修复 jobs 表 specialty 字段
    console.log('\n📋 修复 jobs 表...');
    const jobs = await client.query('SELECT id, specialty FROM jobs WHERE specialty IS NOT NULL');
    for (const row of jobs.rows) {
      try {
        const specialty = JSON.parse(row.specialty);
        await client.query('UPDATE jobs SET specialty = $1 WHERE id = $2', [JSON.stringify(specialty), row.id]);
        console.log(`  ✅ jobs.${row.id.slice(0,8)} specialty 修复`);
      } catch (e) {
        // 如果已经是正确格式则跳过
      }
    }

    console.log('\n✅ 数组字段修复完成');

  } finally {
    await client.end();
  }
}

fixArrayFields().catch(console.error);
