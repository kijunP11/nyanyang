/**
 * 뱃지 카드: 아이콘 + 이름/설명 + [받기] + [대표 뱃지로 설정] 버튼
 *
 * 3가지 상태:
 * - locked: 아이콘 회색, 두 버튼 모두 disabled (회색)
 * - claimable: 아이콘 컬러, [받기] 틸, [대표 뱃지로 설정] 활성 스타일
 * - earned/representative: 아이콘 컬러, [받기] disabled, [대표 뱃지로 설정] 활성
 */
import type { BadgeDefinition, BadgeStatus } from "../types";
import { BadgeIcon } from "./badge-icon";

interface BadgeCardProps {
  definition: BadgeDefinition;
  status: BadgeStatus;
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
  isClaiming?: boolean;
}

export function BadgeCard({
  definition,
  status,
  onClaim,
  onSetRepresentative,
  isClaiming = false,
}: BadgeCardProps) {
  const isLocked = status === "locked";
  const isClaimable = status === "claimable";
  const isEarned = status === "earned" || status === "representative";

  const description = definition.is_hidden
    ? "비밀 조건이에요"
    : definition.description;

  return (
    <div className="flex items-center gap-[20px] overflow-clip rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[16px] dark:border-[#333741] dark:bg-[#1F242F]">
      <BadgeIcon
        iconUrl={definition.icon_url}
        category={definition.category}
        name={definition.name}
        size={60}
        inactive={isLocked}
      />

      <div className="flex min-w-0 flex-1 items-center gap-[16px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[4px] justify-center">
          <p className="text-[16px] font-bold leading-[24px] text-[#717680] dark:text-[#94969C]">
            {definition.level ? `${definition.level} ${definition.name}` : definition.name}
          </p>
          <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-[16px]">
          {/* 받기 button */}
          {isClaimable ? (
            <button
              type="button"
              onClick={() => onClaim(definition.badge_id)}
              disabled={isClaiming}
              className="rounded-[8px] bg-[#00c4af] px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#00b39e] disabled:opacity-50"
            >
              {isClaiming ? "받는 중..." : "받기"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-[8px] border border-[#e9eaeb] bg-[#e9eaeb] px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#a4a7ae] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#333741] dark:text-[#717680]"
            >
              받기
            </button>
          )}

          {/* 대표 뱃지로 설정 button */}
          {isClaimable || isEarned ? (
            <button
              type="button"
              onClick={() => onSetRepresentative(definition.badge_id)}
              className="whitespace-nowrap rounded-[8px] border border-[#d5d7da] bg-white px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
            >
              {status === "representative" ? "대표 뱃지" : "대표 뱃지로 설정"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="whitespace-nowrap rounded-[8px] border border-[#e9eaeb] bg-white px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#d5d7da] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#717680]"
            >
              대표 뱃지로 설정
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
