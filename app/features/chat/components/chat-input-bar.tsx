/**
 * 채팅 입력 바 — Figma 픽셀 퍼펙트 (906:16273)
 * 세로 2줄: textarea + 액션 row (zap, 지문, 대사, send)
 */
import { useState, useRef, useEffect } from "react";

/* ── Figma 인라인 SVG (Untitled UI) ── */

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5V19M5 12H19"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 15 16.5001" fill="none">
      <path
        d="M8.25001 0.750042L0.750009 9.75004H7.50001L6.75001 15.75L14.25 6.75004H7.50001L8.25001 0.750042Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18.3334 18.3334" fill="none">
      <path
        d="M17.5 0.833357L8.33334 10M17.5 0.833357L11.6667 17.5L8.33334 10M17.5 0.833357L0.833338 6.66669L8.33334 10"
        stroke="white"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Types ── */

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    onSend(inputValue.trim());
    setInputValue("");
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  return (
    <div className="bg-white px-[24px] pb-[24px] pt-[16px]">
      <div className="flex flex-col gap-[16px] overflow-hidden rounded-[8px] border border-[#a4a7ae] bg-white px-[14px] py-[16px]">
        {/* 텍스트 영역 */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder='*손을 흔들며 밝게 인사한다* "안녕!"'
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent text-[16px] leading-[24px] text-[#181d27] outline-none placeholder:text-[#717680] disabled:opacity-50"
        />

        {/* 액션 row */}
        <div className="flex items-center gap-[8px]">
          {/* + Plus 버튼 */}
          <button
            type="button"
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#36c4b3] transition-opacity hover:opacity-80"
          >
            <PlusIcon />
          </button>

          {/* ⚡ Zap 버튼 */}
          <button
            type="button"
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#717680] transition-opacity hover:opacity-80"
          >
            <ZapIcon />
          </button>

          {/* *지문* pill */}
          <button
            type="button"
            onClick={() => setInputValue((prev) => prev + "*지문*")}
            className="flex h-[36px] items-center justify-center rounded-[20px] border border-[#d5d7da] bg-[#f5f5f5] px-[16px] py-[8px] text-[14px] leading-[20px] text-[#717680] transition-colors hover:bg-[#e9eaeb]"
          >
            *지문*
          </button>

          {/* "대사" pill */}
          <button
            type="button"
            onClick={() => setInputValue((prev) => prev + '"대사"')}
            className="flex h-[36px] items-center justify-center rounded-[20px] border border-[#d5d7da] bg-[#f5f5f5] px-[16px] py-[8px] text-[14px] leading-[20px] text-[#717680] transition-colors hover:bg-[#e9eaeb]"
          >
            "대사"
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Send 버튼 */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || disabled}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#36c4b3] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
