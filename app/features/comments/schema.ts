/**
 * Comments System Schema
 *
 * 캐릭터 댓글(comments) 및 댓글 좋아요(comment_likes) 테이블.
 */
import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  bigint,
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
import { characters } from "../characters/schema";

/** 댓글 테이블 (캐릭터별, 1단계 답글 지원) */
export const comments = pgTable(
  "comments",
  {
    comment_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    character_id: bigint({ mode: "number" })
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    content: text().notNull(),
    image_url: text(),
    parent_id: integer().references((): AnyPgColumn => comments.comment_id, {
      onDelete: "cascade",
    }),
    like_count: integer().notNull().default(0),
    is_deleted: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pgPolicy("select-comments-anon-policy", {
      for: "select",
      to: anonRole,
      using: sql`${table.is_deleted} = 0`,
    }),
    pgPolicy("select-comments-authenticated-policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.is_deleted} = 0`,
    }),
    pgPolicy("insert-own-comments-policy", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("update-own-comments-policy", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("delete-own-comments-policy", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ]
);

/** 댓글 좋아요 테이블 */
export const commentLikes = pgTable(
  "comment_likes",
  {
    like_id: uuid().primaryKey().defaultRandom(),
    comment_id: integer()
      .notNull()
      .references(() => comments.comment_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    unique("comment_likes_comment_user_unique").on(
      table.comment_id,
      table.user_id
    ),
    pgPolicy("select-own-comment-likes-policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-own-comment-likes-policy", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("delete-own-comment-likes-policy", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ]
);
