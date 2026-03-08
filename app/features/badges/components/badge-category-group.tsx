/**
 * 카테고리별 뱃지 그룹: 카테고리 헤더 + 카드 목록
 * 그룹 간 divider는 부모에서 관리
 */
import type { BadgeCategory, BadgeDefinition, BadgeStatus } from "../types";
import { BadgeCard } from "./badge-card";

export interface BadgeWithStatus {
  definition: BadgeDefinition;
  status: BadgeStatus;
}

const CATEGORY_LABELS: Record<string, string> = {
  followers: "팔로워",
  likes: "좋아요",
  conversations: "대화",
};

interface BadgeCategoryGroupProps {
  categoryKey: BadgeCategory;
  badges: BadgeWithStatus[];
  onClaim: (badgeId: number) => void;
  onSetRepresentative: (badgeId: number) => void;
  claimingBadgeId?: number | null;
}

export function BadgeCategoryGroup({
  categoryKey,
  badges,
  onClaim,
  onSetRepresentative,
  claimingBadgeId = null,
}: BadgeCategoryGroupProps) {
  if (badges.length === 0) return null;

  const label = CATEGORY_LABELS[categoryKey] ?? categoryKey;

  return (
    <div className="flex flex-col gap-[20px]">
      <h3 className="text-[18px] font-bold leading-[28px] text-[#414651] dark:text-white">
        {label}
      </h3>
      <div className="flex flex-col gap-[20px]">
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
  );
}
