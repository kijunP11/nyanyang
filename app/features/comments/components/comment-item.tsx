/**
 * 단일 댓글 컴포넌트
 */
import { useState } from "react";
import { useFetcher } from "react-router";
import { Heart, MessageCircle, Trash2, User } from "lucide-react";

import type { CommentWithAuthor } from "../lib/queries.server";

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply?: (commentId: number) => void;
  isReply?: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export function CommentItem({
  comment,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const likeFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const isDeleted = comment.is_deleted === 1;
  const isDeleting = deleteFetcher.state === "submitting";

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikeCount((prev) => prev + (newState ? 1 : -1));

    likeFetcher.submit(
      { comment_id: comment.comment_id },
      {
        method: newState ? "POST" : "DELETE",
        action: "/api/comments/like",
        encType: "application/json",
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    deleteFetcher.submit(
      { comment_id: comment.comment_id },
      {
        method: "DELETE",
        action: "/api/comments/delete",
        encType: "application/json",
      }
    );
  };

  if (isDeleted) {
    return (
      <div className={`flex gap-3 py-3 ${isReply ? "pl-10" : ""}`}>
        <p className="text-sm italic text-[#A4A7AE] dark:text-[#717680]">
          삭제된 댓글입니다.
        </p>
      </div>
    );
  }

  const timeAgo = comment.created_at
    ? formatTimeAgo(new Date(comment.created_at))
    : "";

  return (
    <div className={`flex gap-3 py-3 ${isReply ? "pl-10" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9EAEB] dark:bg-[#333741]">
        {comment.author_avatar_url ? (
          <img
            src={comment.author_avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-[#717680]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#181D27] dark:text-white">
            {comment.author_name ?? "익명"}
          </span>
          <span className="text-xs text-[#A4A7AE] dark:text-[#717680]">
            {timeAgo}
          </span>
        </div>

        <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#414651] dark:text-[#D5D7DA]">
          {comment.content}
        </p>

        {comment.image_url && (
          <img
            src={comment.image_url}
            alt="첨부 이미지"
            className="mt-2 max-h-48 rounded-lg object-cover"
          />
        )}

        <div className="mt-1.5 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-red-500 dark:text-[#94969C]"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {!isReply && onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.comment_id)}
              className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-[#00c4af] dark:text-[#94969C]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {comment.reply_count > 0 && <span>{comment.reply_count}</span>}
            </button>
          )}

          {comment.isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-red-500 dark:text-[#94969C]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
