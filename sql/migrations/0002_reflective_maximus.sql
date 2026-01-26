/**
 * Database Migration: 0002_reflective_maximus
 * 
 * This migration adds referral system support:
 * 1. referrals table for tracking referral relationships
 * 2. referral_code and verified_at columns to profiles table
 * 3. Unique index and check constraints for referral integrity
 */

-- Create referrals table
CREATE TABLE "referrals" (
	"referral_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"referral_code" text NOT NULL,
	"reward_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Add referral_code and verified_at columns to profiles table
ALTER TABLE "profiles" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
-- Add foreign key constraints for referrals table
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Add unique constraint for referral_code in profiles
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referral_code_unique" UNIQUE("referral_code");--> statement-breakpoint
-- RLS Policy: Users can view referrals where they are the referrer or referee
CREATE POLICY "select_own_referrals_policy" ON "referrals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "referrals"."referrer_id" OR (select auth.uid()) = "referrals"."referee_id");--> statement-breakpoint
-- ✅ 핵심 1: 피추천인(referee_id)에 유니크 인덱스를 걸어, 
-- 한 사람이 두 번 이상 추천받는 것을 DB 차원에서 막습니다.
CREATE UNIQUE INDEX IF NOT EXISTS "unique_referee_idx" ON "referrals" ("referee_id");--> statement-breakpoint
-- ✅ 핵심 2: 자가 추천(본인이 본인을 추천) 방지용 체크 제약조건
ALTER TABLE "referrals" ADD CONSTRAINT "no_self_referral" 
  CHECK ("referrer_id" <> "referee_id");
