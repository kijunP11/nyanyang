ALTER TABLE "messages" ADD COLUMN "parent_message_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "branch_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_active_branch" integer DEFAULT 1 NOT NULL;