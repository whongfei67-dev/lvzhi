-- ============================================
-- 013: 数据管理系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 数据备份记录表
-- ──────────────────────────────────────────
CREATE TABLE data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  backup_scope TEXT NOT NULL CHECK (backup_scope IN ('database', 'table', 'user_data')),
  target_tables TEXT[], -- 备份的表名列表
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  compression_type TEXT CHECK (compression_type IN ('gzip', 'bzip2', 'none')),
  encryption_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_backups_status ON data_backups(status, started_at DESC);
CREATE INDEX idx_data_backups_type ON data_backups(backup_type, started_at DESC);

COMMENT ON TABLE data_backups IS '数据备份记录：定期备份和手动备份';
COMMENT ON COLUMN data_backups.metadata IS '备份元数据：记录数、校验和等';

-- ──────────────────────────────────────────
-- 2. 数据恢复记录表
-- ──────────────────────────────────────────
CREATE TABLE data_restores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES data_backups(id) ON DELETE SET NULL,
  restore_scope TEXT NOT NULL CHECK (restore_scope IN ('full', 'partial', 'table', 'user_data')),
  target_tables TEXT[],
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  records_restored INTEGER DEFAULT 0,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_restores_status ON data_restores(status, started_at DESC);
CREATE INDEX idx_data_restores_backup ON data_restores(backup_id);

COMMENT ON TABLE data_restores IS '数据恢复记录：从备份恢复数据';

-- ──────────────────────────────────────────
-- 3. 数据导出记录表
-- ──────────────────────────────────────────
CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL CHECK (export_type IN ('user_data', 'analytics', 'compliance', 'custom')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'xlsx', 'sql')),
  scope JSONB NOT NULL, -- 导出范围：表名、过滤条件等
  file_path TEXT,
  file_size_bytes BIGINT,
  record_count INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  error_message TEXT,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 导出文件过期时间
  download_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_exports_user ON data_exports(requested_by, requested_at DESC);
CREATE INDEX idx_data_exports_status ON data_exports(status, requested_at DESC);
CREATE INDEX idx_data_exports_expires ON data_exports(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE data_exports IS '数据导出记录：用户数据导出、合规导出等';
COMMENT ON COLUMN data_exports.scope IS '导出范围：{"tables": ["orders"], "filters": {"date_from": "2024-01-01"}}';

-- ──────────────────────────────────────────
-- 4. 数据清理任务表
-- ──────────────────────────────────────────
CREATE TABLE data_cleanup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('delete_old_data', 'archive', 'anonymize', 'purge')),
  target_table TEXT NOT NULL,
  cleanup_rule JSONB NOT NULL, -- 清理规则：如删除 90 天前的数据
  schedule TEXT, -- Cron 表达式
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  records_affected INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_cleanup_tasks_schedule ON data_cleanup_tasks(next_run_at) WHERE status = 'active';
CREATE INDEX idx_data_cleanup_tasks_table ON data_cleanup_tasks(target_table);

COMMENT ON TABLE data_cleanup_tasks IS '数据清理任务：定期清理过期数据';
COMMENT ON COLUMN data_cleanup_tasks.cleanup_rule IS '清理规则：{"older_than_days": 90, "conditions": {...}}';

-- ──────────────────────────────────────────
-- 5. 数据清理日志表
-- ──────────────────────────────────────────
CREATE TABLE data_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES data_cleanup_tasks(id) ON DELETE SET NULL,
  target_table TEXT NOT NULL,
  records_deleted INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  records_anonymized INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_cleanup_logs_task ON data_cleanup_logs(task_id, executed_at DESC);
CREATE INDEX idx_data_cleanup_logs_table ON data_cleanup_logs(target_table, executed_at DESC);

COMMENT ON TABLE data_cleanup_logs IS '数据清理日志：记录每次清理任务的执行结果';

