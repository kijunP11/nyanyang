/**
 * User Profile Schema
 *
 * This file defines the database schema for user profiles and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
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
    // 팔로워/팔로잉 카운터 (비정규화)
    follower_count: integer("follower_count").notNull().default(0),
    following_count: integer("following_count").notNull().default(0),
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
    // RLS Policy: Allow viewing any profile (for follower counts, etc.)
    pgPolicy("select-any-profile-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true`,
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

/**
 * User Follows Table
 *
 * Tracks follow relationships between users.
 * follower_id follows following_id.
 */
export const userFollows = pgTable(
  "user_follows",
  {
    follow_id: uuid().primaryKey().defaultRandom(),
    follower_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    following_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    // 중복 팔로우 방지
    unique("user_follows_unique").on(table.follower_id, table.following_id),
    // 자신의 팔로우 관리 (insert/update/delete)
    pgPolicy("manage_own_follows_policy", {
      for: "all",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.follower_id}`,
      withCheck: sql`(select auth.uid()) = ${table.follower_id}`,
    }),
    // 자신의 팔로워 조회
    pgPolicy("view_followers_policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.following_id}`,
    }),
  ],
);
