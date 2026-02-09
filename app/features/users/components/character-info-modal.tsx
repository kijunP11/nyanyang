/**
 * Character Info Modal
 *
 * 캐릭터 카드 클릭 시 표시되는 정보 모달.
 */

import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";

import type { CharacterCardData } from "../types";

interface CharacterInfoModalProps {
  character: CharacterCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export default function CharacterInfoModal({
  character,
  open,
  onOpenChange,
  currentUserId,
}: CharacterInfoModalProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const likeFetcher = useFetcher();
  const followFetcher = useFetcher();

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open && character) {
      setImageIndex(0);
      setIsLiked(character.is_liked ?? false);
      setIsFollowing(character.is_following ?? false);
    }
  }, [open, character]);

  // fetcher 결과 반영
  useEffect(() => {
    if (likeFetcher.data && typeof likeFetcher.data === "object") {
      const data = likeFetcher.data as { liked?: boolean; error?: string };
      if (data.error) {
        // 에러 시 상태 롤백
        setIsLiked((prev) => !prev);
      }
    }
  }, [likeFetcher.data]);

  useEffect(() => {
    if (followFetcher.data && typeof followFetcher.data === "object") {
      const data = followFetcher.data as { following?: boolean; error?: string };
      if (data.error) {
        // 에러 시 상태 롤백
        setIsFollowing((prev) => !prev);
      }
    }
  }, [followFetcher.data]);

  if (!character) return null;

  // gallery_urls 파싱 (jsonb이므로 string[]로 변환)
  const galleryUrls: string[] = Array.isArray(character.gallery_urls)
    ? character.gallery_urls
    : [];
  const allImages = character.avatar_url
    ? [character.avatar_url, ...galleryUrls]
    : galleryUrls;

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    likeFetcher.submit(
      { character_id: character.character_id },
      {
        method: newState ? "POST" : "DELETE",
        action: "/api/characters/like",
        encType: "application/json",
      }
    );
  };

  const handleFollow = () => {
    const newState = !isFollowing;
    setIsFollowing(newState);
    followFetcher.submit(
      { user_id: character.creator_id },
      {
        method: newState ? "POST" : "DELETE",
        action: "/api/users/follow",
        encType: "application/json",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#232323] border-[#3f3f46] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>캐릭터 정보</DialogTitle>
        </DialogHeader>

        {/* 이미지 슬라이더 */}
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a1a]">
          {allImages.length > 0 ? (
            <img
              src={allImages[imageIndex]}
              alt={character.display_name || character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-16 w-16 text-[#6b7280]" />
            </div>
          )}

          {/* 좌우 화살표 (allImages.length > 1일 때만) */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white disabled:opacity-50"
                disabled={imageIndex === 0}
              >
                ←
              </button>
              <button
                onClick={() =>
                  setImageIndex((i) => Math.min(allImages.length - 1, i + 1))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white disabled:opacity-50"
                disabled={imageIndex === allImages.length - 1}
              >
                →
              </button>
              {/* 인덱스 표시 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-3 py-1 text-xs text-white">
                {imageIndex + 1} / {allImages.length}
              </div>
            </>
          )}

          {/* 좋아요 수 */}
          <div className="absolute top-2 right-2 bg-black/50 rounded-full px-3 py-1 text-xs text-white">
            ❤️ {character.like_count}
          </div>
        </div>

        {/* 캐릭터 정보 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">
                {character.display_name || character.name}
              </h3>
              <p className="text-sm text-[#9ca3af]">
                @{character.creator_name || "creator"}
              </p>
            </div>
            {/* 팔로잉 버튼 (자기 캐릭터가 아닐 때만) */}
            {currentUserId !== character.creator_id && (
              <button
                onClick={handleFollow}
                disabled={followFetcher.state !== "idle"}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isFollowing
                    ? "bg-[#3f3f46] text-white"
                    : "bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                }`}
              >
                {followFetcher.state !== "idle"
                  ? "..."
                  : isFollowing
                    ? "팔로잉"
                    : "팔로우"}
              </button>
            )}
          </div>

          {/* 태그 */}
          {character.tags && character.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {character.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 설명 */}
          <p className="text-sm text-[#9ca3af]">{character.description}</p>
        </div>

        {/* 하단 액션 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleLike}
            disabled={likeFetcher.state !== "idle"}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3f3f46] text-sm hover:bg-[#3f3f46] transition-colors"
          >
            {likeFetcher.state !== "idle" ? "..." : isLiked ? "❤️" : "🤍"} 좋아요
          </button>
          <Link
            to={`/chat/${character.character_id}`}
            className="flex-1 text-center px-4 py-2 rounded-lg bg-[#14b8a6] text-white text-sm font-medium hover:bg-[#0d9488]"
          >
            대화하기
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
