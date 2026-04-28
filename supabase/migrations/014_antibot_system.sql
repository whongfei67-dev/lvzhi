-- ============================================
-- 014: 反爬虫系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 爬虫特征库表
-- ──────────────────────────────────────────
CREATE TABLE bot_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_type TEXT NOT NULL CHECK (signature_type IN ('user_agent', 'ip_range', 'behavior_pattern', 'fingerprint')),
  signature_value TEXT NOT NULL,
  bot_name TEXT,
  bot_category TEXT CHECK (bot_category IN ('search_engine', 'malicious', 'scraper', 'monitoring', 'unknown')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allow', 'monitor', 'challenge', 'block')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bot_signatures_type ON bot_signatures(signature_type) WHERE is_active = true;
CREATE INDEX idx_bot_signatures_category ON bot_signatures(bot_category) WHERE is_active = true;

COMMENT ON TABLE bot_signatures IS '爬虫特征库：已知爬虫的识别特征';

-- 初始化常见爬虫特征
INSERT INTO bot_signatures (signature_type, signature_value, bot_name, bot_category, risk_level, action) VALUES
  -- 搜索引擎爬虫（允许）
  ('user_agent', 'Googlebot', 'Google Bot', 'search_engine', 'low', 'allow'),
  ('user_agent', 'Baiduspider', 'Baidu Spider', 'search_engine', 'low', 'allow'),
  ('user_agent', 'bingbot', 'Bing Bot', 'search_engine', 'low', 'allow'),

  -- 恶意爬虫（阻止）
  ('user_agent', 'scrapy', 'Scrapy Framework', 'scraper', 'high', 'block'),
  ('user_agent', 'python-requests', 'Python Requests', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'curl', 'cURL', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'wget', 'Wget', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'selenium', 'Selenium', 'scraper', 'high', 'block'),
  ('user_agent', 'puppeteer', 'Puppeteer', 'scraper', 'high', 'block'),
  ('user_agent', 'headless', 'Headless Browser', 'scraper', 'high', 'block');

-- ──────────────────────────────────────────
-- 2. 爬虫检测记录表
-- ──────────────────────────────────────────
CREATE TABLE bot_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  detection_method TEXT NOT NULL CHECK (detection_method IN (
    'user_agent_match',
    'behavior_analysis',
    'rate_limit_exceeded',
    'fingerprint_analysis',
    'honeypot_triggered',
    'javascript_challenge_failed',
    'captcha_failed'
  )),
  signature_id UUID REFERENCES bot_signatures(id) ON DELETE SET NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('allowed', 'monitored', 'challenged', 'blocked')),
  evidence JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bot_detections_ip ON bot_detections(ip_address, detected_at DESC);
CREATE INDEX idx_bot_detections_method ON bot_detections(detection_method, detected_at DESC);
CREATE INDEX idx_bot_detections_action ON bot_detections(action_taken, detected_at DESC);
CREATE INDEX idx_bot_detections_risk ON bot_detections(risk_score DESC, detected_at DESC);

COMMENT ON TABLE bot_detections IS '爬虫检测记录：实时检测到的爬虫行为';
COMMENT ON COLUMN bot_detections.risk_score IS '风险评分：0-100，越高越危险';
COMMENT ON COLUMN bot_detections.confidence IS '置信度：0-1，检测结果的可信程度';
COMMENT ON COLUMN bot_detections.evidence IS '证据数据：请求特征、行为模式等';

-- ──────────────────────────────────────────
-- 3. 访问行为分析表
-- ──────────────────────────────────────────
CREATE TABLE access_behavior_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP 或 session_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'session', 'user')),
  time_window TIMESTAMPTZ NOT NULL,

  -- 行为指标
  total_requests INTEGER DEFAULT 0,
  unique_pages INTEGER DEFAULT 0,
  avg_request_interval_ms INTEGER,
  requests_per_minute DECIMAL(10,2),

  -- 异常指标
  suspicious_patterns TEXT[],
  bot_probability DECIMAL(3,2) CHECK (bot_probability >= 0 AND bot_probability <= 1),

  -- 访问特征
  user_agents TEXT[],
  referers TEXT[],
  accessed_endpoints TEXT[],

  -- JavaScript 执行
  javascript_enabled BOOLEAN,
  browser_fingerprint TEXT,

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_access_behavior_identifier ON access_behavior_analysis(identifier, time_window DESC);
CREATE INDEX idx_access_behavior_probability ON access_behavior_analysis(bot_probability DESC, analyzed_at DESC);

