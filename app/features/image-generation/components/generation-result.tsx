/**
 * F4-3-3 로딩 플레이스홀더 + 생성 결과 이미지 그리드
 */
import { Loader2 } from "lucide-react";

interface GenerationResultProps {
  isGenerating: boolean;
  imageCount: number;
  generatedImages: { id: string; data: string }[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
}

export function GenerationResult({
  isGenerating,
  imageCount,
  generatedImages,
  selectedImageId,
  onSelectImage,
}: GenerationResultProps) {
  if (!isGenerating && generatedImages.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3">
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
            className={`cursor-pointer overflow-hidden rounded-xl transition-all ${
              selectedImageId === img.id
                ? "ring-2 ring-[#41C7BD] ring-offset-2 dark:ring-offset-[#0C111D]"
                : "hover:opacity-90"
            }`}
          >
            <img
              src={`data:image/png;base64,${img.data}`}
              alt="생성된 이미지"
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}

        {isGenerating &&
          Array.from({ length: imageCount }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="flex aspect-square items-center justify-center rounded-xl bg-[#F5F5F5] dark:bg-[#1F242F]"
            >
              <Loader2 className="size-8 animate-spin text-[#A4A7AE] dark:text-[#717680]" />
            </div>
          ))}
      </div>
    </div>
  );
}
