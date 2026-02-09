/**
 * Character Grid Card
 *
 * 좋아요/팔로잉 목록의 세로형 캐릭터 카드.
 */

import type { CharacterCardData } from "../types";

interface CharacterGridCardProps {
  character: CharacterCardData;
  onClick: (character: CharacterCardData) => void;
}

export default function CharacterGridCard({
  character,
  onClick,
}: CharacterGridCardProps) {
  return (
    <div
      onClick={() => onClick(character)}
      className="cursor-pointer group"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#2f3032]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.display_name || character.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎭
          </div>
        )}
      </div>

      {/* 캐릭터명 */}
      <h3 className="mt-2 text-sm font-semibold text-white truncate">
        {character.display_name || character.name}
      </h3>

      {/* 좋아요 수 */}
      <p className="text-xs text-[#9ca3af]">❤️ {character.like_count}</p>

      {/* 설명 (1줄) */}
      <p className="text-xs text-[#9ca3af] line-clamp-1 mt-1">
        {character.description || "설명 없음"}
      </p>

      {/* 태그 (최대 3개) */}
      <div className="flex flex-wrap gap-1 mt-2">
        {(character.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
