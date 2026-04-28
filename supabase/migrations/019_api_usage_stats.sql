-- ============================================
-- 019: API 使用统计表
-- ============================================

-- =============================================================
-- API 使用统计表（每日聚合）
-- =============================================================
CREATE TABLE IF NOT EXISTS public.api_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  avg_latency_ms INTEGER,
  success_rate DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_stats_user ON public.api_usage_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_date ON public.api_usage_stats(date);

COMMENT ON TABLE public.api_usage_stats IS 'API 使用统计表：每日用户 API 调用聚合统计';

// =============================================================
-- 管理员统计视图
-- =============================================================
CREATE OR REPLACE VIEW public.admin_api_stats AS
SELECT
  date,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(total_calls) as total_calls,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost) as total_cost,
  AVG(avg_latency_ms) as avg_latency_ms,
  AVG(success_rate) as avg_success_rate
FROM api_usage_stats
GROUP BY date
ORDER BY date DESC;

COMMENT ON VIEW public.admin_api_stats IS '管理员 API 统计视图：每日全局 API 调用统计';

// =============================================================
-- 智能体使用统计表
-- =============================================================
CREATE TABLE IF NOT EXISTS public.agent_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_stats_agent ON public.agent_usage_stats(agent_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_stats_date ON public.agent_usage_stats(date);

COMMENT ON TABLE public.agent_usage_stats IS '智能体使用统计表：每日智能体调用聚合统计';

// =============================================================
-- 统计更新触发器函数
-- =============================================================
CREATE OR REPLACE FUNCTION update_agent_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新智能体使用统计
  IF NEW.agent_id IS NOT NULL THEN
    INSERT INTO agent_usage_stats (agent_id, date, total_calls, total_users, total_tokens, total_revenue)
    VALUES (
      NEW.agent_id,
      CURRENT_DATE,
      1,
      1,
      COALESCE(NEW.tokens_used, 0),
      COALESCE(NEW.cost, 0)
    )
    ON CONFLICT (agent_id, date) DO UPDATE
    SET
      total_calls = agent_usage_stats.total_calls + 1,
      total_tokens = agent_usage_stats.total_tokens + COALESCE(NEW.tokens_used, 0),
      total_revenue = agent_usage_stats.total_revenue + COALESCE(NEW.cost, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- Redis 配置说明
-- =============================================================
-- 阿里云 Redis 配置：
-- 1. 登录阿里云 Redis 管理控制台
-- 2. 创建 Redis 实例（推荐 Tair 或标准版）
-- 3. 获取连接地址和密码
-- 4. 在环境变量中配置：REDIS_URL=redis://password@host:port

-- 如果使用阿里云 Redis HTTP 接口：
-- REDIS_URL=https://r-xxxxxxxxx.redis.rds.aliyuncs.com:6379