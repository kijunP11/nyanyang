/**
 * Initial Database Migration: 0000_worried_vision
 * 
 * This migration establishes the core data model for the Supaplate application,
 * creating the payments and profiles tables with appropriate constraints,
 * foreign keys, and row-level security policies.
 */

/**
 * Payments Table
 * 
 * Stores payment transaction records with detailed information about each payment.
 * Links to the auth.users table to track which user made each payment.
 * 
 * Key features:
 * - Auto-incrementing payment_id as the primary key
 * - Stores payment provider data (payment_key, receipt_url)
 * - Captures order details (order_id, order_name, total_amount)
 * - Stores raw transaction data and metadata as JSON
 * - Tracks payment status and timestamps
 * - Links to user accounts via user_id foreign key
 */
CREATE TABLE "payments" (
	"payment_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"payment_key" text NOT NULL,
	"order_id" text NOT NULL,
	"order_name" text NOT NULL,
	"total_amount" double precision NOT NULL,
	"metadata" jsonb NOT NULL,
	"raw_data" jsonb NOT NULL,
	"receipt_url" text NOT NULL,
	"status" text NOT NULL,
	"user_id" uuid,
	"approved_at" timestamp NOT NULL,
	"requested_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Enable Row Level Security on payments table to restrict access based on user identity
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
/**
 * Profiles Table
 * 
 * Stores user profile information that extends the auth.users table.
 * Each record corresponds to a user in the auth.users table via profile_id.
 * 
 * Key features:
 * - UUID primary key that matches the auth.users.id
 * - Stores display name and optional avatar image URL
 * - Tracks marketing consent for compliance with privacy regulations
 * - Includes standard audit timestamps (created_at, updated_at)
 */
CREATE TABLE "profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Enable Row Level Security on profiles table to restrict access based on user identity
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Add foreign key constraint to link payments to users
-- CASCADE deletion ensures no orphaned payment records when a user is deleted
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Add foreign key constraint to link profiles to users
-- CASCADE deletion ensures profile is deleted when the corresponding user is deleted
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
/**
 * Row Level Security Policies
 * 
 * These policies control access to the tables based on the authenticated user's identity.
 * They ensure users can only access their own data, implementing a multi-tenant security model.
 */

-- Allow users to view only their own payment records
CREATE POLICY "select-payment-policy" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "payments"."user_id");--> statement-breakpoint
-- Allow users to update only their own profile
-- Both USING and WITH CHECK clauses ensure the user can only modify their own profile
CREATE POLICY "edit-profile-policy" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "profiles"."profile_id") WITH CHECK ((select auth.uid()) = "profiles"."profile_id");--> statement-breakpoint
-- Allow users to delete only their own profile
CREATE POLICY "delete-profile-policy" ON "profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "profiles"."profile_id");--> statement-breakpoint
-- Allow users to view only their own profile
CREATE POLICY "select-profile-policy" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "profiles"."profile_id");