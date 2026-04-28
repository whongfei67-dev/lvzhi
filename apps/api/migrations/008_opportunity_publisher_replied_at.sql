-- 投递记录：发布方回复时间（与 publisher_reply 配套，供求职者侧展示）
ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS publisher_replied_at TIMESTAMPTZ;

COMMENT ON COLUMN opportunity_applications.publisher_replied_at IS '发布方最近一次回复时间';

UPDATE opportunity_applications
SET publisher_replied_at = updated_at
WHERE publisher_reply IS NOT NULL AND BTRIM(publisher_reply) <> '' AND publisher_replied_at IS NULL;
