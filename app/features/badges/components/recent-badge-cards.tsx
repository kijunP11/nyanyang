/**
 * 최근 달성 뱃지: 그라디언트 카드 / 빈 상태 (마스코트)
 * Figma 픽셀 퍼펙트
 */
import type { BadgeDefinition } from "../types";

interface RecentBadgeCardsProps {
  recentBadges: Array<{
    definition: BadgeDefinition;
    claimed_at: string;
  }>;
}

export function RecentBadgeCards({ recentBadges }: RecentBadgeCardsProps) {
  if (recentBadges.length === 0) {
    return (
      <section>
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[20px] font-bold leading-[30px] text-[#414651] dark:text-white">
            최근 달성 뱃지
          </h2>
          <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
            도전해서 획득한 뱃지를 확인해보세요.
          </p>
        </div>
        <div className="relative mt-[20px] h-[200px] rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] dark:border-[#333741] dark:bg-[#1F242F]">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-의문.png"
            alt="마스코트"
            className="absolute left-1/2 top-[30px] size-[100px] -translate-x-1/2 object-contain"
          />
          <p className="absolute left-1/2 top-[144px] -translate-x-1/2 whitespace-nowrap text-[14px] font-bold leading-[20px] text-[#414651] dark:text-[#D5D7DA]">
            아직 얻은 뱃지가 없어요
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-[6px]">
        <h2 className="text-[20px] font-bold leading-[30px] text-[#414651] dark:text-white">
          최근 달성 뱃지
        </h2>
        <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
          도전해서 획득한 뱃지를 확인해보세요.
        </p>
      </div>
      <div className="mt-[20px] flex gap-[20px] overflow-x-auto">
        {recentBadges.map(({ definition }) => (
          <div
            key={definition.badge_id}
            className="flex w-[243px] shrink-0 flex-col rounded-[8px] border border-[#00c4af] p-[20px] dark:border-[#00c4af]"
            style={{
              backgroundImage:
                "linear-gradient(-79.75deg, rgba(0, 196, 175, 0.2) 5.1%, rgba(255, 109, 192, 0.2) 97.54%)",
            }}
          >
            <div className="flex w-full flex-col items-center gap-[10px]">
              <img
                src={definition.icon_url ?? ""}
                alt={definition.name}
                className="size-[80px] shrink-0 rounded-[2px] object-cover"
              />
              <div className="flex w-full flex-col items-center gap-[4px] text-center text-[#717680] dark:text-[#94969C]">
                <p className="w-full text-[16px] font-bold leading-[24px]">
                  {definition.level
                    ? `${definition.level} ${definition.name}`
                    : definition.name}
                </p>
                <p className="w-full text-[14px] leading-[20px]">
                  {definition.is_hidden
                    ? "비밀 조건이에요"
                    : definition.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
