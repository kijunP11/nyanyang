/**
 * F4-3-3 로딩 플레이스홀더 + 생성 결과 이미지 그리드
 */

interface GenerationResultProps {
  isGenerating: boolean;
  imageCount: number;
  generatedImages: { id: string; data: string }[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
}

function PlaceholderIcon() {
  return (
    <div className="flex size-[40px] items-center justify-center rounded-full bg-white/80 dark:bg-[#333741]/80">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.75 3.75h-3.5C4.56 3.75 4 4.31 4 5v3.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5c0-.69-.56-1.25-1.25-1.25ZM15.25 3.75h-3.5c-.69 0-1.25.56-1.25 1.25v3.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5c0-.69-.56-1.25-1.25-1.25ZM8.75 10.25h-3.5c-.69 0-1.25.56-1.25 1.25v3.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25v-3.5c0-.69-.56-1.25-1.25-1.25ZM15.25 10.25h-3.5c-.69 0-1.25.56-1.25 1.25v3.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25v-3.5c0-.69-.56-1.25-1.25-1.25Z"
          stroke="#A4A7AE"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function GenerationResult({
  isGenerating,
  imageCount,
  generatedImages,
  selectedImageId,
  onSelectImage,
}: GenerationResultProps) {
  const showPlaceholders =
    generatedImages.length === 0 && !isGenerating;
  const placeholderCount = showPlaceholders ? imageCount : 0;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-[12px]">
        {generatedImages.map((img) => (
          <div
            key={img.id}
            id={`gen-img-${img.id}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectImage(img.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectImage(img.id);
            }}
            className={`cursor-pointer overflow-hidden rounded-[4px] transition-all ${
              selectedImageId === img.id
                ? "ring-2 ring-[#36c4b3] ring-offset-2 dark:ring-offset-[#0C111D]"
                : "hover:opacity-90"
            }`}
          >
            <img
              src={`data:image/png;base64,${img.data}`}
              alt="생성된 이미지"
              className="aspect-square w-full rounded-[4px] object-cover"
            />
          </div>
        ))}

        {isGenerating &&
          Array.from({ length: imageCount }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="flex aspect-square items-center justify-center rounded-[4px] bg-[#F5F5F5] dark:bg-[#1F242F]"
            >
              <PlaceholderIcon />
            </div>
          ))}

        {placeholderCount > 0 &&
          Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="flex aspect-square items-center justify-center rounded-[4px] bg-[#F5F5F5] dark:bg-[#1F242F]"
            >
              <PlaceholderIcon />
            </div>
          ))}
      </div>
    </div>
  );
}
