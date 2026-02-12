-- 0006: Add badge_type to profiles
-- Manual migration (not tracked in Drizzle journal)
-- Run via Supabase SQL Editor or psql

ALTER TABLE profiles
  ADD COLUMN badge_type text NOT NULL DEFAULT 'none';

COMMENT ON COLUMN profiles.badge_type IS 'Creator badge type: none, popular, official';
