/**
 * 댓글 섹션 (캐릭터 상세 페이지용)
 *
 * 상단: 제목
 * 중간: 댓글 작성 폼
 * 하단: 댓글 목록
 */
import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentSectionProps {
  characterId: number;
}

export function CommentSection({ characterId }: CommentSectionProps) {
  const [listKey, setListKey] = useState(0);

  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-bold text-[#181D27] dark:text-white">
        댓글
      </h3>

      <div className="mb-4">
        <CommentForm
          characterId={characterId}
          onSuccess={() => setListKey((k) => k + 1)}
        />
      </div>

      <CommentList key={listKey} characterId={characterId} />
    </section>
  );
}
