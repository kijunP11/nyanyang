/**
 * 젤리 잔액 표시 배지
 *
 * 헤더 우측에 표시. 잔액에 따라 색상이 변한다.
 * - 정상: 민트
 * - 낮음(< 1000): 주황
 * - 소진(0): 빨강
 */
interface JellyDisplayProps {
  balance: number;
  isLow: boolean;
  isDepleted: boolean;
  onClick?: () => void;
}

export function JellyDisplay({
  balance,
  isLow,
  isDepleted,
  onClick,
}: JellyDisplayProps) {
  const colorClass = isDepleted
    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    : isLow
      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-[#E0F7F5] text-[#00897B] dark:bg-[#00c4af]/10 dark:text-[#00c4af]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${colorClass}`}
    >
      <span>🍬</span>
      <span>{balance.toLocaleString()}</span>
    </button>
  );
}
