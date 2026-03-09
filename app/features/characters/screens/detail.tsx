/**
 * Character Detail Screen — Figma 픽셀 퍼펙트 (906:16271)
 *
 * /characters/:characterId
 * 캐릭터 프로필 히어로 + 상세 설명 + 댓글 섹션
 */
import type { Route } from "./+types/detail";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLoaderData, useFetcher, useNavigate } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { chatRooms } from "../../chat/schema";
import type { CommentWithAuthor } from "~/features/comments/lib/queries.server";
import { ChatInitModal } from "~/features/chat/components/chat-init-modal";

/* ──────────────── 인라인 SVG 아이콘 (Figma 원본) ──────────────── */

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 19.0893 16.8632"
      fill="none"
    >
      <path
        d="M16.9111 2.17819C16.4854 1.75236 15.9801 1.41456 15.4239 1.18409C14.8677 0.953623 14.2715 0.835 13.6694 0.835C13.0673 0.835 12.4712 0.953623 11.9149 1.18409C11.3587 1.41456 10.8534 1.75236 10.4277 2.17819L9.54441 3.06152L8.66108 2.17819C7.80133 1.31844 6.63527 0.835446 5.41941 0.835446C4.20355 0.835446 3.03749 1.31844 2.17774 2.17819C1.318 3.03793 0.835 4.20399 0.835 5.41985C0.835 6.63572 1.318 7.80178 2.17774 8.66152L3.06108 9.54485L9.54441 16.0282L16.0277 9.54485L16.9111 8.66152C17.3369 8.23589 17.6747 7.73053 17.9052 7.17432C18.1356 6.6181 18.2543 6.02193 18.2543 5.41985C18.2543 4.81778 18.1356 4.22161 17.9052 3.66539C17.6747 3.10918 17.3369 2.60382 16.9111 2.17819V2.17819Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 19.0893 16.8632"
      fill="none"
    >
      <path
        d="M16.9111 2.17819C16.4854 1.75236 15.9801 1.41456 15.4239 1.18409C14.8677 0.953623 14.2715 0.835 13.6694 0.835C13.0673 0.835 12.4712 0.953623 11.9149 1.18409C11.3587 1.41456 10.8534 1.75236 10.4277 2.17819L9.54441 3.06152L8.66108 2.17819C7.80133 1.31844 6.63527 0.835446 5.41941 0.835446C4.20355 0.835446 3.03749 1.31844 2.17774 2.17819C1.318 3.03793 0.835 4.20399 0.835 5.41985C0.835 6.63572 1.318 7.80178 2.17774 8.66152L3.06108 9.54485L9.54441 16.0282L16.0277 9.54485L16.9111 8.66152C17.3369 8.23589 17.6747 7.73053 17.9052 7.17432C18.1356 6.6181 18.2543 6.02193 18.2543 5.41985C18.2543 4.81778 18.1356 4.22161 17.9052 3.66539C17.6747 3.10918 17.3369 2.60382 16.9111 2.17819V2.17819Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 15.0033 16.67"
      fill="none"
    >
      <path
        d="M14.1683 15.835V14.1683C14.1683 13.2843 13.8171 12.4364 13.192 11.8113C12.5669 11.1862 11.7191 10.835 10.835 10.835H4.16833C3.28428 10.835 2.43643 11.1862 1.81131 11.8113C1.18619 12.4364 0.835 13.2843 0.835 14.1683V15.835M10.835 4.16833C10.835 6.00928 9.34262 7.50167 7.50167 7.50167C5.66072 7.50167 4.16833 6.00928 4.16833 4.16833C4.16833 2.32738 5.66072 0.835 7.50167 0.835C9.34262 0.835 10.835 2.32738 10.835 4.16833Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CornerDownRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <polyline
        points="15 10 20 15 15 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4v7a4 4 0 0 0 4 4h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <div className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#36c4b3]">
      <svg width="9.6" height="9.6" viewBox="0 0 24 24" fill="none">
        <polyline
          points="20 6 9 17 4 12"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ──────────────── 유틸 ──────────────── */

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/* ──────────────── Loader ──────────────── */

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const characterId = parseInt(params.characterId);
  if (isNaN(characterId)) {
    throw new Response("Invalid character ID", { status: 400 });
  }

  const url = new URL(request.url);
  const apiUrl = new URL(`/api/characters/${characterId}`, url.origin);

  const response = await fetch(apiUrl.toString(), {
    headers: request.headers,
  });

  if (!response.ok) {
    throw new Response("Failed to fetch character", {
      status: response.status,
    });
  }

  const data = await response.json();
  return data;
}

