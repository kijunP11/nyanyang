/**
 * 키워드북 탭 메인 컴포넌트
 *
 * 3개 섹션: 유저 키워드북 / 캐릭터 키워드북 / 미분류 키워드북
 */
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

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
  const [books, setBooks] = useState(initialBooks ?? null);

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
          <div
            key={i}
            className="bg-white animate-pulse h-40 rounded-xl border border-[#D5D7DA]"
          />
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
