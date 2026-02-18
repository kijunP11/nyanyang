/**
 * 댓글 목록 + 더보기 페이지네이션
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useFetcher } from "react-router";

import type { CommentWithAuthor } from "../lib/queries.server";
import { CommentItem } from "./comment-item";
import { CommentReplyList } from "./comment-reply-list";
import { CommentForm } from "./comment-form";

interface CommentListProps {
  characterId: number;
}

export function CommentList({ characterId }: CommentListProps) {
  const fetcher = useFetcher();
  const [allComments, setAllComments] = useState<CommentWithAuthor[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const isLoadMoreRef = useRef(false);

  useEffect(() => {
    fetcher.load(`/api/comments/list?character_id=${characterId}`);
  }, [characterId]);

  useEffect(() => {
    const data = fetcher.data as
      | { comments?: CommentWithAuthor[]; nextCursor?: number | null }
      | undefined;
    const comments = data?.comments;
    if (!comments) return;

    if (isLoadMoreRef.current) {
      setAllComments((prev) => [...prev, ...comments]);
    } else {
      setAllComments(comments);
    }
    isLoadMoreRef.current = false;
    setHasMore(!!data?.nextCursor);
    setCursor(data?.nextCursor ?? null);
  }, [fetcher.data]);

  const loadMore = useCallback(() => {
    if (cursor == null || fetcher.state === "loading") return;
    isLoadMoreRef.current = true;
    fetcher.load(
      `/api/comments/list?character_id=${characterId}&cursor=${cursor}`
    );
  }, [cursor, characterId, fetcher.state]);

  const handleNewComment = () => {
    setCursor(null);
    setHasMore(true);
    setAllComments([]);
    fetcher.load(`/api/comments/list?character_id=${characterId}`);
  };

  const isLoading = fetcher.state === "loading" && allComments.length === 0;

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-[#A4A7AE]">
          댓글을 불러오는 중...
        </p>
      ) : allComments.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#A4A7AE] dark:text-[#717680]">
          아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!
        </p>
      ) : (
        <>
          {allComments.map((comment) => (
            <div key={comment.comment_id}>
              <CommentItem
                comment={comment}
                onReply={(id) =>
                  setReplyingTo(replyingTo === id ? null : id)
                }
              />
              <CommentReplyList
                parentId={comment.comment_id}
                characterId={characterId}
                replyCount={comment.reply_count}
              />
              {replyingTo === comment.comment_id && (
                <div className="ml-10 mt-1">
                  <CommentForm
                    characterId={characterId}
                    parentId={comment.comment_id}
                    placeholder="답글을 입력하세요..."
                    autoFocus
                    onSuccess={() => {
                      setReplyingTo(null);
                      setAllComments([]);
                      setCursor(null);
                      setHasMore(true);
                      fetcher.load(
                        `/api/comments/list?character_id=${characterId}`
                      );
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={fetcher.state === "loading"}
              className="w-full py-3 text-center text-sm font-semibold text-[#00c4af] transition-colors hover:text-[#00b39e]"
            >
              {fetcher.state === "loading" ? "로딩 중..." : "더보기"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
