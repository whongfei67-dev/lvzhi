-- ============================================
-- 015: 数据下载限制与文件上传安全
-- ============================================

-- ──────────────────────────────────────────
-- 1. 数据下载记录表
-- ──────────────────────────────────────────
CREATE TABLE data_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('agent', 'post', 'document', 'export', 'report')),
  resource_id UUID,
  file_name TEXT,
  file_size_bytes BIGINT,
  download_method TEXT CHECK (download_method IN ('direct', 'api', 'export')),
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_downloads_user ON data_downloads(user_id, downloaded_at DESC);
CREATE INDEX idx_data_downloads_resource ON data_downloads(resource_type, resource_id);
-- 按日期查询可以使用 downloaded_at 索引配合 WHERE 条件

COMMENT ON TABLE data_downloads IS '数据下载记录：追踪所有数据下载行为';

-- ──────────────────────────────────────────
-- 2. 用户下载配额表
-- ──────────────────────────────────────────
CREATE TABLE user_download_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 10 CHECK (daily_limit >= 0),
  monthly_limit INTEGER DEFAULT 100 CHECK (monthly_limit >= 0),
  total_size_limit_mb INTEGER DEFAULT 500 CHECK (total_size_limit_mb >= 0),
  today_count INTEGER DEFAULT 0 CHECK (today_count >= 0),
  today_size_mb DECIMAL(10,2) DEFAULT 0 CHECK (today_size_mb >= 0),
  month_count INTEGER DEFAULT 0 CHECK (month_count >= 0),
  month_size_mb DECIMAL(10,2) DEFAULT 0 CHECK (month_size_mb >= 0),
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_download_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_download_quotas IS '用户下载配额：每日/每月下载次数和大小限制';

-- ──────────────────────────────────────────
-- 3. 触发器：自动创建下载配额
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_download_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_download_quotas (user_id, daily_limit, monthly_limit, total_size_limit_mb)
  VALUES (
    NEW.id,
    CASE NEW.role
      WHEN 'admin' THEN 1000
      WHEN 'creator' THEN 50
      WHEN 'client' THEN 30
      ELSE 10
    END,
    CASE NEW.role
      WHEN 'admin' THEN 10000
      WHEN 'creator' THEN 500
      WHEN 'client' THEN 300
      ELSE 100
    END,
    CASE NEW.role
      WHEN 'admin' THEN 10000
      WHEN 'creator' THEN 2000
      WHEN 'client' THEN 1000
      ELSE 500
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_download_quota
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_download_quota();

-- ──────────────────────────────────────────
-- 4. 检查下载配额的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_remaining INTEGER,
  monthly_remaining INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_file_size_mb DECIMAL;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 获取配额信息
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0;
    RETURN;
  END IF;

  -- 检查是否需要重置每日计数
  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_download_quotas
    SET today_count = 0,
        today_size_mb = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;

    v_quota.today_count := 0;
    v_quota.today_size_mb := 0;
  END IF;

  -- 检查每日次数限制
  IF v_quota.today_count >= v_quota.daily_limit THEN
    RETURN QUERY SELECT
      false,
      '已达到每日下载次数限制（' || v_quota.daily_limit || '次）',
      0,
      v_quota.monthly_limit - v_quota.month_count;
    RETURN;
  END IF;

  -- 检查每日大小限制
  IF v_quota.today_size_mb + v_file_size_mb > v_quota.total_size_limit_mb THEN
    RETURN QUERY SELECT
      false,
      '已达到每日下载大小限制（' || v_quota.total_size_limit_mb || 'MB）',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count;
    RETURN;
  END IF;

  -- 检查每月次数限制
  IF v_quota.month_count >= v_quota.monthly_limit THEN
    RETURN QUERY SELECT
      false,
      '已达到每月下载次数限制（' || v_quota.monthly_limit || '次）',
      v_quota.daily_limit - v_quota.today_count,
      0;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    '允许下载',
    v_quota.daily_limit - v_quota.today_count - 1,
    v_quota.monthly_limit - v_quota.month_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_download_quota IS '检查用户下载配额';

-- ──────────────────────────────────────────
-- 5. 记录下载并更新配额的函数
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
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

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

  -- 更新配额
  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download IS '记录下载并更新用户配额';

-- ──────────────────────────────────────────
-- 6. 文件上传记录表
-- ──────────────────────────────────────────
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT,
  file_hash TEXT, -- SHA-256
  storage_path TEXT NOT NULL,
  upload_purpose TEXT CHECK (upload_purpose IN ('avatar', 'document', 'agent_demo', 'post_attachment', 'other')),
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'clean', 'suspicious', 'malicious')),
  scan_result JSONB,
  ip_address INET,
  user_agent TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_user ON file_uploads(user_id, uploaded_at DESC);
