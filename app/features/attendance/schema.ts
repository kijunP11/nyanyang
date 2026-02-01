/**
 * Attendance System Schema
 *
 * This file defines the database schema for the daily attendance check-in system.
 * Users receive points for consecutive daily logins.
 */
import { sql } from "drizzle-orm";
import { date, integer, pgPolicy, pgTable, uuid } from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

/**
 * Attendance Records Table
 *
 * Tracks daily attendance check-ins for users.
 * Uses composite primary key (user_id, attendance_date) to prevent duplicate check-ins.
 *
 * Features:
 * - Daily check-in tracking
 * - Consecutive days counter for streak bonuses
 * - Points awarded per check-in
 */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    // User reference
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Check-in date (DATE type for daily uniqueness)
    attendance_date: date().notNull(),

    // Reward info
    points_awarded: integer().notNull(), // Points given for this check-in
    consecutive_days: integer().notNull().default(1), // Current streak length

    // Timestamp
    created_at: timestamps.created_at,
  },
  (table) => [
    // Composite primary key prevents duplicate check-ins on same day
    sql`PRIMARY KEY (${table.user_id}, ${table.attendance_date})`,

    // RLS Policy: Users can view their own attendance records
    pgPolicy("select-own-attendance-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // Note: INSERT should be done by server to prevent cheating
  ],
);
