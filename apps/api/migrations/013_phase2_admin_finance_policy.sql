-- Phase 2: 提现审批、结算审批、超管策略配置

CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  account_type TEXT NOT NULL DEFAULT 'alipay',
  account TEXT NOT NULL DEFAULT '',
  account_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status_created
  ON withdraw_requests(status, created_at DESC);

ALTER TABLE withdraw_requests
  ADD COLUMN IF NOT EXISTS processed_by UUID;

ALTER TABLE withdraw_requests
  ADD COLUMN IF NOT EXISTS review_reason TEXT;

ALTER TABLE withdraw_requests
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE withdraw_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE creator_earnings
  ADD COLUMN IF NOT EXISTS settlement_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE creator_earnings
  ADD COLUMN IF NOT EXISTS settlement_reviewed_by UUID;

ALTER TABLE creator_earnings
  ADD COLUMN IF NOT EXISTS settlement_reviewed_at TIMESTAMPTZ;

ALTER TABLE creator_earnings
  ADD COLUMN IF NOT EXISTS settlement_review_reason TEXT;

CREATE TABLE IF NOT EXISTS admin_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key TEXT NOT NULL UNIQUE,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_policies_key ON admin_policies(policy_key);
