/**
 * F4-3-2/3-3 우측 옵션 패널: 비율 + 개수 + 이미지 장르
 */
import { ASPECT_RATIOS, GENRES, IMAGE_COUNTS } from "../lib/constants";

interface OptionsPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  selectedGenre: string | null;
  onGenreChange: (genreId: string | null) => void;
  showGenre?: boolean;
}

function RatioIcon({
  ratio,
  selected,
}: {
  ratio: string;
  selected: boolean;
}) {
  const sizes: Record<string, { w: number; h: number }> = {
    "1:1": { w: 20, h: 20 },
    "4:3": { w: 24, h: 18 },
    "3:4": { w: 18, h: 24 },
    "16:9": { w: 28, h: 16 },
    "9:16": { w: 16, h: 28 },
  };
  const s = sizes[ratio] ?? sizes["1:1"];
  return (
    <div
      className={`rounded-sm border ${
        selected
          ? "border-[#41C7BD]"
          : "border-[#D5D7DA] dark:border-[#414651]"
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
  showGenre = true,
}: OptionsPanelProps) {
  return (
    <aside className="hidden w-[180px] shrink-0 border-l border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#0C111D] lg:block">
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
          이미지 비율
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onAspectRatioChange(ratio.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                aspectRatio === ratio.id
                  ? "border-[#41C7BD] bg-[#41C7BD]/10 text-[#41C7BD]"
                  : "border-[#E9EAEB] text-[#535862] hover:border-[#D5D7DA] dark:border-[#333741] dark:text-[#94969C] dark:hover:border-[#414651]"
              }`}
            >
              <RatioIcon ratio={ratio.id} selected={aspectRatio === ratio.id} />
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
          이미지 개수
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {IMAGE_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onImageCountChange(count)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                imageCount === count
                  ? "border-[#41C7BD] bg-[#41C7BD] text-white"
                  : "border-[#E9EAEB] text-[#535862] hover:border-[#D5D7DA] dark:border-[#333741] dark:text-[#94969C] dark:hover:border-[#414651]"
              }`}
            >
              {count}개
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 장르 (신규 탭에서만) */}
      {showGenre && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
            이미지 장르
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() =>
                onGenreChange(selectedGenre === genre.id ? null : genre.id)
              }
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`size-9 overflow-hidden rounded-lg ${
                  selectedGenre === genre.id ? "ring-2 ring-[#41C7BD]" : ""
                }`}
                style={{
                  background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}66)`,
                }}
              />
              <span
                className={`text-[10px] ${
                  selectedGenre === genre.id
                    ? "font-semibold text-[#41C7BD]"
                    : "text-[#535862] dark:text-[#94969C]"
                }`}
              >
                {genre.label.replace(/\/.*/, "")}
              </span>
            </button>
          ))}
        </div>
        </div>
      )}
    </aside>
  );
}
