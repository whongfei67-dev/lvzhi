-- ============================================
-- 011: 用户认证系统增强
-- ============================================

-- ──────────────────────────────────────────
-- 1. 登录历史记录表
-- ──────────────────────────────────────────
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_method TEXT NOT NULL CHECK (login_method IN ('password', 'oauth', 'magic_link', 'sms')),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  location JSONB, -- {country, city, region}
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id, created_at DESC);
CREATE INDEX idx_login_history_ip ON login_history(ip_address, created_at DESC);

COMMENT ON TABLE login_history IS '登录历史：记录所有登录尝试';
COMMENT ON COLUMN login_history.location IS '登录地理位置信息';

-- ──────────────────────────────────────────
-- 2. 邮箱验证记录表
-- ──────────────────────────────────────────
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_code ON email_verifications(verification_code) WHERE verified = false;

COMMENT ON TABLE email_verifications IS '邮箱验证记录：用于注册和更换邮箱';

-- ──────────────────────────────────────────
-- 3. 密码重置记录表
-- ──────────────────────────────────────────
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reset_token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id, created_at DESC);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token) WHERE used = false;

COMMENT ON TABLE password_resets IS '密码重置记录：用于找回密码';

-- ──────────────────────────────────────────
-- 4. 安全事件记录表
-- ──────────────────────────────────────────
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'password_changed',
    'email_changed',
    'suspicious_login',
    'account_locked',
    'account_unlocked',
    'two_factor_enabled',
    'two_factor_disabled'
  )),
  description TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);

COMMENT ON TABLE security_events IS '安全事件记录：密码修改、异常登录等';

-- ──────────────────────────────────────────
-- 5. 账号锁定记录表
-- ──────────────────────────────────────────
CREATE TABLE account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lock_reason TEXT NOT NULL CHECK (lock_reason IN (
    'too_many_failed_logins',
    'suspicious_activity',
    'admin_action',
    'user_request'
  )),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unlock_token TEXT UNIQUE,
  unlocked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_account_locks_user ON account_locks(user_id, locked_at DESC);
CREATE INDEX idx_account_locks_active ON account_locks(user_id) WHERE unlocked_at IS NULL;

COMMENT ON TABLE account_locks IS '账号锁定记录：失败登录次数过多、可疑活动等';

-- ──────────────────────────────────────────
-- 6. OAuth 连接记录表
-- ──────────────────────────────────────────
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'wechat', 'dingtalk')),
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  access_token TEXT, -- 加密存储
  refresh_token TEXT, -- 加密存储
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_connections_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider, provider_user_id);

COMMENT ON TABLE oauth_connections IS 'OAuth 第三方登录连接记录';

-- ──────────────────────────────────────────
-- 7. 会话管理表
-- ──────────────────────────────────────────
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, last_activity_at DESC);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS '用户会话管理：支持多设备登录和会话控制';

-- ──────────────────────────────────────────
-- 8. 触发器：记录登录历史
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- 这个函数需要在应用层调用，因为 Supabase Auth 不会自动触发
  -- 仅作为示例，实际使用时在登录成功后手动插入记录
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────
-- 9. 检查账号是否被锁定的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM account_locks
    WHERE user_id = p_user_id
      AND unlocked_at IS NULL
      AND (locked_until IS NULL OR locked_until > NOW())
  ) INTO v_locked;

  RETURN v_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_account_locked IS '检查账号是否被锁定';