COMMENT ON TABLE access_behavior_analysis IS '访问行为分析：基于行为模式识别爬虫';
COMMENT ON COLUMN access_behavior_analysis.suspicious_patterns IS '可疑模式：如 high_frequency, no_javascript, sequential_access';

-- ──────────────────────────────────────────
-- 4. 蜜罐陷阱表
-- ──────────────────────────────────────────
CREATE TABLE honeypot_traps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trap_type TEXT NOT NULL CHECK (trap_type IN ('hidden_link', 'fake_api', 'invisible_field', 'timing_trap')),
  trap_path TEXT UNIQUE NOT NULL,
  trap_content JSONB,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_honeypot_traps_path ON honeypot_traps(trap_path) WHERE is_active = true;

COMMENT ON TABLE honeypot_traps IS '蜜罐陷阱：诱导爬虫触发以识别';
COMMENT ON COLUMN honeypot_traps.trap_content IS '陷阱内容：隐藏链接、假数据等';

-- 初始化蜜罐陷阱
INSERT INTO honeypot_traps (trap_type, trap_path, trap_content) VALUES
  ('hidden_link', '/api/internal/admin-data', '{"description": "Hidden admin endpoint"}'),
  ('hidden_link', '/secret-agents-list', '{"description": "Fake agents list"}'),
  ('fake_api', '/api/v1/users/all', '{"description": "Fake user data endpoint"}');

-- ──────────────────────────────────────────
-- 5. 蜜罐触发记录表
-- ──────────────────────────────────────────
CREATE TABLE honeypot_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trap_id UUID NOT NULL REFERENCES honeypot_traps(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  referer TEXT,
  request_method TEXT,
  request_headers JSONB,
  auto_blocked BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_honeypot_triggers_trap ON honeypot_triggers(trap_id, triggered_at DESC);
CREATE INDEX idx_honeypot_triggers_ip ON honeypot_triggers(ip_address, triggered_at DESC);

COMMENT ON TABLE honeypot_triggers IS '蜜罐触发记录：爬虫访问陷阱的记录';

-- ──────────────────────────────────────────
-- 6. 数据访问控制表
-- ──────────────────────────────────────────
CREATE TABLE data_access_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('agent', 'user_profile', 'post', 'job', 'api_endpoint')),
  resource_id TEXT,
  access_level TEXT NOT NULL CHECK (access_level IN ('public', 'authenticated', 'premium', 'private')),
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,
  require_captcha BOOLEAN DEFAULT false,
  require_javascript BOOLEAN DEFAULT false,
  allowed_user_agents TEXT[],
  blocked_user_agents TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_access_controls_resource ON data_access_controls(resource_type, resource_id) WHERE is_active = true;

COMMENT ON TABLE data_access_controls IS '数据访问控制：细粒度的资源访问限制';

-- 初始化默认访问控制（下调限制）
INSERT INTO data_access_controls (resource_type, access_level, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day) VALUES
  ('agent', 'public', 10, 100, 500),
  ('user_profile', 'authenticated', 5, 50, 200),
  ('post', 'public', 10, 100, 500),
  ('api_endpoint', 'authenticated', 20, 200, 1000);

-- ──────────────────────────────────────────
-- 7. 敏感数据脱敏规则表
-- ──────────────────────────────────────────
CREATE TABLE data_masking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  masking_type TEXT NOT NULL CHECK (masking_type IN ('full', 'partial', 'hash', 'tokenize', 'redact')),
  masking_pattern TEXT, -- 如 '***', 'xxx@xxx.com'
  apply_to_roles TEXT[], -- 对哪些角色应用脱敏
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_name, column_name)
);

