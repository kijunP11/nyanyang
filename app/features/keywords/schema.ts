/**
 * Keyword Books Schema
 *
 * 유저 키워드북 + 키워드 아이템 테이블.
 * book_type: 'user' | 'character' | 'unclassified'
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  integer,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps, makeIdentityColumn } from "~/core/db/helpers";
import { characters } from "../characters/schema";

/** 키워드북 테이블 */
export const keywordBooks = pgTable(
  "keyword_books",
  {
    ...makeIdentityColumn("keyword_book_id"),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    character_id: bigint({ mode: "number" })
      .references(() => characters.character_id, { onDelete: "set null" }),
    title: text().notNull(),
    book_type: text("book_type")
      .notNull()
      .default("unclassified")
      .$type<"user" | "character" | "unclassified">(),
    item_count: integer("item_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pgPolicy("manage_own_keyword_books_policy", {
      for: "all",
      to: authenticatedRole,
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ]
);

/** 키워드북 아이템 테이블 */
export const keywordBookItems = pgTable(
  "keyword_book_items",
  {
    ...makeIdentityColumn("item_id"),
    book_id: bigint({ mode: "number" })
      .notNull()
      .references(() => keywordBooks.keyword_book_id, { onDelete: "cascade" }),
    keyword: text().notNull(),
    description: text(),
    ...timestamps,
  },
  (table) => [
    pgPolicy("manage_own_keyword_items_policy", {
      for: "all",
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM ${keywordBooks}
        WHERE ${keywordBooks.keyword_book_id} = ${table.book_id}
        AND ${keywordBooks.user_id} = ${authUid}
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${keywordBooks}
        WHERE ${keywordBooks.keyword_book_id} = ${table.book_id}
        AND ${keywordBooks.user_id} = ${authUid}
      )`,
    }),
  ]
);
