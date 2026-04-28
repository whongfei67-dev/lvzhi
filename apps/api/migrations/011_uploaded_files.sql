-- 上传/下载元数据表（Fastify API：upload、download、workspace skill-runs 等）
-- 仅标准 PostgreSQL / PolarDB，不含 Supabase RLS；与 apps/api 其它迁移一致手工执行或接入迁移管线

CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size BIGINT NOT NULL CHECK (size > 0),
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN (
    'other',
    'avatar',
    'agent_avatar',
    'document',
    'attachment',
    'skill_run_output'
  )),
  storage_path TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created ON uploaded_files(created_at);

CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_downloads_user ON file_downloads(user_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_downloads_file ON file_downloads(file_id);
