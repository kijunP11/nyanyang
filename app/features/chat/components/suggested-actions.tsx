/**
 * 제안 액션 — Figma 픽셀 퍼펙트 (906:16274)
 * 오른쪽 정렬, 각 액션: zap 아이콘 (24px) + 버블 (rounded-tl/bl/br-8)
 * flex-col gap-[24px] items-end
 */

/* ── Figma 인라인 SVG (Untitled UI zap) ── */

function ZapSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 11.0001" fill="none">
      <path
        d="M5.50001 0.500028L0.500006 6.50003H5.00001L4.50001 10.5L9.50001 4.50003H5.00001L5.50001 0.500028Z"
        stroke="#717680"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SuggestedActionsProps {
  actions: string[];
  onSelect: (action: string) => void;
  disabled: boolean;
}

const DEFAULT_ACTIONS = ["계속", "다른 방향으로", "더 자세히"];

export function SuggestedActions({
  actions,
  onSelect,
  disabled,
}: SuggestedActionsProps) {
  const displayActions = actions.length > 0 ? actions : DEFAULT_ACTIONS;

  return (
    <div className="flex flex-col items-end gap-[24px]">
      {displayActions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="flex items-end gap-[8px] disabled:opacity-50"
        >
          {/* Zap 아이콘 */}
          <div className="flex size-[24px] shrink-0 items-center justify-center rounded-full border-[0.5px] border-[#d5d7da] bg-[#f5f5f5]">
            <ZapSmallIcon />
          </div>
          {/* 버블 */}
          <div className="rounded-tl-[8px] rounded-bl-[8px] rounded-br-[8px] border border-[#d5d7da] bg-[#f5f5f5] p-[14px] transition-colors hover:bg-[#e9eaeb]">
            <span className="text-[14px] leading-[20px] text-[#535862]">
              {action}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
