-- ============================================
-- 012: 防火墙与安全系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. IP 黑名单表
-- ──────────────────────────────────────────
CREATE TABLE ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address) WHERE is_active = true;
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE ip_blacklist IS 'IP 黑名单：阻止恶意 IP 访问';
COMMENT ON COLUMN ip_blacklist.metadata IS '附加信息：攻击类型、触发次数等';

-- ──────────────────────────────────────────
-- 2. IP 白名单表
-- ──────────────────────────────────────────
CREATE TABLE ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address) WHERE is_active = true;

COMMENT ON TABLE ip_whitelist IS 'IP 白名单：信任的 IP 地址（如办公网络、API 服务器）';

-- ──────────────────────────────────────────
-- 3. 请求频率限制记录表
-- ──────────────────────────────────────────
CREATE TABLE rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP 或 user_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key')),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_records(identifier, endpoint, window_end);
CREATE INDEX idx_rate_limit_window ON rate_limit_records(window_end);

COMMENT ON TABLE rate_limit_records IS '请求频率限制记录：防止 API 滥用';
COMMENT ON COLUMN rate_limit_records.identifier IS 'IP 地址、用户 ID 或 API Key';

-- ──────────────────────────────────────────
-- 4. 防火墙规则表
-- ──────────────────────────────────────────
CREATE TABLE firewall_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ip_block', 'rate_limit', 'geo_block', 'user_agent_block', 'custom')),
  priority INTEGER DEFAULT 100 CHECK (priority >= 0 AND priority <= 1000),
  condition JSONB NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('block', 'allow', 'throttle', 'captcha')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firewall_rules_priority ON firewall_rules(priority DESC, created_at) WHERE is_active = true;
CREATE INDEX idx_firewall_rules_type ON firewall_rules(rule_type) WHERE is_active = true;

COMMENT ON TABLE firewall_rules IS '防火墙规则：灵活配置的安全策略';
COMMENT ON COLUMN firewall_rules.priority IS '优先级：0-1000，数字越大优先级越高';
COMMENT ON COLUMN firewall_rules.condition IS '规则条件：JSON 格式，如 {"ip_range": "192.168.0.0/16", "countries": ["CN"]}';

-- 示例规则
INSERT INTO firewall_rules (rule_name, rule_type, priority, condition, action) VALUES
  ('阻止已知恶意 IP 段', 'ip_block', 900, '{"ip_ranges": ["185.220.0.0/16", "45.142.120.0/24"]}', 'block'),
  ('API 频率限制', 'rate_limit', 800, '{"endpoint": "/api/*", "max_requests": 100, "window_seconds": 60}', 'throttle'),
  ('阻止可疑 User-Agent', 'user_agent_block', 700, '{"patterns": ["bot", "crawler", "scraper"]}', 'block');

-- ──────────────────────────────────────────
-- 5. 防火墙日志表
-- ──────────────────────────────────────────
CREATE TABLE firewall_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES firewall_rules(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'allowed', 'throttled', 'captcha_required')),
  reason TEXT,
  user_agent TEXT,
  request_headers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firewall_logs_ip ON firewall_logs(ip_address, created_at DESC);
CREATE INDEX idx_firewall_logs_rule ON firewall_logs(rule_id, created_at DESC);
CREATE INDEX idx_firewall_logs_action ON firewall_logs(action_taken, created_at DESC);
CREATE INDEX idx_firewall_logs_time ON firewall_logs(created_at DESC);

COMMENT ON TABLE firewall_logs IS '防火墙日志：记录所有被拦截或限制的请求';

