/**
 * 요약 버튼: 채팅 메시지 사이에 인라인으로 표시
 */
import { FileText } from "lucide-react";

interface SummaryButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function SummaryButton({ onClick, isLoading }: SummaryButtonProps) {
  return (
    <div className="flex justify-center py-2">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-full border border-[#3f3f46] bg-[#232323] px-4 py-2 text-xs text-[#9ca3af] transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6] disabled:opacity-50"
      >
        <FileText className="h-3.5 w-3.5" />
        {isLoading ? "요약 중..." : "최근 대화 요약하기"}
      </button>
    </div>
  );
}
