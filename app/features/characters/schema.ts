/**
 * Character System Schema
 *
 * This file defines the database schema for characters and related tables.
 * It includes configurations for Row Level Security (RLS) policies to ensure
 * proper access control for character data.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
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

import { makeIdentityColumn, timestamps } from "~/core/db/helpers";

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
 * Stores character profiles, settings, and metadata.
 * Linked to the creator (auth.users) via creator_id.
 */
export const characters = pgTable(
  "characters",
  {
    // Primary Key
    ...makeIdentityColumn("character_id"),

    // Basic Info
    name: text().notNull(),
    display_name: text(),
    description: text(),
    greeting_message: text(),
    tagline: text(), // Added in 0004

    // Media
    avatar_url: text(),
    banner_url: text(),
    gallery_urls: jsonb().default([]),

    // Character Details
    personality_traits: text()
      .array()
      .default(sql`ARRAY[]::text[]`),
    personality: text(), // Added in 0005
    tone: text(),
    age: integer(),
    gender: text(),
    role: text(), // Added in 0004
    appearance: text(), // Added in 0004
    speech_style: text(), // Added in 0004
    system_prompt: text(), // Added in 0005
    example_dialogues: jsonb().default([]), // Added in 0005

    // Settings
    relationship: text(), // Added in 0004
    world_setting: text(), // Added in 0004
    category: text(), // Added in 0005
    age_rating: text().default("everyone"), // Added in 0005
    enable_memory: boolean().default(true), // Added in 0005

    is_public: boolean().notNull().default(false),
    is_nsfw: boolean().notNull().default(false),
    status: characterStatusEnum().notNull().default("draft"),

    // Metadata
    tags: text()
      .array()
      .default(sql`ARRAY[]::text[]`),
    view_count: integer().notNull().default(0),
    like_count: integer().notNull().default(0),
    chat_count: integer().notNull().default(0),

    // Ownership
    creator_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policies
    pgPolicy("select_public_characters_policy", {
      for: "select",
      to: "public",
      using: sql`${table.is_public} = true AND ${table.status} = 'approved'`,
    }),
    pgPolicy("select_own_characters_policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.creator_id}`,
    }),
    pgPolicy("insert_characters_policy", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.creator_id}`,
    }),
    pgPolicy("update_characters_policy", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.creator_id}`,
      withCheck: sql`${authUid} = ${table.creator_id}`,
    }),
    pgPolicy("delete_characters_policy", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.creator_id}`,
    }),
  ],
);

/**
 * Character Keywords Table
 *
 * Stores custom keywords and responses for characters.
 */
export const characterKeywords = pgTable(
  "character_keywords",
  {
    ...makeIdentityColumn("keyword_id"),
    character_id: bigint({ mode: "number" })
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),

    keyword: text().notNull(),
    description: text(),
    response_template: text(),
    priority: integer().notNull().default(0),
    is_active: boolean().notNull().default(true),

    ...timestamps,
  },
  (table) => [
    pgPolicy("manage_own_character_keywords_policy", {
      for: "all",
      to: authenticatedRole,
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
 * Character Safety Filters Table
 *
 * Stores content moderation settings for characters.
 */
export const characterSafetyFilters = pgTable(
  "character_safety_filters",
  {
    ...makeIdentityColumn("filter_id"),
    character_id: bigint({ mode: "number" })
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }), // Unique constraint handled by index if needed, or app logic

    block_nsfw: boolean().notNull().default(true),
    block_violence: boolean().notNull().default(true),
    block_hate_speech: boolean().notNull().default(true),
    block_personal_info: boolean().notNull().default(true),

    blocked_words: text()
      .array()
      .default(sql`ARRAY[]::text[]`),
    blocked_phrases: text()
      .array()
      .default(sql`ARRAY[]::text[]`),

    sensitivity_level: integer().notNull().default(5),

    ...timestamps,
  },
  (table) => [
    pgPolicy("manage_own_character_filters_policy", {
      for: "all",
      to: authenticatedRole,
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
 * Character Likes Table
 *
 * Tracks user likes for characters.
 */
export const characterLikes = pgTable(
  "character_likes",
  {
    like_id: uuid().primaryKey().defaultRandom(),
    character_id: bigint({ mode: "number" })
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    ...timestamps,
  },
  (table) => [
    pgPolicy("manage_own_likes_policy", {
      for: "all",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

