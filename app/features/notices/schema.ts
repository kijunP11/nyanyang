import { sql } from "drizzle-orm";
import {
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

export const notices = pgTable(
  "notices",
  {
    notice_id: integer().primaryKey().generatedAlwaysAsIdentity(),

    type: text().notNull().$type<"notice" | "event">(),
    title: text().notNull(),
    slug: text().notNull(),
    tag: text(),
    content: text().notNull(),
    status: text().notNull().$type<"draft" | "published">().default("draft"),

    author_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    published_at: timestamp(),

    ...timestamps,
  },
  (table) => [
    unique("notices_slug_unique").on(table.slug),

    // Anyone (anon + authenticated) can read published notices
    pgPolicy("select-published-notices-anon", {
      for: "select",
      to: anonRole,
      as: "permissive",
      using: sql`${table.status} = 'published'`,
    }),
    pgPolicy("select-published-notices-authenticated", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.status} = 'published'`,
    }),

    // Admins can insert notices
    pgPolicy("insert-notices-admin", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
      )`,
    }),
    // Admins can update notices
    pgPolicy("update-notices-admin", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
      )`,
    }),
    // Admins can delete notices
    pgPolicy("delete-notices-admin", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
      )`,
    }),
  ],
);