-- ──────────────────────────────────────────
-- 6. 数据审计日志表
-- ──────────────────────────────────────────
CREATE TABLE data_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_audit_logs_table ON data_audit_logs(table_name, performed_at DESC);
CREATE INDEX idx_data_audit_logs_record ON data_audit_logs(record_id, performed_at DESC);
CREATE INDEX idx_data_audit_logs_user ON data_audit_logs(user_id, performed_at DESC);
CREATE INDEX idx_data_audit_logs_operation ON data_audit_logs(operation, performed_at DESC);

COMMENT ON TABLE data_audit_logs IS '数据审计日志：记录敏感数据的所有操作';
COMMENT ON COLUMN data_audit_logs.changed_fields IS '变更字段列表（仅 UPDATE 操作）';

-- ──────────────────────────────────────────
-- 7. 数据质量检查表
-- ──────────────────────────────────────────
CREATE TABLE data_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('completeness', 'accuracy', 'consistency', 'validity', 'uniqueness')),
  target_table TEXT NOT NULL,
  check_rule JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  schedule TEXT, -- Cron 表达式
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_quality_checks_table ON data_quality_checks(target_table);
CREATE INDEX idx_data_quality_checks_schedule ON data_quality_checks(next_run_at) WHERE is_active = true;

COMMENT ON TABLE data_quality_checks IS '数据质量检查：定期检查数据完整性和准确性';
COMMENT ON COLUMN data_quality_checks.check_rule IS '检查规则：{"field": "email", "rule": "not_null", "threshold": 0.95}';

