/**
 * 요약 버튼 — Figma 픽셀 퍼펙트 (906:16273)
 * 채팅 메시지 사이에 인라인 pill 버튼
 */

function SummaryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="#36c4b3" strokeWidth="1.5" />
      <line x1="4.5" y1="5" x2="11.5" y2="5" stroke="#36c4b3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#36c4b3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.5" y1="11" x2="8.5" y2="11" stroke="#36c4b3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface SummaryButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function SummaryButton({ onClick, isLoading }: SummaryButtonProps) {
  return (
    <div className="flex justify-center py-[8px]">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex h-[36px] items-center gap-[8px] rounded-[20px] border border-[#d5d7da] bg-[#f5f5f5] px-[16px] py-[8px] transition-colors hover:bg-[#e9eaeb] disabled:opacity-50"
      >
        <SummaryIcon />
        <span className="text-[14px] leading-[20px] text-[#181d27]">
          {isLoading ? "요약 중..." : "최근 대화 요약하기"}
        </span>
      </button>
    </div>
  );
}
