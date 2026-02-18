/**
 * 키워드북 섹션 컴포넌트
 *
 * 섹션 제목 + 카드 그리드 + [+ 키워드북 만들기] CTA
 */
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";

import CreateBookDialog from "./create-book-dialog";
import KeywordBookCard from "./keyword-book-card";

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
