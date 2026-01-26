CREATE TABLE "point_transactions" (
	"transaction_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "point_transactions_transaction_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_points" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_points" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-own-transactions-policy" ON "point_transactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "point_transactions"."user_id");--> statement-breakpoint
CREATE POLICY "select-own-points-policy" ON "user_points" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_points"."user_id");