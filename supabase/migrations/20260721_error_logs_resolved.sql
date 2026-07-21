-- error_logs 해결 워크플로 컬럼
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE error_logs
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE error_logs
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE error_logs
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved
  ON error_logs (resolved, created_at DESC);
