-- ============================================
-- 上线前补充迁移：文件存储表
-- ============================================

-- ──────────────────────────────────────────
-- 1. 上传文件记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size BIGINT NOT NULL CHECK (size > 0),
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('other', 'avatar', 'agent_avatar', 'document', 'attachment')),
  storage_path TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploaded_files_user ON uploaded_files(user_id, created_at DESC);
CREATE INDEX idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX idx_uploaded_files_created ON uploaded_files(created_at DESC);

COMMENT ON TABLE uploaded_files IS '用户上传文件记录表';

-- ──────────────────────────────────────────
-- 2. 文件下载记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_downloads_user ON file_downloads(user_id, downloaded_at DESC);
CREATE INDEX idx_file_downloads_file ON file_downloads(file_id);

COMMENT ON TABLE file_downloads IS '文件下载记录表';

-- ──────────────────────────────────────────
-- 3. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_downloads ENABLE ROW LEVEL SECURITY;

-- 上传文件：用户可查看和管理自己的
CREATE POLICY "uploaded_files_select_own" ON uploaded_files
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "uploaded_files_insert_own" ON uploaded_files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "uploaded_files_delete_own" ON uploaded_files
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "uploaded_files_admin_all" ON uploaded_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 下载记录：用户可查看自己的，管理员可查看所有
CREATE POLICY "file_downloads_select_own" ON file_downloads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "file_downloads_insert_own" ON file_downloads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "file_downloads_admin_all" ON file_downloads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