CREATE INDEX idx_file_uploads_hash ON file_uploads(file_hash);
CREATE INDEX idx_file_uploads_scan_status ON file_uploads(scan_status, uploaded_at DESC);

COMMENT ON TABLE file_uploads IS '文件上传记录：追踪所有文件上传';
COMMENT ON COLUMN file_uploads.file_hash IS 'SHA-256 哈希值，用于检测重复文件和恶意文件';

-- ──────────────────────────────────────────
-- 7. 文件安全扫描规则表
-- ──────────────────────────────────────────
CREATE TABLE file_scan_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('file_type', 'file_size', 'file_name', 'content_pattern', 'hash_blacklist')),
  rule_condition JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allow', 'warn', 'quarantine', 'reject')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_scan_rules_type ON file_scan_rules(rule_type) WHERE is_active = true;

COMMENT ON TABLE file_scan_rules IS '文件安全扫描规则';

-- 初始化文件扫描规则
INSERT INTO file_scan_rules (rule_name, rule_type, rule_condition, severity, action) VALUES
  ('禁止可执行文件', 'file_type', '{"blocked_extensions": [".exe", ".bat", ".sh", ".cmd", ".com", ".scr", ".vbs", ".js", ".jar"]}', 'critical', 'reject'),
  ('禁止超大文件', 'file_size', '{"max_size_mb": 100}', 'error', 'reject'),
  ('可疑文件名', 'file_name', '{"patterns": ["virus", "malware", "hack", "crack", "keygen"]}', 'warning', 'quarantine'),
  ('允许的图片格式', 'file_type', '{"allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]}', 'info', 'allow'),
  ('允许的文档格式', 'file_type', '{"allowed_extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"]}', 'info', 'allow');

-- ──────────────────────────────────────────
-- 8. 文件异常检测记录表
-- ──────────────────────────────────────────
CREATE TABLE file_anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'suspicious_file_type',
    'oversized_file',
    'malicious_content',
    'duplicate_upload',
    'rapid_uploads',
    'suspicious_file_name',
    'hash_blacklisted'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  auto_action TEXT CHECK (auto_action IN ('none', 'quarantine', 'delete', 'block_user')),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_anomaly_upload ON file_anomaly_detections(upload_id);
CREATE INDEX idx_file_anomaly_type ON file_anomaly_detections(anomaly_type, detected_at DESC);
CREATE INDEX idx_file_anomaly_severity ON file_anomaly_detections(severity, detected_at DESC);
CREATE INDEX idx_file_anomaly_reviewed ON file_anomaly_detections(reviewed, detected_at DESC);

COMMENT ON TABLE file_anomaly_detections IS '文件异常检测记录：识别可疑文件上传';

-- ──────────────────────────────────────────
-- 9. 文件上传行为分析表
-- ──────────────────────────────────────────
CREATE TABLE upload_behavior_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_window TIMESTAMPTZ NOT NULL,
  total_uploads INTEGER DEFAULT 0,
  total_size_mb DECIMAL(10,2) DEFAULT 0,
  unique_file_types TEXT[],
  avg_file_size_mb DECIMAL(10,2),
  suspicious_patterns TEXT[],
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_behavior_user ON upload_behavior_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_upload_behavior_risk ON upload_behavior_analysis(risk_score DESC, analyzed_at DESC);

COMMENT ON TABLE upload_behavior_analysis IS '文件上传行为分析：检测异常上传模式';

-- ──────────────────────────────────────────
-- 10. 文件扫描函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION scan_uploaded_file(
  p_upload_id UUID,
  p_file_name TEXT,
  p_file_type TEXT,
  p_file_size_bytes BIGINT,
  p_file_hash TEXT
)
RETURNS TABLE(
  scan_passed BOOLEAN,
  scan_status TEXT,
  issues TEXT[]
) AS $$
DECLARE
  v_issues TEXT[] := ARRAY[]::TEXT[];
  v_scan_status TEXT := 'clean';
  v_rule RECORD;
  v_file_extension TEXT;
  v_file_size_mb DECIMAL;