CREATE INDEX idx_data_masking_rules_table ON data_masking_rules(table_name) WHERE is_active = true;

COMMENT ON TABLE data_masking_rules IS '敏感数据脱敏规则：保护用户隐私';

-- 初始化脱敏规则
INSERT INTO data_masking_rules (table_name, column_name, masking_type, masking_pattern, apply_to_roles) VALUES
  ('profiles', 'email', 'partial', 'xxx@xxx.com', ARRAY['public']),
  ('profiles', 'phone', 'partial', '***-****-1234', ARRAY['public']),
  ('lawyer_profiles', 'bar_number', 'hash', NULL, ARRAY['public', 'seeker']),
  ('orders', 'payment_id', 'redact', '***', ARRAY['public']);

-- ──────────────────────────────────────────
-- 8. JavaScript 挑战记录表
-- ──────────────────────────────────────────
CREATE TABLE javascript_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  challenge_token TEXT UNIQUE NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('computation', 'dom_manipulation', 'timing', 'fingerprint')),
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  passed BOOLEAN,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_javascript_challenges_session ON javascript_challenges(session_id);
CREATE INDEX idx_javascript_challenges_token ON javascript_challenges(challenge_token);
CREATE INDEX idx_javascript_challenges_ip ON javascript_challenges(ip_address, created_at DESC);

COMMENT ON TABLE javascript_challenges IS 'JavaScript 挑战：验证客户端是否为真实浏览器';

-- ──────────────────────────────────────────
-- 9. 检测爬虫的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION detect_bot(
  p_ip_address INET,
  p_user_agent TEXT,
  p_endpoint TEXT
)
RETURNS TABLE(
  is_bot BOOLEAN,
  risk_score INTEGER,
  action TEXT,
  reason TEXT
) AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_action TEXT := 'allow';
  v_reason TEXT := '';
  v_signature RECORD;
BEGIN
  -- 1. 检查 User-Agent 特征
  FOR v_signature IN
    SELECT * FROM bot_signatures
    WHERE signature_type = 'user_agent'
      AND is_active = true
      AND p_user_agent ILIKE '%' || signature_value || '%'
    ORDER BY risk_level DESC
    LIMIT 1
  LOOP
    v_risk_score := v_risk_score + CASE v_signature.risk_level
      WHEN 'critical' THEN 80
      WHEN 'high' THEN 60
      WHEN 'medium' THEN 40
      WHEN 'low' THEN 20
    END;
    v_action := v_signature.action;
    v_reason := 'User-Agent matched: ' || v_signature.bot_name;
  END LOOP;

  -- 2. 检查是否触发过蜜罐
  IF EXISTS (
    SELECT 1 FROM honeypot_triggers
    WHERE ip_address = p_ip_address
      AND triggered_at > NOW() - INTERVAL '24 hours'
  ) THEN
    v_risk_score := v_risk_score + 70;
    v_action := 'block';
    v_reason := v_reason || '; Honeypot triggered';
  END IF;

  -- 3. 检查请求频率
  DECLARE
    v_recent_requests INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_recent_requests
    FROM rate_limit_records
    WHERE identifier = p_ip_address::text
      AND window_end > NOW() - INTERVAL '1 minute';

    IF v_recent_requests > 100 THEN
      v_risk_score := v_risk_score + 50;
      v_action := 'challenge';
      v_reason := v_reason || '; High request frequency';
    END IF;
  END;

  -- 4. 检查行为模式
  DECLARE
    v_bot_probability DECIMAL;
  BEGIN
    SELECT bot_probability INTO v_bot_probability
    FROM access_behavior_analysis
    WHERE identifier = p_ip_address::text
      AND time_window > NOW() - INTERVAL '1 hour'
    ORDER BY analyzed_at DESC
    LIMIT 1;

    IF v_bot_probability > 0.7 THEN
      v_risk_score := v_risk_score + 60;
      v_action := 'block';
      v_reason := v_reason || '; Suspicious behavior pattern';
    END IF;
  END;

  -- 记录检测结果
  INSERT INTO bot_detections (
    ip_address,
    user_agent,
    detection_method,
    risk_score,
    confidence,
    action_taken,
    evidence
  ) VALUES (
    p_ip_address,
    p_user_agent,
    'behavior_analysis',
    v_risk_score,
    LEAST(v_risk_score / 100.0, 1.0),
    v_action,
    jsonb_build_object('endpoint', p_endpoint, 'reason', v_reason)
  );

  RETURN QUERY SELECT
    v_risk_score > 50,
    v_risk_score,
    v_action,
    v_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_bot IS '综合检测爬虫：基于多种特征和行为模式';

