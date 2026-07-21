-- Admin 보안 강화: last-admin 원자 가드 + DEFINER REVOKE + RLS is_approved
-- Supabase SQL Editor에서 실행하세요.

-- 1) 승인 취소: 자기자신·마지막 ADMIN 보호 (원자)
CREATE OR REPLACE FUNCTION admin_safe_reject_user(target_id uuid, actor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  target_role text;
  target_approved boolean;
BEGIN
  IF target_id = actor_id THEN
    RAISE EXCEPTION '자신의 승인은 취소할 수 없습니다.';
  END IF;

  SELECT role, is_approved INTO target_role, target_approved
  FROM user_profiles WHERE id = target_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  IF target_role = 'ADMIN' AND target_approved IS TRUE THEN
    SELECT count(*)::int INTO admin_count
    FROM user_profiles
    WHERE role = 'ADMIN' AND is_approved IS TRUE;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION '마지막 관리자 계정은 승인을 취소할 수 없습니다.';
    END IF;
  END IF;

  UPDATE user_profiles
  SET is_approved = false,
      approved_at = null,
      approved_by = null,
      updated_at = now()
  WHERE id = target_id;

  RETURN true;
END;
$$;

-- 2) 역할 변경: 자기자신·마지막 ADMIN 강등 보호
CREATE OR REPLACE FUNCTION admin_safe_update_role(
  target_id uuid,
  actor_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  target_role text;
  target_approved boolean;
BEGIN
  IF target_id = actor_id THEN
    RAISE EXCEPTION '자신의 역할은 변경할 수 없습니다.';
  END IF;

  IF new_role NOT IN ('ADMIN', 'ANALYST', 'VIEWER', 'USER') THEN
    RAISE EXCEPTION '유효하지 않은 역할입니다.';
  END IF;

  SELECT role, is_approved INTO target_role, target_approved
  FROM user_profiles WHERE id = target_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  IF target_role = 'ADMIN' AND target_approved IS TRUE AND new_role <> 'ADMIN' THEN
    SELECT count(*)::int INTO admin_count
    FROM user_profiles
    WHERE role = 'ADMIN' AND is_approved IS TRUE;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION '마지막 관리자 계정은 강등할 수 없습니다.';
    END IF;
  END IF;

  UPDATE user_profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_id;

  RETURN true;
END;
$$;

-- 3) 삭제 전 검사 (Auth 삭제는 앱에서 수행)
CREATE OR REPLACE FUNCTION admin_safe_precheck_delete(
  target_id uuid,
  actor_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  target_role text;
  target_approved boolean;
BEGIN
  IF target_id = actor_id THEN
    RAISE EXCEPTION '자신의 계정은 삭제할 수 없습니다.';
  END IF;

  SELECT role, is_approved INTO target_role, target_approved
  FROM user_profiles WHERE id = target_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  IF target_role = 'ADMIN' AND target_approved IS TRUE THEN
    SELECT count(*)::int INTO admin_count
    FROM user_profiles
    WHERE role = 'ADMIN' AND is_approved IS TRUE;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION '마지막 관리자 계정은 삭제할 수 없습니다.';
    END IF;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION admin_safe_reject_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION admin_safe_update_role(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION admin_safe_precheck_delete(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_safe_reject_user(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION admin_safe_update_role(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION admin_safe_precheck_delete(uuid, uuid) TO service_role;

-- 4) 기존 DEFINER 함수 REVOKE (미존재 시 무시하려면 DO 블록)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_rate_limit') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION check_rate_limit(text, text, int, int) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, int, int) TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_error_logs') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION cleanup_old_error_logs() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION cleanup_old_error_logs() TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_system_alerts') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION cleanup_old_system_alerts() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION cleanup_old_system_alerts() TO service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_ip_logs') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION cleanup_old_ip_logs() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION cleanup_old_ip_logs() TO service_role';
  END IF;
END $$;

-- 5) ADMIN SELECT 정책에 is_approved 정렬 (존재하는 정책만 재생성 시도)
-- error_logs
DROP POLICY IF EXISTS "error_logs_admin_select" ON error_logs;
CREATE POLICY "error_logs_admin_select" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
        AND user_profiles.is_approved IS TRUE
    )
  );

DROP POLICY IF EXISTS "system_alerts_admin_select" ON system_alerts;
CREATE POLICY "system_alerts_admin_select" ON system_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
        AND user_profiles.is_approved IS TRUE
    )
  );
