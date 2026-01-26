ALTER TABLE "characters" ALTER COLUMN "character_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "character_id" SET MAXVALUE 2147483647;--> statement-breakpoint
ALTER TABLE "chat_rooms" ALTER COLUMN "room_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "chat_rooms" ALTER COLUMN "room_id" SET MAXVALUE 2147483647;