/**
 * Chat System Schema
 *
 * This file defines the database schema for the chat system including rooms,
 * messages, and conversation memory.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers";

import { characters } from "../characters/schema";

/**
 * Chat Rooms Table
 *
 * Stores chat room instances where users interact with AI characters.
 * Each room represents a unique conversation thread between a user and a character.
 *
 * Features:
 * - Links users to characters
 * - Tracks conversation metadata
 * - Stores last message preview
 * - Message count for pagination
 */
export const chatRooms = pgTable(
  "chat_rooms",
  {
    // Auto-incrementing primary key
    room_id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Relationships
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    character_id: integer()
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),

    // Room metadata
    title: text().notNull(), // User-defined room title
    last_message: text(), // Preview of last message
    last_message_at: timestamp(), // When last message was sent
    message_count: integer().notNull().default(0), // Total messages in room

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can view their own chat rooms
    pgPolicy("select-own-rooms-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can create chat rooms
    pgPolicy("insert-own-rooms-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can update their own chat rooms
    pgPolicy("update-own-rooms-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can delete their own chat rooms
    pgPolicy("delete-own-rooms-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Messages Table
 *
 * Stores individual chat messages between users and AI characters.
 * Each message is linked to a chat room and represents one turn in the conversation.
 *
 * Features:
 * - Message content and role (user or assistant)
 * - Token usage tracking for billing
 * - Message ordering within rooms
 * - Soft delete support
 */
export const messages = pgTable(
  "messages",
  {
    // Auto-incrementing primary key
    message_id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Relationships
    room_id: integer()
      .notNull()
      .references(() => chatRooms.room_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Message content
    role: text().notNull(), // 'user' or 'assistant'
    content: text().notNull(), // Message text content

    // Token usage (for billing and analytics)
    tokens_used: integer().default(0), // Number of tokens consumed
    cost: integer().default(0), // Points cost for this message

    // Branching system
    parent_message_id: integer(), // Points to parent message for branching
    branch_name: text(), // User-defined branch name (e.g., "main", "alternative 1")
    is_active_branch: integer().notNull().default(1), // Whether this message is in the active branch (0 or 1)

    // Message metadata
    is_deleted: integer().notNull().default(0), // Soft delete flag (0 or 1)
    sequence_number: integer().notNull(), // Message order within room

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can view messages in their own rooms
    pgPolicy("select-own-messages-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can insert messages in their own rooms
    pgPolicy("insert-own-messages-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can soft-delete their own messages
    pgPolicy("update-own-messages-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Room Memories Table
 *
 * Stores conversation context and important facts extracted from chat history.
 * Used by AI to maintain continuity and remember key information across sessions.
 *
 * Features:
 * - Summary of conversation context
 * - Key facts and entities extraction
 * - Memory importance scoring
 * - Auto-update on new messages
 */
export const roomMemories = pgTable(
  "room_memories",
  {
    // Auto-incrementing primary key
    memory_id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Relationships
    room_id: integer()
      .notNull()
      .references(() => chatRooms.room_id, { onDelete: "cascade" }),

    // Memory content
    memory_type: text().notNull(), // 'summary', 'fact', 'entity', 'event'
    content: text().notNull(), // Memory content
    importance: integer().notNull().default(5), // Importance score (1-10)

    // Metadata
    metadata: jsonb(), // Additional structured data (entities, timestamps, etc.)
    message_range_start: integer(), // First message_id this memory covers
    message_range_end: integer(), // Last message_id this memory covers

    // Who created this memory: 'auto' (AI) or 'user'
    created_by: text().default("auto"),

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can view memories for their own rooms
    // Note: Need to join with chat_rooms to check ownership
    pgPolicy("select-room-memories-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.room_id = ${table.room_id}
        AND chat_rooms.user_id = ${authUid}
      )`,
    }),
    // Note: INSERT/UPDATE should be done by server (service role) for AI-generated memories
  ],
);

/**
 * Chat Room Settings Table
 * Per-room user settings (font, background, response length, etc.)
 */
export const chatRoomSettings = pgTable(
  "chat_room_settings",
  {
    setting_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    room_id: integer()
      .notNull()
      .references(() => chatRooms.room_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    font_size: integer().notNull().default(16),
    background_image_url: text(),
    background_enabled: boolean().notNull().default(true),
    character_nickname: text(),
    multi_image: boolean().notNull().default(false),

    response_length: integer().notNull().default(2000),
    positivity_bias: boolean().notNull().default(false),
    anti_impersonation: boolean().notNull().default(true),
    realtime_output: boolean().notNull().default(true),

    ...timestamps,
  },
  (table) => [
    unique("chat_room_settings_room_user_unique").on(
      table.room_id,
      table.user_id
    ),
    pgPolicy("select-own-room-settings-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-own-room-settings-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("update-own-room-settings-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("delete-own-room-settings-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ]
);
