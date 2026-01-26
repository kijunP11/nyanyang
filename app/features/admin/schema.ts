/**
 * Admin System Schema
 *
 * Defines admin roles and permissions for platform management.
 */

import { sql } from "drizzle-orm";
import {
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * Admins Table
 *
 * Stores admin users and their roles.
 */
export const admins = pgTable(
  "admins",
  {
    // Reference to auth.users
    user_id: uuid()
      .primaryKey()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Admin role: 'super_admin', 'moderator', 'support'
    role: text().notNull().default("moderator"),

    // Optional notes about this admin
    notes: text(),

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Only admins can view admin list
    pgPolicy("select-admins-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
      )`,
    }),
    // RLS Policy: Only super_admins can insert new admins
    pgPolicy("insert-admins-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
        AND admins.role = 'super_admin'
      )`,
    }),
    // RLS Policy: Only super_admins can update admins
    pgPolicy("update-admins-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
        AND admins.role = 'super_admin'
      )`,
    }),
    // RLS Policy: Only super_admins can delete admins
    pgPolicy("delete-admins-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = ${authUid}
        AND admins.role = 'super_admin'
      )`,
    }),
  ],
);

/**
 * Admin Action Logs Table
 *
 * Tracks all administrative actions for audit purposes.
 */
export const adminActionLogs = pgTable("admin_action_logs", {
  log_id: uuid().primaryKey().defaultRandom(),

  // Admin who performed the action
  admin_id: uuid()
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  // Action type
  action_type: text().notNull(), // 'user_suspend', 'user_delete', 'character_approve', etc.

  // Target of the action (user_id, character_id, etc.)
  target_type: text(), // 'user', 'character', 'payment', etc.
  target_id: text(), // ID of the target

  // Action details (JSON)
  details: text(),

  // Timestamps
  created_at: timestamp().notNull().defaultNow(),
});
