-- =====================================================
-- API Rate Limiting (슬라이딩 윈도우, Supabase 기반)
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 인증 없이 호출 가능한 API 라우트(/api/log-ip, /api/geocode)를
-- IP + 엔드포인트 기준으로 제한하기 위한 테이블/함수입니다.
-- Upstash Redis 등 외부 서비스 없이 이미 사용 중인 Supabase Postgres만으로
-- 분산 환경(서버리스 다중 인스턴스)에서도 정확하게 동작합니다.
-- =====================================================

-- 1. 요청 이벤트 테이블
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON rate_limit_events (ip_address, endpoint, created_at DESC);

-- service_role 전용 테이블이므로 공개 정책 없이 RLS만 활성화
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

-- 2. 슬라이딩 윈도우 체크 + 기록 (원자적 처리)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address TEXT,
  p_endpoint TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS TABLE(allowed BOOLEAN, current_count INT, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_count INT;
  v_oldest TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MIN(created_at) INTO v_count, v_oldest
  FROM rate_limit_events
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT
      FALSE,
      v_count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_oldest + (p_window_seconds || ' seconds')::INTERVAL - NOW())))::INT);
    RETURN;
  END IF;

  INSERT INTO rate_limit_events (ip_address, endpoint) VALUES (p_ip_address, p_endpoint);

  RETURN QUERY SELECT TRUE, v_count + 1, 0;
END;
$$;

-- 3. TTL 정리 함수 (Supabase Scheduled Functions에서 주기 실행 권장, cleanup_old_ip_logs와 동일 패턴)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limit_events WHERE created_at < NOW() - INTERVAL '1 hour';
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limit_events() TO service_role;
