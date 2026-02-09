/**
 * Admin Statistics API
 *
 * Provides comprehensive platform-wide statistics and metrics for the admin dashboard.
 * Includes user growth, character moderation status, chat activity, message volume,
 * point economy metrics, top-performing characters, and recent activity trends.
 *
 * All statistics are computed in real-time from the database using efficient aggregate
 * queries. Requires admin authentication.
 *
 * @module features/admin/api/stats
 */

import type { Route } from "./+types/stats";

import { sql } from "drizzle-orm";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { profiles } from "../../users/schema";
import { characters } from "../../characters/schema";
import { chatRooms, messages } from "../../chat/schema";
import { pointTransactions } from "../../points/schema";
import { requireAdmin } from "../lib/guards.server";

/**
 * Fetches comprehensive platform statistics for the admin dashboard.
 *
 * Aggregates data across multiple tables to provide insights into:
 * - User growth (total, daily, weekly, monthly new users)
 * - Character statistics (total, by status, public/NSFW counts, new characters)
 * - Chat activity (total rooms, active rooms, new rooms)
 * - Message volume (total, daily/weekly, by role, token usage, costs)
 * - Point economy (transactions, earned/spent totals, transaction types)
 * - Top characters by chat count and likes (top 10 each)
 * - Recent activity trends (last 30 days of daily message/user counts)
 *
 * All statistics are computed with PostgreSQL aggregate functions for efficiency.
 * Requires admin authentication.
 *
 * @param request - The incoming request object
 * @returns JSON response with comprehensive platform statistics
 * @throws {Response} 401 Unauthorized if user is not authenticated
 * @throws {Response} 403 Forbidden if user is not an admin
 *
 * @example
 * ```typescript
 * // GET /api/admin/stats
 * {
 *   stats: {
 *     users: {
 *       total_users: 1000,
 *       new_users_today: 5,
 *       new_users_this_week: 25,
 *       new_users_this_month: 100
 *     },
 *     characters: {
 *       total_characters: 500,
 *       pending_characters: 10,
 *       approved_characters: 480,
 *       rejected_characters: 10,
 *       public_characters: 450,
 *       nsfw_characters: 30,
 *       new_characters_today: 2,
 *       new_characters_this_week: 15
 *     },
 *     chats: {
 *       total_chat_rooms: 2000,
 *       active_chat_rooms_today: 150,
 *       active_chat_rooms_this_week: 500,
 *       new_chat_rooms_today: 20
 *     },
 *     messages: {
 *       total_messages: 50000,
 *       messages_today: 500,
 *       messages_this_week: 3500,
 *       user_messages: 25000,
 *       assistant_messages: 25000,
 *       total_tokens_used: 1000000,
 *       total_cost: 50000
 *     },
 *     points: {
 *       total_transactions: 5000,
 *       total_points_earned: 100000,
 *       total_points_spent: 75000,
 *       transactions_today: 50,
 *       purchase_transactions: 1000,
 *       usage_transactions: 3500,
 *       reward_transactions: 500
 *     }
 *   },
 *   topCharacters: {
 *     byChats: [...],  // Top 10 characters by chat count
 *     byLikes: [...]   // Top 10 characters by likes
 *   },
 *   recentActivity: [  // Last 30 days
 *     { date: "2025-11-12", message_count: 500, user_count: 150 },
 *     ...
 *   ]
 * }
 * ```
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const db = drizzle;

  // Get user statistics
  const [userStats] = await db
    .select({
      total_users: sql<number>`count(*)::int`,
      new_users_today: sql<number>`count(*) filter (where ${profiles.created_at} >= current_date)::int`,
      new_users_this_week: sql<number>`count(*) filter (where ${profiles.created_at} >= current_date - interval '7 days')::int`,
      new_users_this_month: sql<number>`count(*) filter (where ${profiles.created_at} >= current_date - interval '30 days')::int`,
    })
    .from(profiles);

  // Get character statistics
  const [characterStats] = await db
    .select({
      total_characters: sql<number>`count(*)::int`,
      pending_characters: sql<number>`count(*) filter (where ${characters.status} = 'pending')::int`,
      approved_characters: sql<number>`count(*) filter (where ${characters.status} = 'approved')::int`,
      rejected_characters: sql<number>`count(*) filter (where ${characters.status} = 'rejected')::int`,
      public_characters: sql<number>`count(*) filter (where ${characters.is_public} = true)::int`,
      nsfw_characters: sql<number>`count(*) filter (where ${characters.is_nsfw} = true)::int`,
      new_characters_today: sql<number>`count(*) filter (where ${characters.created_at} >= current_date)::int`,
      new_characters_this_week: sql<number>`count(*) filter (where ${characters.created_at} >= current_date - interval '7 days')::int`,
    })
    .from(characters);

  // Get chat statistics
  const [chatStats] = await db
    .select({
      total_chat_rooms: sql<number>`count(*)::int`,
      active_chat_rooms_today: sql<number>`count(*) filter (where ${chatRooms.last_message_at} >= current_date)::int`,
      active_chat_rooms_this_week: sql<number>`count(*) filter (where ${chatRooms.last_message_at} >= current_date - interval '7 days')::int`,
      new_chat_rooms_today: sql<number>`count(*) filter (where ${chatRooms.created_at} >= current_date)::int`,
    })
    .from(chatRooms);

  // Get message statistics
  const [messageStats] = await db
    .select({
      total_messages: sql<number>`count(*)::int`,
      messages_today: sql<number>`count(*) filter (where ${messages.created_at} >= current_date)::int`,
      messages_this_week: sql<number>`count(*) filter (where ${messages.created_at} >= current_date - interval '7 days')::int`,
      user_messages: sql<number>`count(*) filter (where ${messages.role} = 'user')::int`,
      assistant_messages: sql<number>`count(*) filter (where ${messages.role} = 'assistant')::int`,
      total_tokens_used: sql<number>`coalesce(sum(${messages.tokens_used}), 0)::int`,
      total_cost: sql<number>`coalesce(sum(${messages.cost}), 0)::int`,
    })
    .from(messages);

  // Get point transaction statistics
  const [pointStats] = await db
    .select({
      total_transactions: sql<number>`count(*)::int`,
      total_points_earned: sql<number>`coalesce(sum(${pointTransactions.amount}) filter (where ${pointTransactions.amount} > 0), 0)::int`,
      total_points_spent: sql<number>`coalesce(abs(sum(${pointTransactions.amount}) filter (where ${pointTransactions.amount} < 0)), 0)::int`,
      transactions_today: sql<number>`count(*) filter (where ${pointTransactions.created_at} >= current_date)::int`,
      purchase_transactions: sql<number>`count(*) filter (where ${pointTransactions.type} = 'purchase')::int`,
      usage_transactions: sql<number>`count(*) filter (where ${pointTransactions.type} = 'usage')::int`,
      reward_transactions: sql<number>`count(*) filter (where ${pointTransactions.type} = 'reward')::int`,
    })
    .from(pointTransactions);

  // Get top characters by chat count
  const topCharsByChatsRaw = await db
    .select()
    .from(characters)
    .orderBy(sql`${characters.chat_count} desc`)
    .limit(10);

  const topCharactersByChats = topCharsByChatsRaw.map((char) => ({
    character_id: (char as any).character_id,
    display_name: char.display_name,
    avatar_url: char.avatar_url,
    chat_count: char.chat_count,
    like_count: char.like_count,
  }));

  // Get top characters by likes
  const topCharsByLikesRaw = await db
    .select()
    .from(characters)
    .orderBy(sql`${characters.like_count} desc`)
    .limit(10);

  const topCharactersByLikes = topCharsByLikesRaw.map((char) => ({
    character_id: (char as any).character_id,
    display_name: char.display_name,
    avatar_url: char.avatar_url,
    like_count: char.like_count,
    chat_count: char.chat_count,
  }));

  // Get recent activity (last 30 days)
  const recentActivity = await db
    .select({
      date: sql<string>`date(${messages.created_at})`,
      message_count: sql<number>`count(*)::int`,
      user_count: sql<number>`count(distinct ${messages.user_id})::int`,
    })
    .from(messages)
    .where(sql`${messages.created_at} >= current_date - interval '30 days'`)
    .groupBy(sql`date(${messages.created_at})`)
    .orderBy(sql`date(${messages.created_at}) desc`);

  return data(
    {
      stats: {
        users: userStats,
        characters: characterStats,
        chats: chatStats,
        messages: messageStats,
        points: pointStats,
      },
      topCharacters: {
        byChats: topCharactersByChats,
        byLikes: topCharactersByLikes,
      },
      recentActivity,
    },
    { headers }
  );
}
