/**
 * User Profile Schema
 *
 * This file defines the database schema for user profiles and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

/**
 * Profiles Table
 *
 * Stores additional user profile information beyond the core auth data.
 * Links to Supabase auth.users table via profile_id foreign key.
 *
 * Includes Row Level Security (RLS) policies to ensure users can only
 * access and modify their own profile data.
 */
export const profiles = pgTable(
  "profiles",
  {
    // Primary key that references the Supabase auth.users id
    // Using CASCADE ensures profile is deleted when user is deleted
    profile_id: uuid()
      .primaryKey()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    name: text().notNull(),
    avatar_url: text(),
    marketing_consent: boolean("marketing_consent").notNull().default(false),
    // 추천인 코드 (고유값)
    referral_code: text().unique(),
    // 본인인증 완료 시간
    verified_at: timestamp("verified_at"),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only update their own profile
    pgPolicy("edit-profile-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.profile_id}`,
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only delete their own profile
    pgPolicy("delete-profile-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
    // RLS Policy: Users can only view their own profile
    pgPolicy("select-profile-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ],
);

/**
 * Referrals Table
 *
 * Stores referral relationships between users.
 * Tracks who referred whom and the reward status.
 *
 * Business Rules:
 * - One user can only be referred once (enforced by unique index on referee_id)
 * - Self-referral is not allowed (enforced by check constraint)
 * - Rewards are paid after identity verification
 */
export const referrals = pgTable(
  "referrals",
  {
    referral_id: uuid().primaryKey().defaultRandom(),
    // 추천인 (코드를 제공한 사람)
    referrer_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    // 피추천인 (코드를 입력한 사람)
    referee_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    // 사용된 추천인 코드
    referral_code: text().notNull(),
    // 보상 지급 상태: 'pending' | 'paid'
    reward_status: text("reward_status")
      .notNull()
      .default("pending")
      .$type<"pending" | "paid">(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // RLS Policy: Users can view referrals where they are the referrer or referee
    pgPolicy("select_own_referrals_policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.referrer_id} OR ${authUid} = ${table.referee_id}`,
    }),
  ],
);