-- ──────────────────────────────────────────
-- 6. 异常行为检测表
-- ──────────────────────────────────────────
CREATE TABLE anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_type TEXT NOT NULL CHECK (detection_type IN (
    'brute_force',
    'sql_injection',
    'xss_attempt',
    'unusual_traffic',
    'data_scraping',
    'account_takeover',
    'credential_stuffing'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  auto_blocked BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomaly_detections_type ON anomaly_detections(detection_type, created_at DESC);
CREATE INDEX idx_anomaly_detections_severity ON anomaly_detections(severity, created_at DESC);
CREATE INDEX idx_anomaly_detections_reviewed ON anomaly_detections(reviewed, created_at DESC);
CREATE INDEX idx_anomaly_detections_ip ON anomaly_detections(ip_address);

COMMENT ON TABLE anomaly_detections IS '异常行为检测：AI/规则引擎检测到的可疑活动';
COMMENT ON COLUMN anomaly_detections.evidence IS '证据数据：请求日志、行为模式等';

-- ──────────────────────────────────────────
-- 7. CAPTCHA 验证记录表
-- ──────────────────────────────────────────
CREATE TABLE captcha_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('image', 'audio', 'puzzle', 'recaptcha')),
  success BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_captcha_verifications_session ON captcha_verifications(session_id);
CREATE INDEX idx_captcha_verifications_ip ON captcha_verifications(ip_address, created_at DESC);

COMMENT ON TABLE captcha_verifications IS 'CAPTCHA 验证记录：人机验证';

-- ──────────────────────────────────────────
-- 8. 检查 IP 是否被封禁的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  -- 检查白名单（优先级最高）
  IF EXISTS (
    SELECT 1 FROM ip_whitelist
    WHERE ip_address = p_ip_address AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- 检查黑名单
  SELECT EXISTS (
    SELECT 1 FROM ip_blacklist
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blocked;

  RETURN v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_ip_blocked IS '检查 IP 是否被封禁';

-- ──────────────────────────────────────────
-- 9. 检查请求频率限制的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_window_end := NOW();

  -- 统计当前窗口内的请求数
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limit_records
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint
    AND window_end > v_window_start;

  -- 插入或更新记录
  INSERT INTO rate_limit_records (
    identifier,
    identifier_type,
    endpoint,
    request_count,
    window_start,
    window_end,
    blocked
  ) VALUES (
    p_identifier,
    p_identifier_type,
    p_endpoint,
    1,
    v_window_start,
    v_window_end,
    v_current_count >= p_max_requests
  );

  RETURN QUERY SELECT
    v_current_count < p_max_requests,
    v_current_count + 1,
    v_window_end + (p_window_seconds || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_rate_limit IS '检查请求频率限制';

-- ──────────────────────────────────────────
-- 10. 记录异常行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_anomaly(
  p_detection_type TEXT,
  p_severity TEXT,
  p_ip_address INET,
  p_user_id UUID,
  p_description TEXT,
  p_evidence JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_anomaly_id UUID;
  v_should_block BOOLEAN := false;
BEGIN
  -- 插入异常记录
  INSERT INTO anomaly_detections (
    detection_type,
    severity,
    ip_address,
    user_id,
    description,
    evidence,
    auto_blocked
  ) VALUES (
    p_detection_type,
    p_severity,
    p_ip_address,
    p_user_id,
    p_description,
    p_evidence,
    false
  ) RETURNING id INTO v_anomaly_id;

  -- 高危异常自动封禁
  IF p_severity IN ('high', 'critical') THEN
    -- 检查是否已在黑名单
    IF NOT EXISTS (
      SELECT 1 FROM ip_blacklist
      WHERE ip_address = p_ip_address AND is_active = true
    ) THEN
      -- 添加到黑名单（24小时）
      INSERT INTO ip_blacklist (
        ip_address,
        reason,
        expires_at,
        metadata
      ) VALUES (
        p_ip_address,
        '自动封禁：' || p_detection_type,
        NOW() + INTERVAL '24 hours',
        jsonb_build_object('anomaly_id', v_anomaly_id, 'auto_blocked', true)
      );

      v_should_block := true;
    END IF;

    -- 如果有用户 ID，锁定账号
    IF p_user_id IS NOT NULL THEN
      INSERT INTO account_locks (
        user_id,
        lock_reason,
        locked_until,
        metadata
      ) VALUES (
        p_user_id,
        'suspicious_activity',
        NOW() + INTERVAL '24 hours',
        jsonb_build_object('anomaly_id', v_anomaly_id, 'detection_type', p_detection_type)
      );
    END IF;
  END IF;

  -- 更新自动封禁状态
  UPDATE anomaly_detections
  SET auto_blocked = v_should_block
  WHERE id = v_anomaly_id;

  RETURN v_anomaly_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_anomaly IS '记录异常行为并自动处理高危情况';

-- ──────────────────────────────────────────
-- 11. 清理过期防火墙数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_firewall_data()
RETURNS void AS $$
BEGIN
  -- 删除过期的 IP 黑名单记录
  UPDATE ip_blacklist
  SET is_active = false
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_active = true;

  -- 删除过期的频率限制记录（保留 7 天）
  DELETE FROM rate_limit_records
  WHERE window_end < NOW() - INTERVAL '7 days';

  -- 删除旧的防火墙日志（保留 90 天）
  DELETE FROM firewall_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- 删除旧的 CAPTCHA 记录（保留 30 天）
  DELETE FROM captcha_verifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_firewall_data IS '清理过期的防火墙数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 12. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_verifications ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以访问防火墙相关表
CREATE POLICY "firewall_admin_only" ON ip_blacklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "whitelist_admin_only" ON ip_whitelist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rate_limit_admin_only" ON rate_limit_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "firewall_rules_admin_only" ON firewall_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "firewall_logs_admin_only" ON firewall_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "anomaly_admin_only" ON anomaly_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "captcha_admin_only" ON captcha_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
