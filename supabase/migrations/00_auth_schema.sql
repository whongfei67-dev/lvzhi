-- =============================================================
-- 为独立 PostgreSQL 创建 Supabase 兼容的 auth 模块
-- 在运行其他迁移前先执行此脚本
-- =============================================================

-- 创建 auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- 创建基础 users 表（兼容 Supabase auth.users）
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 允许 public 访问
GRANT USAGE ON SCHEMA auth TO lvzhi;
GRANT ALL ON auth.users TO lvzhi;

-- 设置 search_path
ALTER DATABASE lvzhi SET search_path TO public, auth;

-- 创建公开别名（可选，方便查询）
CREATE OR REPLACE VIEW auth.user AS SELECT * FROM auth.users;
