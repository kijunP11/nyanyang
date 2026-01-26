CREATE TABLE "character_likes" (
	"user_id" uuid NOT NULL,
	"character_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "characters" (
	"character_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "characters_character_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	"greeting_message" text NOT NULL,
	"avatar_url" text,
	"banner_url" text,
	"personality" text NOT NULL,
	"system_prompt" text NOT NULL,
	"example_dialogues" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text,
	"age_rating" text DEFAULT 'general' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_nsfw" boolean DEFAULT false NOT NULL,
	"enable_memory" boolean DEFAULT true NOT NULL,
	"creator_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"moderation_note" text,
	"chat_count" integer DEFAULT 0 NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "character_likes" ADD CONSTRAINT "character_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_likes" ADD CONSTRAINT "character_likes_character_id_characters_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("character_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-own-likes-policy" ON "character_likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "character_likes"."user_id");--> statement-breakpoint
CREATE POLICY "insert-likes-policy" ON "character_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "character_likes"."user_id");--> statement-breakpoint
CREATE POLICY "delete-own-likes-policy" ON "character_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "character_likes"."user_id");--> statement-breakpoint
CREATE POLICY "select-public-characters-policy" ON "characters" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("characters"."is_public" = true AND "characters"."status" = 'approved');--> statement-breakpoint
CREATE POLICY "select-own-characters-policy" ON "characters" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
CREATE POLICY "update-own-characters-policy" ON "characters" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id") WITH CHECK ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
CREATE POLICY "insert-characters-policy" ON "characters" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "characters"."creator_id");--> statement-breakpoint
CREATE POLICY "delete-own-characters-policy" ON "characters" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "characters"."creator_id");