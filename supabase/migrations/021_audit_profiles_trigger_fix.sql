-- 修复登录/失败计数等 UPDATE profiles 时触发审计写入失败：
-- 1) 仅 failed_attempts、locked_until、password_hash 等变更时，不再写审计行（避免无意义插入）。
-- 2) 若 data_audit_logs 存在与 operation 同义的 action 列（NOT NULL），写入时显式带上 action。

CREATE OR REPLACE FUNCTION audit_profiles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_fields TEXT[];
  v_has_action BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'data_audit_logs'
      AND column_name = 'action'
  ) INTO v_has_action;

  IF TG_OP = 'UPDATE' THEN
    v_changed_fields := ARRAY[]::TEXT[];
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      v_changed_fields := array_append(v_changed_fields, 'phone');
    END IF;
    IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
      v_changed_fields := array_append(v_changed_fields, 'display_name');
    END IF;
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      v_changed_fields := array_append(v_changed_fields, 'role');
    END IF;

    IF cardinality(v_changed_fields) = 0 THEN
      RETURN NEW;
    END IF;

    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name,
        record_id,
        operation,
        action,
        old_data,
        new_data,
        changed_fields,
        user_id
      ) VALUES (
        'profiles',
        NEW.id,
        'UPDATE',
        'UPDATE',
        to_jsonb(OLD),
        to_jsonb(NEW),
        v_changed_fields,
        auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_fields,
        user_id
      ) VALUES (
        'profiles',
        NEW.id,
        'UPDATE',
        to_jsonb(OLD),
        to_jsonb(NEW),
        v_changed_fields,
        auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name,
        record_id,
        operation,
        action,
        old_data,
        user_id
      ) VALUES (
        'profiles',
        OLD.id,
        'DELETE',
        'DELETE',
        to_jsonb(OLD),
        auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        user_id
      ) VALUES (
        'profiles',
        OLD.id,
        'DELETE',
        to_jsonb(OLD),
        auth.uid()
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION audit_profiles_changes IS '审计 profiles 敏感字段变更；忽略仅 failed_attempts 等非敏感更新；兼容 data_audit_logs.action 列';
