/**
 * Keyword Books Server Queries
 */
import { and, desc, eq, sql } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { keywordBooks, keywordBookItems } from "../schema";

type BookType = "user" | "character" | "unclassified";

/**
 * 유저의 키워드북 목록 (타입별 그룹)
 */
export async function getKeywordBooksByUser(userId: string) {
  const db = drizzle;

  const books = await db
    .select({
      keyword_book_id: keywordBooks.keyword_book_id,
      title: keywordBooks.title,
      book_type: keywordBooks.book_type,
      character_id: keywordBooks.character_id,
      item_count: keywordBooks.item_count,
      created_at: keywordBooks.created_at,
      updated_at: keywordBooks.updated_at,
    })
    .from(keywordBooks)
    .where(eq(keywordBooks.user_id, userId))
    .orderBy(desc(keywordBooks.created_at));

  return {
    userBooks: books.filter((b) => b.book_type === "user"),
    characterBooks: books.filter((b) => b.book_type === "character"),
    unclassifiedBooks: books.filter((b) => b.book_type === "unclassified"),
  };
}

/**
 * 키워드북 상세 (아이템 포함)
 */
export async function getKeywordBookDetail(bookId: number, userId: string) {
  const db = drizzle;

  const [book] = await db
    .select()
    .from(keywordBooks)
    .where(
      and(
        eq(keywordBooks.keyword_book_id, bookId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .limit(1);

  if (!book) return null;

  const items = await db
    .select()
    .from(keywordBookItems)
    .where(eq(keywordBookItems.book_id, bookId))
    .orderBy(desc(keywordBookItems.created_at));

  return { ...book, items };
}

/**
 * 키워드북 생성
 */
export async function createKeywordBook(
  userId: string,
  data: { title: string; book_type: BookType; character_id?: number | null }
) {
  const db = drizzle;

  const [newBook] = await db
    .insert(keywordBooks)
    .values({
      user_id: userId,
      title: data.title,
      book_type: data.book_type,
      character_id: data.character_id ?? null,
    })
    .returning();

  return newBook;
}

/**
 * 키워드북 수정 (제목)
 */
export async function updateKeywordBook(
  bookId: number,
  userId: string,
  data: { title: string }
) {
  const db = drizzle;

  const [updated] = await db
    .update(keywordBooks)
    .set({ title: data.title, updated_at: new Date() })
    .where(
      and(
        eq(keywordBooks.keyword_book_id, bookId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .returning();

  return updated ?? null;
}

/**
 * 키워드북 삭제 (CASCADE로 아이템도 삭제)
 */
export async function deleteKeywordBook(bookId: number, userId: string) {
  const db = drizzle;

  const [deleted] = await db
    .delete(keywordBooks)
    .where(
      and(
        eq(keywordBooks.keyword_book_id, bookId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .returning();

  return !!deleted;
}

/**
 * 키워드 아이템 추가 + item_count 증가
 */
export async function addKeywordItem(
  bookId: number,
  userId: string,
  data: { keyword: string; description?: string }
) {
  const db = drizzle;

  const [book] = await db
    .select({ keyword_book_id: keywordBooks.keyword_book_id })
    .from(keywordBooks)
    .where(
      and(
        eq(keywordBooks.keyword_book_id, bookId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .limit(1);

  if (!book) return null;

  const [item] = await db
    .insert(keywordBookItems)
    .values({
      book_id: bookId,
      keyword: data.keyword,
      description: data.description ?? null,
    })
    .returning();

  await db
    .update(keywordBooks)
    .set({
      item_count: sql`${keywordBooks.item_count} + 1`,
      updated_at: new Date(),
    })
    .where(eq(keywordBooks.keyword_book_id, bookId));

  return item;
}

/**
 * 키워드 아이템 수정
 */
export async function updateKeywordItem(
  itemId: number,
  userId: string,
  data: { keyword: string; description?: string }
) {
  const db = drizzle;

  const [existing] = await db
    .select({ item_id: keywordBookItems.item_id })
    .from(keywordBookItems)
    .innerJoin(
      keywordBooks,
      eq(keywordBookItems.book_id, keywordBooks.keyword_book_id)
    )
    .where(
      and(
        eq(keywordBookItems.item_id, itemId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(keywordBookItems)
    .set({
      keyword: data.keyword,
      description: data.description ?? null,
      updated_at: new Date(),
    })
    .where(eq(keywordBookItems.item_id, itemId))
    .returning();

  return updated;
}

/**
 * 키워드 아이템 삭제 + item_count 감소
 */
export async function deleteKeywordItem(itemId: number, userId: string) {
  const db = drizzle;

  const [existing] = await db
    .select({
      item_id: keywordBookItems.item_id,
      book_id: keywordBookItems.book_id,
    })
    .from(keywordBookItems)
    .innerJoin(
      keywordBooks,
      eq(keywordBookItems.book_id, keywordBooks.keyword_book_id)
    )
    .where(
      and(
        eq(keywordBookItems.item_id, itemId),
        eq(keywordBooks.user_id, userId)
      )
    )
    .limit(1);

  if (!existing) return false;

  await db
    .delete(keywordBookItems)
    .where(eq(keywordBookItems.item_id, itemId));

  await db
    .update(keywordBooks)
    .set({
      item_count: sql`GREATEST(${keywordBooks.item_count} - 1, 0)`,
      updated_at: new Date(),
    })
    .where(eq(keywordBooks.keyword_book_id, existing.book_id));

  return true;
}
