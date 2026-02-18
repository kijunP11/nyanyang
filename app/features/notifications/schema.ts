/**
 * Notifications Schema
 * 알림 테이블 — 출석체크, 좋아요, 댓글, 팔로우 알림 저장
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

export const notifications = pgTable(
  "notifications",
  {
    notification_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    subtitle: text(),
    metadata: jsonb().default({}),
    is_read: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    pgPolicy("select-own-notifications", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-notifications", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ]
);
