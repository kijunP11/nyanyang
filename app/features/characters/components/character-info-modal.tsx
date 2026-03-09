/**
 * 캐릭터 정보 모달 — Figma 픽셀 퍼펙트 (906:6709)
 *
 * 홈, 캐릭터 목록, 마이페이지 좋아요/팔로잉에서 카드 클릭 시 열림.
 * useFetcher로 캐릭터 상세 데이터를 로드한다.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useFetcher, useNavigate } from "react-router";

import { Dialog, DialogContent } from "~/core/components/ui/dialog";

/* ──────────────── 인라인 SVG 아이콘 (Figma 원본) ──────────────── */

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 14 14" fill="none">
      <path
        d="M13 1L1 13M1 1L13 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18l6-6-6-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 19.0893 16.8632" fill="none">
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
    <svg className={className} width="20" height="20" viewBox="0 0 19.0893 16.8632" fill="none">
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

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Zm0 0 10.25-10.25a2 2 0 0 1 2.83 0L21 13.5M10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ──────────────── 좋아요 수 포맷 ──────────────── */

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/* ──────────────── 메인 컴포넌트 ──────────────── */

interface CharacterInfoModalProps {
  characterId: number | null;
  onClose: () => void;
  showFollowButton?: boolean;
}

export function CharacterInfoModal({
  characterId,
  onClose,
  showFollowButton = false,
}: CharacterInfoModalProps) {
  const fetcher = useFetcher();
  const likeFetcher = useFetcher();
  const followFetcher = useFetcher();
  const navigate = useNavigate();

  useEffect(() => {
    if (characterId) {
      fetcher.load(`/api/characters/${characterId}`);
    }
  }, [characterId]);

  const character = fetcher.data?.character;
  const isLoading = fetcher.state === "loading";

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (character) {
      setIsLiked(character.isLiked ?? false);
      setLikeCount(character.like_count ?? 0);
      setIsFollowing(character.isFollowing ?? false);
      setImageIndex(0);
    }
  }, [character]);

  const handleFollow = () => {
    if (!character?.creator_id) return;
    const newFollow = !isFollowing;
    setIsFollowing(newFollow);
    followFetcher.submit(
      { user_id: character.creator_id },
      {
        method: newFollow ? "POST" : "DELETE",
        action: "/api/users/follow",
        encType: "application/json",
      },
    );
  };

  const handleLike = () => {
    if (!character) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev) => prev + (newLikedState ? 1 : -1));
    likeFetcher.submit(
      { character_id: character.character_id },
      {
        method: newLikedState ? "POST" : "DELETE",
        action: "/api/characters/like",
        encType: "application/json",
      },
    );
  };

  const handleStartChat = async () => {
    if (!character) return;
    try {
      const res = await fetch("/api/chat/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: character.character_id }),
      });
      const data = (await res.json()) as { room_id?: number; error?: string };
      if (data.room_id) {
        onClose();
        navigate(`/chat/${data.room_id}`);
      } else {
        alert("대화방을 만들 수 없습니다.");
      }
    } catch {
      alert("대화방을 만들 수 없습니다.");
    }
  };

  const handleContinueChat = () => {
    if (!character?.existingRoomId) return;
    navigate(`/chat/${character.existingRoomId}`);
    onClose();
  };

  // 이미지 목록 구성
  const images: string[] = [];
  if (character?.avatar_url) images.push(character.avatar_url);
  if (character?.gallery_urls && Array.isArray(character.gallery_urls)) {
    images.push(
      ...(character.gallery_urls as string[]).filter((url: string) => url),
    );
  }
  if (
    character?.banner_url &&
    !images.includes(character.banner_url as string)
  ) {
    images.push(character.banner_url as string);
  }

  // 이미지 캐러셀 네비게이션
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToImage = useCallback(
    (index: number) => {
      if (!scrollRef.current || images.length === 0) return;
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      scrollRef.current.scrollTo({
        left: clamped * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
      setImageIndex(clamped);
    },
    [images.length],
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || images.length === 0) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const idx = Math.round(scrollLeft / clientWidth);
    setImageIndex(idx);
  }, [images.length]);

  return (
    <Dialog open={!!characterId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[800px] max-h-[90vh] w-[400px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[8px] border-none p-0 [&>button]:hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c4af] border-t-transparent" />
          </div>
        ) : character ? (
          <div className="flex h-full flex-col bg-white dark:bg-[#181D27]">
            {/* ── 헤더 ── */}
            <div className="flex shrink-0 items-center justify-between px-[24px] py-[24px]">
              <h2 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                캐릭터 정보
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm text-[#181D27] transition-opacity hover:opacity-70 dark:text-white"
                aria-label="닫기"
              >
                <XIcon />
              </button>
            </div>

            {/* ── 스크롤 가능 영역 ── */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 이미지 캐러셀 */}
              <div className="relative aspect-square w-full">
                {images.length > 0 ? (
                  <>
                    <div
                      ref={scrollRef}
                      onScroll={handleScroll}
                      className="scrollbar-hide flex h-full snap-x snap-mandatory overflow-x-auto"
                    >
                      {images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={
                            character.display_name || character.name || ""
                          }
                          className="h-full w-full shrink-0 snap-center object-cover"
                        />
                      ))}
                    </div>

                    {/* 좌측 화살표 */}
                    {images.length > 1 && imageIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => scrollToImage(imageIndex - 1)}
                        className="absolute left-[14px] top-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,0,0,0.6)] p-[12.6px] backdrop-blur-[6.5px] transition-opacity hover:opacity-80"
                        aria-label="이전 이미지"
                      >
                        <ChevronLeftIcon />
                      </button>
                    )}

                    {/* 우측 화살표 */}
                    {images.length > 1 &&
                      imageIndex < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => scrollToImage(imageIndex + 1)}
                          className="absolute right-[14px] top-1/2 -translate-y-1/2 rounded-full bg-[rgba(0,0,0,0.6)] p-[12.6px] backdrop-blur-[6.5px] transition-opacity hover:opacity-80"
                          aria-label="다음 이미지"
                        >
                          <ChevronRightIcon />
                        </button>
                      )}

                    {/* 좌하단: 좋아요 버튼 */}
                    <button
                      type="button"
                      onClick={handleLike}
                      className="absolute bottom-[14px] left-[24px] flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5]"
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

                    {/* 우하단: 이미지 카운터 */}
                    {images.length > 1 && (
                      <div className="absolute bottom-[14px] right-[24px] flex items-center gap-[4px] rounded-[50px] border border-white bg-[rgba(0,0,0,0.6)] px-[14px] py-[8px]">
                        <ImageIcon />
                        <span className="text-[14px] font-semibold leading-[20px] text-white">
                          {String(imageIndex + 1).padStart(2, "0")}/
                          {String(images.length).padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#F5F5F5] text-4xl dark:bg-[#1F242F]">
                    🐱
                  </div>
                )}
              </div>

              {/* 캐릭터 정보 */}
              <div className="flex flex-col gap-[16px] px-[24px] pt-[24px] pb-[24px]">
                {/* 캐릭터명 + 크리에이터 + 팔로우 */}
                <div className="flex flex-col gap-[8px]">
                  <p className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                    {character.display_name || character.name}
                  </p>
                  <div className="flex items-start gap-[8px]">
                    {/* 크리에이터 태그 */}
                    {character.creatorName && (
                      <span className="flex items-center gap-[2px] rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] leading-[16px] text-[#9ca3af] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]">
                        @{character.creatorName}
                        <img src="/icons/verified-badge.svg" alt="" width={12} height={14} className="shrink-0" />
                      </span>
                    )}
                    {/* 팔로우 버튼 */}
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
                {character.tags && (character.tags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-[4px]">
                    {(character.tags as string[]).map(
                      (tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[4px] text-[12px] leading-[16px] text-[#9ca3af] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]"
                        >
                          #{tag}
                        </span>
                      ),
                    )}
                  </div>
                )}

                {/* 짧은 설명 (tagline) */}
                {(character.tagline || character.description) && (
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[16px] font-medium leading-[24px] text-black dark:text-white">
                      {character.tagline || character.description}
                    </p>
                    {/* 설명 해시태그 */}
                    {character.tags &&
                      (character.tags as string[]).length > 0 && (
                        <p className="text-[16px] leading-[24px] text-[#535862] dark:text-[#94969C]">
                          {(character.tags as string[])
                            .map((t: string) => `#${t}`)
                            .join(" ")}
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* ── 구분선 ── */}
              <div className="mx-[24px] h-px bg-[#E9EAEB] dark:bg-[#333741]" />

              {/* ── 상세 설명 ── */}
              {character.description && (
                <div className="flex flex-col gap-[12px] px-[24px] py-[24px]">
                  <h3 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                    상세 설명
                  </h3>
                  <p className="text-[14px] leading-[20px] text-[#535862] dark:text-[#94969C]">
                    {character.description}
                  </p>
                </div>
              )}

              {/* ── 구분선 ── */}
              <div className="mx-[24px] h-px bg-[#E9EAEB] dark:bg-[#333741]" />

              {/* ── 댓글 섹션 ── */}
              <div className="flex flex-col gap-[16px] px-[24px] py-[24px]">
                {/* 댓글 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <h3 className="text-[20px] font-semibold leading-[30px] text-black dark:text-white">
                      댓글
                    </h3>
                    <span className="rounded-[6px] border border-[#d5d7da] bg-[#f5f5f5] px-[8px] py-[2px] text-[12px] leading-[16px] text-[#717680] dark:border-[#414651] dark:bg-[#333741] dark:text-[#94969C]">
                      {formatCount(character.chat_count ?? 0)}개
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-[14px] leading-[20px] text-[#717680] hover:underline dark:text-[#94969C]"
                  >
                    전체보기
                  </button>
                </div>

                {/* 댓글 입력 미리보기 */}
                <div className="flex items-center gap-[8px] rounded-[8px] bg-[#f5f5f5] px-[14px] py-[12px] dark:bg-[#1F242F]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 15.0033 16.67"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M14.1683 15.835V14.1683C14.1683 13.2843 13.8171 12.4364 13.192 11.8113C12.5669 11.1862 11.7191 10.835 10.835 10.835H4.16833C3.28428 10.835 2.43643 11.1862 1.81131 11.8113C1.18619 12.4364 0.835 13.2843 0.835 14.1683V15.835M10.835 4.16833C10.835 6.00928 9.34262 7.50167 7.50167 7.50167C5.66072 7.50167 4.16833 6.00928 4.16833 4.16833C4.16833 2.32738 5.66072 0.835 7.50167 0.835C9.34262 0.835 10.835 2.32738 10.835 4.16833Z"
                      stroke="#535862"
                      strokeWidth="1.67"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[14px] font-semibold leading-[20px] text-[#535862] dark:text-[#717680]">
                    댓글을 입력해주세요...
                  </span>
                </div>
              </div>
            </div>

            {/* ── 하단 액션바 (고정) ── */}
            <div className="shrink-0 border-t border-[#d5d7da] p-[24px] shadow-[4px_0px_16px_0px_rgba(0,0,0,0.65)] dark:border-[#333741]">
              <div className="flex gap-[12px]">
                {/* 하트 버튼 */}
                <button
                  type="button"
                  onClick={handleLike}
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[8px] border border-[#d5d7da] bg-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5] dark:border-[#414651] dark:bg-[#1F242F] dark:hover:bg-[#333741]"
                  aria-label="좋아요"
                >
                  {isLiked ? (
                    <HeartFilledIcon className="text-red-500" />
                  ) : (
                    <HeartIcon className="text-[#414651] dark:text-[#D5D7DA]" />
                  )}
                </button>

                {/* 이어서 대화하기 */}
                {character.existingRoomId ? (
                  <button
                    type="button"
                    onClick={handleContinueChat}
                    className="flex flex-1 items-center justify-center rounded-[8px] border border-[#e9faf7] bg-[#e9faf7] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-[#28a393] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-80"
                  >
                    이어서 대화하기
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                {/* 새 대화하기 */}
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="flex flex-1 items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-opacity hover:opacity-90"
                >
                  새 대화하기
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#535862] dark:text-[#94969C]">
            캐릭터를 찾을 수 없습니다
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
