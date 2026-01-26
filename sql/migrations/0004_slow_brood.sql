CREATE TABLE "chat_rooms" (
	"room_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_rooms_room_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"character_id" integer NOT NULL,
	"title" text NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"message_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_character_id_characters_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("character_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-own-rooms-policy" ON "chat_rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "chat_rooms"."user_id");--> statement-breakpoint
CREATE POLICY "insert-own-rooms-policy" ON "chat_rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "chat_rooms"."user_id");--> statement-breakpoint
CREATE POLICY "update-own-rooms-policy" ON "chat_rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "chat_rooms"."user_id") WITH CHECK ((select auth.uid()) = "chat_rooms"."user_id");--> statement-breakpoint
CREATE POLICY "delete-own-rooms-policy" ON "chat_rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "chat_rooms"."user_id");