-- ⚠️ MANUAL MIGRATION — not tracked by Drizzle journal (_journal.json)
--
-- How to apply:
--   Run this SQL directly in Supabase SQL Editor or psql.
--   DO NOT use `npm run db:migrate` — it won't pick up this file.
--
-- Why manual:
--   db:generate has a pre-existing snapshot collision (0003/0004 share the same prevId)
--   plus unrelated pending schema diffs (e.g. characters.tagline), so automated
--   generation was not possible at the time of writing.
--
-- Future db:generate caveat:
--   Drizzle doesn't know about this table in its journal. If you run db:generate later,
--   it may produce a duplicate CREATE TABLE for notices. Review the generated SQL and
--   remove the notices portion before applying.
--
-- Create notices table for announcements and events
CREATE TABLE IF NOT EXISTS "notices" (
	"notice_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"tag" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" uuid NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notices_slug_unique" UNIQUE("slug")
);

-- Foreign key to auth.users
ALTER TABLE "notices"
  ADD CONSTRAINT "notices_author_id_users_id_fk"
  FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

-- Enable RLS
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;

-- Select: anyone can read published notices
CREATE POLICY "select-published-notices-anon"
  ON "notices" FOR SELECT TO "anon"
  USING (status = 'published');

CREATE POLICY "select-published-notices-authenticated"
  ON "notices" FOR SELECT TO "authenticated"
  USING (status = 'published');

-- Insert: admins only
CREATE POLICY "insert-notices-admin"
  ON "notices" FOR INSERT TO "authenticated"
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = (SELECT auth.uid())
  ));

-- Update: admins only
CREATE POLICY "update-notices-admin"
  ON "notices" FOR UPDATE TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = (SELECT auth.uid())
  ));

-- Delete: admins only
CREATE POLICY "delete-notices-admin"
  ON "notices" FOR DELETE TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = (SELECT auth.uid())
  ));
