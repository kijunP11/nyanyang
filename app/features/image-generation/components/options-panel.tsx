/**
 * F4-3-2/3-3 우측 옵션 패널: 비율 + 개수 + 장르
 */
import { ASPECT_RATIOS, GENRES, IMAGE_COUNTS } from "../lib/constants";

interface OptionsPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  selectedGenre: string | null;
  onGenreChange: (genreId: string | null) => void;
}

function RatioIcon({
  ratio,
  selected,
}: {
  ratio: string;
  selected: boolean;
}) {
  const sizes: Record<string, { w: number; h: number }> = {
    "1:1": { w: 12, h: 12 },
    "4:3": { w: 16, h: 12 },
    "3:4": { w: 12, h: 16 },
    "16:9": { w: 22, h: 12 },
    "9:16": { w: 13, h: 20 },
  };
  const s = sizes[ratio] ?? sizes["1:1"];
  return (
    <div
      className={`border ${
        selected
          ? "border-[#e277be]"
          : "border-[#a4a7ae]"
      }`}
      style={{ width: s.w, height: s.h }}
    />
  );
}

export function OptionsPanel({
  aspectRatio,
  onAspectRatioChange,
  imageCount,
  onImageCountChange,
  selectedGenre,
  onGenreChange,
}: OptionsPanelProps) {
  const firstRow = GENRES.slice(0, 4);
  const secondRow = GENRES.slice(4, 8);

  return (
    <aside className="hidden w-[260px] shrink-0 border-l border-[#e2e8f0] bg-[#fdfdfd] dark:border-[#333741] dark:bg-[#0C111D] lg:block">
      {/* 이미지 비율 */}
      <div className="px-[16px] py-[20px]">
        <h4 className="mb-[16px] text-[14px] font-bold leading-[21px] text-black dark:text-white">
          이미지 비율
        </h4>
        <div className="flex gap-[4px]">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onAspectRatioChange(ratio.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-[10px] rounded-[4px] px-[10px] py-[8px] transition-colors ${
                aspectRatio === ratio.id
                  ? "border border-[#ee46bc] bg-[#fdf2fa]"
                  : "bg-[#f5f5f5] dark:bg-[#1F242F]"
              }`}
            >
              <div className="flex size-[24px] items-center justify-center">
                <RatioIcon ratio={ratio.id} selected={aspectRatio === ratio.id} />
              </div>
              <span className="text-[12px] leading-[18px] text-black dark:text-white">
                {ratio.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 개수 */}
      <div className="border-t border-[#e9eaeb] px-[16px] py-[20px] dark:border-[#333741]">
        <h4 className="mb-[16px] text-[14px] font-bold leading-[21px] text-black dark:text-white">
          이미지 개수
        </h4>
        <div className="flex gap-[4px]">
          {IMAGE_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onImageCountChange(count)}
              className={`flex flex-1 items-center justify-center rounded-[4px] px-[10px] py-[8px] text-[12px] leading-[18px] transition-colors ${
                imageCount === count
                  ? "border border-[#ee46bc] bg-[#fce7f6] text-black dark:text-white"
                  : "bg-[#f5f5f5] text-black dark:bg-[#1F242F] dark:text-white"
              }`}
            >
              {count}개
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 장르 */}
      <div className="border-t border-[#e9eaeb] px-[16px] py-[20px] dark:border-[#333741]">
        <h4 className="mb-[16px] text-[14px] font-bold leading-[21px] text-black dark:text-white">
          이미지 장르
        </h4>
        <div className="flex flex-col gap-[4px]">
          {[firstRow, secondRow].map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-col gap-[4px]">
              <div className="flex gap-[5px]">
                {row.map((genre) => {
                  const isSelected = selectedGenre === genre.id;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() =>
                        onGenreChange(isSelected ? null : genre.id)
                      }
                      className={`relative h-[54px] flex-1 overflow-hidden rounded-[4px] ${
                        isSelected
                          ? "border border-[#ee46bc]"
                          : ""
                      }`}
                    >
                      <img
                        src={genre.image}
                        alt={genre.label}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-[5px]">
                {row.map((genre) => (
                  <span
                    key={genre.id}
                    className="flex-1 text-center text-[12px] leading-[18px] text-black dark:text-white"
                  >
                    {genre.label.split("/")[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
