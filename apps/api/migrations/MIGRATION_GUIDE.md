-- ============================================
-- 数据库迁移执行指南
-- ============================================

-- 在执行迁移之前，请确保：

-- 1. 备份数据库（非常重要！）
--    pg_dump -h <host> -U <user> -d <database> > backup_before_v2.sql

-- 2. 在测试环境先执行，验证无误后再在生产环境执行

-- ============================================
-- 方式一：使用 psql 直接执行
-- ============================================

psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -U mamba_01 -d data01 -f 002_new_architecture.sql

-- 或指定编码
psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -U mamba_01 -d data01 --set=ON_ERROR_STOP=on -f 002_new_architecture.sql

-- ============================================
-- 方式二：使用 Docker 执行
-- ============================================

docker run --rm -it \
  -e PGPASSWORD='Wxwzcfwhf205' \
  postgres:15 psql \
  -h lvzhi-prod.pg.polardb.rds.aliyuncs.com \
  -U mamba_01 \
  -d data01 \
  -f 002_new_architecture.sql

-- ============================================
-- 方式三：在应用启动时自动执行（推荐开发环境）
-- ============================================

-- 在 .env 中设置
# DATABASE_AUTO_MIGRATE=true

-- 然后在代码中添加迁移执行逻辑
-- 注意：生产环境不建议自动迁移

-- ============================================
-- 验证迁移是否成功
-- ============================================

-- 检查表是否创建成功
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 检查关键表是否存在
SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'opportunities'
) as opportunities_exists;

SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'invitations'
) as invitations_exists;

SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'trials'
) as trials_exists;

SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'lawyer_profiles'
) as lawyer_profiles_exists;

SELECT EXISTS(
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'notifications'
) as notifications_exists;

-- 检查 profiles 表是否有新字段
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('creator_level', 'lawyer_verified', 'follower_count', 'balance');

-- 检查初始数据是否插入
SELECT * FROM creator_guides LIMIT 5;
SELECT * FROM community_topics LIMIT 5;

-- ============================================
-- 回滚方案（如果需要）
-- ============================================

-- 如果迁移出现问题，可以执行以下回滚

-- 删除新增的表（按依赖顺序）
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS lawyer_reviews;
DROP TABLE IF EXISTS lawyer_profiles;
DROP TABLE IF EXISTS creator_earnings;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS ip_applications;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS creator_verifications;
DROP TABLE IF EXISTS creator_guides;
DROP TABLE IF EXISTS trials;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS opportunities;

-- 回滚 profiles 表的新字段（谨慎操作！）
ALTER TABLE profiles DROP COLUMN IF EXISTS creator_level;
ALTER TABLE profiles DROP COLUMN IF EXISTS lawyer_verified;
ALTER TABLE profiles DROP COLUMN IF EXISTS lawyer_profile_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS follower_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS following_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS balance;

-- ============================================
-- 迁移后检查清单
-- ============================================

-- [ ] 所有新表已创建
-- [ ] profiles 表有新字段
-- [ ] 初始数据已插入（creator_guides, community_topics）
-- [ ] 触发器已创建
-- [ ] 索引已创建
-- [ ] 前端 API 调用正常
-- [ ] 旧路由兼容/重定向已配置