-- ──────────────────────────────────────────
-- 10. 触发器：蜜罐触发自动封禁
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_block_honeypot_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新陷阱触发次数
  UPDATE honeypot_traps
  SET trigger_count = trigger_count + 1
  WHERE id = NEW.trap_id;

  -- 自动封禁 IP（24小时）
  INSERT INTO ip_blacklist (
    ip_address,
    reason,
    expires_at,
    metadata
  ) VALUES (
    NEW.ip_address,
    '触发蜜罐陷阱',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object('trap_id', NEW.trap_id, 'auto_blocked', true)
  )
  ON CONFLICT (ip_address) DO UPDATE
  SET expires_at = NOW() + INTERVAL '24 hours',
      metadata = jsonb_set(
        ip_blacklist.metadata,
        '{trigger_count}',
        to_jsonb(COALESCE((ip_blacklist.metadata->>'trigger_count')::int, 0) + 1)
      );

  -- 记录异常
  INSERT INTO anomaly_detections (
    detection_type,
    severity,
    ip_address,
    description,
    evidence,
    auto_blocked
  ) VALUES (
    'data_scraping',
    'high',
    NEW.ip_address,
    '访问蜜罐陷阱',
    jsonb_build_object('trap_id', NEW.trap_id, 'user_agent', NEW.user_agent),
    true
  );

  NEW.auto_blocked := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_honeypot_triggered
  BEFORE INSERT ON honeypot_triggers
  FOR EACH ROW
  EXECUTE FUNCTION auto_block_honeypot_trigger();

