# F8 마이페이지 Phase 4: 내 키워드북 (NEW feature)

## 개요
유저/캐릭터/미분류 키워드북 관리 기능을 신규 구현한다. 새 스키마, API, 컴포넌트를 생성하고 `/account/edit` Tab 2 (키워드북 placeholder)를 실제 기능으로 교체한다.

**전제조건**: Phase 3 (프로필 수정 + 세이프티 수정 + 3탭 구조) 완료 + SQL 마이그레이션 실행

**신규 feature**: `app/features/keywords/` 폴더 전체 생성

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `sql/migrations/0015_create_keyword_books.sql` | 생성 (수동 마이그레이션) |
| 2 | `features/keywords/schema.ts` | 생성 (Drizzle 스키마) |
| 3 | `features/keywords/lib/queries.server.ts` | 생성 (서버 쿼리) |
| 4 | `features/keywords/api/list.tsx` | 생성 (목록 API) |
| 5 | `features/keywords/api/create-book.tsx` | 생성 (키워드북 생성 API) |
| 6 | `features/keywords/api/update-book.tsx` | 생성 (키워드북 수정 API) |
| 7 | `features/keywords/api/delete-book.tsx` | 생성 (키워드북 삭제 API) |
| 8 | `features/keywords/components/keyword-book-tab.tsx` | 생성 (메인 탭 컴포넌트) |
| 9 | `features/keywords/components/keyword-book-section.tsx` | 생성 (섹션 컴포넌트) |
| 10 | `features/keywords/components/keyword-book-card.tsx` | 생성 (카드 컴포넌트) |
| 11 | `features/keywords/components/create-book-dialog.tsx` | 생성 (생성 다이얼로그) |
| 12 | `routes.ts` | 수정 (API 라우트 추가) |
| 13 | `users/screens/account.tsx` | 수정 (Tab 2 연동) |

---

## 1. `sql/migrations/0015_create_keyword_books.sql` (생성)

수동 마이그레이션. Supabase SQL Editor 또는 psql로 직접 실행.

```sql
-- Manual migration: F8 Phase 4 — 내 키워드북 기능
-- Not tracked by Drizzle journal (_journal.json)
-- Run via Supabase SQL Editor or psql
-- After applying: npm run db:typegen

-- 키워드북 (폴더/컬렉션)
CREATE TABLE IF NOT EXISTS keyword_books (
  keyword_book_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id INTEGER REFERENCES characters(character_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL DEFAULT 'unclassified',
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 키워드북 아이템 (개별 키워드)
CREATE TABLE IF NOT EXISTS keyword_book_items (
  item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES keyword_books(keyword_book_id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE keyword_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_book_items ENABLE ROW LEVEL SECURITY;

-- 키워드북: 자기 것만 CRUD
CREATE POLICY "manage_own_keyword_books" ON keyword_books
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 키워드북 아이템: 부모 키워드북 소유자만 CRUD
CREATE POLICY "manage_own_keyword_items" ON keyword_book_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM keyword_books
    WHERE keyword_books.keyword_book_id = keyword_book_items.book_id
    AND keyword_books.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM keyword_books
    WHERE keyword_books.keyword_book_id = keyword_book_items.book_id
    AND keyword_books.user_id = auth.uid()
  ));
```

---

## 2. `features/keywords/schema.ts` (생성)

Drizzle 스키마 정의. `characterKeywords` 패턴 참조.

```typescript
/**
 * Keyword Books Schema
 *
 * 유저 키워드북 + 키워드 아이템 테이블.
 * book_type: 'user' | 'character' | 'unclassified'
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
    character_id: integer()
      .references(() => characters.character_id, { onDelete: "set null" }),
    title: text().notNull(),
    book_type: text("book_type").notNull().default("unclassified")
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
  ],
);

/** 키워드북 아이템 테이블 */
export const keywordBookItems = pgTable(
  "keyword_book_items",
  {
    ...makeIdentityColumn("item_id"),
    book_id: integer()
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
  ],
);
```

