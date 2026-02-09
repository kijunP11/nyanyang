DO $$ BEGIN
    CREATE TYPE "public"."character_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'character_keywords') THEN
        DROP SEQUENCE IF EXISTS "character_keywords_keyword_id_seq";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'character_safety_filters') THEN
        DROP SEQUENCE IF EXISTS "character_safety_filters_filter_id_seq";
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character_keywords" (
	"keyword_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "character_keywords_keyword_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"character_id" bigint NOT NULL,
	"keyword" text NOT NULL,
	"description" text,
	"response_template" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_keywords" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "character_safety_filters" (
	"filter_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "character_safety_filters_filter_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"character_id" bigint NOT NULL,
	"block_nsfw" boolean DEFAULT true NOT NULL,
	"block_violence" boolean DEFAULT true NOT NULL,
	"block_hate_speech" boolean DEFAULT true NOT NULL,
	"block_personal_info" boolean DEFAULT true NOT NULL,
	"blocked_words" text[] DEFAULT ARRAY[]::text[],
	"blocked_phrases" text[] DEFAULT ARRAY[]::text[],
	"sensitivity_level" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_safety_filters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"referral_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"referral_code" text NOT NULL,
	"reward_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "character_likes" ALTER COLUMN "character_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "display_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "greeting_message" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "personality" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "system_prompt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "example_dialogues" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE OR REPLACE FUNCTION _tmp_jsonb_to_text_array(j jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT COALESCE(array_agg(elem), ARRAY[]::text[]) FROM jsonb_array_elements_text(COALESCE(j, '[]'::jsonb)) AS elem;
$$;--> statement-breakpoint
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'tags';

    IF col_type = 'jsonb' THEN
        ALTER TABLE "characters" ALTER COLUMN "tags" DROP DEFAULT;
        ALTER TABLE "characters" ALTER COLUMN "tags" SET DATA TYPE text[] USING _tmp_jsonb_to_text_array(tags);
    END IF;

    ALTER TABLE "characters" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::text[];

    BEGIN
        ALTER TABLE "characters" ALTER COLUMN "tags" DROP NOT NULL;
    EXCEPTION
        WHEN others THEN null;
    END;
END $$;--> statement-breakpoint
DROP FUNCTION IF EXISTS _tmp_jsonb_to_text_array(jsonb);--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "age_rating" SET DEFAULT 'everyone';--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "age_rating" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "enable_memory" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "characters" ALTER COLUMN "status" SET DATA TYPE character_status USING status::character_status;
EXCEPTION
    WHEN others THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "character_likes" ADD COLUMN "like_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "tagline" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "gallery_urls" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "personality_traits" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "tone" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "age" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "gender" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "role" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "appearance" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "speech_style" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "relationship" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "world_setting" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "referral_code" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "character_keywords" ADD CONSTRAINT "character_keywords_character_id_characters_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("character_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "character_safety_filters" ADD CONSTRAINT "character_safety_filters_character_id_characters_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("character_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "is_featured";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "moderation_note";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "message_count";--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referral_code_unique" UNIQUE("referral_code");
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DROP POLICY IF EXISTS "select-own-likes-policy" ON "character_likes";--> statement-breakpoint
DROP POLICY IF EXISTS "insert-likes-policy" ON "character_likes";--> statement-breakpoint
DROP POLICY IF EXISTS "delete-own-likes-policy" ON "character_likes";--> statement-breakpoint
DROP POLICY IF EXISTS "select-public-characters-policy" ON "characters";--> statement-breakpoint
DROP POLICY IF EXISTS "select-own-characters-policy" ON "characters";--> statement-breakpoint
DROP POLICY IF EXISTS "update-own-characters-policy" ON "characters";--> statement-breakpoint
DROP POLICY IF EXISTS "insert-characters-policy" ON "characters";--> statement-breakpoint
DROP POLICY IF EXISTS "delete-own-characters-policy" ON "characters";--> statement-breakpoint
DROP POLICY IF EXISTS "manage_own_likes_policy" ON "character_likes";--> statement-breakpoint
CREATE POLICY "manage_own_likes_policy" ON "character_likes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "character_likes"."user_id") WITH CHECK ((select auth.uid()) = "character_likes"."user_id");--> statement-breakpoint
DROP POLICY IF EXISTS "select_public_characters_policy" ON "characters";--> statement-breakpoint
CREATE POLICY "select_public_characters_policy" ON "characters" AS PERMISSIVE FOR SELECT TO public USING ("characters"."is_public" = true AND "characters"."status" = 'approved');--> statement-breakpoint
DROP POLICY IF EXISTS "select_own_characters_policy" ON "characters";--> statement-breakpoint
CREATE POLICY "select_own_characters_policy" ON "characters" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
DROP POLICY IF EXISTS "insert_characters_policy" ON "characters";--> statement-breakpoint
CREATE POLICY "insert_characters_policy" ON "characters" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
DROP POLICY IF EXISTS "update_characters_policy" ON "characters";--> statement-breakpoint
CREATE POLICY "update_characters_policy" ON "characters" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id") WITH CHECK ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
DROP POLICY IF EXISTS "delete_characters_policy" ON "characters";--> statement-breakpoint
CREATE POLICY "delete_characters_policy" ON "characters" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
DROP POLICY IF EXISTS "manage_own_character_keywords_policy" ON "character_keywords";--> statement-breakpoint
CREATE POLICY "manage_own_character_keywords_policy" ON "character_keywords" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "characters"
        WHERE "characters"."character_id" = "character_keywords"."character_id"
        AND "characters"."creator_id" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "characters"
        WHERE "characters"."character_id" = "character_keywords"."character_id"
        AND "characters"."creator_id" = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "manage_own_character_filters_policy" ON "character_safety_filters";--> statement-breakpoint
CREATE POLICY "manage_own_character_filters_policy" ON "character_safety_filters" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "characters"
        WHERE "characters"."character_id" = "character_safety_filters"."character_id"
        AND "characters"."creator_id" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "characters"
        WHERE "characters"."character_id" = "character_safety_filters"."character_id"
        AND "characters"."creator_id" = (select auth.uid())
      ));--> statement-breakpoint
DROP POLICY IF EXISTS "select_own_referrals_policy" ON "referrals";--> statement-breakpoint
CREATE POLICY "select_own_referrals_policy" ON "referrals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "referrals"."referrer_id" OR (select auth.uid()) = "referrals"."referee_id");
