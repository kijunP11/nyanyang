/**
 * 요약 블록: 채팅 중 인라인 요약 카드
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Trash2 } from "lucide-react";

interface SummaryBlockProps {
  content: string;
  messageRangeStart: number | null;
  messageRangeEnd: number | null;
  createdAt: string;
  onDelete?: () => void;
}

export function SummaryBlock({
  content,
  messageRangeStart,
  messageRangeEnd,
  createdAt,
  onDelete,
}: SummaryBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const preview = content.length > 150 ? content.substring(0, 150) + "..." : content;

  return (
    <div className="mx-4 my-3 rounded-lg border border-[#3f3f46]/50 bg-[#1a1a2e] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#14b8a6]" />
          <span className="text-xs font-semibold text-[#14b8a6]">대화 요약</span>
          {messageRangeStart != null && messageRangeEnd != null && (
            <span className="text-xs text-[#6b7280]">
              메시지 {messageRangeStart}-{messageRangeEnd}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1 text-[#6b7280] hover:text-red-400"
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-[#6b7280] hover:text-white"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[#d1d5db]">
        {expanded ? content : preview}
      </p>

      <p className="mt-2 text-xs text-[#6b7280]">
        {new Date(createdAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
