/**
 * 뱃지 도전 과제 카드: 아이콘 + 이름/설명 + 진행도 바 + 보상 + 버튼 (F8 리디자인)
 */
import { Check, PawPrint } from "lucide-react";

import type { BadgeProgress } from "../lib/badge-checker.server";
import type { BadgeDefinition, BadgeStatus } from "../types";
import { BadgeIcon } from "./badge-icon";

const DEFAULT_PROGRESS: BadgeProgress = {
  current: 0,
  target: 1,
  percentage: 0,
};

interface BadgeCardProps {
  definition: BadgeDefinition;
  status: BadgeStatus;
  progress?: BadgeProgress;
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
  isClaiming?: boolean;
}

export function BadgeCard({
  definition,
  status,
  progress = DEFAULT_PROGRESS,
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
    <div className="flex gap-3 rounded-lg border border-[#E9EAEB] p-4 dark:border-[#3f3f46]">
      <BadgeIcon
        iconUrl={definition.icon_url}
        category={definition.category}
        name={definition.name}
        size={48}
        inactive={isLocked}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-black dark:text-white">
              {definition.name}
              {definition.level && (
                <span className="ml-1 text-sm font-normal text-[#717680] dark:text-[#9ca3af]">
                  {definition.level}
                </span>
              )}
            </p>
          </div>
          {definition.reward_points > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#F5A3C7]">
              +{definition.reward_points.toLocaleString()}
              <PawPrint className="size-3.5" />
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm text-[#717680] dark:text-[#9ca3af]">{description}</p>

        {!isEarned && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-full bg-[#E9EAEB] h-2 dark:bg-[#3f3f46]">
              <div
                className="h-full rounded-full bg-[#00C4AF] transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-[#717680] dark:text-[#9ca3af]">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          {isClaimable && (
            <button
              type="button"
              onClick={() => onClaim(definition.badge_id)}
              disabled={isClaiming}
              className="rounded-lg bg-[#00C4AF] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
            >
              {isClaiming ? "받는 중..." : "받기"}
            </button>
          )}
          {isEarned && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-[#00C4AF]">
                <Check className="size-4" />
                달성 완료
              </span>
              <button
                type="button"
                onClick={() => onSetRepresentative(definition.badge_id)}
                className="rounded-lg border border-[#D5D7DA] bg-white px-3 py-1.5 text-xs font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-[#d1d5db] dark:hover:bg-[#3f3f46]"
              >
                {status === "representative"
                  ? "대표 뱃지"
                  : "대표로 설정"}
              </button>
            </div>
          )}
          {isLocked && !isClaimable && (
            <span className="text-xs text-[#A4A7AE] dark:text-[#6b7280]">미달성</span>
          )}
        </div>
      </div>
    </div>
  );
}
