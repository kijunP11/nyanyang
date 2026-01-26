CREATE TABLE "attendance_records" (
	"user_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"points_awarded" integer NOT NULL,
	"consecutive_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-own-attendance-policy" ON "attendance_records" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "attendance_records"."user_id");