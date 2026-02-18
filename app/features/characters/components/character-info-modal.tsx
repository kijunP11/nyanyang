/**
 * 캐릭터 정보 모달
 *
 * 홈, 캐릭터 목록, 마이페이지 좋아요/팔로잉에서 카드 클릭 시 열림.
 * useFetcher로 캐릭터 상세 데이터를 로드한다.
 */
import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Heart, MessageCircle, Eye, Pencil, UserPlus, UserMinus } from "lucide-react";

import { Dialog, DialogContent } from "~/core/components/ui/dialog";
import { ImageCarousel } from "./image-carousel";

interface CharacterInfoModalProps {
  characterId: number | null;
  onClose: () => void;
  /** 마이페이지 좋아요/팔로잉에서 열 때 팔로우 버튼 표시 */
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

  useEffect(() => {
    if (character) {
      setIsLiked(character.isLiked ?? false);
      setLikeCount(character.like_count ?? 0);
      setIsFollowing(character.isFollowing ?? false);
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
      }
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
      }
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

  const handleEdit = () => {
    if (!character) return;
    navigate(`/characters/${character.character_id}/edit`);
    onClose();
  };

  const images: string[] = [];
  if (character?.avatar_url) images.push(character.avatar_url);
  if (character?.gallery_urls && Array.isArray(character.gallery_urls)) {
    images.push(
      ...(character.gallery_urls as string[]).filter((url: string) => url)
    );
  }
  if (
    character?.banner_url &&
    !images.includes(character.banner_url as string)
  ) {
    images.push(character.banner_url as string);
  }

  return (
    <Dialog open={!!characterId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c4af] border-t-transparent" />
          </div>
        ) : character ? (
          <div className="flex flex-col">
            <ImageCarousel
              images={images}
              alt={character.display_name || character.name}
              className="aspect-square rounded-t-lg"
            />

            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#181D27] dark:text-white">
                    {character.display_name || character.name}
                  </h2>
                  {character.tagline && (
                    <p className="mt-0.5 text-sm text-[#535862] dark:text-[#94969C]">
                      {character.tagline}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {showFollowButton && !character.isCreator && (
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followFetcher.state !== "idle"}
                      className="flex items-center gap-1 rounded-full border border-[#D5D7DA] dark:border-[#414651] px-3 py-2 text-sm font-medium text-[#414651] dark:text-[#D5D7DA] transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741] disabled:opacity-50"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          팔로우 취소
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          팔로우
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLike}
                    className="flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isLiked
                          ? "fill-red-500 text-red-500"
                          : "text-[#A4A7AE] dark:text-[#717680]"
                      }`}
                    />
                    <span className="text-xs text-[#535862] dark:text-[#94969C]">
                      {likeCount}
                    </span>
                  </button>
                </div>
              </div>

              {character.description && (
                <p className="text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
                  {character.description}
                </p>
              )}

              {character.tags && character.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(character.tags as string[]).map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[#F5F5F5] px-3 py-1 text-xs text-[#535862] dark:bg-[#333741] dark:text-[#94969C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[#717680] dark:text-[#94969C]">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {character.chat_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {character.view_count ?? 0}
                </span>
              </div>

              {character.creatorName && (
                <p className="text-xs text-[#717680] dark:text-[#94969C]">
                  by {character.creatorName}
                </p>
              )}

              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="w-full rounded-lg bg-[#00c4af] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e]"
                >
                  대화 시작하기
                </button>

                {character.existingRoomId && (
                  <button
                    type="button"
                    onClick={handleContinueChat}
                    className="w-full rounded-lg border border-[#D5D7DA] bg-white py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
                  >
                    이어서 대화하기
                  </button>
                )}

                {character.isCreator && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#D5D7DA] bg-white py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
                  >
                    <Pencil className="h-4 w-4" />
                    수정하기
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-[#535862]">
            캐릭터를 찾을 수 없습니다
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
