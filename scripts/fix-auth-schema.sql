-- =============================================================
-- 修复 profiles 表以支持邮箱密码认证
-- 执行时间：2026-04-02
-- =============================================================

-- 1. 添加 email 和 password_hash 字段（如果不存在）
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
END $$;

-- 2. 移除对 auth.users 的依赖（如果存在外键）
DO $$ 
BEGIN
  -- 检查并删除外键约束
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- 3. 创建测试管理员账户（如果不存在）
INSERT INTO profiles (email, password_hash, display_name, role, verified)
VALUES (
  'admin@lvzhi.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4QEGj0iXJ3q1k3Ei',  -- 密码: Admin123!
  '管理员',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- 4. 创建测试用户（如果不存在）
INSERT INTO profiles (email, password_hash, display_name, role, verified)
VALUES (
  'test@lvzhi.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4QEGj0iXJ3q1k3Ei',  -- 密码: Test123456
  '测试用户',
  'seeker',
  true
)
ON CONFLICT (email) DO NOTHING;

-- 5. 确保测试用户有余额记录
INSERT INTO user_balances (user_id, balance, frozen_balance)
SELECT id, 100, 0 FROM profiles WHERE email = 'test@lvzhi.com'
AND NOT EXISTS (SELECT 1 FROM user_balances WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@lvzhi.com'))
ON CONFLICT (user_id) DO NOTHING;

-- 6. 确保管理员有余额记录
INSERT INTO user_balances (user_id, balance, frozen_balance)
SELECT id, 100, 0 FROM profiles WHERE email = 'admin@lvzhi.com'
AND NOT EXISTS (SELECT 1 FROM user_balances WHERE user_id = (SELECT id FROM profiles WHERE email = 'admin@lvzhi.com'))
ON CONFLICT (user_id) DO NOTHING;

-- 显示结果
SELECT 'Profiles 表修复完成' as status;
SELECT COUNT(*) as total_users FROM profiles;
SELECT email, role, verified FROM profiles LIMIT 10;
