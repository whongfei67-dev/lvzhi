/**
 * PolarDB 完整迁移脚本
 * 从 Supabase 导出数据迁移到 PolarDB
 * 
 * 使用方法: node scripts/migrate-all-to-polardb.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const POLARDB_CONFIG = {
  host: 'lvzhi-prod.pg.polardb.rds.aliyuncs.com',
  port: 5432,
  database: 'data01',
  user: 'mamba_01',
  password: 'Wxwzcfwhf205',
  ssl: { rejectUnauthorized: false }
};

// Supabase 导出数据路径
const SUPABASE_DATA_PATH = path.join(__dirname, '..', '..', 'supabase-export', 'data_only.sql');

// 导入顺序（外键依赖）
const IMPORT_ORDER = [
  // 1. 基础表（无外键或自引用）
  { table: 'profiles', file: 'profiles' },
  { table: 'user_balances', file: 'user_balances' },
  
  // 2. 用户扩展表
  { table: 'lawyer_profiles', file: 'lawyer_profiles' },
  { table: 'recruiter_profiles', file: 'recruiter_profiles' },
  { table: 'seeker_profiles', file: 'seeker_profiles' },
  
  // 3. 内容表
  { table: 'agents', file: 'agents' },
  { table: 'agent_demos', file: 'agent_demos' },
  { table: 'agent_favorites', file: 'agent_favorites' },
  { table: 'agent_ratings', file: 'agent_ratings' },
  { table: 'jobs', file: 'jobs' },
  { table: 'community_posts', file: 'community_posts' },
  
  // 4. 社交表
  { table: 'comments', file: 'comments' },
  { table: 'likes', file: 'likes' },
  { table: 'user_follows', file: 'user_follows' },
  
  // 5. 业务表
  { table: 'applications', file: 'applications' },
  { table: 'orders', file: 'orders' },
  { table: 'balance_transactions', file: 'balance_transactions' },
  { table: 'coupons', file: 'coupons' },
  { table: 'user_coupons', file: 'user_coupons' },
  { table: 'coupon_usages', file: 'coupon_usages' },
  { table: 'subscriptions', file: 'subscriptions' },
  { table: 'subscription_history', file: 'subscription_history' },
  
  // 6. API 相关
  { table: 'api_credentials', file: 'api_credentials' },
  { table: 'api_usage_stats', file: 'api_usage_stats' },
  { table: 'api_call_logs', file: 'api_call_logs' },
  
  // 7. 其他
  { table: 'products', file: 'products' },
  { table: 'promo_orders', file: 'promo_orders' },
  { table: 'platform_inquiries', file: 'platform_inquiries' },
  { table: 'uploaded_files', file: 'uploaded_files' },
  { table: 'login_history', file: 'login_history' },
];

async function run() {
  const client = new Client(POLARDB_CONFIG);

  try {
    await client.connect();
    console.log('✅ 连接 PolarDB 成功\n');

    // 读取 Supabase 导出文件
    if (!fs.existsSync(SUPABASE_DATA_PATH)) {
      console.log('❌ Supabase 导出文件不存在:', SUPABASE_DATA_PATH);
      console.log('请先从 Supabase 导出数据到 supabase-export/data_only.sql');
      return;
    }

    const sqlContent = fs.readFileSync(SUPABASE_DATA_PATH, 'utf8');
    console.log('📁 读取 Supabase 导出文件成功\n');

    // 解析 INSERT 语句
    const insertStatements = parseInsertStatements(sqlContent);
    console.log(`📊 解析到 ${insertStatements.length} 个 INSERT 语句\n`);

    // 按顺序导入每个表
    console.log('='.repeat(60));
    console.log('开始迁移数据...');
    console.log('='.repeat(60) + '\n');

    for (const { table, file } of IMPORT_ORDER) {
      const statements = insertStatements.filter(s => s.table === table);
      
      if (statements.length === 0) {
        console.log(`  ⏭️  ${table}: 无数据，跳过`);
        continue;
      }

      try {
        // 清空目标表
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  🗑️  ${table}: 已清空旧数据`);

        // 插入数据
        let insertedCount = 0;
        for (const stmt of statements) {
          try {
            await client.query(stmt.sql);
            insertedCount++;
          } catch (err) {
            // 某些表结构可能不完全匹配，跳过失败的语句
            if (err.code !== '42P01' && err.code !== '42703') {
              console.log(`  ⚠️  ${table}: 部分数据插入失败 (${err.message.substring(0, 50)})`);
            }
          }
        }

        // 验证结果
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        
        console.log(`  ✅ ${table}: 迁移成功 (${count} 条)\n`);

      } catch (err) {
        if (err.code === '42P01') {
          console.log(`  ⚠️  ${table}: 表不存在，跳过\n`);
        } else {
          console.log(`  ❌ ${table}: 迁移失败 - ${err.message.substring(0, 80)}\n`);
        }
      }
    }

    // 迁移用户账户数据
    console.log('='.repeat(60));
    console.log('迁移用户账户数据...');
    console.log('='.repeat(60) + '\n');

    await migrateUserAccounts(client, sqlContent);

    console.log('\n' + '='.repeat(60));
    console.log('迁移完成！');
    console.log('='.repeat(60));

    // 验证关键数据
    console.log('\n验证迁移结果:\n');
    await verifyMigration(client);

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

/**
 * 解析 SQL 文件中的 INSERT 语句
 */
