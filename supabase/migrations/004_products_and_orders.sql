-- ============================================
-- 004: 商品管理与订单系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 商品表
-- ──────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('agent', 'consultation', 'course', 'content')),
  related_id UUID, -- 关联到 agents/posts 等具体实体
  name TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT CHECK (pricing_type IN ('free', 'one_time', 'subscription', 'usage_based')),
  price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_creator ON products(creator_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';

COMMENT ON TABLE products IS '商品表：智能体、咨询服务、课程等统一抽象';
COMMENT ON COLUMN products.related_id IS '关联实体ID（如 agents.id, community_posts.id）';
COMMENT ON COLUMN products.metadata IS '扩展字段：规格、库存、标签等';

-- ──────────────────────────────────────────
-- 2. 订单表
-- ──────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('purchase', 'subscription', 'recharge')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT, -- 'alipay', 'wechat', 'balance'
  payment_id TEXT, -- 第三方支付流水号
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id) WHERE payment_id IS NOT NULL;

COMMENT ON TABLE orders IS '订单表：购买、订阅、充值统一管理';
COMMENT ON COLUMN orders.metadata IS '订单详情：商品快照、优惠券、发票信息等';

-- ──────────────────────────────────────────
-- 3. 用户余额表
-- ──────────────────────────────────────────
CREATE TABLE user_balances (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  frozen_balance DECIMAL(10,2) DEFAULT 0 CHECK (frozen_balance >= 0),
  total_recharged DECIMAL(10,2) DEFAULT 0 CHECK (total_recharged >= 0),
  total_consumed DECIMAL(10,2) DEFAULT 0 CHECK (total_consumed >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_balances IS '用户余额表：支持内部积分/token体系';
COMMENT ON COLUMN user_balances.frozen_balance IS '冻结余额：待结算订单、提现中等';

-- ──────────────────────────────────────────
-- 4. 余额变动记录
-- ──────────────────────────────────────────
CREATE TABLE balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'recharge', 'purchase', 'refund', 'reward',
    'withdrawal', 'system_adjustment', 'api_call'
  )),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_balance_tx_user ON balance_transactions(user_id, created_at DESC);
CREATE INDEX idx_balance_tx_type ON balance_transactions(transaction_type, created_at DESC);

COMMENT ON TABLE balance_transactions IS '余额变动记录：包含隐藏的 API 调用扣费';
COMMENT ON COLUMN balance_transactions.metadata IS 'API调用详情：model, tokens, endpoint 等';

-- ──────────────────────────────────────────
-- 5. 触发器：自动创建用户余额
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_balance
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_balance();

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Products: 所有人可查看 active 商品，创作者管理自己的商品
CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "products_insert_creator" ON products
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('creator', 'admin'))
  );

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (creator_id = auth.uid());

-- Orders: 用户只能查看自己的订单
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (user_id = auth.uid());

-- User Balances: 用户只能查看自己的余额
CREATE POLICY "balances_select_own" ON user_balances
  FOR SELECT USING (user_id = auth.uid());

-- Balance Transactions: 用户只能查看自己的交易记录
CREATE POLICY "balance_tx_select_own" ON balance_transactions
  FOR SELECT USING (user_id = auth.uid());
