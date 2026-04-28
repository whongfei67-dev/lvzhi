-- ============================================
-- 018: 微信/支付宝登录支持
-- ============================================

-- =============================================================
-- 为 profiles 表添加微信/支付宝登录字段
-- =============================================================

-- 添加微信登录字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wechat_unionid TEXT,
  ADD COLUMN IF NOT EXISTS wechat_openid TEXT,
  ADD COLUMN IF NOT EXISTS alipay_user_id TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT; -- 如果还没有这个字段

-- 添加唯一索引（可选）
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wechat_unionid
  ON public.profiles(wechat_unionid) WHERE wechat_unionid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wechat_openid
  ON public.profiles(wechat_openid) WHERE wechat_openid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_alipay_user_id
  ON public.profiles(alipay_user_id) WHERE alipay_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone) WHERE phone IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN public.profiles.wechat_unionid IS '微信 UnionID（同一主体下多应用唯一）';
COMMENT ON COLUMN public.profiles.wechat_openid IS '微信 OpenID（同一应用内唯一）';
COMMENT ON COLUMN public.profiles.alipay_user_id IS '支付宝用户唯一标识';

-- 更新 RLS 策略，允许用户更新自己的第三方登录信息
DO $$
BEGIN
  -- 确保管理员可以更新所有用户的第三方登录字段
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'profiles_admin_update_third_party'
  ) THEN
    CREATE POLICY "profiles_admin_update_third_party" ON public.profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles AS p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- =============================================================
-- 创建微信登录状态表（用于存储 state 防止 CSRF）
-- =============================================================
CREATE TABLE IF NOT EXISTS public.wechat_auth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  redirect_uri TEXT,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wechat_auth_states_state ON public.wechat_auth_states(state);
CREATE INDEX IF NOT EXISTS idx_wechat_auth_states_expires ON public.wechat_auth_states(expires_at);

COMMENT ON TABLE public.wechat_auth_states IS '微信登录临时状态表（防止 CSRF 攻击）';

-- =============================================================
-- 创建第三方登录连接表（扩展 oauth_connections）
-- =============================================================
-- 更新 oauth_connections 表支持更多 provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oauth_connections'
    AND column_name = 'provider_user_id'
  ) THEN
    ALTER TABLE public.oauth_connections
      ADD COLUMN IF NOT EXISTS provider_user_id TEXT NOT NULL;
  END IF;
END $$;

-- 添加微信专有字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oauth_connections'
    AND column_name = 'wechat_avatar'
  ) THEN
    ALTER TABLE public.oauth_connections
      ADD COLUMN IF NOT EXISTS wechat_avatar TEXT,
      ADD COLUMN IF NOT EXISTS wechat_nickname TEXT,
      ADD COLUMN IF NOT EXISTS wechat_country TEXT,
      ADD COLUMN IF NOT EXISTS wechat_province TEXT,
      ADD COLUMN IF NOT EXISTS wechat_city TEXT;
  END IF;
END $$;

-- 添加支付宝专有字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oauth_connections'
    AND column_name = 'alipay_avatar'
  ) THEN
    ALTER TABLE public.oauth_connections
      ADD COLUMN IF NOT EXISTS alipay_avatar TEXT,
      ADD COLUMN IF NOT EXISTS alipay_nickname TEXT;
  END IF;
END $$;

-- =============================================================
-- 清理过期状态的函数
-- =============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_wechat_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.wechat_auth_states
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_wechat_states IS '清理过期的微信登录状态（建议每小时执行）';

-- =============================================================
-- 自动清理触发器（可选）
-- =============================================================
-- 可以创建定时任务来清理，或者手动调用 cleanup_expired_wechat_states()

-- =============================================================
-- 备注
-- =============================================================
-- 执行此迁移后，需要配置以下环境变量：
-- WECHAT_APP_ID - 微信开放平台应用 AppID
-- WECHAT_APP_SECRET - 微信开放平台应用 AppSecret
-- ALIPAY_APP_ID - 支付宝应用 AppID
-- ALIPAY_PRIVATE_KEY - 支付宝应用私钥
-- ALIPAY_PUBLIC_KEY - 支付宝公钥
-- WEB_BASE_URL - 前端网站地址（用于登录后跳转）
-- API_BASE_URL - 后端 API 地址（用于回调）

-- =============================================================
-- 短信验证码表（如果还不存在）
-- =============================================================
CREATE TABLE IF NOT EXISTS public.sms_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON public.sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_code ON public.sms_codes(phone, code) WHERE used = false;

COMMENT ON TABLE public.sms_codes IS '短信验证码表：存储发送的验证码';

-- =============================================================
-- 阿里云 SMS 环境变量配置模板
-- =============================================================
-- ALIYUN_ACCESS_KEY_ID=你的阿里云 AccessKey ID
-- ALIYUN_ACCESS_KEY_SECRET=你的阿里云 AccessKey Secret
-- ALIYUN_SMS_SIGN_NAME=短信签名名称
-- ALIYUN_SMS_TEMPLATE_CODE=短信模板 CODE
