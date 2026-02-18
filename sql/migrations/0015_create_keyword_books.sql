-- Manual migration: F8 Phase 4 — 내 키워드북 기능
-- Not tracked by Drizzle journal (_journal.json)
-- Run via Supabase SQL Editor or psql
-- After applying: npm run db:typegen

-- 키워드북 (폴더/컬렉션)
CREATE TABLE IF NOT EXISTS keyword_books (
  keyword_book_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id BIGINT REFERENCES characters(character_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  book_type TEXT NOT NULL DEFAULT 'unclassified',
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 키워드북 아이템 (개별 키워드)
CREATE TABLE IF NOT EXISTS keyword_book_items (
  item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES keyword_books(keyword_book_id) ON DELETE CASCADE,
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
