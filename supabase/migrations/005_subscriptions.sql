-- ============================================
-- 005: 订阅系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 订阅表
-- ──────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end);
CREATE INDEX idx_subscriptions_product ON subscriptions(product_id);

COMMENT ON TABLE subscriptions IS '订阅表：月度会员、年度会员等';
COMMENT ON COLUMN subscriptions.cancel_reason IS '取消原因：用于改进产品';

-- ──────────────────────────────────────────
-- 2. 订阅历史记录
-- ──────────────────────────────────────────
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'renewed', 'cancelled', 'expired', 'paused', 'resumed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  amount DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_sub ON subscription_history(subscription_id, created_at DESC);

COMMENT ON TABLE subscription_history IS '订阅历史：续费、取消、暂停等事件记录';

-- ──────────────────────────────────────────
-- 3. 自动过期订阅的函数（需配合定时任务）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND current_period_end < NOW()
    AND auto_renew = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_subscriptions IS '定时任务：每日执行，自动过期未续费订阅';

-- ──────────────────────────────────────────
-- 4. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions: 用户只能查看和管理自己的订阅
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Subscription History: 用户只能查看自己的订阅历史
CREATE POLICY "subscription_history_select_own" ON subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );
