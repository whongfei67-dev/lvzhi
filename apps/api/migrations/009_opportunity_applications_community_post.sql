-- 社区帖子投递：与对外岗位投递共用 opportunity_applications，进入工作台「机会投递」列表
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS community_post_id UUID;

ALTER TABLE opportunity_applications ALTER COLUMN opportunity_id DROP NOT NULL;

ALTER TABLE opportunity_applications DROP CONSTRAINT IF EXISTS opportunity_applications_opportunity_id_applicant_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_oa_opp_applicant
  ON opportunity_applications (opportunity_id, applicant_id)
  WHERE opportunity_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_oa_cp_applicant
  ON opportunity_applications (community_post_id, applicant_id)
  WHERE community_post_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_applications_community_post_id_fkey'
  ) THEN
    ALTER TABLE opportunity_applications
      ADD CONSTRAINT opportunity_applications_community_post_id_fkey
      FOREIGN KEY (community_post_id) REFERENCES community_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oa_target_xor_ck') THEN
    ALTER TABLE opportunity_applications ADD CONSTRAINT oa_target_xor_ck CHECK (
      (opportunity_id IS NOT NULL AND community_post_id IS NULL) OR
      (opportunity_id IS NULL AND community_post_id IS NOT NULL)
    );
  END IF;
END $$;
