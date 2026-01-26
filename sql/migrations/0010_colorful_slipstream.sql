CREATE TABLE "admin_action_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'moderator' NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "character_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "character_id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-admins-policy" ON "admins" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "insert-admins-policy" ON "admins" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = (select auth.uid())
        AND admins.role = 'super_admin'
      ));--> statement-breakpoint
CREATE POLICY "update-admins-policy" ON "admins" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = (select auth.uid())
        AND admins.role = 'super_admin'
      ));--> statement-breakpoint
CREATE POLICY "delete-admins-policy" ON "admins" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = (select auth.uid())
        AND admins.role = 'super_admin'
      ));