-- ──────────────────────────────────────────
-- 11. 分析访问行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION analyze_access_behavior(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS DECIMAL AS $$
DECLARE
  v_bot_probability DECIMAL := 0.0;
  v_total_requests INTEGER;
  v_unique_pages INTEGER;
  v_avg_interval_ms INTEGER;
  v_requests_per_minute DECIMAL;
  v_suspicious_patterns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 统计请求数据
  SELECT
    COUNT(*),
    COUNT(DISTINCT endpoint),
    AVG(EXTRACT(EPOCH FROM (window_end - window_start)) * 1000)::INTEGER
  INTO v_total_requests, v_unique_pages, v_avg_interval_ms
  FROM rate_limit_records
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND window_end > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  v_requests_per_minute := v_total_requests::DECIMAL / p_time_window_minutes;

  -- 判断可疑模式
  IF v_requests_per_minute > 10 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'high_frequency');
    v_bot_probability := v_bot_probability + 0.3;
  END IF;

  IF v_avg_interval_ms < 100 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'too_fast');
    v_bot_probability := v_bot_probability + 0.2;
  END IF;

  IF v_unique_pages < 3 AND v_total_requests > 50 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'repetitive_access');
    v_bot_probability := v_bot_probability + 0.3;
  END IF;

  -- 插入分析结果
  INSERT INTO access_behavior_analysis (
    identifier,
    identifier_type,
    time_window,
    total_requests,
    unique_pages,
    avg_request_interval_ms,
    requests_per_minute,
    suspicious_patterns,
    bot_probability
  ) VALUES (
    p_identifier,
    p_identifier_type,
    NOW(),
    v_total_requests,
    v_unique_pages,
    v_avg_interval_ms,
    v_requests_per_minute,
    v_suspicious_patterns,
    LEAST(v_bot_probability, 1.0)
  );

  RETURN LEAST(v_bot_probability, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_access_behavior IS '分析访问行为并计算爬虫概率';

-- ──────────────────────────────────────────
-- 12. 数据脱敏函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION mask_sensitive_data(
  p_table_name TEXT,
  p_column_name TEXT,
  p_value TEXT,
  p_user_role TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_rule RECORD;
  v_masked_value TEXT;
BEGIN
  -- 查询脱敏规则
  SELECT * INTO v_rule
  FROM data_masking_rules
  WHERE table_name = p_table_name
    AND column_name = p_column_name
    AND is_active = true
    AND (apply_to_roles IS NULL OR p_user_role = ANY(apply_to_roles));

  IF NOT FOUND THEN
    RETURN p_value;
  END IF;

  -- 应用脱敏
  CASE v_rule.masking_type
    WHEN 'full' THEN
      v_masked_value := '***';
    WHEN 'partial' THEN
      IF p_column_name = 'email' THEN
        v_masked_value := substring(p_value from 1 for 2) || '***@' || split_part(p_value, '@', 2);
      ELSIF p_column_name = 'phone' THEN
        v_masked_value := '***-****-' || right(p_value, 4);
      ELSE
        v_masked_value := left(p_value, 3) || '***';
      END IF;
    WHEN 'hash' THEN
      v_masked_value := encode(digest(p_value, 'sha256'), 'hex');
    WHEN 'redact' THEN
      v_masked_value := v_rule.masking_pattern;
    ELSE
      v_masked_value := p_value;
  END CASE;

  RETURN v_masked_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mask_sensitive_data IS '敏感数据脱敏：根据规则保护用户隐私';

-- ──────────────────────────────────────────
-- 13. 清理反爬虫数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_antibot_data()
RETURNS void AS $$
BEGIN
  -- 删除旧的爬虫检测记录（保留 30 天）
  DELETE FROM bot_detections
  WHERE detected_at < NOW() - INTERVAL '30 days';

  -- 删除旧的访问行为分析（保留 7 天）
  DELETE FROM access_behavior_analysis
  WHERE analyzed_at < NOW() - INTERVAL '7 days';

  -- 删除旧的蜜罐触发记录（保留 90 天）
  DELETE FROM honeypot_triggers
  WHERE triggered_at < NOW() - INTERVAL '90 days';

  -- 删除旧的 JavaScript 挑战记录（保留 7 天）
  DELETE FROM javascript_challenges
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_antibot_data IS '清理反爬虫数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 14. 反爬虫统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW antibot_stats AS
SELECT
  (SELECT COUNT(*) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS detections_24h,
  (SELECT COUNT(*) FROM bot_detections WHERE action_taken = 'blocked' AND detected_at > NOW() - INTERVAL '24 hours') AS blocked_24h,
  (SELECT COUNT(*) FROM honeypot_triggers WHERE triggered_at > NOW() - INTERVAL '24 hours') AS honeypot_triggers_24h,
  (SELECT COUNT(DISTINCT ip_address) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS unique_bot_ips_24h,
  (SELECT AVG(risk_score) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS avg_risk_score_24h,
  (SELECT COUNT(*) FROM bot_signatures WHERE is_active = true) AS active_signatures,
  (SELECT COUNT(*) FROM honeypot_traps WHERE is_active = true) AS active_traps;

COMMENT ON VIEW antibot_stats IS '反爬虫统计概览';

-- ──────────────────────────────────────────
-- 15. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE bot_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_behavior_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_traps ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_masking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE javascript_challenges ENABLE ROW LEVEL SECURITY;

-- 所有反爬虫表仅管理员可访问
CREATE POLICY "bot_signatures_admin_only" ON bot_signatures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "bot_detections_admin_only" ON bot_detections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "access_behavior_admin_only" ON access_behavior_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "honeypot_traps_admin_only" ON honeypot_traps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "honeypot_triggers_admin_only" ON honeypot_triggers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "data_access_controls_admin_only" ON data_access_controls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "data_masking_rules_admin_only" ON data_masking_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "javascript_challenges_admin_only" ON javascript_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
