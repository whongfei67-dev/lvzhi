-- =============================================================
-- 律师认证申请表 (lawyer_verification_applications)
-- 用于创作者申请律师认证
-- =============================================================

-- 创建律师认证申请表
CREATE TABLE IF NOT EXISTS lawyer_verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bar_number VARCHAR(50) NOT NULL,
  law_firm VARCHAR(200) NOT NULL,
  specialty TEXT[] DEFAULT '{}',
  certificate_url TEXT,
  id_card_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lawyer_user ON lawyer_verification_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_status ON lawyer_verification_applications(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_bar ON lawyer_verification_applications(bar_number);

-- 添加注释
COMMENT ON TABLE lawyer_verification_applications IS '律师认证申请表 - 用于创作者申请律师认证';
COMMENT ON COLUMN lawyer_verification_applications.user_id IS '申请人ID';
COMMENT ON COLUMN lawyer_verification_applications.bar_number IS '律师执业证号';
COMMENT ON COLUMN lawyer_verification_applications.law_firm IS '所属律所';
COMMENT ON COLUMN lawyer_verification_applications.specialty IS '专业领域';
COMMENT ON COLUMN lawyer_verification_applications.certificate_url IS '执业证扫描件URL';
COMMENT ON COLUMN lawyer_verification_applications.id_card_url IS '身份证扫描件URL';
COMMENT ON COLUMN lawyer_verification_applications.status IS '申请状态：pending/approved/rejected';
COMMENT ON COLUMN lawyer_verification_applications.reviewer_id IS '审核人ID';
COMMENT ON COLUMN lawyer_verification_applications.reviewed_at IS '审核时间';
COMMENT ON COLUMN lawyer_verification_applications.rejection_reason IS '驳回原因';

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_lawyer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lawyer_updated_at
  BEFORE UPDATE ON lawyer_verification_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_lawyer_updated_at();

-- =============================================================
-- 为 profiles 表添加创作者相关字段（如果不存在）
-- =============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_level VARCHAR(20) 
  CHECK (creator_level IN ('basic', 'excellent', 'master', 'lawyer'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_title VARCHAR(100);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_verified_at TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bar_number VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS law_firm VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT[] DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN profiles.creator_level IS '创作者认证等级：basic/excellent/master/lawyer';
COMMENT ON COLUMN profiles.creator_title IS '创作者头衔';
COMMENT ON COLUMN profiles.lawyer_verified IS '是否已通过律师认证';
COMMENT ON COLUMN profiles.lawyer_verified_at IS '律师认证时间';
COMMENT ON COLUMN profiles.bar_number IS '律师执业证号';
COMMENT ON COLUMN profiles.law_firm IS '所属律所';
COMMENT ON COLUMN profiles.specialty IS '专业领域数组';
