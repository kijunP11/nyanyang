/**
 * F4-3-2/3-3 장르별 이미지 선택 카드 (8개, placeholder 그라데이션 + 선택 시 체크 아이콘)
 */
import { Check } from "lucide-react";

import { GENRES } from "../lib/constants";

interface GenreCardsProps {
  selectedGenre: string | null;
  onSelect: (genreId: string | null) => void;
}

export function GenreCards({ selectedGenre, onSelect }: GenreCardsProps) {
  return (
    <section>
      <h3 className="mb-1 text-lg font-bold text-[#181D27] dark:text-white">
        장르별 이미지 생성
      </h3>
      <p className="mb-4 text-sm text-[#535862] dark:text-[#94969C]">
        어떤 장르의 캐릭터를 만들고 싶으신가요?
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() =>
              onSelect(selectedGenre === genre.id ? null : genre.id)
            }
            className={`group relative aspect-[4/5] overflow-hidden rounded-xl transition-all ${
              selectedGenre === genre.id
                ? "ring-2 ring-[#41C7BD] ring-offset-2 dark:ring-offset-[#0C111D]"
                : "hover:scale-[1.02]"
            }`}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}66)`,
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
              <p className="text-sm font-bold text-white">
                {genre.label}{" "}
                <span className="text-xs font-normal text-white/70">
                  ({genre.sub})
                </span>
              </p>
            </div>
            {selectedGenre === genre.id && (
              <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#41C7BD] text-white shadow">
                <Check className="size-3.5" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
