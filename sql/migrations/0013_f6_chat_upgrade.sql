-- ⚠️ MANUAL MIGRATION — not tracked by Drizzle journal (_journal.json)
--
-- How to apply:
--   Run this SQL directly in Supabase SQL Editor or psql.
--   DO NOT use `npm run db:migrate` — it won't pick up this file.
--
-- Why manual:
--   db:generate has a pre-existing snapshot collision (0003/0004 share the same prevId)
--   plus unrelated pending schema diffs, so automated generation was not possible.
--
-- Tables created: chat_room_settings, comments, comment_likes
-- Columns added: room_memories.created_by

-- ============================================================
-- 1. chat_room_settings (per-room 유저 설정)
-- ============================================================
CREATE TABLE IF NOT EXISTS "chat_room_settings" (
  "setting_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "room_id" integer NOT NULL REFERENCES "chat_rooms"("room_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "font_size" integer NOT NULL DEFAULT 16,
  "background_image_url" text,
  "background_enabled" boolean NOT NULL DEFAULT true,
  "character_nickname" text,
  "multi_image" boolean NOT NULL DEFAULT false,
  "response_length" integer NOT NULL DEFAULT 2000,
  "positivity_bias" boolean NOT NULL DEFAULT false,
  "anti_impersonation" boolean NOT NULL DEFAULT true,
  "realtime_output" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE("room_id", "user_id")
);

ALTER TABLE "chat_room_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-own-room-settings-policy" ON "chat_room_settings"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert-own-room-settings-policy" ON "chat_room_settings"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update-own-room-settings-policy" ON "chat_room_settings"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-room-settings-policy" ON "chat_room_settings"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. comments (캐릭터 댓글)
-- ============================================================
CREATE TABLE IF NOT EXISTS "comments" (
  "comment_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "character_id" bigint NOT NULL REFERENCES "characters"("character_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "image_url" text,
  "parent_id" integer REFERENCES "comments"("comment_id") ON DELETE CASCADE,
  "like_count" integer NOT NULL DEFAULT 0,
  "is_deleted" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-comments-public" ON "comments"
  FOR SELECT TO anon
  USING (is_deleted = 0);

CREATE POLICY "select-comments-authenticated" ON "comments"
  FOR SELECT TO authenticated
  USING (is_deleted = 0);

CREATE POLICY "insert-own-comments-policy" ON "comments"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update-own-comments-policy" ON "comments"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-comments-policy" ON "comments"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. comment_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "like_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comment_id" integer NOT NULL REFERENCES "comments"("comment_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE("comment_id", "user_id")
);

ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-own-comment-likes" ON "comment_likes"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert-own-comment-likes" ON "comment_likes"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-comment-likes" ON "comment_likes"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. room_memories에 created_by 컬럼 추가
-- ============================================================
ALTER TABLE "room_memories" ADD COLUMN IF NOT EXISTS "created_by" text DEFAULT 'auto';
