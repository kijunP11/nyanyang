/**
 * F4-3-2 프롬프트 입력: textarea + 자동생성 버튼 + 이미지 생성하기(젤리 비용) + 글자수
 */
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
    <div className="mb-8">
      <div className="rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[16px] dark:border-[#333741] dark:bg-[#0C111D]">
        <textarea
          value={value}
          onChange={(e) =>
            onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))
          }
          placeholder={"만들고 싶은 이미지의 특징을 차례대로 적어주세요.\n(성별, 포즈, 얼굴, 표정, 자세, 구도, 의상, 배경 등)"}
          className="min-h-[80px] w-full resize-none bg-transparent text-[16px] leading-[24px] text-[#181D27] placeholder:text-[#717680] focus:outline-none dark:text-white dark:placeholder:text-[#717680]"
          rows={3}
        />

        <div className="mt-[16px] flex items-center justify-between">
          <button
            type="button"
            onClick={onAutoGenerate}
            disabled={isGenerating}
            className="flex items-center gap-[8px] rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
          >
            <img src="/icons/sparkle.svg" alt="" className="size-[16px]" />
            프롬프트 자동생성
          </button>

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`flex items-center gap-[4px] rounded-[8px] px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors ${
              canGenerate
                ? "bg-[#00c4af] text-white hover:bg-[#00b3a0]"
                : "bg-[#e9eaeb] text-[#a4a7ae] dark:bg-[#333741] dark:text-[#717680]"
            }`}
          >
            이미지 생성하기
            <span className="flex items-center gap-[4px]">
              <img src="/icons/pawprint.svg" alt="" className="size-[16px]" />
              {jellyCost}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-[8px] text-right text-[14px] leading-[20px] text-[#535862] dark:text-[#94969C]">
        {value.length}/{MAX_PROMPT_LENGTH}
      </div>
    </div>
  );
}
