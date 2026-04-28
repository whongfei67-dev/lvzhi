-- ============================================
-- 017: 在校生认证 + 免费智能体下载限额升级
-- 在校生（本科/硕士/博士）认证通过后免费下载上限提升至 40 次
-- 所有免费下载限制仅针对 price=0 的免费智能体
-- ============================================

-- ──────────────────────────────────────────
-- 1. 在校生认证表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  degree_type TEXT NOT NULL CHECK (degree_type IN ('undergraduate', 'master', 'phd')),
  school_name TEXT NOT NULL,
  major TEXT,
  enrollment_year INTEGER NOT NULL,
  expected_graduation_year INTEGER NOT NULL,
  student_id_number TEXT,                        -- 学号（可选，部分学校不公开）
  edu_email TEXT,                                -- 教育邮箱（.edu.cn 等）
  proof_document_url TEXT,                       -- 在读证明/学生证扫描件
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  expires_at TIMESTAMPTZ,                        -- 认证有效期（通常到预计毕业年份）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)                               -- 每人只能有一条认证记录
);

CREATE INDEX idx_student_verifications_status ON student_verifications(status, created_at DESC);
CREATE INDEX idx_student_verifications_user ON student_verifications(user_id);

COMMENT ON TABLE student_verifications IS '在校生认证：本科生/硕士生/博士生，认证通过后免费下载上限提升至 40 次';
COMMENT ON COLUMN student_verifications.degree_type IS 'undergraduate=本科生, master=硕士生, phd=博士生';
COMMENT ON COLUMN student_verifications.expires_at IS '认证有效期，通常设为预计毕业年份的 9 月 1 日';

-- ──────────────────────────────────────────
-- 2. user_download_quotas 新增在校生字段
-- ──────────────────────────────────────────
ALTER TABLE user_download_quotas
  ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_download_quotas.is_verified_student IS '是否为认证在校生（本科/硕士/博士），认证通过后免费下载上限为 40 次';

-- ──────────────────────────────────────────
-- 3. 在校生认证审核触发器
--    认证通过 → is_verified_student=true, free_total_limit=40
--    认证拒绝/过期 → is_verified_student=false, free_total_limit=20
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_student_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()) THEN
    UPDATE user_download_quotas
    SET is_verified_student = true,
        free_total_limit = 40,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    UPDATE user_download_quotas
    SET is_verified_student = false,
        free_total_limit = 20,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_verification_changed
  AFTER INSERT OR UPDATE ON student_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_verification_status();

COMMENT ON FUNCTION sync_student_verification_status IS '在校生认证状态变更时同步 user_download_quotas';

-- ──────────────────────────────────────────
-- 4. 管理员审核在校生认证的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION review_student_verification(
  p_verification_id UUID,
  p_reviewer_id UUID,
  p_approved BOOLEAN,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_record RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_record
  FROM student_verifications
  WHERE id = p_verification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '认证记录不存在';
  END IF;

  IF p_approved THEN
    -- 有效期设为预计毕业年份的 9 月 1 日
    v_expires_at := make_timestamptz(v_record.expected_graduation_year, 9, 1, 0, 0, 0, 'Asia/Shanghai');

    UPDATE student_verifications
    SET status = 'approved',
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        expires_at = v_expires_at,
        reject_reason = NULL,
        updated_at = NOW()
    WHERE id = p_verification_id;
  ELSE
    UPDATE student_verifications
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        reject_reason = p_reject_reason,
        updated_at = NOW()
    WHERE id = p_verification_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION review_student_verification IS '管理员审核在校生认证申请';

-- ──────────────────────────────────────────
-- 5. 定时检查认证是否过期的函数（配合定时任务）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_student_verifications()
RETURNS void AS $$
BEGIN
  UPDATE student_verifications
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_student_verifications IS '定时任务：检查并过期已到期的在校生认证';

-- ──────────────────────────────────────────
-- 6. 升级 check_download_quota
--    新增 p_agent_is_free 参数：只有免费智能体才受次数限制
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT,
  p_ip_address INET DEFAULT NULL,
  p_agent_is_free BOOLEAN DEFAULT true
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
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0, 0;
    RETURN;
  END IF;

  -- 实时检查有效订阅
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > NOW()
  ) INTO v_has_active_sub;

  -- 同步 is_paid
  IF v_has_active_sub != v_quota.is_paid THEN
    UPDATE user_download_quotas
    SET is_paid = v_has_active_sub, updated_at = NOW()
    WHERE user_id = p_user_id;
    v_quota.is_paid := v_has_active_sub;
  END IF;

  -- 付费用户：不受任何次数限制
  IF v_quota.is_paid THEN
    RETURN QUERY SELECT
      true,
      '付费用户，允许下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      -1;
    RETURN;
  END IF;

  -- 非免费智能体（付费智能体）：免费用户不可下载，需付费或订阅
  IF NOT p_agent_is_free THEN
    RETURN QUERY SELECT
      false,
      '该智能体为付费内容，请购买或升级会员后下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      v_quota.free_total_limit - v_quota.total_lifetime_count;
    RETURN;
  END IF;

  -- 以下仅针对免费智能体的免费用户限额检查

  -- 检查终身累计次数
  IF v_quota.total_lifetime_count >= v_quota.free_total_limit THEN
    RETURN QUERY SELECT
      false,
      '免费智能体下载次数已用完（上限 ' || v_quota.free_total_limit || ' 次），请升级会员',
      0,
      0,
      0;
    RETURN;
  END IF;

  -- 检查 IP 限制
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

  -- 重置每日计数
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

COMMENT ON FUNCTION check_download_quota IS '检查下载配额：免费限额仅针对免费智能体(price=0)，在校生上限40次，普通免费用户20次';

-- ──────────────────────────────────────────
-- 7. 升级 record_download
--    新增 p_agent_is_free 参数：只有免费智能体才计入免费限额
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_agent_is_free BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_download_id UUID;
  v_file_size_mb DECIMAL;
  v_is_paid BOOLEAN;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  SELECT is_paid INTO v_is_paid
  FROM user_download_quotas
  WHERE user_id = p_user_id;

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

  -- 更新日/月计数（所有用户）
  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 免费用户 + 免费智能体：计入终身次数和 IP 计数
  IF NOT COALESCE(v_is_paid, false) AND p_agent_is_free THEN
    UPDATE user_download_quotas
    SET total_lifetime_count = total_lifetime_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    IF p_ip_address IS NOT NULL THEN
      INSERT INTO ip_download_limits (ip_address, free_download_count, last_download_at, updated_at)
      VALUES (p_ip_address, 1, NOW(), NOW())
      ON CONFLICT (ip_address) DO UPDATE
        SET free_download_count = ip_download_limits.free_download_count + 1,
            last_download_at = NOW(),
            updated_at = NOW();
    END IF;
  END IF;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download IS '记录下载并更新配额：免费限额计数仅针对免费智能体(price=0)的免费用户';

-- ──────────────────────────────────────────
-- 8. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;

-- 用户可查看和提交自己的认证
CREATE POLICY "student_verifications_select_own" ON student_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "student_verifications_insert_own" ON student_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "student_verifications_update_own" ON student_verifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    -- 用户只能在 pending/rejected 状态下修改，不能自行改 status
    status IN ('pending', 'rejected')
  );

-- 管理员可操作所有认证记录
CREATE POLICY "student_verifications_admin_all" ON student_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