-- ──────────────────────────────────────────
-- 8. 数据质量检查结果表
-- ──────────────────────────────────────────
CREATE TABLE data_quality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES data_quality_checks(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  records_checked INTEGER NOT NULL,
  records_failed INTEGER DEFAULT 0,
  failure_rate DECIMAL(5,2),
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_quality_results_check ON data_quality_results(check_id, checked_at DESC);
CREATE INDEX idx_data_quality_results_passed ON data_quality_results(passed, checked_at DESC);

COMMENT ON TABLE data_quality_results IS '数据质量检查结果';
COMMENT ON COLUMN data_quality_results.details IS '详细信息：失败记录 ID、错误原因等';

-- ──────────────────────────────────────────
-- 9. 数据归档表
-- ──────────────────────────────────────────
CREATE TABLE data_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  archive_name TEXT NOT NULL,
  archive_path TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  date_range JSONB, -- {"from": "2023-01-01", "to": "2023-12-31"}
  compression_type TEXT CHECK (compression_type IN ('gzip', 'bzip2', 'none')),
  file_size_bytes BIGINT,
  archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_archives_table ON data_archives(source_table, archived_at DESC);

COMMENT ON TABLE data_archives IS '数据归档记录：长期存储的历史数据';

-- ──────────────────────────────────────────
-- 10. 触发器：自动记录审计日志（示例：profiles 表）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_profiles_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields TEXT[];
  v_has_action BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_audit_logs' AND column_name = 'action'
  ) INTO v_has_action;

  IF TG_OP = 'UPDATE' THEN
    v_changed_fields := ARRAY[]::TEXT[];
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN v_changed_fields := array_append(v_changed_fields, 'phone'); END IF;
    IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN v_changed_fields := array_append(v_changed_fields, 'display_name'); END IF;
    IF OLD.role IS DISTINCT FROM NEW.role THEN v_changed_fields := array_append(v_changed_fields, 'role'); END IF;

    IF cardinality(v_changed_fields) = 0 THEN
      RETURN NEW;
    END IF;

    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, action, old_data, new_data, changed_fields, user_id
      ) VALUES (
        'profiles', NEW.id, 'UPDATE', 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_changed_fields, auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, old_data, new_data, changed_fields, user_id
      ) VALUES (
        'profiles', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_changed_fields, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, action, old_data, user_id
      ) VALUES (
        'profiles', OLD.id, 'DELETE', 'DELETE', to_jsonb(OLD), auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, old_data, user_id
      ) VALUES (
        'profiles', OLD.id, 'DELETE', to_jsonb(OLD), auth.uid()
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_profiles_trigger
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profiles_changes();

COMMENT ON FUNCTION audit_profiles_changes IS '审计 profiles 敏感字段变更；忽略仅 failed_attempts 等非敏感更新；兼容 data_audit_logs.action 列';

-- ──────────────────────────────────────────
-- 11. 执行数据导出的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION request_data_export(
  p_user_id UUID,
  p_export_type TEXT,
  p_format TEXT,
  p_scope JSONB
)
RETURNS UUID AS $$
DECLARE
  v_export_id UUID;
BEGIN
  INSERT INTO data_exports (
    export_type,
    format,
    scope,
    requested_by,
    expires_at,
    status
  ) VALUES (
    p_export_type,
    p_format,
    p_scope,
    p_user_id,
    NOW() + INTERVAL '7 days', -- 导出文件 7 天后过期
    'pending'
  ) RETURNING id INTO v_export_id;

  RETURN v_export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_data_export IS '请求数据导出（异步处理）';

-- ──────────────────────────────────────────
-- 12. 清理过期数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  -- 删除过期的导出文件记录
  UPDATE data_exports
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'completed';

  -- 删除旧的审计日志（保留 1 年）
  DELETE FROM data_audit_logs
  WHERE performed_at < NOW() - INTERVAL '1 year';

  -- 删除旧的数据质量检查结果（保留 90 天）
  DELETE FROM data_quality_results
  WHERE checked_at < NOW() - INTERVAL '90 days';

  -- 删除旧的清理日志（保留 180 天）
  DELETE FROM data_cleanup_logs
  WHERE executed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_exports IS '清理过期的导出文件和旧日志（建议每日执行）';

-- ──────────────────────────────────────────
-- 13. 数据统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW data_management_stats AS
SELECT
  (SELECT COUNT(*) FROM data_backups WHERE status = 'completed') AS total_backups,
  (SELECT COUNT(*) FROM data_backups WHERE status = 'completed' AND started_at > NOW() - INTERVAL '7 days') AS recent_backups,
  (SELECT SUM(file_size_bytes) FROM data_backups WHERE status = 'completed') AS total_backup_size,
  (SELECT COUNT(*) FROM data_exports WHERE status = 'completed') AS total_exports,
  (SELECT COUNT(*) FROM data_exports WHERE status = 'pending') AS pending_exports,
  (SELECT COUNT(*) FROM data_audit_logs WHERE performed_at > NOW() - INTERVAL '24 hours') AS audit_logs_24h,
  (SELECT COUNT(*) FROM data_quality_checks WHERE is_active = true) AS active_quality_checks,
  (SELECT COUNT(*) FROM data_quality_results WHERE NOT passed AND checked_at > NOW() - INTERVAL '7 days') AS recent_quality_failures;

COMMENT ON VIEW data_management_stats IS '数据管理统计概览';

-- ──────────────────────────────────────────
-- 14. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_restores ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cleanup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_archives ENABLE ROW LEVEL SECURITY;

-- 备份和恢复：仅管理员
CREATE POLICY "backups_admin_only" ON data_backups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "restores_admin_only" ON data_restores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 数据导出：用户可查看自己的导出
CREATE POLICY "exports_select_own" ON data_exports
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "exports_insert_own" ON data_exports
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "exports_admin_all" ON data_exports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 清理任务：仅管理员
CREATE POLICY "cleanup_tasks_admin_only" ON data_cleanup_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "cleanup_logs_admin_only" ON data_cleanup_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 审计日志：管理员可查看所有，用户可查看自己的
CREATE POLICY "audit_logs_select_own" ON data_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 数据质量：仅管理员
CREATE POLICY "quality_checks_admin_only" ON data_quality_checks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "quality_results_admin_only" ON data_quality_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 归档：仅管理员
CREATE POLICY "archives_admin_only" ON data_archives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
