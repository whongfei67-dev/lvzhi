-- =============================================================
-- 知识产权保护申请表 (ip_protection_applications)
-- 用于创作者对 Skills 或智能体申请知识产权保护
-- =============================================================

-- 创建知识产权保护申请表
CREATE TABLE IF NOT EXISTS ip_protection_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('skill', 'agent')),
  application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('copyright', 'trademark', 'patent')),
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_user ON ip_protection_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_product ON ip_protection_applications(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_ip_status ON ip_protection_applications(status);
CREATE INDEX IF NOT EXISTS idx_ip_type ON ip_protection_applications(application_type);

-- 添加注释
COMMENT ON TABLE ip_protection_applications IS '知识产权保护申请表 - 用于创作者申请 Skills 或智能体的知识产权保护';
COMMENT ON COLUMN ip_protection_applications.user_id IS '申请人ID（创作者）';
COMMENT ON COLUMN ip_protection_applications.product_id IS '产品ID（Skills或智能体）';
COMMENT ON COLUMN ip_protection_applications.product_type IS '产品类型：skill 或 agent';
COMMENT ON COLUMN ip_protection_applications.application_type IS '申请类型：copyright（版权）/ trademark（商标）/ patent（专利）';
COMMENT ON COLUMN ip_protection_applications.description IS '知识产权描述说明';
COMMENT ON COLUMN ip_protection_applications.evidence_urls IS '证据材料URL列表';
COMMENT ON COLUMN ip_protection_applications.status IS '申请状态：pending/approved/rejected/withdrawn';
COMMENT ON COLUMN ip_protection_applications.reviewer_id IS '审核人ID';
COMMENT ON COLUMN ip_protection_applications.reviewed_at IS '审核时间';
COMMENT ON COLUMN ip_protection_applications.rejection_reason IS '驳回原因';
COMMENT ON COLUMN ip_protection_applications.certificate_url IS '证书URL（通过后生成）';

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_ip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ip_updated_at
  BEFORE UPDATE ON ip_protection_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_ip_updated_at();
