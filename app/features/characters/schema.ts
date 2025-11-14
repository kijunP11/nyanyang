/**
 * Characters Schema
 *
 * This file defines the database schema for characters and related data.
 * Includes character profiles, settings, keywords, and safety filters.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { makeIdentityColumn, timestamps } from "~/core/db/helpers.server";

/**
 * Character Status Enum
 */
export const characterStatusEnum = pgEnum("character_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "archived",
]);

/**
 * Characters Table
 *
 * Main table for storing character information including profile,
 * personality, and media assets.
 */
export const characters = pgTable(
  "characters",
  {
    ...makeIdentityColumn("character_id"),
    // Basic Info
    name: text().notNull(),
    display_name: text(),
    description: text(),
    greeting_message: text(),

    // Media
    avatar_url: text(),
    banner_url: text(),
    gallery_urls: jsonb().$type<string[]>().default([]),

    // Character Details
    personality_traits: text().array().default([]),
    tone: text(), // e.g., "friendly", "formal", "playful"
    age: integer(),
    gender: text(),

    // Settings
    is_public: boolean().notNull().default(false),
    is_nsfw: boolean().notNull().default(false),
    status: characterStatusEnum().notNull().default("draft"),

    // Metadata
    tags: text().array().default([]),
    view_count: integer().notNull().default(0),
    like_count: integer().notNull().default(0),
    chat_count: integer().notNull().default(0),

    // Ownership
    creator_id: uuid()
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),

    ...timestamps,
  },
  (table) => [
    // RLS Policy: Anyone can view public approved characters
    pgPolicy("select-public-characters-policy", {
      for: "select",
      to: "public",
      as: "permissive",
      using: sql`${table.is_public} = true AND ${table.status} = 'approved'`,
    }),
    // RLS Policy: Authenticated users can view their own characters
    pgPolicy("select-own-characters-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: Users can only insert their own characters
    pgPolicy("insert-characters-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: Users can only update their own characters
    pgPolicy("update-characters-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.creator_id}`,
      using: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: Users can only delete their own characters
    pgPolicy("delete-characters-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.creator_id}`,
    }),
  ],
);

/**
 * Character Keywords (Keyword Book)
 *
 * Stores custom keywords and their associated responses/behaviors
 * for more nuanced character interactions.
 */
export const characterKeywords = pgTable(
  "character_keywords",
  {
    ...makeIdentityColumn("keyword_id"),
    character_id: uuid()
      .notNull()
      .references(() => characters.character_id, {
        onDelete: "cascade",
      }),

    // Keyword details
    keyword: text().notNull(),
    description: text(),
    response_template: text(),
    priority: integer().notNull().default(0), // Higher priority = checked first
    is_active: boolean().notNull().default(true),

    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can manage keywords for their own characters
    pgPolicy("manage-own-character-keywords-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${characters}
        WHERE ${characters.character_id} = ${table.character_id}
        AND ${characters.creator_id} = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${characters}
        WHERE ${characters.character_id} = ${table.character_id}
        AND ${characters.creator_id} = ${authUid}
      )`,
    }),
  ],
);

/**
 * Character Safety Filters
 *
 * Configurable content filtering and moderation settings per character.
 */
export const characterSafetyFilters = pgTable(
  "character_safety_filters",
  {
    ...makeIdentityColumn("filter_id"),
    character_id: uuid()
      .notNull()
      .references(() => characters.character_id, {
        onDelete: "cascade",
      }),

    // Filter settings
    block_nsfw: boolean().notNull().default(true),
    block_violence: boolean().notNull().default(true),
    block_hate_speech: boolean().notNull().default(true),
    block_personal_info: boolean().notNull().default(true),

    // Custom filters
    blocked_words: text().array().default([]),
    blocked_phrases: text().array().default([]),

    // Filter sensitivity (1-10, 10 = most strict)
    sensitivity_level: integer().notNull().default(5),

    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can manage filters for their own characters
    pgPolicy("manage-own-character-filters-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${characters}
        WHERE ${characters.character_id} = ${table.character_id}
        AND ${characters.creator_id} = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${characters}
        WHERE ${characters.character_id} = ${table.character_id}
        AND ${characters.creator_id} = ${authUid}
      )`,
    }),
  ],
);

/**
 * Character Likes
 *
 * Tracks which users have liked which characters.
 */
export const characterLikes = pgTable(
  "character_likes",
  {
    like_id: uuid().primaryKey().defaultRandom(),
    character_id: uuid()
      .notNull()
      .references(() => characters.character_id, {
        onDelete: "cascade",
      }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),

    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can manage their own likes
    pgPolicy("manage-own-likes-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
