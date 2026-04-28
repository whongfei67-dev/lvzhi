/**
 * 数据一致性验证脚本
 * 对比 Supabase 和阿里云的关键业务数据
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_CONFIG = {
  host: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false },
};

const ALIYUN_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: false,
};

// 需要验证的关键表
const KEY_TABLES = [
  'profiles',
  'agents',
  'jobs',
  'community_posts',
  'permissions',
  'role_permissions',
  'bot_signatures',
  'firewall_rules',
];

async function verifyDataConsistency() {
  console.log('\n' + '='.repeat(60));
  console.log('  数据一致性验证');
  console.log('='.repeat(60) + '\n');

  const supabase = new Client(SUPABASE_CONFIG);
  const aliyun = new Client(ALIYUN_CONFIG);

  try {
    await supabase.connect();
    await aliyun.connect();
    console.log('✅ 已连接到两个数据库\n');

    const results = [];

    for (const tableName of KEY_TABLES) {
      process.stdout.write(`📋 验证表: ${tableName}... `);

      try {
        // 获取 Supabase 数据
        const supaResult = await supabase.query(`SELECT * FROM "${tableName}"`);
        const supaCount = supaResult.rowCount;
        const supaData = supaResult.rows;

        // 获取阿里云数据
        const aliResult = await aliyun.query(`SELECT * FROM "${tableName}"`);
        const aliCount = aliResult.rowCount;
        const aliData = aliResult.rows;

        // 比较
        const match = supaCount === aliCount;
        
        if (match) {
          console.log(`✅ (${supaCount} 行)`);
        } else {
          console.log(`⚠️ (Supabase: ${supaCount}, 阿里云: ${aliCount})`);
        }

        results.push({
          table: tableName,
          supabase_count: supaCount,
          aliyun_count: aliCount,
          match,
        });

      } catch (err) {
        console.log(`❌ 错误: ${err.message.substring(0, 40)}`);
        results.push({
          table: tableName,
          error: err.message,
        });
      }
    }

    // 输出汇总
    console.log('\n' + '='.repeat(60));
    console.log('  验证结果汇总');
    console.log('='.repeat(60) + '\n');

    const matched = results.filter(r => r.match === true).length;
    const total = results.filter(r => !r.error).length;

    results.forEach(r => {
      if (r.error) {
        console.log(`  ❌ ${r.table}: 错误 - ${r.error.substring(0, 50)}`);
      } else if (r.match) {
        console.log(`  ✅ ${r.table}: 一致 (${r.supabase_count} 行)`);
      } else {
        console.log(`  ⚠️  ${r.table}: 不一致 (Supabase ${r.supabase_count} vs 阿里云 ${r.aliyun_count})`);
      }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`总计: ${matched}/${total} 张表数据一致`);

    // 特别显示 profiles 数据
    console.log('\n📊 关键数据详情:');
    
    const profiles = await aliyun.query('SELECT id, role, display_name FROM profiles');
    console.log('\n用户列表:');
    profiles.rows.forEach(p => {
      console.log(`  - ${p.display_name} (${p.role})`);
    });

    const agents = await aliyun.query('SELECT id, name, status FROM agents');
    console.log('\n智能体列表:');
    agents.rows.forEach(a => {
      console.log(`  - ${a.name} (${a.status})`);
    });

    console.log('\n' + '='.repeat(60));

  } finally {
    await supabase.end();
    await aliyun.end();
  }
}

verifyDataConsistency().catch(console.error);
