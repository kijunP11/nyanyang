-- 0018: weekly_attendance_records 테이블 생성
-- 수동 마이그레이션: Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS weekly_attendance_records (
  record_id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded integer NOT NULL DEFAULT 800,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_attendance_user ON weekly_attendance_records(user_id);
CREATE INDEX idx_weekly_attendance_created ON weekly_attendance_records(user_id, created_at DESC);

ALTER TABLE weekly_attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_weekly_attendance" ON weekly_attendance_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
