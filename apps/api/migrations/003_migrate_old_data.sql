-- ============================================
-- 旧数据迁移脚本
-- 版本: v1.0
-- 说明: 将旧表数据迁移到新表结构
-- 执行时间: 2026-04-08
-- ============================================

-- ============================================
-- 重要提醒：
-- 1. 执行前请务必备份数据库！
-- 2. 建议在测试环境先执行验证
-- 3. 此脚本会修改数据，请谨慎操作
-- ============================================

BEGIN;

-- ============================================
-- 步骤1: 检查旧表是否存在
-- ============================================

DO $$
DECLARE
  old_jobs_exist BOOLEAN;
  old_cooperation_exist BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs'
  ) INTO old_jobs_exist;
  
  SELECT EXISTS(
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cooperation_invitations'
  ) INTO old_cooperation_exist;
  
  RAISE NOTICE 'jobs 表存在: %', old_jobs_exist;
  RAISE NOTICE 'cooperation_invitations 表存在: %', old_cooperation_exist;
END $$;

-- ============================================
-- 步骤2: 迁移 jobs 表到 opportunities 表
-- ============================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- 检查 jobs 表是否存在
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs'
  ) THEN
    -- 迁移 jobs 数据到 opportunities
    INSERT INTO opportunities (
      publisher_id,
      publisher_role,
      title,
      slug,
      summary,
      description,
      location,
      opportunity_type,
      category,
      status,
      view_count,
      application_count,
      created_at,
      updated_at
    )
    SELECT 
      j.recruiter_id,
      'client', -- 旧版没有 publisher_role，默认设为 client
      j.title,
      LOWER(REPLACE(j.title, ' ', '-')) || '-' || j.id::text,
      LEFT(j.description, 500), -- 截取前500字符作为摘要
      j.description,
      j.location,
      CASE j.job_type 
        WHEN 'full_time' THEN 'job'
        WHEN 'part_time' THEN 'job'
        WHEN 'contract' THEN 'project'
        WHEN 'internship' THEN 'job'
        ELSE 'job'
      END AS opportunity_type,
      j.specialty,
      CASE j.status 
        WHEN 'active' THEN 'published'
        WHEN 'closed' THEN 'closed'
        WHEN 'draft' THEN 'draft'
        ELSE 'pending_review'
      END AS status,
      COALESCE(j.view_count, 0),
      COALESCE(j.application_count, 0),
      j.created_at,
      COALESCE(j.updated_at, NOW())
    FROM jobs j
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunities o 
      WHERE o.title = j.title 
        AND o.publisher_id = j.recruiter_id
        AND o.created_at = j.created_at
    );
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '从 jobs 迁移了 % 条记录到 opportunities', migrated_count;
  ELSE
    RAISE NOTICE 'jobs 表不存在，跳过迁移';
  END IF;
END $$;

-- ============================================
-- 步骤3: 迁移 cooperation_invitations 表到 invitations 表
-- ============================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- 检查旧表是否存在
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cooperation_invitations'
  ) THEN
    -- 迁移合作邀请数据
    INSERT INTO invitations (
      sender_id,
      sender_role,
      receiver_id,
      receiver_role,
      source_type,
      source_id,
      invitation_type,
      message,
      status,
      created_at,
      updated_at
    )
    SELECT 
      ci.from_user_id,
      'client', -- 旧版没有 sender_role
      ci.to_user_id,
      'client', -- 旧版没有 receiver_role
      'creator_profile', -- 旧版没有 source_type，默认设为 creator_profile
      ci.to_user_id, -- 旧版没有 source_id，使用 to_user_id 作为占位
      CASE ci.type 
        WHEN 'collaboration' THEN 'collaboration'
        WHEN 'job' THEN 'job'
        ELSE 'collaboration'
      END AS invitation_type,
      ci.message,
      CASE ci.status 
        WHEN 'pending' THEN 'pending'
        WHEN 'accepted' THEN 'accepted'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'negotiating' THEN 'negotiating'
        ELSE 'pending'
      END AS status,
      ci.created_at,
      COALESCE(ci.updated_at, NOW())
    FROM cooperation_invitations ci
    WHERE NOT EXISTS (
      SELECT 1 FROM invitations i 
      WHERE i.sender_id = ci.from_user_id 
        AND i.receiver_id = ci.to_user_id
        AND i.created_at = ci.created_at
    );
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '从 cooperation_invitations 迁移了 % 条记录到 invitations', migrated_count;
  ELSE
    RAISE NOTICE 'cooperation_invitations 表不存在，跳过迁移';
  END IF;