**주의사항:**
- `characters` 테이블의 PK는 `bigint` (mode: "number"). `character_id` FK는 `integer()`로 선언하면 타입 불일치 가능 → **`bigint({ mode: "number" })`로 맞출 것**
- `makeIdentityColumn`은 `~/core/db/helpers`에서 import (`.ts` 확장자, `.server` 아님)
- `characters` import는 `../characters/schema`에서

```typescript
// character_id FK 타입 수정 (bigint 매칭)
import { bigint } from "drizzle-orm/pg-core";

character_id: bigint({ mode: "number" })
  .references(() => characters.character_id, { onDelete: "set null" }),
```

---

## 3. `features/keywords/lib/queries.server.ts` (생성)

서버 쿼리 함수. Drizzle 직결 패턴 (`drizzle-client.server`).

```typescript
/**
 * Keyword Books Server Queries
 */
import { eq, and, desc, sql } from "drizzle-orm";

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

  // 소유권 확인
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

  // item_count 증가
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

  // 소유권 확인 (JOIN)
  const [existing] = await db
    .select({ item_id: keywordBookItems.item_id })
    .from(keywordBookItems)
    .innerJoin(keywordBooks, eq(keywordBookItems.book_id, keywordBooks.keyword_book_id))
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

  // 소유권 확인 + book_id 조회
  const [existing] = await db
    .select({
      item_id: keywordBookItems.item_id,
      book_id: keywordBookItems.book_id,
    })
    .from(keywordBookItems)
    .innerJoin(keywordBooks, eq(keywordBookItems.book_id, keywordBooks.keyword_book_id))
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

  // item_count 감소
  await db
    .update(keywordBooks)
    .set({
      item_count: sql`GREATEST(${keywordBooks.item_count} - 1, 0)`,
      updated_at: new Date(),
    })
    .where(eq(keywordBooks.keyword_book_id, existing.book_id));

  return true;
}
```

---

## 4. `features/keywords/api/list.tsx` (생성)

유저의 키워드북 목록 + 상세 조회 API.

```typescript
/**
 * 키워드북 목록 API
 *
 * GET /api/keywords/list           → 전체 목록 (타입별 그룹)
 * GET /api/keywords/list?book_id=1 → 특정 키워드북 상세 (아이템 포함)
 */
import type { Route } from "./+types/list";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getKeywordBooksByUser, getKeywordBookDetail } from "../lib/queries.server";

const querySchema = z.object({
  book_id: z.coerce.number().int().positive().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return data({ error: "Invalid parameters" }, { status: 400, headers });
  }

  try {
    if (parsed.data.book_id) {
      const book = await getKeywordBookDetail(parsed.data.book_id, user.id);
      if (!book) {
        return data({ error: "Not found" }, { status: 404, headers });
      }
      return data({ book }, { headers });
    }

    const books = await getKeywordBooksByUser(user.id);
    return data({ books }, { headers });
  } catch (err) {
    console.error("Error fetching keyword books:", err);
    return data({ error: "Failed to fetch keyword books" }, { status: 500, headers });
  }
}
```

---

## 5. `features/keywords/api/create-book.tsx` (생성)

```typescript
/**
 * 키워드북 생성 API
 *
 * POST /api/keywords/create-book
 * Body: { title, book_type, character_id? }
 */
import type { Route } from "./+types/create-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  title: z.string().min(1).max(100),
  book_type: z.enum(["user", "character", "unclassified"]),
  character_id: z.coerce.number().int().positive().nullable().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return data(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const book = await createKeywordBook(user.id, parsed.data);
    return data({ success: true, book }, { headers });
  } catch (err) {
    console.error("Error creating keyword book:", err);
    return data({ error: "Failed to create keyword book" }, { status: 500, headers });
  }
}
```

---

## 6. `features/keywords/api/update-book.tsx` (생성)

```typescript
/**
 * 키워드북 수정 API
 *
 * POST /api/keywords/update-book
 * Body: { book_id, title }
 */
import type { Route } from "./+types/update-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { updateKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  book_id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(100),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return data(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const updated = await updateKeywordBook(parsed.data.book_id, user.id, {
      title: parsed.data.title,
    });

    if (!updated) {
      return data({ error: "Not found or not authorized" }, { status: 404, headers });
    }

    return data({ success: true, book: updated }, { headers });
  } catch (err) {
    console.error("Error updating keyword book:", err);
    return data({ error: "Failed to update keyword book" }, { status: 500, headers });
  }
}
```

