/**
 * Vertical Character Card
 *
 * 세로형 포트레이트 캐릭터 카드 (이미지 + 이름 + 설명 + 크리에이터 + 태그)
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
    tagline?: string | null;
    description?: string | null;
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
  const className = "group flex-shrink-0 w-[156px] cursor-pointer";
  const shortDesc = character.tagline || character.description || null;
  const content = (
    <>
      {/* 이미지 */}
      <div className="relative h-[208px] w-full overflow-hidden rounded-[8px] border border-[#A4A7AE] bg-[#F5F5F5] dark:border-[#535862] dark:bg-[#1F242F]">
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
            className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
        )}
        {/* 섹션 배지 (HOT 등) — 좌상단 */}
        {badge && !character.is_nsfw && (
          <span className="absolute left-0 top-0 rounded-br-[8px] rounded-tl-[8px] bg-[#00C4AF] px-2 py-1 text-[12px] font-bold leading-[18px] text-white">
            {badge}
          </span>
        )}
        {/* 좋아요 수 — 좌하단 오버레이 */}
        {character.like_count != null && character.like_count > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-[2px] rounded-[6px] bg-black/80 px-2 py-1 text-[12px] font-semibold leading-[18px] text-white">
            <Heart className="h-3.5 w-3.5" />
            <span>{character.like_count.toLocaleString()}</span>
          </div>
        )}
      </div>
      {/* 이름 — mt-[14px] */}
      <h3 className="mt-[14px] truncate text-[16px] font-semibold leading-[24px] text-[#1A1918] group-hover:text-[#41C7BD] dark:text-white">
        {character.name}
      </h3>
      {/* 설명 — mt-[6px], 2줄 고정 h-[42px] */}
      {shortDesc && (
        <p className="mt-[6px] h-[42px] overflow-hidden text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
          {shortDesc}
        </p>
      )}
      {/* 크리에이터 필 — mt-[10px] */}
      {creatorName && (
        <div className="mt-[10px] inline-flex items-center gap-0.5 rounded-[6px] border border-[#D5D7DA] bg-[#F5F5F5] px-2 py-1 dark:border-[#333741] dark:bg-[#1F242F]">
          <span className="truncate text-[12px] leading-[16px] text-[#9CA3AF] dark:text-[#717680]">
            @{creatorName}
          </span>
          <CreatorBadge
            badgeType={creatorBadgeType as "none" | "popular" | "official" | undefined}
            className="size-3.5 shrink-0"
          />
        </div>
      )}
      {/* 태그 필 (크리에이터가 없을 때만) */}
      {!creatorName && character.tags && character.tags.length > 0 && (
        <div className="mt-[10px] flex flex-wrap gap-1">
          {character.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] border border-[#D5D7DA] bg-[#F5F5F5] px-2 py-1 text-[12px] leading-[16px] text-[#9CA3AF] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#717680]"
            >
              #{tag}
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