BEGIN
  v_file_extension := lower(substring(p_file_name from '\.([^.]+)$'));
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 检查所有活跃规则
  FOR v_rule IN
    SELECT * FROM file_scan_rules
    WHERE is_active = true
    ORDER BY severity DESC
  LOOP
    CASE v_rule.rule_type
      WHEN 'file_type' THEN
        -- 检查禁止的文件类型
        IF v_rule.rule_condition ? 'blocked_extensions' THEN
          IF ('.' || v_file_extension) = ANY(
            SELECT jsonb_array_elements_text(v_rule.rule_condition->'blocked_extensions')
          ) THEN
            v_issues := array_append(v_issues, '禁止的文件类型: ' || v_file_extension);
            v_scan_status := 'malicious';
          END IF;
        END IF;

      WHEN 'file_size' THEN
        -- 检查文件大小
        IF v_rule.rule_condition ? 'max_size_mb' THEN
          IF v_file_size_mb > (v_rule.rule_condition->>'max_size_mb')::DECIMAL THEN
            v_issues := array_append(v_issues, '文件过大: ' || v_file_size_mb || 'MB');
            IF v_rule.severity IN ('error', 'critical') THEN
              v_scan_status := 'suspicious';
            END IF;
          END IF;
        END IF;

      WHEN 'file_name' THEN
        -- 检查可疑文件名
        IF v_rule.rule_condition ? 'patterns' THEN
          DECLARE
            v_pattern TEXT;
          BEGIN
            FOR v_pattern IN
              SELECT jsonb_array_elements_text(v_rule.rule_condition->'patterns')
            LOOP
              IF p_file_name ILIKE '%' || v_pattern || '%' THEN
                v_issues := array_append(v_issues, '可疑文件名包含: ' || v_pattern);
                v_scan_status := 'suspicious';
              END IF;
            END LOOP;
          END;
        END IF;

      WHEN 'hash_blacklist' THEN
        -- 检查文件哈希黑名单（需要预先维护黑名单）
        IF v_rule.rule_condition ? 'blacklisted_hashes' THEN
          IF p_file_hash = ANY(
            SELECT jsonb_array_elements_text(v_rule.rule_condition->'blacklisted_hashes')
          ) THEN
            v_issues := array_append(v_issues, '文件哈希在黑名单中');
            v_scan_status := 'malicious';
          END IF;
        END IF;
    END CASE;
  END LOOP;

  -- 更新上传记录的扫描状态
  UPDATE file_uploads
  SET scan_status = v_scan_status,
      scan_result = jsonb_build_object('issues', v_issues, 'scanned_at', NOW())
  WHERE id = p_upload_id;

  RETURN QUERY SELECT
    v_scan_status = 'clean',
    v_scan_status,
    v_issues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION scan_uploaded_file IS '扫描上传的文件并检测安全问题';

-- ──────────────────────────────────────────
-- 11. 检测文件上传异常的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION detect_upload_anomaly(
  p_user_id UUID,
  p_upload_id UUID
)
RETURNS void AS $$
DECLARE
  v_recent_uploads INTEGER;
  v_duplicate_count INTEGER;
  v_upload RECORD;
  v_anomaly_detected BOOLEAN := false;
