/**
 * 数据库修复工具
 * 运行方式: npx tsx scripts/fix-auth-db.ts
 */

import { query } from '../apps/api/src/lib/database.js';
import { hashPassword } from '../apps/api/src/utils/password.js';
import crypto from 'crypto';

function genId(): string {
  return crypto.randomUUID();
}

async function fixAuthSchema() {
  console.log('🔧 开始修复认证数据库...');

  try {
    // 1. 添加缺失的列
    console.log('📝 添加缺失的列到 profiles 表...');
    
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
          ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'password_hash') THEN
          ALTER TABLE profiles ADD COLUMN password_hash TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'failed_attempts') THEN
          ALTER TABLE profiles ADD COLUMN failed_attempts INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'locked_until') THEN
          ALTER TABLE profiles ADD COLUMN locked_until TIMESTAMPTZ;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
          ALTER TABLE profiles ADD COLUMN phone TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
          ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
          ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;
    `);
    console.log('✅ 列添加完成');

    // 1.5 确保 email 有唯一约束
    console.log('🔑 确保 email 唯一约束...');
    // 先给没有 email 的用户生成临时 email
    await query(`
      UPDATE profiles 
      SET email = 'user_' || id || '@placeholder.local'
      WHERE email IS NULL
    `);
    // 删除可能存在的旧索引和约束
    await query(`DROP INDEX IF EXISTS idx_profiles_email;`);
    // 创建唯一索引
    await query(`CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);`);
    console.log('✅ 唯一约束添加完成');

    // 2. 检查并移除对外键的依赖
    console.log('🔗 检查外键约束...');
    try {
      await query(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;`);
      console.log('✅ 外键已移除');
    } catch (e) {
      console.log('ℹ️ 无需移除外键或已不存在');
    }

    // 3. 创建测试账户
    console.log('👤 创建测试账户...');
    const hashedPassword = hashPassword('Test123456');
    const testUserId = genId();
    
    await query(`
      INSERT INTO profiles (id, email, password_hash, display_name, role, verified)
      VALUES ($1, $2, $3, $4, 'seeker', true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name
    `, [testUserId, 'test@lvzhi.com', hashedPassword, '测试用户']);

    // 创建管理员
    const adminHashedPassword = hashPassword('Admin123!');
    const adminId = genId();
    await query(`
      INSERT INTO profiles (id, email, password_hash, display_name, role, verified)
      VALUES ($1, $2, $3, $4, 'admin', true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'admin'
    `, [adminId, 'admin@lvzhi.com', adminHashedPassword, '管理员']);

    console.log('✅ 测试账户创建完成');

    // 4. 确保用户有余额
    console.log('💰 初始化余额...');
    await query(`
      INSERT INTO user_balances (user_id, balance, frozen_balance)
      SELECT id, 100, 0 FROM profiles WHERE email IN ('test@lvzhi.com', 'admin@lvzhi.com')
      ON CONFLICT (user_id) DO NOTHING
    `);
    console.log('✅ 余额初始化完成');

    // 5. 验证
    console.log('\n📊 验证结果:');
    const users = await query(`SELECT email, role, verified FROM profiles LIMIT 10`);
    console.table(users.rows);

    console.log('\n🎉 认证数据库修复完成!');
    console.log('\n测试账户:');
    console.log('  用户: test@lvzhi.com / Test123456');
    console.log('  管理员: admin@lvzhi.com / Admin123!');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

fixAuthSchema();
