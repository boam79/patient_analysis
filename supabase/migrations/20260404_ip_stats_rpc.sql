-- =====================================================
-- IP 통계 집계용 RPC 함수
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- =====================================================

-- 1. Top N 접근 IP 집계
CREATE OR REPLACE FUNCTION get_top_ips(limit_count int DEFAULT 10)
RETURNS TABLE(ip_address text, access_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ip_address::text,
    COUNT(*)::bigint AS access_count
  FROM ip_access_logs
  WHERE ip_address IS NOT NULL
  GROUP BY ip_address
  ORDER BY access_count DESC
  LIMIT limit_count;
$$;

-- 2. 시간대별 접근 통계 (UTC 기준 1시간 버킷)
CREATE OR REPLACE FUNCTION get_hourly_stats(since_time timestamptz DEFAULT NOW() - INTERVAL '24 hours')
RETURNS TABLE(hour text, access_count bigint, unique_ips bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS hour,
    COUNT(*)::bigint AS access_count,
    COUNT(DISTINCT ip_address)::bigint AS unique_ips
  FROM ip_access_logs
  WHERE created_at >= since_time
    AND ip_address IS NOT NULL
  GROUP BY DATE_TRUNC('hour', created_at AT TIME ZONE 'UTC')
  ORDER BY hour ASC;
$$;

-- 3. 경로별 접근 통계
CREATE OR REPLACE FUNCTION get_path_stats()
RETURNS TABLE(path text, access_count bigint, unique_ips bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    path::text,
    COUNT(*)::bigint AS access_count,
    COUNT(DISTINCT ip_address)::bigint AS unique_ips
  FROM ip_access_logs
  WHERE path IS NOT NULL
    AND ip_address IS NOT NULL
  GROUP BY path
  ORDER BY access_count DESC;
$$;

-- 4. 국가별 접근 통계
CREATE OR REPLACE FUNCTION get_country_stats(limit_count int DEFAULT 10)
RETURNS TABLE(country text, access_count bigint, unique_ips bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    country::text,
    COUNT(*)::bigint AS access_count,
    COUNT(DISTINCT ip_address)::bigint AS unique_ips
  FROM ip_access_logs
  WHERE country IS NOT NULL
    AND ip_address IS NOT NULL
  GROUP BY country
  ORDER BY access_count DESC
  LIMIT limit_count;
$$;

-- 5. ip_access_logs TTL 정책: 90일 이상 된 로그 삭제 함수
-- pg_cron 또는 Supabase Scheduled Functions에서 호출하세요.
CREATE OR REPLACE FUNCTION cleanup_old_ip_logs(retention_days int DEFAULT 90)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM ip_access_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
$$;

-- 6. 각 함수에 대해 ADMIN 역할만 실행 가능하도록 권한 설정
-- (SECURITY DEFINER를 사용하므로 anon/authenticated 호출 자체를 막음)
REVOKE ALL ON FUNCTION get_top_ips(int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_hourly_stats(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_path_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_country_stats(int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cleanup_old_ip_logs(int) FROM PUBLIC, anon, authenticated;

-- service_role만 실행 가능
GRANT EXECUTE ON FUNCTION get_top_ips(int) TO service_role;
GRANT EXECUTE ON FUNCTION get_hourly_stats(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION get_path_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_country_stats(int) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_ip_logs(int) TO service_role;
