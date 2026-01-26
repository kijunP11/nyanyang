CREATE TABLE "messages" (
	"message_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"room_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tokens_used" integer DEFAULT 0,
	"cost" integer DEFAULT 0,
	"is_deleted" integer DEFAULT 0 NOT NULL,
	"sequence_number" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "room_memories" (
	"memory_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_memories_memory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"room_id" integer NOT NULL,
	"memory_type" text NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"metadata" jsonb,
	"message_range_start" integer,
	"message_range_end" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_memories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_chat_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_memories" ADD CONSTRAINT "room_memories_room_id_chat_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-own-messages-policy" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "messages"."user_id");--> statement-breakpoint
CREATE POLICY "insert-own-messages-policy" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "messages"."user_id");--> statement-breakpoint
CREATE POLICY "update-own-messages-policy" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "messages"."user_id") WITH CHECK ((select auth.uid()) = "messages"."user_id");--> statement-breakpoint
CREATE POLICY "select-room-memories-policy" ON "room_memories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.room_id = "room_memories"."room_id"
        AND chat_rooms.user_id = (select auth.uid())
      ));