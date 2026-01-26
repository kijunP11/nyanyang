/**
 * Points System Schema
 *
 * This file defines the database schema for the point economy system.
 * Users earn and spend points for various activities (attendance, chat, purchases).
 */
import { sql } from "drizzle-orm";
import {
  integer,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * User Points Table
 *
 * Stores the current point balance for each user.
 * This is the single source of truth for a user's point balance.
 *
 * Features:
 * - Current balance tracking
 * - Lifetime earned/spent statistics
 * - Updated atomically with transactions
 */
export const userPoints = pgTable(
  "user_points",
  {
    // Primary key that references auth.users
    user_id: uuid()
      .primaryKey()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Current point balance
    current_balance: integer().notNull().default(0),

    // Lifetime statistics
    total_earned: integer().notNull().default(0), // 총 획득 포인트
    total_spent: integer().notNull().default(0), // 총 사용 포인트

    // Timestamp
    updated_at: timestamps.updated_at,
  },
  (table) => [
    // RLS Policy: Users can only view their own points
    pgPolicy("select-own-points-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // Note: INSERT/UPDATE should be done by server (service role) to prevent cheating
  ],
);

/**
 * Point Transactions Table
 *
 * Records all point transactions (charges, usage, rewards).
 * Provides a complete audit trail of all point movements.
 *
 * Features:
 * - Transaction history with reasons
 * - Balance snapshots after each transaction
 * - Reference IDs for linking to payments/chat rooms/etc.
 */
export const pointTransactions = pgTable(
  "point_transactions",
  {
    // Auto-incrementing primary key
    transaction_id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // User reference
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Transaction details
    amount: integer().notNull(), // Positive for credits, negative for debits
    balance_after: integer().notNull(), // Balance after this transaction
    type: text().notNull(), // 'charge', 'usage', 'reward'
    reason: text().notNull(), // Human-readable reason
    reference_id: text(), // Optional: payment_id, room_id, etc.

    // Timestamp
    created_at: timestamps.created_at,
  },
  (table) => [
    // RLS Policy: Users can view their own transaction history
    pgPolicy("select-own-transactions-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // Note: INSERT should be done by server (service role) to prevent cheating
  ],
);
