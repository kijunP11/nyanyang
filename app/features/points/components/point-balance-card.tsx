/**
 * Point Balance Card
 *
 * 내가 보유한 냥젤리 잔액 표시 (F8 라이트 테마)
 */

import { PawPrint } from "lucide-react";

interface PointBalanceCardProps {
  currentBalance: number;
}

export default function PointBalanceCard({
  currentBalance,
}: PointBalanceCardProps) {
  return (
    <div className="rounded-lg border border-[#D5D7DA] bg-[#F5F5F5] p-[14px]">
      <p className="text-xs text-black">내가 보유한 냥젤리</p>
      <div className="flex items-center gap-1">
        <PawPrint className="size-6 text-[#F5A3C7]" />
        <span className="text-xl font-semibold text-black">
          {currentBalance.toLocaleString()}개
        </span>
      </div>
    </div>
  );
}