BEGIN
  -- 获取上传信息
  SELECT * INTO v_upload
  FROM file_uploads
  WHERE id = p_upload_id;

  -- 1. 检测快速连续上传（5分钟内超过10次）
  SELECT COUNT(*) INTO v_recent_uploads
  FROM file_uploads
  WHERE user_id = p_user_id
    AND uploaded_at > NOW() - INTERVAL '5 minutes';

  IF v_recent_uploads > 10 THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      'rapid_uploads',
      'medium',
      '5分钟内上传超过10个文件',
      jsonb_build_object('upload_count', v_recent_uploads),
      'none'
    );
    v_anomaly_detected := true;
  END IF;

  -- 2. 检测重复文件上传
  SELECT COUNT(*) INTO v_duplicate_count
  FROM file_uploads
  WHERE user_id = p_user_id
    AND file_hash = v_upload.file_hash
    AND id != p_upload_id;

  IF v_duplicate_count > 0 THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      'duplicate_upload',
      'low',
      '上传了重复的文件',
      jsonb_build_object('duplicate_count', v_duplicate_count, 'file_hash', v_upload.file_hash),
      'none'
    );
  END IF;

  -- 3. 检测扫描结果异常
  IF v_upload.scan_status IN ('suspicious', 'malicious') THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'malicious_content'
        ELSE 'suspicious_file_type'
      END,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'critical'
        ELSE 'high'
      END,
      '文件扫描发现问题',
      v_upload.scan_result,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'quarantine'
        ELSE 'none'
      END
    );
    v_anomaly_detected := true;
  END IF;

  -- 4. 如果检测到严重异常，发送告警
  IF v_anomaly_detected THEN
    -- 这里可以集成告警系统（邮件、短信、Webhook等）
    -- 暂时记录到安全事件表
    INSERT INTO security_events (
      user_id,
      event_type,
      description,
      ip_address,
      metadata
    ) VALUES (
      p_user_id,
      'suspicious_login',
      '检测到可疑文件上传',
      v_upload.ip_address,
      jsonb_build_object('upload_id', p_upload_id, 'file_name', v_upload.file_name)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_upload_anomaly IS '检测文件上传异常并触发告警';

-- ──────────────────────────────────────────
-- 12. 触发器：上传后自动扫描和检测
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_scan_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- 自动扫描文件
  PERFORM scan_uploaded_file(
    NEW.id,
    NEW.file_name,
    NEW.file_type,
    NEW.file_size_bytes,
    NEW.file_hash
  );

  -- 检测异常
  PERFORM detect_upload_anomaly(NEW.user_id, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_file_uploaded
  AFTER INSERT ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION auto_scan_upload();

-- ──────────────────────────────────────────
-- 13. 分析用户上传行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION analyze_upload_behavior(
  p_user_id UUID,
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_total_uploads INTEGER;
  v_total_size_mb DECIMAL;
  v_suspicious_patterns TEXT[] := ARRAY[]::TEXT[];
  v_anomaly_count INTEGER;
BEGIN
  -- 统计上传数据
  SELECT
    COUNT(*),
    SUM(file_size_bytes) / 1024.0 / 1024.0
  INTO v_total_uploads, v_total_size_mb
  FROM file_uploads
  WHERE user_id = p_user_id
    AND uploaded_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL;

  -- 检查异常模式
  IF v_total_uploads > 50 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'high_upload_frequency');
    v_risk_score := v_risk_score + 30;
  END IF;

  IF v_total_size_mb > 1000 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'large_total_size');
    v_risk_score := v_risk_score + 20;
  END IF;

  -- 统计异常检测次数
  SELECT COUNT(*) INTO v_anomaly_count
  FROM file_anomaly_detections fad
  JOIN file_uploads fu ON fu.id = fad.upload_id
  WHERE fu.user_id = p_user_id
    AND fad.detected_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL;

  IF v_anomaly_count > 0 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'anomalies_detected');
    v_risk_score := v_risk_score + (v_anomaly_count * 10);
  END IF;

  -- 插入分析结果
  INSERT INTO upload_behavior_analysis (
    user_id,
    time_window,
    total_uploads,
    total_size_mb,
    suspicious_patterns,
    risk_score
  ) VALUES (
    p_user_id,
    NOW(),
    v_total_uploads,
    v_total_size_mb,
    v_suspicious_patterns,
    LEAST(v_risk_score, 100)
  );

  RETURN LEAST(v_risk_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_upload_behavior IS '分析用户上传行为并计算风险评分';

-- ──────────────────────────────────────────
-- 14. 下载和上传统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW download_upload_stats AS
SELECT
  (SELECT COUNT(*) FROM data_downloads WHERE downloaded_at > NOW() - INTERVAL '24 hours') AS downloads_24h,
  (SELECT COUNT(DISTINCT user_id) FROM data_downloads WHERE downloaded_at > NOW() - INTERVAL '24 hours') AS unique_downloaders_24h,
  (SELECT COUNT(*) FROM file_uploads WHERE uploaded_at > NOW() - INTERVAL '24 hours') AS uploads_24h,
  (SELECT COUNT(*) FROM file_uploads WHERE scan_status IN ('suspicious', 'malicious') AND uploaded_at > NOW() - INTERVAL '24 hours') AS suspicious_uploads_24h,
  (SELECT COUNT(*) FROM file_anomaly_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS anomalies_24h,
  (SELECT COUNT(*) FROM file_anomaly_detections WHERE severity IN ('high', 'critical') AND NOT reviewed) AS pending_critical_reviews;

COMMENT ON VIEW download_upload_stats IS '下载和上传统计概览';

-- ──────────────────────────────────────────
-- 15. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE data_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_download_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_scan_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_behavior_analysis ENABLE ROW LEVEL SECURITY;

-- 下载记录：用户可查看自己的
CREATE POLICY "downloads_select_own" ON data_downloads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "downloads_admin_all" ON data_downloads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 下载配额：用户可查看自己的
CREATE POLICY "download_quotas_select_own" ON user_download_quotas
  FOR SELECT USING (user_id = auth.uid());

-- 文件上传：用户可查看自己的
CREATE POLICY "uploads_select_own" ON file_uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "uploads_insert_own" ON file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "uploads_admin_all" ON file_uploads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 扫描规则：仅管理员
CREATE POLICY "scan_rules_admin_only" ON file_scan_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 异常检测：仅管理员
CREATE POLICY "file_anomaly_admin_only" ON file_anomaly_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 上传行为分析：仅管理员
CREATE POLICY "upload_behavior_admin_only" ON upload_behavior_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
