/**
 * Point Balance Card
 *
 * 나의 냥젤리 잔액 표시 카드
 */

import { Link } from "react-router";

interface PointBalanceCardProps {
  currentBalance: number;
}

export default function PointBalanceCard({
  currentBalance,
}: PointBalanceCardProps) {
  return (
    <div className="bg-[#232323] border border-[#3f3f46] rounded-xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#9ca3af]">나의 냥젤리</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐱</span>
          <span className="text-2xl font-bold text-white">
            {currentBalance.toLocaleString()}개
          </span>
        </div>
      </div>
      <Link
        to="/dashboard/payments"
        className="text-sm text-[#14b8a6] hover:underline"
      >
        전액 내역 →
      </Link>
    </div>
  );
}
