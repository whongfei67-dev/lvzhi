-- 工作台：技能运行记录（输入文件 → 执行 → 产出文件/文本）
CREATE TABLE IF NOT EXISTS skill_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'completed',
  input_file_ids UUID[] NOT NULL DEFAULT '{}',
  skill_title_snapshot VARCHAR(500),
  input_names_snapshot TEXT,
  result_text TEXT,
  -- 逻辑外键：uploaded_files 在 011 迁移中建表；此处不用 REFERENCES，避免未跑 011 时整段迁移失败
  output_file_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_skill_runs_user_created ON skill_runs(user_id, created_at DESC);
