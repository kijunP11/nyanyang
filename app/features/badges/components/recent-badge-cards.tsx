/**
 * 최근 달성 뱃지: 가로 스크롤 카드 / 빈 상태
 */
import type { BadgeDefinition } from "../types";
import { BadgeIcon } from "./badge-icon";
import { Trophy } from "lucide-react";

interface RecentBadgeCardsProps {
  recentBadges: Array<{
    definition: BadgeDefinition;
    claimed_at: string;
  }>;
}

export function RecentBadgeCards({ recentBadges }: RecentBadgeCardsProps) {
  if (recentBadges.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-[#181D27] dark:text-white">
          최근 달성 뱃지
        </h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#E9EAEB] bg-[#FAFAFA] py-12 dark:border-[#333741] dark:bg-[#181D27]">
          <div className="flex size-20 items-center justify-center rounded-full bg-[#E9EAEB] dark:bg-[#333741]">
            <Trophy className="size-10 text-[#535862] dark:text-[#94969C]" />
          </div>
          <p className="text-center text-sm font-medium text-[#535862] dark:text-[#94969C]">
            아직 얻은 뱃지가 없어요
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-[#181D27] dark:text-white">
        최근 달성 뱃지
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recentBadges.map(({ definition }) => (
          <div
            key={definition.badge_id}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl bg-gradient-to-br from-[#00c4af]/10 to-[#00c4af]/5 p-4"
          >
            <BadgeIcon
              iconUrl={definition.icon_url}
              category={definition.category}
              name={definition.name}
              size={48}
            />
            <p className="max-w-[100px] truncate text-center text-sm font-semibold text-[#181D27] dark:text-white">
              {definition.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
