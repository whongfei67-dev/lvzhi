-- =============================================================
-- 试用邀请表 (trial_invitations)
-- 用于创作者向目标用户发送 Skills 或智能体试用邀请
-- =============================================================

-- 创建试用邀请表
CREATE TABLE IF NOT EXISTS trial_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('skill', 'agent')),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  response_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_trial_per_product UNIQUE (from_user_id, to_user_id, product_id, product_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trial_from_user ON trial_invitations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_trial_to_user ON trial_invitations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_trial_product ON trial_invitations(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_trial_status ON trial_invitations(status);
CREATE INDEX IF NOT EXISTS idx_trial_expires ON trial_invitations(expires_at);

-- 添加注释
COMMENT ON TABLE trial_invitations IS '试用邀请表 - 用于创作者向目标用户发送 Skills 或智能体试用邀请';
COMMENT ON COLUMN trial_invitations.from_user_id IS '发送邀请的用户ID（创作者）';
COMMENT ON COLUMN trial_invitations.to_user_id IS '接收邀请的用户ID（目标用户）';
COMMENT ON COLUMN trial_invitations.product_id IS '产品ID（Skills或智能体）';
COMMENT ON COLUMN trial_invitations.product_type IS '产品类型：skill 或 agent';
COMMENT ON COLUMN trial_invitations.message IS '邀请附言';
COMMENT ON COLUMN trial_invitations.status IS '邀请状态：pending/accepted/rejected/expired/cancelled';
COMMENT ON COLUMN trial_invitations.response_message IS '被邀请人的响应消息';
COMMENT ON COLUMN trial_invitations.expires_at IS '邀请过期时间';
COMMENT ON COLUMN trial_invitations.responded_at IS '响应时间';

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_trial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trial_updated_at
  BEFORE UPDATE ON trial_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_updated_at();
