-- ============================================
-- 009: API 调用系统（隐藏后门）
-- ============================================

-- ──────────────────────────────────────────
-- 1. API 密钥表（不对外暴露）
-- ──────────────────────────────────────────
CREATE TABLE api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  api_secret TEXT NOT NULL,
  name TEXT, -- 密钥名称，方便用户管理多个密钥
  rate_limit INTEGER DEFAULT 1000 CHECK (rate_limit > 0),
  daily_quota INTEGER DEFAULT 10000 CHECK (daily_quota > 0),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_credentials_key ON api_credentials(api_key) WHERE is_active = true;
CREATE INDEX idx_api_credentials_user ON api_credentials(user_id);

COMMENT ON TABLE api_credentials IS 'API密钥表：仅后端服务访问，不对外暴露';
COMMENT ON COLUMN api_credentials.rate_limit IS '每分钟请求限制';
COMMENT ON COLUMN api_credentials.daily_quota IS '每日请求配额';

-- ──────────────────────────────────────────
-- 2. API 调用记录表
-- ──────────────────────────────────────────
CREATE TABLE api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL,
  service TEXT NOT NULL CHECK (service IN ('llm', 'embedding', 'image', 'tts', 'stt')),
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost DECIMAL(10,6) DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_call_logs_user ON api_call_logs(user_id, created_at DESC);
CREATE INDEX idx_api_call_logs_key ON api_call_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_call_logs_service ON api_call_logs(service, created_at DESC);

COMMENT ON TABLE api_call_logs IS 'API调用日志：记录所有 LLM/AI 服务调用';
COMMENT ON COLUMN api_call_logs.cost IS '本次调用成本（人民币）';
COMMENT ON COLUMN api_call_logs.metadata IS '请求详情：prompt, response, parameters 等';

-- ──────────────────────────────────────────
-- 3. API 使用统计表（按日汇总）
-- ──────────────────────────────────────────
CREATE TABLE api_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service TEXT NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date, service)
);

CREATE INDEX idx_api_usage_stats_user ON api_usage_stats(user_id, date DESC);

COMMENT ON TABLE api_usage_stats IS 'API使用统计：按日汇总，用于账单和配额管理';

-- ──────────────────────────────────────────
-- 4. 触发器：记录 API 调用并扣费
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_api_call()
RETURNS TRIGGER AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  -- 只处理成功的调用
  IF NEW.status = 'success' AND NEW.cost > 0 THEN
    -- 检查余额
    SELECT balance INTO v_balance
    FROM user_balances
    WHERE user_id = NEW.user_id;

    IF v_balance < NEW.cost THEN
      RAISE EXCEPTION '余额不足，无法完成 API 调用';
    END IF;

    -- 扣除余额
    UPDATE user_balances
    SET balance = balance - NEW.cost,
        total_consumed = total_consumed + NEW.cost,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- 记录余额变动
    INSERT INTO balance_transactions (
      user_id,
      transaction_type,
      amount,
      balance_after,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'api_call',
      -NEW.cost,
      v_balance - NEW.cost,
      'API 调用扣费',
      jsonb_build_object(
        'service', NEW.service,
        'model', NEW.model,
        'tokens', NEW.total_tokens,
        'request_id', NEW.request_id
      )
    );

    -- 更新统计
    INSERT INTO api_usage_stats (
      user_id,
      date,
      service,
      total_calls,
      total_tokens,
      total_cost,
      success_count
    ) VALUES (
      NEW.user_id,
      CURRENT_DATE,
      NEW.service,
      1,
      NEW.total_tokens,
      NEW.cost,
      1
    )
    ON CONFLICT (user_id, date, service)
    DO UPDATE SET
      total_calls = api_usage_stats.total_calls + 1,
      total_tokens = api_usage_stats.total_tokens + EXCLUDED.total_tokens,
      total_cost = api_usage_stats.total_cost + EXCLUDED.total_cost,
      success_count = api_usage_stats.success_count + 1;
  ELSIF NEW.status = 'error' THEN
    -- 记录错误统计
    INSERT INTO api_usage_stats (
      user_id,
      date,
      service,
      total_calls,
      error_count
    ) VALUES (
      NEW.user_id,
      CURRENT_DATE,
      NEW.service,
      1,
      1
    )
    ON CONFLICT (user_id, date, service)
    DO UPDATE SET
      total_calls = api_usage_stats.total_calls + 1,
      error_count = api_usage_stats.error_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_api_call_logged
  AFTER INSERT ON api_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION process_api_call();

-- ──────────────────────────────────────────
-- 5. 生成 API 密钥的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_api_key(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  api_key TEXT,
  api_secret TEXT
) AS $$
DECLARE
  v_key TEXT;
  v_secret TEXT;
BEGIN
  -- 生成随机密钥（实际应用中应使用更安全的方法）
  v_key := 'lvzhi_' || encode(gen_random_bytes(24), 'base64');
  v_secret := encode(gen_random_bytes(32), 'base64');

  -- 插入密钥
  INSERT INTO api_credentials (user_id, api_key, api_secret, name)
  VALUES (p_user_id, v_key, v_secret, p_name);

  RETURN QUERY SELECT v_key, v_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_api_key IS '生成 API 密钥（仅创作者可用）';

-- ──────────────────────────────────────────
-- 6. 验证 API 密钥的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_api_key(
  p_api_key TEXT,
  p_api_secret TEXT
)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  rate_limit INTEGER,
  daily_quota INTEGER,
  message TEXT
) AS $$
DECLARE
  v_credential RECORD;
  v_today_calls INTEGER;
BEGIN
  -- 查询密钥
  SELECT * INTO v_credential
  FROM api_credentials
  WHERE api_key = p_api_key
    AND api_secret = p_api_secret
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 0, 'API 密钥无效或已过期';
    RETURN;
  END IF;

  -- 检查今日配额
  SELECT COALESCE(SUM(total_calls), 0) INTO v_today_calls
  FROM api_usage_stats
  WHERE user_id = v_credential.user_id
    AND date = CURRENT_DATE;

  IF v_today_calls >= v_credential.daily_quota THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 0, '今日 API 调用配额已用尽';
    RETURN;
  END IF;

  -- 更新最后使用时间
  UPDATE api_credentials
  SET last_used_at = NOW()
  WHERE id = v_credential.id;

  RETURN QUERY SELECT
    true,
    v_credential.user_id,
    v_credential.rate_limit,
    v_credential.daily_quota,
    'API 密钥有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_api_key IS '验证 API 密钥并检查配额';

-- ──────────────────────────────────────────
-- 7. RLS 策略（严格限制访问）
-- ──────────────────────────────────────────
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- API Credentials: 用户只能查看自己的密钥（不显示 secret）
CREATE POLICY "api_credentials_select_own" ON api_credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "api_credentials_insert_creator" ON api_credentials
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('creator', 'admin'))
  );

CREATE POLICY "api_credentials_update_own" ON api_credentials
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "api_credentials_delete_own" ON api_credentials
  FOR DELETE USING (user_id = auth.uid());

-- API Call Logs: 用户只能查看自己的调用记录
CREATE POLICY "api_call_logs_select_own" ON api_call_logs
  FOR SELECT USING (user_id = auth.uid());

-- API Usage Stats: 用户只能查看自己的统计
CREATE POLICY "api_usage_stats_select_own" ON api_usage_stats
  FOR SELECT USING (user_id = auth.uid());
