/**
 * 제안 액션 칩
 * AI 응답 아래에 표시, 클릭 시 해당 텍스트를 다음 메시지로 전송
 */

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
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {displayActions.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="rounded-full border border-[#3f3f46] bg-[#232323] px-3 py-1.5 text-xs text-[#d1d5db] transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6] disabled:opacity-50"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
