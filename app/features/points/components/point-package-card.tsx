/**
 * Point Package Card
 *
 * 포인트 상품 선택 카드 (라디오 선택)
 */

import type { PointPackage } from "../lib/packages";

interface PointPackageCardProps {
  pkg: PointPackage;
  selected: boolean;
  onSelect: () => void;
}

export default function PointPackageCard({
  pkg,
  selected,
  onSelect,
}: PointPackageCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-[#232323] rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? "border-2 border-[#14b8a6]"
          : "border border-[#3f3f46] hover:border-[#52525b]"
      }`}
    >
      {/* 추천 뱃지 */}
      {pkg.recommended && (
        <span className="absolute top-2 right-2 bg-[#14b8a6] text-white text-xs px-2 py-0.5 rounded">
          추천
        </span>
      )}

      {/* 라디오 아이콘 */}
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
            selected ? "border-[#14b8a6] bg-[#14b8a6]" : "border-[#3f3f46]"
          }`}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>

        <div className="flex-1">
          {/* 아이콘 + 포인트 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🐱</span>
            <span className="text-lg font-bold text-white">
              {pkg.points.toLocaleString()}개
            </span>
          </div>

          {/* 보너스 */}
          {pkg.bonusPoints > 0 && (
            <p className="text-xs text-[#14b8a6] mb-2">
              +{pkg.bonusPoints.toLocaleString()} 보너스
            </p>
          )}

          {/* 가격 */}
          <p className="text-[#14b8a6] font-semibold">
            {pkg.price.toLocaleString()}원
          </p>
        </div>
      </div>
    </div>
  );
}
