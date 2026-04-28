-- ============================================
-- 008: 权限系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 权限表
-- ──────────────────────────────────────────
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource_type TEXT, -- 'user', 'agent', 'post', 'order', 'system'
  action TEXT, -- 'create', 'read', 'update', 'delete', 'manage'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_resource ON permissions(resource_type);

COMMENT ON TABLE permissions IS '权限表：定义系统中所有可用权限';
COMMENT ON COLUMN permissions.name IS '权限标识：如 manage_users, review_agents, access_analytics';

-- ──────────────────────────────────────────
-- 2. 角色权限关联表
-- ──────────────────────────────────────────
CREATE TABLE role_permissions (
  role TEXT NOT NULL CHECK (role IN ('seeker', 'creator', 'recruiter', 'client', 'admin')),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);

COMMENT ON TABLE role_permissions IS '角色权限：定义每个角色的默认权限';

-- ──────────────────────────────────────────
-- 3. 用户特殊权限表
-- ──────────────────────────────────────────
CREATE TABLE user_permissions (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE user_permissions IS '用户特殊权限：覆盖角色默认权限';
COMMENT ON COLUMN user_permissions.granted IS 'true=授予权限, false=撤销权限';
COMMENT ON COLUMN user_permissions.expires_at IS '权限过期时间，NULL表示永久';

-- ──────────────────────────────────────────
-- 4. 检查用户权限的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  -- 获取用户角色
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- 管理员拥有所有权限
  IF v_user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- 检查用户特殊权限（优先级最高）
  SELECT granted INTO v_has_permission
  FROM user_permissions up
  JOIN permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id
    AND p.name = p_permission_name
    AND (up.expires_at IS NULL OR up.expires_at > NOW());

  IF FOUND THEN
    RETURN v_has_permission;
  END IF;

  -- 检查角色默认权限
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_role
      AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_permission IS '检查用户是否拥有指定权限';

-- ──────────────────────────────────────────
-- 5. 初始化基础权限
-- ──────────────────────────────────────────
INSERT INTO permissions (name, description, resource_type, action) VALUES
  -- 用户管理
  ('manage_users', '管理用户账号', 'user', 'manage'),
  ('view_user_details', '查看用户详细信息', 'user', 'read'),
  ('ban_users', '封禁用户', 'user', 'update'),

  -- 智能体管理
  ('create_agent', '创建智能体', 'agent', 'create'),
  ('publish_agent', '发布智能体', 'agent', 'update'),
  ('review_agents', '审核智能体', 'agent', 'manage'),
  ('delete_any_agent', '删除任意智能体', 'agent', 'delete'),

  -- 帖子管理
  ('create_post', '发布帖子', 'post', 'create'),
  ('create_paid_post', '发布付费帖子', 'post', 'create'),
  ('review_posts', '审核帖子', 'post', 'manage'),
  ('delete_any_post', '删除任意帖子', 'post', 'delete'),

  -- 职位管理
  ('create_job', '发布职位', 'job', 'create'),
  ('review_jobs', '审核职位', 'job', 'manage'),

  -- 订单管理
  ('view_own_orders', '查看自己的订单', 'order', 'read'),
  ('view_all_orders', '查看所有订单', 'order', 'read'),
  ('refund_orders', '退款订单', 'order', 'update'),

  -- 系统管理
  ('access_analytics', '访问数据分析', 'system', 'read'),
  ('manage_coupons', '管理优惠券', 'system', 'manage'),
  ('manage_permissions', '管理权限', 'system', 'manage');

-- ──────────────────────────────────────────
-- 6. 初始化角色权限
-- ──────────────────────────────────────────
-- Seeker（求职者）
INSERT INTO role_permissions (role, permission_id)
SELECT 'seeker', id FROM permissions WHERE name IN (
  'create_post',
  'view_own_orders'
);

-- Creator（创作者）
INSERT INTO role_permissions (role, permission_id)
SELECT 'creator', id FROM permissions WHERE name IN (
  'create_agent',
  'publish_agent',
  'create_post',
  'create_paid_post',
  'view_own_orders'
);

-- Recruiter（招聘方）
INSERT INTO role_permissions (role, permission_id)
SELECT 'recruiter', id FROM permissions WHERE name IN (
  'create_job',
  'view_own_orders'
);

-- Client（法律需求方）
INSERT INTO role_permissions (role, permission_id)
SELECT 'client', id FROM permissions WHERE name IN (
  'create_post',
  'view_own_orders'
);

-- Admin（管理员）- 拥有所有权限，通过 has_permission 函数直接返回 true

-- ──────────────────────────────────────────
-- 7. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions: 所有人可查看权限列表
CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT USING (true);

-- Role Permissions: 所有人可查看角色权限
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT USING (true);

-- User Permissions: 用户可查看自己的特殊权限，管理员可管理
CREATE POLICY "user_permissions_select_own" ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_permissions_manage_admin" ON user_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
