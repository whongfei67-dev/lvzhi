-- 合作机会：投递时需附带的文件/材料说明（详情页展示）
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS application_file_requirements TEXT;

COMMENT ON COLUMN opportunities.application_file_requirements IS '合作投递时需准备的文件与格式说明';