END $$;

-- ============================================
-- 步骤4: 迁移 trial_invitations 表到 trials 表
-- ============================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trial_invitations'
  ) THEN
    INSERT INTO trials (
      creator_id,
      target_user_id,
      source_type,
      source_id,
      message,
      status,
      expires_at,
      responded_at,
      created_at,
      updated_at
    )
    SELECT 
      ti.from_user_id,
      ti.to_user_id,
      'agent', -- 旧版 trial_invitations 没有 source_type，默认设为 agent
      ti.agent_id,
      ti.message,
      CASE ti.status 
        WHEN 'pending' THEN 'pending'
        WHEN 'accepted' THEN 'accepted'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'expired' THEN 'expired'
        WHEN 'completed' THEN 'completed'
        ELSE 'pending'
      END AS status,
      ti.expires_at,
      ti.responded_at,
      ti.created_at,
      COALESCE(ti.updated_at, NOW())
    FROM trial_invitations ti
    WHERE NOT EXISTS (
      SELECT 1 FROM trials t 
      WHERE t.creator_id = ti.from_user_id 
        AND t.target_user_id = ti.to_user_id
        AND t.source_id = ti.agent_id
        AND t.created_at = ti.created_at
    );
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '从 trial_invitations 迁移了 % 条记录到 trials', migrated_count;
  ELSE
    RAISE NOTICE 'trial_invitations 表不存在，跳过迁移';
  END IF;
END $$;

-- ============================================
-- 步骤5: 更新 lawyer_profiles 表数据
-- ============================================

DO $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- 从 profiles 表迁移律师相关字段到 lawyer_profiles
  UPDATE lawyer_profiles lp
  SET 
    name = COALESCE(lp.name, p.display_name),
    slug = COALESCE(lp.slug, LOWER(REPLACE(p.display_name, ' ', '-')) || '-' || lp.user_id::text),
    expertise = COALESCE(lp.expertise, p.specialty),
    city = COALESCE(lp.city, '未知'),
    years_of_practice = COALESCE(lp.years_of_practice, 0)
  FROM profiles p
  WHERE lp.user_id = p.id
    AND (lp.name IS NULL OR lp.name = '' OR p.display_name IS NOT NULL);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '更新了 % 条 lawyer_profiles 记录', updated_count;
END $$;

-- ============================================
-- 步骤6: 验证迁移结果
-- ============================================

DO $$
DECLARE
  opp_count INTEGER;
  inv_count INTEGER;
  trial_count INTEGER;
  lawyer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO opp_count FROM opportunities;
  SELECT COUNT(*) INTO inv_count FROM invitations;
  SELECT COUNT(*) INTO trial_count FROM trials;
  SELECT COUNT(*) INTO lawyer_count FROM lawyer_profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '========== 迁移完成统计 ==========';
  RAISE NOTICE 'opportunities 表记录数: %', opp_count;
  RAISE NOTICE 'invitations 表记录数: %', inv_count;
  RAISE NOTICE 'trials 表记录数: %', trial_count;
  RAISE NOTICE 'lawyer_profiles 表记录数: %', lawyer_count;
  RAISE NOTICE '=================================';
END $$;

-- ============================================
-- 提交事务
-- ============================================

COMMIT;

-- ============================================
-- 迁移后建议
-- ============================================

/*
1. 验证数据完整性
   SELECT * FROM opportunities LIMIT 10;
   SELECT * FROM invitations LIMIT 10;
   SELECT * FROM trials LIMIT 10;

2. 检查数据一致性
   - 确认 publisher_id 在 profiles 表中存在
   - 确认 sender_id/receiver_id 在 profiles 表中存在

3. 可选：删除旧表（建议保留一段时间后再删除）
   DROP TABLE IF EXISTS jobs;
   DROP TABLE IF EXISTS cooperation_invitations;
   DROP TABLE IF EXISTS trial_invitations;

4. 可选：创建旧表到新表的视图别名（兼容性）
   CREATE OR REPLACE VIEW jobs_view AS SELECT * FROM opportunities;
   CREATE OR REPLACE VIEW cooperation_invitations_view AS SELECT * FROM invitations;

5. 更新前端代码使用新的 API 接口
*/