-- ──────────────────────────────────────────
-- 10. 记录失败登录并自动锁定账号
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_failed_login(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_count INTEGER;
  v_should_lock BOOLEAN := false;
BEGIN
  -- 记录失败登录
  INSERT INTO login_history (
    user_id,
    login_method,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    'password',
    p_ip_address,
    p_user_agent,
    false,
    'Invalid credentials'
  );

  -- 统计最近 15 分钟内的失败次数
  SELECT COUNT(*) INTO v_failed_count
  FROM login_history
  WHERE user_id = p_user_id
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';

  -- 超过 5 次失败则锁定账号 30 分钟
  IF v_failed_count >= 5 THEN
    INSERT INTO account_locks (
      user_id,
      lock_reason,
      locked_until,
      metadata
    ) VALUES (
      p_user_id,
      'too_many_failed_logins',
      NOW() + INTERVAL '30 minutes',
      jsonb_build_object('failed_count', v_failed_count, 'ip_address', p_ip_address::text)
    );

    -- 记录安全事件
    INSERT INTO security_events (
      user_id,
      event_type,
      description,
      ip_address
    ) VALUES (
      p_user_id,
      'account_locked',
      '连续登录失败 ' || v_failed_count || ' 次，账号已锁定 30 分钟',
      p_ip_address
    );

    v_should_lock := true;
  END IF;

  RETURN v_should_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_failed_login IS '处理失败登录：记录并在必要时锁定账号';

-- ──────────────────────────────────────────
-- 11. 生成密码重置令牌
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_password_reset_token(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- 生成随机令牌
  v_token := encode(gen_random_bytes(32), 'base64');

  -- 插入重置记录
  INSERT INTO password_resets (
    user_id,
    reset_token,
    expires_at,
    ip_address
  ) VALUES (
    p_user_id,
    v_token,
    NOW() + INTERVAL '1 hour',
    p_ip_address
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_password_reset_token IS '生成密码重置令牌（有效期 1 小时）';

-- ──────────────────────────────────────────
-- 12. 验证密码重置令牌
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_password_reset_token(p_token TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  message TEXT
) AS $$
DECLARE
  v_reset RECORD;
BEGIN
  SELECT * INTO v_reset
  FROM password_resets
  WHERE reset_token = p_token
    AND used = false
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, '重置令牌无效或已过期';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_reset.user_id, '令牌有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_password_reset_token IS '验证密码重置令牌';

-- ──────────────────────────────────────────
-- 13. 清理过期数据的函数（需配合定时任务）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
  -- 删除过期的邮箱验证记录（保留 7 天）
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- 删除过期的密码重置记录（保留 7 天）
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- 删除过期的会话（保留 30 天）
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '30 days';

  -- 删除旧的登录历史（保留 90 天）
  DELETE FROM login_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_auth_data IS '清理过期的认证数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 14. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Login History: 用户只能查看自己的登录历史
CREATE POLICY "login_history_select_own" ON login_history
  FOR SELECT USING (user_id = auth.uid());

-- Email Verifications: 用户只能查看自己的验证记录
CREATE POLICY "email_verifications_select_own" ON email_verifications
  FOR SELECT USING (user_id = auth.uid());

-- Password Resets: 不允许直接查询（通过函数验证）
CREATE POLICY "password_resets_no_select" ON password_resets
  FOR SELECT USING (false);

-- Security Events: 用户只能查看自己的安全事件
CREATE POLICY "security_events_select_own" ON security_events
  FOR SELECT USING (user_id = auth.uid());

-- Account Locks: 用户只能查看自己的锁定记录
CREATE POLICY "account_locks_select_own" ON account_locks
  FOR SELECT USING (user_id = auth.uid());

-- OAuth Connections: 用户只能查看和管理自己的 OAuth 连接
CREATE POLICY "oauth_connections_select_own" ON oauth_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "oauth_connections_delete_own" ON oauth_connections
  FOR DELETE USING (user_id = auth.uid());

-- User Sessions: 用户只能查看和管理自己的会话
CREATE POLICY "user_sessions_select_own" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_sessions_delete_own" ON user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ──────────────────────────────────────────
-- 15. 管理员策略
-- ──────────────────────────────────────────
-- 管理员可以查看所有认证相关数据
CREATE POLICY "login_history_admin_all" ON login_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "security_events_admin_all" ON security_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "account_locks_admin_all" ON account_locks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
