-- Manual migration: F8 Phase 3 — 프로필 수정 탭에 자기소개 필드 추가
-- Not tracked by Drizzle journal (_journal.json)
-- Run via Supabase SQL Editor or psql
-- After applying: npm run db:typegen

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bio" text;
