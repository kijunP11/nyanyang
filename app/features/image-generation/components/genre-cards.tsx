/**
 * F4-3-2/3-3 장르별 이미지 선택 카드 (8개, 실제 캐릭터 이미지 + 선택 시 체크 아이콘)
 */
import { GENRES } from "../lib/constants";

interface GenreCardsProps {
  selectedGenre: string | null;
  onSelect: (genreId: string | null) => void;
}

export function GenreCards({ selectedGenre, onSelect }: GenreCardsProps) {
  return (
    <section>
      <div className="mb-[16px] flex flex-col gap-[6px]">
        <h3 className="text-[20px] font-bold leading-[30px] text-[#414651] dark:text-white">
          장르별 이미지 생성
        </h3>
        <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
          어떤 장르의 캐릭터를 만들고 싶으신가요?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-[8px] gap-y-[20px] sm:grid-cols-4">
        {GENRES.map((genre) => {
          const isSelected = selectedGenre === genre.id;
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() =>
                onSelect(isSelected ? null : genre.id)
              }
              className={`group relative h-[248px] overflow-hidden rounded-[8px] transition-all ${
                isSelected
                  ? "border-2 border-[#ee46bc]"
                  : "hover:scale-[1.02]"
              }`}
            >
              <img
                src={genre.image}
                alt={genre.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-[74px] bg-gradient-to-b from-transparent to-black" />
              <div className={`absolute flex items-end gap-[2px] text-white ${
                isSelected
                  ? "bottom-[12px] left-[12px]"
                  : "bottom-[14px] left-[14px]"
              }`}>
                <span className="text-[16px] font-bold leading-[24px]">
                  {genre.label}
                </span>
                <span className="text-[12px] leading-[18px]">
                  ({genre.sub})
                </span>
              </div>
              {isSelected && (
                <div className="absolute right-[16px] top-[12px] flex size-[32px] items-center justify-center rounded-[16px] bg-[#ee46bc]">
                  <img src="/icons/check.svg" alt="" className="size-[16px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