---

## 7. `features/keywords/api/delete-book.tsx` (생성)

```typescript
/**
 * 키워드북 삭제 API
 *
 * DELETE /api/keywords/delete-book
 * Body: { book_id }
 */
import type { Route } from "./+types/delete-book";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { deleteKeywordBook } from "../lib/queries.server";

const bodySchema = z.object({
  book_id: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return data({ error: "Invalid book_id" }, { status: 400, headers });
    }

    const deleted = await deleteKeywordBook(parsed.data.book_id, user.id);

    if (!deleted) {
      return data({ error: "Not found or not authorized" }, { status: 404, headers });
    }

    return data({ success: true }, { headers });
  } catch (err) {
    console.error("Error deleting keyword book:", err);
    return data({ error: "Failed to delete keyword book" }, { status: 500, headers });
  }
}
```

**참고:** 아이템 CRUD API (`add-item`, `update-item`, `delete-item`)도 같은 패턴으로 필요하지만, 우선 키워드북 단위 CRUD + 목록을 먼저 구현하고, 아이템 관리는 키워드북 상세 화면에서 인라인으로 처리해도 된다. 아이템 API가 필요하면 같은 패턴으로 추가:

```
features/keywords/api/add-item.tsx     — POST, body: { book_id, keyword, description? }
features/keywords/api/update-item.tsx  — POST, body: { item_id, keyword, description? }
features/keywords/api/delete-item.tsx  — DELETE, body: { item_id }
```

각각 `addKeywordItem`, `updateKeywordItem`, `deleteKeywordItem` 함수 호출.

---

## 8. `features/keywords/components/keyword-book-tab.tsx` (생성)

메인 탭 컴포넌트. account.tsx의 Tab 2에 렌더링.

```typescript
/**
 * 키워드북 탭 메인 컴포넌트
 *
 * 3개 섹션: 유저 키워드북 / 캐릭터 키워드북 / 미분류 키워드북
 */
import { useFetcher } from "react-router";
import { useEffect, useState } from "react";

import KeywordBookSection from "./keyword-book-section";

interface BookData {
  keyword_book_id: number;
  title: string;
  book_type: string;
  character_id: number | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

interface KeywordBookTabProps {
  initialBooks?: {
    userBooks: BookData[];
    characterBooks: BookData[];
    unclassifiedBooks: BookData[];
  } | null;
}

export default function KeywordBookTab({ initialBooks }: KeywordBookTabProps) {
  const fetcher = useFetcher();
  const [books, setBooks] = useState(initialBooks);

  // 초기 데이터가 없으면 클라이언트에서 로드
  useEffect(() => {
    if (!books) {
      fetcher.load("/api/keywords/list");
    }
  }, []);

  useEffect(() => {
    if (fetcher.data?.books) {
      setBooks(fetcher.data.books);
    }
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading" && !books;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white animate-pulse h-40 rounded-xl border border-[#D5D7DA]" />
        ))}
      </div>
    );
  }

  const refreshBooks = () => {
    fetcher.load("/api/keywords/list");
  };

  return (
    <div className="space-y-8">
      <KeywordBookSection
        title="유저 키워드북"
        bookType="user"
        books={books?.userBooks ?? []}
        onRefresh={refreshBooks}
      />
      <KeywordBookSection
        title="캐릭터 키워드북"
        bookType="character"
        books={books?.characterBooks ?? []}
        onRefresh={refreshBooks}
      />
      <KeywordBookSection
        title="미분류 키워드북"
        bookType="unclassified"
        books={books?.unclassifiedBooks ?? []}
        onRefresh={refreshBooks}
      />
    </div>
  );
}
```

---

## 9. `features/keywords/components/keyword-book-section.tsx` (생성)

각 섹션 (유저/캐릭터/미분류). 카드 그리드 + 생성 버튼.

