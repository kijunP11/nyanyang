/**
 * Badges System Schema
 *
 * 뱃지 정의(badge_definitions)와 유저 뱃지(user_badges) 테이블.
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
import {
  anonRole,
  authUid,
  authUsers,
  authenticatedRole,
} from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

/** 뱃지 정의 테이블 */
export const badgeDefinitions = pgTable(
  "badge_definitions",
  {
    badge_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: text().notNull(),
    name: text().notNull(),
    level: text(),
    description: text().notNull(),
    metric_type: text().notNull(),
    threshold: integer(),
    icon_url: text(),
    sort_order: integer().notNull().default(0),
    is_hidden: boolean().notNull().default(false),
    reward_points: integer().notNull().default(0),
    ...timestamps,
  },
  () => [
    pgPolicy("select-badge-defs-authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("select-badge-defs-anon", {
      for: "select",
      to: anonRole,
      using: sql`true`,
    }),
  ]
);

/** 유저 뱃지 테이블 */
export const userBadges = pgTable(
  "user_badges",
  {
    user_badge_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    badge_id: integer()
      .notNull()
      .references(() => badgeDefinitions.badge_id, { onDelete: "cascade" }),
    claimed_at: timestamp().notNull().defaultNow(),
    is_representative: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("user_badges_user_badge_unique").on(table.user_id, table.badge_id),
    pgPolicy("select-own-badges", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ]
);
