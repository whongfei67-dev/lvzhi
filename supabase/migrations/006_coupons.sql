-- ============================================
-- 006: 优惠券系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 优惠券表
-- ──────────────────────────────────────────
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10,2) DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_discount_amount DECIMAL(10,2),
  applicable_products JSONB DEFAULT '[]', -- 空数组表示全部商品可用
  usage_limit INTEGER, -- NULL 表示无限制
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until) WHERE is_active = true;

COMMENT ON TABLE coupons IS '优惠券表：支持百分比折扣、固定金额、免费试用';
COMMENT ON COLUMN coupons.applicable_products IS '可用商品ID数组，空数组表示全部可用';
COMMENT ON COLUMN coupons.usage_limit IS '总使用次数限制，NULL表示无限制';

-- ──────────────────────────────────────────
-- 2. 优惠券使用记录
-- ──────────────────────────────────────────
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);

COMMENT ON TABLE coupon_usages IS '优惠券使用记录';

-- ──────────────────────────────────────────
-- 3. 用户优惠券领取记录（支持发放优惠券给特定用户）
-- ──────────────────────────────────────────
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id, is_used);

COMMENT ON TABLE user_coupons IS '用户优惠券：支持定向发放优惠券';

-- ──────────────────────────────────────────
-- 4. 触发器：更新优惠券使用次数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = NEW.coupon_id;

  -- 更新用户优惠券状态
  UPDATE user_coupons
  SET is_used = true,
      used_at = NOW()
  WHERE user_id = NEW.user_id
    AND coupon_id = NEW.coupon_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_coupon_used
  AFTER INSERT ON coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage();

-- ──────────────────────────────────────────
-- 5. 验证优惠券有效性的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_product_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE(
  valid BOOLEAN,
  coupon_id UUID,
  discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
BEGIN
  -- 查询优惠券
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW());

  -- 优惠券不存在或已过期
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '优惠券无效或已过期';
    RETURN;
  END IF;

  -- 检查使用次数限制
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '优惠券已达使用上限';
    RETURN;
  END IF;

  -- 检查最低消费金额
  IF p_amount < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL,
      '订单金额不满足优惠券使用条件（最低 ' || v_coupon.min_purchase_amount || ' 元）';
    RETURN;
  END IF;

  -- 检查商品适用范围
  IF jsonb_array_length(v_coupon.applicable_products) > 0 THEN
    IF NOT (v_coupon.applicable_products @> to_jsonb(p_product_id)) THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '该商品不适用此优惠券';
      RETURN;
    END IF;
  END IF;

  -- 计算折扣金额
  IF v_coupon.coupon_type = 'percentage' THEN
    v_discount := p_amount * v_coupon.discount_value / 100;
  ELSIF v_coupon.coupon_type = 'fixed_amount' THEN
    v_discount := v_coupon.discount_value;
  ELSE
    v_discount := p_amount; -- free_trial 全免
  END IF;

  -- 应用最大折扣限制
  IF v_coupon.max_discount_amount IS NOT NULL THEN
    v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
  END IF;

  -- 折扣不能超过订单金额
  v_discount := LEAST(v_discount, p_amount);

  RETURN QUERY SELECT true, v_coupon.id, v_discount, '优惠券有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_coupon IS '验证优惠券并计算折扣金额';

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- Coupons: 所有人可查看有效优惠券，管理员可管理
CREATE POLICY "coupons_select_all" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "coupons_manage_admin" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coupon Usages: 用户只能查看自己的使用记录
CREATE POLICY "coupon_usages_select_own" ON coupon_usages
  FOR SELECT USING (user_id = auth.uid());

-- User Coupons: 用户只能查看自己的优惠券
CREATE POLICY "user_coupons_select_own" ON user_coupons
  FOR SELECT USING (user_id = auth.uid());