```typescript
/**
 * 키워드북 섹션 컴포넌트
 *
 * 섹션 제목 + 카드 그리드 + [+ 키워드북 만들기] CTA
 */
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";

import KeywordBookCard from "./keyword-book-card";
import CreateBookDialog from "./create-book-dialog";

interface BookData {
  keyword_book_id: number;
  title: string;
  book_type: string;
  character_id: number | null;
  item_count: number;
  created_at: string;
}

interface KeywordBookSectionProps {
  title: string;
  bookType: "user" | "character" | "unclassified";
  books: BookData[];
  onRefresh: () => void;
}

export default function KeywordBookSection({
  title,
  bookType,
  books,
  onRefresh,
}: KeywordBookSectionProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#181D27]">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="border-[#D5D7DA] text-[#535862] hover:bg-[#F5F5F5]"
        >
          <Plus className="h-4 w-4 mr-1" />
          키워드북 만들기
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[#717680]">키워드북이 없습니다.</p>
          <p className="text-xs text-[#717680] mt-1">
            새 키워드북을 만들어보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {books.map((book) => (
            <KeywordBookCard
              key={book.keyword_book_id}
              book={book}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      <CreateBookDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        bookType={bookType}
        onSuccess={onRefresh}
      />
    </div>
  );
}
```

---

## 10. `features/keywords/components/keyword-book-card.tsx` (생성)

개별 키워드북 카드. 제목, 아이템 수, 날짜, edit/delete 액션.

```typescript
/**
 * 키워드북 카드
 *
 * 제목, N개, 날짜, 호버 시 edit/delete 아이콘
 */
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/core/components/ui/alert-dialog";
import { Input } from "~/core/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";

interface BookData {
  keyword_book_id: number;
  title: string;
  book_type: string;
  character_id: number | null;
  item_count: number;
  created_at: string;
}

interface KeywordBookCardProps {
  book: BookData;
  onRefresh: () => void;
}

export default function KeywordBookCard({ book, onRefresh }: KeywordBookCardProps) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);

  const formattedDate = new Date(book.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const handleDelete = () => {
    deleteFetcher.submit(
      { book_id: book.keyword_book_id },
      { method: "DELETE", action: "/api/keywords/delete-book", encType: "application/json" }
    );
    setShowDelete(false);
    // 삭제 후 리프레시
    setTimeout(onRefresh, 300);
  };

  const handleEdit = () => {
    editFetcher.submit(
      { book_id: book.keyword_book_id, title: editTitle },
      { method: "POST", action: "/api/keywords/update-book", encType: "application/json" }
    );
    setShowEdit(false);
    setTimeout(onRefresh, 300);
  };

  return (
    <>
      <div className="group relative rounded-lg border border-[#E9EAEB] p-4 hover:border-[#00c4af] transition-colors cursor-pointer">
        <h4 className="font-medium text-[#181D27] truncate">{book.title}</h4>
        <p className="text-xs text-[#717680] mt-1">{book.item_count}개</p>
        <p className="text-xs text-[#717680] mt-0.5">{formattedDate}</p>

        {/* 호버 액션 */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
            className="p-1.5 rounded-md hover:bg-[#F5F5F5] text-[#717680]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
            className="p-1.5 rounded-md hover:bg-red-50 text-[#717680] hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>키워드북을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{book.title}" 키워드북과 포함된 키워드가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#D5D7DA]">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>키워드북 이름 수정</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={100}
            placeholder="키워드북 이름"
            className="border-[#D5D7DA]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="border-[#D5D7DA]"
            >
              취소
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editTitle.trim()}
              className="bg-[#00c4af] hover:bg-[#00b39e] text-white"
            >
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 11. `features/keywords/components/create-book-dialog.tsx` (생성)

키워드북 생성 다이얼로그.

```typescript
/**
 * 키워드북 생성 다이얼로그
 */
import { useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

interface CreateBookDialogProps {
  open: boolean;
  onClose: () => void;
  bookType: "user" | "character" | "unclassified";
  onSuccess: () => void;
}

export default function CreateBookDialog({
  open,
  onClose,
  bookType,
  onSuccess,
}: CreateBookDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;

    fetcher.submit(
      { title: title.trim(), book_type: bookType },
      {
        method: "POST",
        action: "/api/keywords/create-book",
        encType: "application/json",
      }
    );

    setTitle("");
    onClose();
    setTimeout(onSuccess, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>키워드북 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="book-title" className="text-sm font-medium text-[#181D27]">
              키워드북 이름
            </Label>
            <Input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="키워드북 이름을 입력하세요"
              className="mt-1 border-[#D5D7DA]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#D5D7DA]">
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || fetcher.state !== "idle"}
            className="bg-[#00c4af] hover:bg-[#00b39e] text-white"
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 12. `routes.ts` (수정)

API 라우트 추가. `/api` prefix 블록 내, 기존 `...prefix("/badges", ...)` 다음에 추가.

**추가 위치: 약 L94 부근 (`/badges` 블록 뒤)**

```typescript
    ...prefix("/keywords", [
      route("/list", "features/keywords/api/list.tsx"),
      route("/create-book", "features/keywords/api/create-book.tsx"),
      route("/update-book", "features/keywords/api/update-book.tsx"),
      route("/delete-book", "features/keywords/api/delete-book.tsx"),
    ]),
```

아이템 API 추가 시:
```typescript
    ...prefix("/keywords", [
      route("/list", "features/keywords/api/list.tsx"),
      route("/create-book", "features/keywords/api/create-book.tsx"),
      route("/update-book", "features/keywords/api/update-book.tsx"),
      route("/delete-book", "features/keywords/api/delete-book.tsx"),
      route("/add-item", "features/keywords/api/add-item.tsx"),
      route("/update-item", "features/keywords/api/update-item.tsx"),
      route("/delete-item", "features/keywords/api/delete-item.tsx"),
    ]),
```

---

## 13. `users/screens/account.tsx` (수정)

Tab 2 placeholder → `KeywordBookTab` 컴포넌트로 교체.

**import 추가:**
```typescript
import KeywordBookTab from "~/features/keywords/components/keyword-book-tab";
```

**Tab 2 변경 — 기존:**
```tsx
<TabsContent value="keywords">
  <div className="bg-white rounded-xl border border-[#D5D7DA] p-12 text-center">
    <p className="text-lg font-medium text-[#181D27] mb-2">준비 중입니다</p>
    <p className="text-sm text-[#535862]">곧 키워드북 기능이 추가됩니다.</p>
  </div>
</TabsContent>
```

**변경 후:**
```tsx
<TabsContent value="keywords">
  <KeywordBookTab />
</TabsContent>
```

`KeywordBookTab`은 내부에서 `useFetcher`로 `/api/keywords/list`를 호출하여 데이터를 로드한다. 로더에서 데이터를 전달하지 않아도 됨.

---

## 라이트 테마 컬러 (참고)

| 용도 | 컬러 |
|------|------|
| 카드 bg | `bg-white border border-[#D5D7DA]` |
| 카드 호버 | `hover:border-[#00c4af]` |
| 제목 | `text-[#181D27]` |
| 보조 텍스트 | `text-[#535862]` |
| 연한 텍스트 | `text-[#717680]` |
| 빈 상태 | `text-[#717680]` |
| 액센트 CTA | `bg-[#00c4af] hover:bg-[#00b39e] text-white` |
| 삭제 | `bg-red-500 hover:bg-red-600 text-white` |

## 검증

1. `sql/migrations/0015_create_keyword_books.sql` → SQL Editor에서 실행
2. `npm run db:typegen` → database.types.ts 재생성
3. `npm run typecheck` 통과
4. `/account/edit?tab=keywords` → 3 섹션 (유저/캐릭터/미분류) 렌더링
5. 각 섹션 빈 상태 표시 ("키워드북이 없습니다.")
6. [+ 키워드북 만들기] → 다이얼로그 → 이름 입력 → 만들기 → 카드 표시
7. 카드 호버 → edit/delete 아이콘 표시
8. edit 클릭 → 이름 수정 다이얼로그 → 수정 → 반영
9. delete 클릭 → 확인 다이얼로그 → 삭제 → 목록에서 제거
10. `npm run typecheck` 최종 통과
