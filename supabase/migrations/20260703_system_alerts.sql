-- =====================================================
-- 시스템 이상탐지 알림 이력 (Slack 알림 중복 방지용)
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- app/api/cron/anomaly-check가 주기 실행되며 동일한 이상 징후에 대해
-- 반복적으로 Slack 알림을 보내지 않도록 최근 전송 이력을 기록합니다.
-- =====================================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alert_key TEXT NOT NULL, -- 예: 'anomaly:1.2.3.4'
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_key_time
  ON system_alerts (alert_key, sent_at DESC);

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- ADMIN 역할만 조회 가능 (error_logs / audit_logs와 동일한 정책 패턴)
CREATE POLICY "system_alerts_admin_select" ON system_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
    )
  );

-- 삽입은 service_role(크론 라우트)에서만 수행

CREATE OR REPLACE FUNCTION cleanup_old_system_alerts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM system_alerts WHERE sent_at < NOW() - INTERVAL '90 days';
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_system_alerts() TO service_role;
