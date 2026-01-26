/**
 * Characters Schema
 *
 * This file defines the database schema for AI characters in the Nyanyang platform.
 * Characters can be created by users (creators) and used in chat conversations.
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

import { makeIdentityColumn, timestamps } from "~/core/db/helpers.server";

/**
 * Characters Table
 *
 * Stores AI character information including personality, appearance, and behavior settings.
 * Each character can be used to create chat rooms where users interact with the AI.
 *
 * Features:
 * - Public/Private visibility control
 * - Creator attribution and management
 * - Rich metadata (tags, personality traits, example dialogues)
 * - Safety filtering and content moderation
 * - Usage statistics tracking
 */
export const characters = pgTable(
  "characters",
  {
    // Auto-incrementing primary key
    ...makeIdentityColumn("character_id"),

    // Basic Info
    name: text().notNull(),
    display_name: text().notNull(), // 표시용 이름 (닉네임)
    description: text().notNull(), // 캐릭터 설명
    greeting_message: text().notNull(), // 첫 인사말

    // Visual
    avatar_url: text(), // 프로필 이미지 URL (Supabase Storage)
    banner_url: text(), // 배너 이미지 URL

    // AI Configuration
    personality: text().notNull(), // 성격 설정 (상세)
    system_prompt: text().notNull(), // AI 시스템 프롬프트
    example_dialogues: jsonb(), // 예시 대화 (JSON array)

    // Categorization
    tags: jsonb().notNull().default(sql`'[]'::jsonb`), // 태그 배열 (로맨스, 츤데레 등)
    category: text(), // 카테고리 (남성, 여성, 기타)
    age_rating: text().notNull().default("general"), // general, teen, mature, adult

    // Settings
    is_public: boolean().notNull().default(false), // 공개 여부
    is_featured: boolean().notNull().default(false), // 추천 캐릭터 여부
    is_nsfw: boolean().notNull().default(false), // 성인 콘텐츠 여부
    enable_memory: boolean().notNull().default(true), // 메모리 기능 활성화

    // Creator & Ownership
    creator_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // Moderation
    status: text().notNull().default("pending"), // pending, approved, rejected
    moderation_note: text(), // 관리자 검토 노트

    // Statistics
    chat_count: integer().notNull().default(0), // 생성된 채팅방 수
    message_count: integer().notNull().default(0), // 총 메시지 수
    view_count: integer().notNull().default(0), // 조회수
    like_count: integer().notNull().default(0), // 좋아요 수

    // Timestamps
    ...timestamps,
  },
  (table) => [
    // RLS Policy: 모든 인증된 사용자가 승인된 공개 캐릭터를 볼 수 있음
    pgPolicy("select-public-characters-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.is_public} = true AND ${table.status} = 'approved'`,
    }),
    // RLS Policy: 제작자는 자신의 캐릭터를 볼 수 있음
    pgPolicy("select-own-characters-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: 제작자는 자신의 캐릭터를 수정할 수 있음
    pgPolicy("update-own-characters-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.creator_id}`,
      withCheck: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: 인증된 사용자는 캐릭터를 생성할 수 있음
    pgPolicy("insert-characters-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.creator_id}`,
    }),
    // RLS Policy: 제작자는 자신의 캐릭터를 삭제할 수 있음
    pgPolicy("delete-own-characters-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.creator_id}`,
    }),
  ],
);

/**
 * Character Likes Table
 *
 * Tracks which users have liked which characters.
 * Used for recommendation and popularity ranking.
 */
export const characterLikes = pgTable(
  "character_likes",
  {
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    character_id: integer()
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: 사용자는 자신의 좋아요만 볼 수 있음
    pgPolicy("select-own-likes-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: 사용자는 좋아요를 추가할 수 있음
    pgPolicy("insert-likes-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: 사용자는 자신의 좋아요를 삭제할 수 있음
    pgPolicy("delete-own-likes-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
