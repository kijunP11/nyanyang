/**
 * 요약 블록 — Figma 픽셀 퍼펙트 (906:16273)
 * bg-[#f5f5f5] border rounded-8, 16px SemiBold
 */
import { useState } from "react";

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
  const preview = content.length > 200 ? content.substring(0, 200) + "..." : content;

  return (
    <div className="rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] p-[14px]">
      <div className="whitespace-pre-wrap text-[16px] font-semibold leading-[24px] text-[#181d27]">
        (요약) {expanded ? content : preview}
      </div>
      {content.length > 200 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-[8px] text-[14px] leading-[20px] text-[#717680] hover:underline"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
