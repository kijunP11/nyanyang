/**
 * 대표 뱃지 카드: 설정됨(아이콘+이름+클릭→해제 모달) / 빈 상태(일러스트+문구)
 * F8 라이트 테마 적용
 */
import { Award } from "lucide-react";

import type { BadgeDefinition } from "../types";
import { BadgeIcon } from "./badge-icon";

interface RepresentativeBadgeCardProps {
  representativeBadge: { definition: BadgeDefinition } | null;
  onUnsetClick: () => void;
}

export function RepresentativeBadgeCard({
  representativeBadge,
  onUnsetClick,
}: RepresentativeBadgeCardProps) {
  if (representativeBadge) {
    const { definition } = representativeBadge;
    return (
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-black dark:text-white">대표 뱃지</h2>
        <button
          type="button"
          onClick={onUnsetClick}
          className="flex w-full items-center gap-4 rounded-xl border border-[#D5D7DA] bg-[#F5F5F5] p-4 text-left transition-colors hover:bg-[#EEEEEE] dark:border-[#3f3f46] dark:bg-[#232323] dark:hover:bg-[#3f3f46]"
        >
          <BadgeIcon
            iconUrl={definition.icon_url}
            category={definition.category}
            name={definition.name}
            size={56}
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-black dark:text-white">
              {definition.name}
              {definition.level && (
                <span className="ml-1.5 text-sm font-normal text-[#717680] dark:text-[#9ca3af]">
                  {definition.level}
                </span>
              )}
            </p>
            <p className="text-sm text-[#717680] dark:text-[#9ca3af]">
              {definition.is_hidden
                ? "비밀 조건이에요"
                : definition.description}
            </p>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-black dark:text-white">대표 뱃지</h2>
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#D5D7DA] bg-[#F5F5F5] py-12 dark:border-[#3f3f46] dark:bg-[#232323]">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#E9EAEB] dark:bg-[#3f3f46]">
          <Award className="size-10 text-[#717680] dark:text-[#9ca3af]" />
        </div>
        <p className="text-center text-sm font-medium text-[#717680] dark:text-[#9ca3af]">
          나를 대표할 뱃지를 설정해보세요!
        </p>
      </div>
    </section>
  );
}
