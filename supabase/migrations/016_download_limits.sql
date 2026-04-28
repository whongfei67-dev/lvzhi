-- ============================================
-- 016: 下载限制系统升级
-- 免费用户：终身累计 20 次上限
-- 付费用户：订阅期内不限次数
-- IP 限制：同一 IP 免费下载累计 30 次上限
-- ============================================

-- ──────────────────────────────────────────
-- 1. 升级 user_download_quotas 表
-- ──────────────────────────────────────────
ALTER TABLE user_download_quotas
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_lifetime_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_total_limit INTEGER DEFAULT 20;

COMMENT ON COLUMN user_download_quotas.is_paid IS '是否处于有效付费订阅期（由触发器维护）';
COMMENT ON COLUMN user_download_quotas.total_lifetime_count IS '终身累计下载次数（免费用户限额判断依据）';
COMMENT ON COLUMN user_download_quotas.free_total_limit IS '免费用户终身下载次数上限，默认 20';

-- ──────────────────────────────────────────
-- 2. IP 下载限制表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_download_limits (
  ip_address INET PRIMARY KEY,
  free_download_count INTEGER DEFAULT 0,
  free_download_limit INTEGER DEFAULT 30,
  last_download_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ip_download_limits IS '同一 IP 免费下载次数限制，防止多账号绕过';
COMMENT ON COLUMN ip_download_limits.free_download_limit IS '同一 IP 免费下载累计上限，默认 30';

-- ──────────────────────────────────────────
-- 3. 订阅状态同步触发器
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_subscription_paid_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 判断是否有效订阅
  IF NEW.status = 'active' AND NEW.current_period_end > NOW() THEN
    UPDATE user_download_quotas
    SET is_paid = true,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    -- 检查该用户是否还有其他有效订阅
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = NEW.user_id
        AND status = 'active'
        AND current_period_end > NOW()
        AND id != NEW.id
    ) THEN
      UPDATE user_download_quotas
      SET is_paid = false,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_changed_sync_paid
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_paid_status();

COMMENT ON FUNCTION sync_subscription_paid_status IS '订阅状态变更时自动同步 user_download_quotas.is_paid';

-- ──────────────────────────────────────────
-- 4. 升级 check_download_quota 函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_remaining INTEGER,
  monthly_remaining INTEGER,
  lifetime_remaining INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_ip_limit RECORD;
  v_has_active_sub BOOLEAN;
BEGIN
  -- 获取配额信息
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0, 0;
    RETURN;
  END IF;

  -- 检查是否有有效订阅（实时查询，不依赖缓存字段）
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > NOW()
  ) INTO v_has_active_sub;

  -- 同步 is_paid 字段（保持一致）
  IF v_has_active_sub != v_quota.is_paid THEN
    UPDATE user_download_quotas
    SET is_paid = v_has_active_sub, updated_at = NOW()
    WHERE user_id = p_user_id;
    v_quota.is_paid := v_has_active_sub;
  END IF;

  -- 付费用户：跳过次数限制
  IF v_quota.is_paid THEN
    RETURN QUERY SELECT
      true,
      '付费用户，允许下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      -1; -- -1 表示不限
    RETURN;
  END IF;

  -- 免费用户：检查终身累计次数
  IF v_quota.total_lifetime_count >= v_quota.free_total_limit THEN
    RETURN QUERY SELECT
      false,
      '免费下载次数已用完（上限 ' || v_quota.free_total_limit || ' 次），请升级会员',
      0,
      0,
      0;
    RETURN;
  END IF;

  -- 免费用户：检查 IP 限制
  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_ip_limit
    FROM ip_download_limits
    WHERE ip_address = p_ip_address;

    IF FOUND AND v_ip_limit.free_download_count >= v_ip_limit.free_download_limit THEN
      RETURN QUERY SELECT
        false,
        '该 IP 免费下载次数已达上限，请升级会员',
        0,
        0,
        v_quota.free_total_limit - v_quota.total_lifetime_count;
      RETURN;
    END IF;
  END IF;

  -- 检查每日次数（重置逻辑）
  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_download_quotas
    SET today_count = 0,
        today_size_mb = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_quota.today_count := 0;
    v_quota.today_size_mb := 0;
  END IF;

  RETURN QUERY SELECT
    true,
    '允许下载',
    v_quota.daily_limit - v_quota.today_count - 1,
    v_quota.monthly_limit - v_quota.month_count - 1,
    v_quota.free_total_limit - v_quota.total_lifetime_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_download_quota IS '检查用户下载配额（支持免费/付费区分及 IP 限制）';

-- ──────────────────────────────────────────
-- 5. 升级 record_download 函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_download_id UUID;
  v_file_size_mb DECIMAL;
  v_is_paid BOOLEAN;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 获取付费状态
  SELECT is_paid INTO v_is_paid
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  -- 记录下载
  INSERT INTO data_downloads (
    user_id,
    resource_type,
    resource_id,
    file_name,
    file_size_bytes,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_file_name,
    p_file_size_bytes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_download_id;

  -- 更新配额（所有用户都更新日/月计数和终身计数）
  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      total_lifetime_count = total_lifetime_count + 1,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 免费用户：更新 IP 下载计数
  IF NOT COALESCE(v_is_paid, false) AND p_ip_address IS NOT NULL THEN
    INSERT INTO ip_download_limits (ip_address, free_download_count, last_download_at, updated_at)
    VALUES (p_ip_address, 1, NOW(), NOW())
    ON CONFLICT (ip_address) DO UPDATE
      SET free_download_count = ip_download_limits.free_download_count + 1,
          last_download_at = NOW(),
          updated_at = NOW();
  END IF;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download IS '记录下载并更新用户配额（含终身计数和 IP 计数）';

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE ip_download_limits ENABLE ROW LEVEL SECURITY;

-- IP 限制表：仅管理员可查看，函数内部通过 SECURITY DEFINER 操作
CREATE POLICY "ip_download_limits_admin_only" ON ip_download_limits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