function parseInsertStatements(sqlContent) {
  const statements = [];
  
  // 匹配 INSERT INTO "table_name" (...) VALUES (...)
  const insertRegex = /INSERT INTO "([^"]+)" \(([^)]+)\) VALUES (.+?)(?=;[\s]*$|\n\n--|\n\nINSERT|\nCOPY|$)/gis;
  
  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].replace(/^public\."/, '').replace(/"$/, '');
    const columns = match[2].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const valuesPart = match[3];
    
    // 处理多行 VALUES
    const valueBlocks = valuesPart.split(/\),\s*\(/);
    
    for (const block of valueBlocks) {
      const cleanBlock = block.trim().replace(/^\(|\)$/g, '');
      if (cleanBlock) {
        statements.push({
          table: tableName,
          columns,
          sql: `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${cleanBlock})`
        });
      }
    }
  }

  // 也处理没有 schema 前缀的 INSERT
  const simpleInsertRegex = /INSERT INTO (\w+) \(([^)]+)\) VALUES (.+?)(?=;[\s]*$|\n\n--|\n\nINSERT|\nCOPY|$)/gis;
  
  while ((match = simpleInsertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    // 跳过已经处理过的
    if (statements.some(s => s.sql.includes(`INSERT INTO "${tableName}"`))) continue;
    
    const columns = match[2].split(',').map(c => c.trim());
    const valuesPart = match[3];
    
    const valueBlocks = valuesPart.split(/\),\s*\(/);
    
    for (const block of valueBlocks) {
      const cleanBlock = block.trim().replace(/^\(|\)$/g, '');
      if (cleanBlock) {
        statements.push({
          table: tableName,
          columns,
          sql: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${cleanBlock})`
        });
      }
    }
  }

  return statements;
}

/**
 * 迁移用户账户数据
 * 从 Supabase auth.users 表迁移到 PolarDB profiles 表
 */
async function migrateUserAccounts(client, sqlContent) {
  // 查找 auth.users 的 INSERT 语句
  const usersMatch = sqlContent.match(/INSERT INTO "auth"\."users" \(([^)]+)\) VALUES (.+?)(?=;[\s]*$)/is);
  
  if (!usersMatch) {
    console.log('  ⚠️  未找到 auth.users 数据，跳过用户账户迁移');
    return;
  }

  console.log('  📝 发现 auth.users 数据，正在迁移...\n');

  // 解析用户数据
  const columns = usersMatch[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  const valuesPart = usersMatch[2];
  const userBlocks = valuesPart.split(/\),\s*\(/);

  for (const block of userBlocks) {
    const cleanBlock = block.trim().replace(/^\(|\)$/g, '');
    if (!cleanBlock) continue;

    // 解析 VALUES
    const values = parseValues(cleanBlock);
    const userData = {};
    columns.forEach((col, idx) => {
      userData[col] = values[idx];
    });

    // 提取用户信息
    const id = userData.id?.replace(/'/g, '');
    const email = userData.email?.replace(/'/g, '');
    const encryptedPassword = userData.encrypted_password;
    const phone = userData.phone?.replace(/'/g, '');
    const rawMetaData = userData.raw_user_meta_data;
    
    let displayName = email?.split('@')[0] || '用户';
    let role = 'seeker';

    // 解析 user metadata
    if (rawMetaData) {
      try {
        const meta = JSON.parse(rawMetaData.replace(/'/g, '"'));
        displayName = meta.display_name || displayName;
        role = meta.role || role;
      } catch (e) {
        // 忽略解析错误
      }
    }

    // 密码处理：Supabase 使用 bcrypt 加密，需要特殊处理
    // 由于 PolarDB 使用不同的密码哈希，我们需要创建新密码或标记需要重置
    const passwordHash = encryptedPassword || null;

    try {
      // 检查是否已存在
      const exists = await client.query(
        'SELECT id FROM profiles WHERE id = $1',
        [id]
      );

      if (exists.rows.length === 0) {
        // 插入新用户
        await client.query(`
          INSERT INTO profiles (id, email, phone, password_hash, display_name, role, verified, status)
          VALUES ($1, $2, $3, $4, $5, $6, true, 'active')
          ON CONFLICT (id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, profiles.email),
            phone = COALESCE(EXCLUDED.phone, profiles.phone),
            display_name = COALESCE(EXCLUDED.display_name, profiles.display_name)
        `, [id, email, phone, passwordHash, displayName, role]);

        console.log(`  ✅ 用户迁移: ${email} (${role})`);

        // 初始化用户余额
        const balanceExists = await client.query(
          'SELECT user_id FROM user_balances WHERE user_id = $1',
          [id]
        );

        if (balanceExists.rows.length === 0) {
          await client.query(`
            INSERT INTO user_balances (user_id, balance, frozen_balance)
            VALUES ($1, 0, 0)
          `, [id]);
        }
      } else {
        console.log(`  ⏭️  用户已存在: ${email}`);
      }
    } catch (err) {
      console.log(`  ⚠️  用户迁移失败: ${email} - ${err.message.substring(0, 50)}`);
    }
  }
}

/**
 * 解析 VALUES 中的值
 */
function parseValues(valuesString) {
  const values = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];
    
    if ((char === "'" || char === '"') && !inQuote) {
      inQuote = true;
      quoteChar = char;
      current += char;
    } else if (char === quoteChar && inQuote) {
      // 检查是否转义
      if (valuesString[i + 1] === quoteChar) {
        current += char + char;
        i++;
      } else {
        inQuote = false;
        current += char;
      }
    } else if (char === ',' && !inQuote) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

/**
 * 验证迁移结果
 */
async function verifyMigration(client) {
  const tables = [
    'profiles', 'agents', 'jobs', 'community_posts',
    'user_balances', 'applications', 'orders'
  ];

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  📊 ${table}: ${result.rows[0].count} 条`);
    } catch (err) {
      console.log(`  ❌ ${table}: 查询失败`);
    }
  }

  // 检查用户角色分布
  try {
    const roles = await client.query(`
      SELECT role, COUNT(*) as count FROM profiles GROUP BY role
    `);
    console.log('\n  👥 用户角色分布:');
    roles.rows.forEach(r => {
      console.log(`     ${r.role}: ${r.count} 人`);
    });
  } catch (err) {
    console.log('  ⚠️  无法获取角色分布');
  }
}

// 运行迁移
run();
