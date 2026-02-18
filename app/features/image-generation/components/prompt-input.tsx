/**
 * F4-3-2 프롬프트 입력: textarea + 자동생성 버튼 + 이미지 생성하기(젤리 비용) + 글자수
 */
import { Sparkles } from "lucide-react";

import { MAX_PROMPT_LENGTH } from "../lib/constants";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onAutoGenerate: () => void;
  isGenerating: boolean;
  jellyCost: number;
}

export function PromptInput({
  value,
  onChange,
  onGenerate,
  onAutoGenerate,
  isGenerating,
  jellyCost,
}: PromptInputProps) {
  const canGenerate = value.trim().length > 0 && !isGenerating;

  return (
    <div className="mb-8 rounded-xl border border-[#E9EAEB] p-5 dark:border-[#333741]">
      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))
        }
        placeholder="만들고 싶은 이미지의 특징을 차례대로 적어주세요. (성별, 포즈, 얼굴, 표정, 자세, 구도, 의상, 배경 등)"
        className="min-h-[80px] w-full resize-none bg-transparent text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:outline-none dark:text-white dark:placeholder:text-[#717680]"
        rows={3}
      />

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-[#E9EAEB] px-3 py-2 text-sm font-medium text-[#535862] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 dark:border-[#333741] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
        >
          <Sparkles className="size-4" />
          프롬프트 자동생성
        </button>

        <div className="flex items-center gap-3">
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
      </div>

      <div className="mt-2 text-right text-xs text-[#A4A7AE] dark:text-[#717680]">
        {value.length}/{MAX_PROMPT_LENGTH}
      </div>
    </div>
  );
}
