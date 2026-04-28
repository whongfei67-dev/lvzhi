-- 岗位投递：发布方回复申请人
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS publisher_reply TEXT;
