/**
 * Vertical Character Card
 *
 * 세로형 포트레이트 캐릭터 카드 (3:4 비율 이미지 + 이름 + 창작자)
 */

import { Heart, User } from "lucide-react";
import { Link } from "react-router";

import { CreatorBadge } from "~/core/components/creator-badge";
import { Badge } from "~/core/components/ui/badge";

interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
  creatorBadgeType?: string | null;
  badge?: string;
  /** 클릭 시 모달 열기 (있으면 Link 대신 사용) */
  onClick?: (characterId: number) => void;
}

export function VerticalCharacterCard({
  character,
  creatorName,
  creatorBadgeType,
  badge,
  onClick,
}: VerticalCharacterCardProps) {
  const className =
    "group flex-shrink-0 w-[120px] sm:w-[140px] lg:w-[150px]";
  const content = (
    <>
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE]" />
          </div>
        )}
        {/* NSFW 배지 */}
        {character.is_nsfw && (
          <Badge
            variant="destructive"
            className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
        )}
        {/* 섹션 배지 (HOT 등) — 좌상단, NSFW가 없을 때만 */}
        {badge && !character.is_nsfw && (
          <span className="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        {/* 좋아요 수 — 좌하단 오버레이 */}
        {character.like_count != null && character.like_count > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
            <Heart className="h-3 w-3" />
            <span>{character.like_count.toLocaleString()}</span>
          </div>
        )}
      </div>
      {/* 이름 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD]">
        {character.name}
      </h3>
      {/* 창작자 */}
      {creatorName && (
        <div className="flex items-center gap-1">
          <p className="truncate text-xs text-[#535862]">{creatorName}</p>
          <CreatorBadge
            badgeType={
              creatorBadgeType as "none" | "popular" | "official" | undefined
            }
          />
        </div>
      )}
      {/* 태그 표시 */}
      {character.tags && character.tags.length > 0 && (
        <div className="mt-1 flex gap-1">
          {character.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] text-[#535862]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(character.character_id)}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={`/chat/${character.character_id}`} className={className}>
      {content}
    </Link>
  );
}
