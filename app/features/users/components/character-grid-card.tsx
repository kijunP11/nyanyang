/**
 * Character Grid Card
 *
 * 좋아요/팔로잉 목록의 세로형 캐릭터 카드. 라이트 테마.
 */

import { User } from "lucide-react";

import type { CharacterCardData } from "../types";

interface CharacterGridCardProps {
  character: CharacterCardData;
  onClick: () => void;
}

export default function CharacterGridCard({
  character,
  onClick,
}: CharacterGridCardProps) {
  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#E8E8E8]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.display_name || character.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-10 w-10 text-[#717680]" />
          </div>
        )}
      </div>

      <h3 className="mt-2 text-sm font-semibold text-[#181D27] truncate">
        {character.display_name || character.name}
      </h3>

      <p className="text-xs text-[#535862]">❤️ {character.like_count}</p>

      <p className="text-xs text-[#535862] line-clamp-1 mt-1">
        {character.description || "설명 없음"}
      </p>

      <div className="flex flex-wrap gap-1 mt-2">
        {(character.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-[#E0F7F5] text-[#00897B]"
          >
            {tag}
          </span>
        ))}
      </div>

      {"creator_name" in character && character.creator_name && (
        <p className="text-xs text-[#717680] mt-1">
          by {character.creator_name}
        </p>
      )}
    </div>
  );
}
