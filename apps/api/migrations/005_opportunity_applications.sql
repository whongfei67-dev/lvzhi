-- 合作机会：合作投递记录（材料上传后写入，发布方在工作台查看）
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  original_name VARCHAR(500),
  uploaded_file_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_opp_apps_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_apps_applicant ON opportunity_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_opp_apps_created ON opportunity_applications(created_at DESC);

COMMENT ON TABLE opportunity_applications IS '合作机会投递：每位申请人对同一机会一条记录，更新材料时覆盖文件';
