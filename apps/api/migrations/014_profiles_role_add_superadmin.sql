-- Phase 4: 允许 profiles.role 使用 superadmin
-- 说明：修复历史约束未包含 superadmin 导致角色回写失败的问题

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    role = ANY (
      ARRAY[
        'seeker'::text,
        'creator'::text,
        'recruiter'::text,
        'client'::text,
        'admin'::text,
        'superadmin'::text
      ]
    )
  );
