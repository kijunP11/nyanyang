/**
 * 카테고리별 뱃지 그룹: 헤더 + 뱃지 카드 목록
 */
import type { BadgeDefinition, BadgeStatus } from "../types";
import { BadgeCard } from "./badge-card";

export interface BadgeWithStatus {
  definition: BadgeDefinition;
  status: BadgeStatus;
}

interface BadgeCategoryGroupProps {
  categoryLabel: string;
  badges: BadgeWithStatus[];
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
  claimingBadgeId?: number | null;
}

export function BadgeCategoryGroup({
  categoryLabel,
  badges,
  onClaim,
  onSetRepresentative,
  claimingBadgeId = null,
}: BadgeCategoryGroupProps) {
  if (badges.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-[#181D27] dark:text-white">
        {categoryLabel}
      </h2>
      <div className="border-t border-[#E9EAEB] pt-3 dark:border-[#333741]">
        <div className="flex flex-col gap-3">
          {badges.map(({ definition, status }) => (
            <BadgeCard
              key={definition.badge_id}
              definition={definition}
              status={status}
              onClaim={onClaim}
              onSetRepresentative={onSetRepresentative}
              isClaiming={claimingBadgeId === definition.badge_id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