/* ──────────────── Action ──────────────── */

export async function action({ request, params }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const characterId = parseInt(params.characterId);
  const db = drizzle;

  const [room] = await db
    .insert(chatRooms)
    .values({
      user_id: user.id,
      character_id: characterId,
      title: `New Chat`,
      message_count: 0,
    })
    .returning();

  return Response.redirect(`/chat/${room.room_id}`);
}

/* ──────────────── 댓글 아이템 ──────────────── */

function DetailCommentItem({
  comment,
  creatorId,
  isReply,
  onReply,
  onDelete,
}: {
  comment: CommentWithAuthor;
  creatorId: string;
  isReply?: boolean;
  onReply?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  const likeFetcher = useFetcher();
  const [liked, setLiked] = useState(comment.isLiked);
  const [lc, setLc] = useState(comment.like_count);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLc((p) => p + (next ? 1 : -1));
    likeFetcher.submit(
      { comment_id: comment.comment_id },
      {
        method: next ? "POST" : "DELETE",
        action: "/api/comments/like",
        encType: "application/json",
      },
    );
  };

  if (comment.is_deleted === 1) {
    return (
      <p className="text-[14px] italic leading-[20px] text-[#A4A7AE]">
        삭제된 댓글입니다.
      </p>
    );
  }

  return (
    <div className="flex gap-[7px]">
      {/* 아바타 */}
      <div className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#E9EAEB]">
        {comment.author_avatar_url ? (
          <img
            src={comment.author_avatar_url}
            alt=""
            className="size-[24px] rounded-full object-cover"
          />
        ) : (
          <UserIcon className="text-[#717680]" />
        )}
      </div>

      {/* 본문 */}
      <div className="flex min-w-0 flex-1 flex-col gap-[11px]">
        <div className="flex flex-col gap-[8px]">
          {/* 닉네임 + 날짜 + 뱃지 + 메뉴 */}
          <div className="flex items-center gap-[15px]">
            <div className="flex flex-1 items-end gap-[8px]">
              <span className="text-[14px] font-semibold leading-[20px] text-black dark:text-white">
                {comment.author_name ?? "익명"}
              </span>
              <span className="text-[12px] leading-[18px] text-[#717680]">
                {formatDate(comment.created_at)}
              </span>
              {/* 레벨 뱃지 */}
              {comment.badge_level && comment.badge_name && (
                <div className="flex items-end gap-[8px]">
                  <span className="text-[12px] font-bold leading-[18px] text-[#5925dc] whitespace-nowrap">
                    Lv.{comment.badge_level} {comment.badge_name}
                  </span>
                  {comment.badge_icon_url && (
                    <img
                      src={comment.badge_icon_url}
                      alt=""
                      className="size-[20px] shrink-0 rounded-full object-cover"
                    />
                  )}
                </div>
              )}
              {/* 제작자 뱃지 */}
              {comment.user_id === creatorId && (
                <div className="flex items-center gap-[4px]">
                  <CheckBadgeIcon />
                  <span className="text-[12px] font-bold leading-[18px] text-[#36c4b3] whitespace-nowrap">
                    제작자
                  </span>
                </div>
              )}
            </div>
            {comment.isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-[#717680] transition-opacity hover:opacity-70"
                >
                  <MoreVerticalIcon />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-[20px] z-10 w-[115px] overflow-hidden rounded-[8px] border border-[#e9eaeb] bg-white shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03)]">
                    <button
                      type="button"
                      className="w-full px-[16px] py-[10px] text-left text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
                      onClick={() => {
                        setShowMenu(false);
                        // TODO: edit
                      }}
                    >
                      수정
                    </button>
                    <div className="h-px bg-[#e9eaeb]" />
                    <button
                      type="button"
                      className="w-full px-[16px] py-[10px] text-left text-[14px] font-medium leading-[20px] text-[#414651] hover:bg-[#f5f5f5]"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete?.(comment.comment_id);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 댓글 텍스트 */}
          <p className="whitespace-pre-wrap text-[14px] leading-[20px] text-black dark:text-white">
            {comment.content}
          </p>

          {comment.image_url && (
            <div className="size-[100px] shrink-0 overflow-hidden rounded-[8px]">
              <img
                src={comment.image_url}
                alt="첨부 이미지"
                className="size-full object-cover"
              />
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="flex items-center gap-[24px]">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-[4px]"
          >
            {liked ? (
              <HeartFilledIcon className="text-red-500" />
            ) : (
              <HeartIcon className="text-[#717680]" />
            )}
            {lc > 0 && (
              <span className="text-[14px] leading-[20px] text-[#717680]">
                {lc}
              </span>
            )}
          </button>

          {!isReply && (
            <>
              <button
                type="button"
                onClick={() => onReply?.(comment.comment_id)}
                className="flex items-center gap-[4px]"
              >
                <MessageSquareIcon className="text-[#717680]" />
                {comment.reply_count > 0 && (
                  <span className="text-[14px] leading-[20px] text-[#717680]">
                    {comment.reply_count}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onReply?.(comment.comment_id)}
                className="text-[14px] leading-[20px] text-[#717680] hover:underline"
              >
                댓글 달기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── 메인 컴포넌트 ──────────────── */

export default function CharacterDetailScreen() {
  const { character } = useLoaderData<typeof loader>();
  const likeFetcher = useFetcher();
  const commentFetcher = useFetcher();
  const commentCreateFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const followFetcher = useFetcher();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(character.isLiked);
  const [likeCount, setLikeCount] = useState(character.like_count);
  const [isFollowing, setIsFollowing] = useState(character.isFollowing);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // 댓글 상태
  const [allComments, setAllComments] = useState<CommentWithAuthor[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [repliesMap, setRepliesMap] = useState<Record<number, CommentWithAuthor[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const isLoadMoreRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyFetcher = useFetcher();

  // 댓글 로드
  useEffect(() => {
    commentFetcher.load(
      `/api/comments/list?character_id=${character.character_id}`,
    );
  }, [character.character_id]);

  useEffect(() => {
    const data = commentFetcher.data as
      | { comments?: CommentWithAuthor[]; nextCursor?: number | null }
      | undefined;
    if (!data?.comments) return;
    if (isLoadMoreRef.current) {
      setAllComments((prev) => [...prev, ...data.comments!]);
    } else {
      setAllComments(data.comments);
    }
    isLoadMoreRef.current = false;
    setHasMore(!!data.nextCursor);
    setCursor(data.nextCursor ?? null);
  }, [commentFetcher.data]);

  // 댓글 등록 성공 시 새로고침
  const prevCreateRef = useRef(commentCreateFetcher.state);
  useEffect(() => {
    const data = commentCreateFetcher.data as
      | { success?: boolean }
      | undefined;
    const wasSubmitting = prevCreateRef.current === "submitting";
    if (wasSubmitting && commentCreateFetcher.state === "idle" && data?.success) {
      setCommentContent("");
      setReplyContent("");
      setReplyingTo(null);
      setAllComments([]);
      setCursor(null);
      setHasMore(true);
      commentFetcher.load(
        `/api/comments/list?character_id=${character.character_id}`,
      );
    }
    prevCreateRef.current = commentCreateFetcher.state;
  }, [commentCreateFetcher.state, commentCreateFetcher.data]);

  // 답글 로드 처리
  useEffect(() => {
    const data = replyFetcher.data as
      | { replies?: CommentWithAuthor[] }
      | undefined;
    if (!data?.replies) return;
    if (data.replies.length > 0) {
      const parentId = data.replies[0].parent_id;
      if (parentId != null) {
        setRepliesMap((prev) => ({ ...prev, [parentId]: data.replies! }));
      }
    }
  }, [replyFetcher.data]);

  const handleToggleReplies = useCallback((commentId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        if (!repliesMap[commentId]) {
          replyFetcher.load(`/api/comments/list?parent_id=${commentId}`);
        }
      }
      return next;
    });
  }, [repliesMap]);

  const handleLoadMore = useCallback(() => {
    if (cursor == null || commentFetcher.state === "loading") return;
    isLoadMoreRef.current = true;
    commentFetcher.load(
      `/api/comments/list?character_id=${character.character_id}&cursor=${cursor}`,
    );
  }, [cursor, character.character_id, commentFetcher.state]);

  const handleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((prev: number) => prev + (next ? 1 : -1));
    likeFetcher.submit(
      { character_id: character.character_id },
      {
        method: next ? "POST" : "DELETE",
        action: "/api/characters/like",
        encType: "application/json",
      },
    );
  };

  const handleFollow = () => {
    if (!character.creator_id) return;
    const next = !isFollowing;
    setIsFollowing(next);
    followFetcher.submit(
      { user_id: character.creator_id },
      {
        method: next ? "POST" : "DELETE",
        action: "/api/users/follow",
        encType: "application/json",
      },
    );
  };

  const handleStartChat = () => {
    setChatModalOpen(true);
  };

  const handleConfirmChat = async (_model: string) => {
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: character.character_id }),
      });
      const data = (await res.json()) as { room_id?: number };
      if (data.room_id) navigate(`/chat/${data.room_id}`);
    } catch {
      /* ignore */
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmitComment = (parentId?: number | null) => {
    const content = parentId ? replyContent.trim() : commentContent.trim();
    if (!content) return;
    commentCreateFetcher.submit(
      {
        character_id: character.character_id,
        content,
        ...(parentId ? { parent_id: parentId } : {}),
      },
      {
        method: "POST",
        action: "/api/comments/create",
        encType: "application/json",
      },
    );
  };

  const handleDeleteComment = (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    deleteFetcher.submit(
      { comment_id: commentId },
      {
        method: "DELETE",
        action: "/api/comments/delete",
        encType: "application/json",
      },
    );
    setAllComments((prev) =>
      prev.map((c) =>
        c.comment_id === commentId ? { ...c, is_deleted: 1 } : c,
      ),
    );
  };

  // 이미지
  const mainImage = character.avatar_url || character.banner_url || null;
  const tags = (character.tags as string[] | null) ?? [];
  const commentCount = allComments.length;

  return (
    <div className="mx-auto w-full max-w-[816px]">
      {/* ── 캐릭터 프로필 히어로 ── */}
      <div className="flex gap-[24px]">
        {/* 좌측: 이미지 300×300 */}
        <div className="relative size-[300px] shrink-0 overflow-hidden rounded-[16px]">
          {mainImage ? (
            <img
              src={mainImage}
              alt={character.display_name || character.name || ""}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-[#F5F5F5] text-6xl">
              🐱
            </div>
          )}

          {/* 좋아요 오버레이 — 우하단 */}
          <button
            type="button"
            onClick={handleLike}
            className="absolute bottom-[14px] right-[24px] flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5]"
          >
            {isLiked ? (
              <HeartFilledIcon className="text-red-500" />
            ) : (
              <HeartIcon className="text-[#414651]" />
            )}
            <span className="text-[14px] font-semibold leading-[20px] text-[#414651]">
              {formatCount(likeCount)}
            </span>
          </button>
        </div>

        {/* 우측: 캐릭터 정보 */}
        <div className="flex flex-1 flex-col justify-between">
          {/* 상단 정보 */}
          <div className="flex flex-col gap-[20px]">
            {/* 이름 + 크리에이터 + 태그 */}
            <div className="flex flex-col gap-[14px]">
              {/* 이름 + 크리에이터 */}
              <div className="flex flex-col gap-[8px]">
                <h1 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                  {character.display_name || character.name}
                </h1>
                <div className="flex items-center gap-[8px]">
                  {character.creatorName && (
                    <span className="flex items-center gap-[2px] rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] leading-[16px] text-[#9ca3af] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]">
                      @{character.creatorName}
                      <img
                        src="/icons/verified-badge.svg"
                        alt=""
                        width={12}
                        height={14}
                        className="shrink-0"
                      />
                    </span>
                  )}
                  {!character.isCreator && (
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followFetcher.state !== "idle"}
                      className="rounded-[4px] bg-[#181d27] px-[8px] py-[3px] text-[12px] font-semibold leading-[18px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-[#D5D7DA] dark:text-[#181d27]"
                    >
                      {isFollowing ? "팔로잉 취소" : "팔로우"}
                    </button>
                  )}
                </div>
              </div>

              {/* 태그 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-[4px]">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] leading-[16px] text-[#9ca3af] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 짧은 설명 + 해시태그 */}
            {(character.tagline || character.description) && (
              <div className="flex flex-col gap-[4px]">
                <p className="text-[16px] font-medium leading-[24px] text-black dark:text-white">
                  {character.tagline || character.description}
                </p>
                {tags.length > 0 && (
                  <div className="flex gap-[5px] text-[16px] leading-[24px] text-[#535862] dark:text-[#94969C]">
                    {tags.map((t, i) => (
                      <span key={i}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 대화하기 버튼 */}
          <button
            type="button"
            onClick={handleStartChat}
            className="flex h-[44px] w-full items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-90"
          >
            대화하기
          </button>
        </div>
      </div>

      {/* ── 구분선 ── */}
      <div className="my-[48px] h-px w-full bg-[#d5d7da] dark:bg-[#333741]" />

      {/* ── 상세 설명 ── */}
      {character.description && (
        <>
          <div className="flex flex-col gap-[14px]">
            <h2 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
              상세 설명
            </h2>
            <div className="whitespace-pre-wrap text-[16px] leading-[24px] text-black dark:text-[#D5D7DA]">
              {character.description}
            </div>
          </div>

          {/* 구분선 */}
          <div className="my-[48px] h-px w-full bg-[#d5d7da] dark:bg-[#333741]" />
        </>
      )}

      {/* ── 댓글 섹션 ── */}
      <div className="flex flex-col gap-[24px]">
        {/* 댓글 헤더 */}
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <h2 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                댓글
              </h2>
              <span className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] leading-[16px] text-[#9ca3af] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]">
                {commentCount}개
              </span>
            </div>
          </div>
        </div>

        {/* 댓글 입력 */}
        <div className="relative flex h-[136px] flex-col rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] dark:border-[#414651] dark:bg-[#1F242F]">
          <textarea
            ref={textareaRef}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="타인에게 부적절한 댓글은 재재될 수 있습니다."
            className="flex-1 resize-none bg-transparent text-[16px] leading-[24px] text-black outline-none placeholder:text-[#717680] dark:text-white dark:placeholder:text-[#717680]"
            maxLength={1000}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleSubmitComment(null)}
              disabled={
                commentCreateFetcher.state === "submitting" ||
                !commentContent.trim()
              }
              className="rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              등록하기
            </button>
          </div>
        </div>

        {/* 댓글 목록 */}
        {allComments.length > 0 ? (
          <div className="flex flex-col gap-[24px] rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] px-[24px] py-[32px] dark:border-[#414651] dark:bg-[#1F242F]">
            {allComments.map((comment, idx) => (
              <div key={comment.comment_id}>
                {idx > 0 && (
                  <div className="mb-[24px] h-px w-full bg-[#d5d7da] dark:bg-[#414651]" />
                )}
                <DetailCommentItem
                  comment={comment}
                  creatorId={character.creator_id}
                  onReply={(id) => {
                    setReplyingTo(replyingTo === id ? null : id);
                    if (comment.reply_count > 0 && !expandedReplies.has(id)) {
                      handleToggleReplies(id);
                    }
                  }}
                  onDelete={handleDeleteComment}
                />

                {/* 답글 목록 */}
                {expandedReplies.has(comment.comment_id) &&
                  repliesMap[comment.comment_id]?.map((reply) => (
                    <div
                      key={reply.comment_id}
                      className="ml-[31px] mt-[12px]"
                    >
                      <DetailCommentItem
                        comment={reply}
                        creatorId={character.creator_id}
                        isReply
                        onDelete={handleDeleteComment}
                      />
                    </div>
                  ))}

                {/* 답글 입력 */}
                {replyingTo === comment.comment_id && (
                  <div className="mt-[12px] flex items-start gap-[10px]">
                    <CornerDownRightIcon className="shrink-0 text-[#717680]" />
                    <div className="flex h-[136px] flex-1 flex-col rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] dark:border-[#414651] dark:bg-[#1F242F]">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="타인에게 부적절한 댓글은 재재될 수 있습니다."
                        className="flex-1 resize-none bg-transparent text-[16px] leading-[24px] text-black outline-none placeholder:text-[#717680] dark:text-white dark:placeholder:text-[#717680]"
                        maxLength={1000}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment(comment.comment_id);
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleSubmitComment(comment.comment_id)
                          }
                          disabled={
                            commentCreateFetcher.state === "submitting" ||
                            !replyContent.trim()
                          }
                          className="rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          등록하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={commentFetcher.state === "loading"}
                className="w-full py-[8px] text-center text-[14px] font-semibold text-[#36c4b3] transition-colors hover:opacity-80"
              >
                {commentFetcher.state === "loading" ? "로딩 중..." : "더보기"}
              </button>
            )}
          </div>
        ) : commentFetcher.state === "loading" ? (
          <div className="flex items-center justify-center py-[48px]">
            <div className="size-6 animate-spin rounded-full border-2 border-[#36c4b3] border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] px-[24px] py-[48px] text-center text-[14px] text-[#717680] dark:border-[#414651] dark:bg-[#1F242F]">
            아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!
          </div>
        )}
      </div>

      {/* 하단 여백 */}
      <div className="h-[80px]" />

      {/* 대화 설정 모달 */}
      <ChatInitModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        characterName={character.display_name || character.name}
        characterDescription={character.description ?? ""}
        onStartChat={handleConfirmChat}
        isLoading={chatLoading}
      />
    </div>
  );
}
