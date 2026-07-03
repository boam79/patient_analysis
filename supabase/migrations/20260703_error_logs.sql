-- =====================================================
-- 클라이언트 에러 로그 (자체 error_logs 테이블)
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- Next.js 에러 바운더리(app/error.tsx, app/global-error.tsx,
-- app/dashboard/error.tsx, app/admin/error.tsx)에서 발생한 런타임 에러를
-- 수집합니다. 외부 에러 트래킹 서비스(Sentry 등) 대신 이미 사용 중인
-- Supabase에 저장하여 추가 벤더/의존성 없이 관측성을 확보합니다.
--
-- 주의: 에러 메시지/스택은 PHI(환자 개인정보)를 포함하지 않는 React
-- 컴포넌트 에러 정보만 담습니다(클라이언트 코드에서 환자 데이터를
-- 에러 메시지에 포함시키지 않도록 주의 필요).
-- =====================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  boundary TEXT NOT NULL, -- 'app' | 'global' | 'dashboard' | 'admin'
  message TEXT NOT NULL,
  stack TEXT,
  digest TEXT,
  path TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_boundary ON error_logs (boundary);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN 역할만 조회 가능 (다른 로그 테이블과 동일한 정책 패턴)
CREATE POLICY "error_logs_admin_select" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
    )
  );

-- 삽입은 service_role(API 라우트)에서만 수행 (RLS를 우회하므로 별도 INSERT 정책 불필요)

-- TTL 정리 함수 (Supabase Scheduled Functions에서 주기 실행 권장)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_error_logs() TO service_role;
