/**
 * Vertical Character Card
 *
 * 세로형 포트레이트 캐릭터 카드 (3:4 비율 이미지 + 이름 + 창작자)
 */

import { User } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";

interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
  };
  creatorName?: string | null;
}

export function VerticalCharacterCard({
  character,
  creatorName,
}: VerticalCharacterCardProps) {
  return (
    <Link
      to={`/chat/${character.character_id}`}
      className="group flex-shrink-0 w-[120px] sm:w-[140px] lg:w-[150px]"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#2f3032]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#6b7280]" />
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
      {/* 이름 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-white group-hover:text-[#14b8a6]">
        {character.name}
      </h3>
      {/* 창작자 */}
      {creatorName && (
        <p className="truncate text-xs text-[#9ca3af]">{creatorName}</p>
      )}
    </Link>
  );
}
