/**
 * 답글 목록 (1단계만 지원)
 *
 * 답글 보기 클릭 시 로드. 답글 작성 폼은 comment-list.tsx의 replyingTo 인라인 폼 사용.
 */
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import type { CommentWithAuthor } from "../lib/queries.server";
import { CommentItem } from "./comment-item";

interface CommentReplyListProps {
  parentId: number;
  characterId: number;
  replyCount: number;
}

export function CommentReplyList({
  parentId,
  characterId,
  replyCount,
}: CommentReplyListProps) {
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !fetcher.data) {
      fetcher.load(`/api/comments/list?parent_id=${parentId}`);
    }
  }, [isOpen, parentId]);

  const replies: CommentWithAuthor[] =
    (fetcher.data as { replies?: CommentWithAuthor[] })?.replies ?? [];
  const isLoading = fetcher.state === "loading";

  if (replyCount === 0) {
    return null;
  }

  return (
    <div className="ml-10">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-1 text-xs font-semibold text-[#00c4af]"
      >
        {isOpen ? "답글 접기" : `답글 ${replyCount}개 보기`}
      </button>

      {isOpen && (
        <div>
          {isLoading ? (
            <p className="py-2 text-xs text-[#A4A7AE]">로딩 중...</p>
          ) : (
            replies.map((reply) => (
              <CommentItem key={reply.comment_id} comment={reply} isReply />
            ))
          )}
        </div>
      )}
    </div>
  );
}
