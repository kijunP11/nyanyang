/**
 * F4 기존 캐릭터 수정 — 프롬프트 입력 (업로드 버튼 + placeholder)
 */
import { useRef } from "react";
import { Upload } from "lucide-react";

import { MAX_PROMPT_LENGTH } from "../lib/constants";

interface EditPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onUploadImage: (file: File) => void;
  isGenerating: boolean;
  jellyCost: number;
  uploadedImagePreview: string | null;
  onClearUpload: () => void;
}

export function EditPromptInput({
  value,
  onChange,
  onGenerate,
  onUploadImage,
  isGenerating,
  jellyCost,
  uploadedImagePreview,
  onClearUpload,
}: EditPromptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 최대 5MB까지 가능합니다.");
      return;
    }
    onUploadImage(file);
    e.target.value = "";
  };

  const canGenerate = value.trim().length > 0 && !isGenerating;

  return (
    <div className="mb-8 rounded-xl border border-[#E9EAEB] p-5 dark:border-[#333741]">
      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))
        }
        placeholder="바꾸고 싶은 부분을 입력해주세요."
        className="min-h-[80px] w-full resize-none bg-transparent text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:outline-none dark:text-white dark:placeholder:text-[#717680]"
        rows={3}
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-[#E9EAEB] px-3 py-2 text-sm font-medium text-[#535862] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 dark:border-[#333741] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
          >
            <Upload className="size-4" />
            이미지 업로드 하기
          </button>
          {uploadedImagePreview && (
            <div className="relative inline-block">
              <img
                src={uploadedImagePreview}
                alt="업로드 미리보기"
                className="size-10 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={onClearUpload}
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                aria-label="업로드 이미지 제거"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 rounded-lg bg-[#41C7BD] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#38b5ab] disabled:cursor-not-allowed disabled:bg-[#E9EAEB] disabled:text-[#A4A7AE] dark:disabled:bg-[#333741] dark:disabled:text-[#717680]"
        >
          이미지 생성하기
          <span className="flex items-center gap-1">🐱 {jellyCost}</span>
        </button>
      </div>

      <div className="mt-2 text-right text-xs text-[#A4A7AE] dark:text-[#717680]">
        {value.length}/{MAX_PROMPT_LENGTH}
      </div>
    </div>
  );
}
