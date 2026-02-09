/**
 * Horizontal Character Card Component
 *
 * 가로형 카드: 왼쪽 썸네일 (89px) + 오른쪽 정보 (이름, 통계, 설명, 창작자)
 * Figma 디자인 기반 (27:270)
 */
import { MessageCircle, Star, User2 } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import type { Database } from "database.types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface HorizontalCharacterCardProps {
  character: Character;
  creatorName?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

export function HorizontalCharacterCard({
  character,
  creatorName,
}: HorizontalCharacterCardProps) {
  return (
    <Link
      to={`/chat/${character.character_id}`}
      className="group flex gap-4 rounded-lg p-1 transition-colors hover:bg-white/5"
    >
      {/* 썸네일 (89px) */}
      <div className="relative h-[138px] w-[89px] flex-shrink-0 overflow-hidden rounded-lg bg-[#2f3032]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User2 className="h-10 w-10 text-[#6b7280]" />
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
      </div>

      {/* 정보 영역 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        {/* 상단: 이름 + 통계 */}
        <div>
          {/* 캐릭터 이름 */}
          <h3 className="truncate text-base font-semibold text-white group-hover:text-[#14b8a6]">
            {character.name}
          </h3>

          {/* 통계 (별/조회, 팔로워, 채팅) - Figma 기준 ⭐👤💬 */}
          <div className="mt-1.5 flex items-center gap-4 text-sm text-[#9ca3af]">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {formatNumber(character.view_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <User2 className="h-3.5 w-3.5" />
              {formatNumber(character.like_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {formatNumber(character.chat_count || 0)}
            </span>
          </div>

          {/* 설명 (2줄 제한) */}
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#9ca3af]">
            {character.description || "설명 없음"}
          </p>
        </div>

        {/* 하단: 창작자 배지 */}
        <div className="flex items-center gap-1.5">
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3f3f46]">
            <User2 className="h-3 w-3 text-[#9ca3af]" />
          </div>
          <span className="text-sm text-[#9ca3af]">
            @{creatorName || "unknown"}
          </span>
        </div>
      </div>
    </Link>
  );
}
