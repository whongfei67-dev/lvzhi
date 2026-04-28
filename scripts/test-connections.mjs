#!/usr/bin/env node
/**
 * 数据库连接测试脚本
 * 
 * 用于测试 Supabase 和阿里云 PolarDB 的连接
 * 
 * 使用方法：
 *   node scripts/test-connections.mjs
 */

import pg from 'pg';

const { Client: PgClient } = pg;

// ============================================
// Supabase 连接测试
// ============================================

async function testSupabase() {
  console.log('\n--- 测试 Supabase 连接 ---\n');
  
  const config = {
    host: 'db.kqtpdsgwkvzinonkprcl.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Wxwzcfwhf205',
  };

  console.log('配置:');
  console.log(`  主机: ${config.host}`);
  console.log(`  端口: ${config.port}`);
  console.log(`  数据库: ${config.database}`);
  console.log(`  用户: ${config.user}`);
  console.log('');

  let client;
  try {
    client = new PgClient({
      ...config,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    console.log('正在连接...');
    await client.connect();
    console.log('✅ Supabase 连接成功!\n');

    // 测试查询
    console.log('测试查询...');
    const versionResult = await client.query('SELECT version()');
    console.log(`数据库版本: ${versionResult.rows[0].version.split(',')[0]}`);

    // 获取表列表
    console.log('\n获取表列表...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n找到 ${tablesResult.rows.length} 个表:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // 获取表行数统计
    console.log('\n表行数统计:');
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        console.log(`  ${row.table_name}: ${countResult.rows[0].count} 行`);
      } catch (e) {
        console.log(`  ${row.table_name}: 无法获取行数 (${e.message})`);
      }
    }

    console.log('\n✅ Supabase 数据库测试完成!');
    
  } catch (error) {
    console.error('❌ Supabase 连接失败:');
    console.error(`  错误: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n提示: 连接被拒绝，可能原因:');
      console.error('  1. Supabase 使用 PgBouncer 进行连接池，默认端口可能不同');
      console.error('  2. 需要在 Supabase Dashboard 中配置 Connection Pooling');
      console.error('  3. 检查是否开启了 SSL 连接');
    }
    
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
  
  return true;
}

// ============================================
// 阿里云 PolarDB 连接测试
// ============================================

async function testAliyun() {
  console.log('\n--- 测试阿里云 PolarDB 连接 ---\n');
  
  const config = {
    host: process.env.ALIYUN_HOST || 'localhost',
    port: parseInt(process.env.ALIYUN_PORT || '5432'),
    database: process.env.ALIYUN_DB || 'lvzhi',
    user: process.env.ALIYUN_USER || 'lvzhi',
    password: process.env.ALIYUN_PASSWORD || '',
  };

  console.log('配置:');
  console.log(`  主机: ${config.host}`);
  console.log(`  端口: ${config.port}`);
  console.log(`  数据库: ${config.database}`);
  console.log(`  用户: ${config.user}`);
  console.log(`  密码: ${config.password ? '******' : '未设置'}`);
  console.log('');

  if (!config.password) {
    console.error('❌ 未设置 ALIYUN_PASSWORD 环境变量');
    console.log('\n请运行:');
    console.log('  export ALIYUN_PASSWORD=your_password');
    console.log('');
    return false;
  }

  let client;
  try {
    client = new PgClient({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    console.log('正在连接...');
    await client.connect();
    console.log('✅ 阿里云 PolarDB 连接成功!\n');

    // 测试查询
    console.log('测试查询...');
    const versionResult = await client.query('SELECT version()');
    console.log(`数据库版本: ${versionResult.rows[0].version.split(',')[0]}`);

    // 获取表列表
    console.log('\n获取表列表...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n找到 ${tablesResult.rows.length} 个表:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // 获取表行数统计
    console.log('\n表行数统计:');
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        console.log(`  ${row.table_name}: ${countResult.rows[0].count} 行`);
      } catch (e) {
        console.log(`  ${row.table_name}: 无法获取行数 (${e.message})`);
      }
    }

    console.log('\n✅ 阿里云 PolarDB 数据库测试完成!');
    
  } catch (error) {
    console.error('❌ 阿里云 PolarDB 连接失败:');
    console.error(`  错误: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n提示: 连接被拒绝，可能原因:');
      console.error('  1. 主机地址或端口配置错误');
      console.error('  2. 阿里云数据库未开启公网访问');
      console.error('  3. IP 白名单未添加当前 IP');
    }
    
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
  
  return true;
}

// ============================================
// 主流程
// ============================================

async function main() {
  console.log('============================================');
  console.log('  律植 - 数据库连接测试工具');
  console.log('============================================');
  console.log('');

  console.log('注意: 此脚本需要网络访问权限来连接数据库');
  console.log('');

  // 测试 Supabase
  const supabaseOk = await testSupabase();

  // 测试阿里云
  const aliyunOk = await testAliyun();

  // 总结
  console.log('\n============================================');
  console.log('  测试结果总结');
  console.log('============================================');
  console.log(`Supabase: ${supabaseOk ? '✅ 成功' : '❌ 失败'}`);
  console.log(`阿里云: ${aliyunOk ? '✅ 成功' : '❌ 失败'}`);
  console.log('');

  if (supabaseOk && aliyunOk) {
    console.log('🎉 两个数据库连接都成功! 可以进行数据迁移了。');
    console.log('');
    console.log('下一步:');
    console.log('  1. 导出 Supabase 数据:');
    console.log('     node scripts/export-supabase-api.mjs');
    console.log('');
    console.log('  2. 导入阿里云 PolarDB:');
    console.log('     node scripts/import-to-aliyun.mjs');
    console.log('');
  } else {
    console.log('⚠️  部分连接失败，请检查配置后重试。');
    console.log('');
  }
}

main().catch(console.error);
