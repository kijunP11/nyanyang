/**
 * Character Grid Card
 *
 * 캐릭터 목록 5열 그리드용 카드
 * 3:4 비율 이미지 + 이름 + 설명 + 크리에이터 뱃지
 */

import { Heart, User } from "lucide-react";
import { Link } from "react-router";

import { CreatorBadge } from "~/core/components/creator-badge";
import { Badge } from "~/core/components/ui/badge";

interface CharacterGridCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    description: string | null;
    is_nsfw?: boolean;
    like_count?: number;
  };
  creatorName?: string | null;
  creatorBadgeType?: string | null;
  onClick?: (characterId: number) => void;
}

export function CharacterGridCard({
  character,
  creatorName,
  creatorBadgeType,
  onClick,
}: CharacterGridCardProps) {
  const className = "group";
  const content = (
    <>
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5] dark:bg-[#1F242F]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE] dark:text-[#717680]" />
          </div>
        )}
        {/* NSFW 배지 */}
        {character.is_nsfw && (
          <Badge
            variant="destructive"
            className="absolute left-1.5 top-1.5 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
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
      <h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD] dark:text-white">
        {character.name}
      </h3>
      {/* 설명 (2줄) */}
      {character.description && (
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#535862] dark:text-[#94969C]">
          {character.description}
        </p>
      )}
      {/* 크리에이터 */}
      {creatorName && (
        <div className="mt-1 flex items-center gap-1">
          <p className="truncate text-xs text-[#535862] dark:text-[#94969C]">@{creatorName}</p>
          <CreatorBadge
            badgeType={
              creatorBadgeType as "none" | "popular" | "official" | undefined
            }
          />
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
