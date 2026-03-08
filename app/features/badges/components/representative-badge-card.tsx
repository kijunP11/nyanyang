/**
 * 대표 뱃지 카드: 설정됨(200px 컨테이너에 중앙 배치) / 빈 상태(마스코트+문구)
 * Figma 픽셀 퍼펙트
 */
import type { BadgeDefinition } from "../types";

interface RepresentativeBadgeCardProps {
  representativeBadge: { definition: BadgeDefinition } | null;
  onUnsetClick: () => void;
}

export function RepresentativeBadgeCard({
  representativeBadge,
  onUnsetClick,
}: RepresentativeBadgeCardProps) {
  return (
    <section>
      <div className="flex flex-col gap-[6px]">
        <h2 className="text-[20px] font-bold leading-[30px] text-[#414651] dark:text-white">
          대표 뱃지
        </h2>
        <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
          나를 대표할 뱃지를 설정해보세요!
        </p>
      </div>

      {representativeBadge ? (
        <button
          type="button"
          onClick={onUnsetClick}
          className="relative mt-[20px] flex h-[200px] w-full items-center justify-center rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] transition-colors hover:bg-[#EEEEEE] dark:border-[#333741] dark:bg-[#1F242F] dark:hover:bg-[#333741]"
        >
          <div className="flex w-[147px] flex-col items-center gap-[10px]">
            <img
              src={representativeBadge.definition.icon_url ?? ""}
              alt={representativeBadge.definition.name}
              className="size-[80px] shrink-0 rounded-[2px] object-cover"
            />
            <div className="flex w-full flex-col items-center gap-[4px] text-[#717680] dark:text-[#94969C]">
              <p className="min-w-full text-center text-[16px] font-bold leading-[24px]">
                {representativeBadge.definition.level
                  ? `${representativeBadge.definition.level} ${representativeBadge.definition.name}`
                  : representativeBadge.definition.name}
              </p>
              <p className="text-center text-[14px] leading-[20px]">
                {representativeBadge.definition.is_hidden
                  ? "비밀 조건이에요"
                  : representativeBadge.definition.description}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="relative mt-[20px] h-[200px] rounded-[8px] border border-[#d5d7da] bg-[#f5f5f5] dark:border-[#333741] dark:bg-[#1F242F]">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-의문.png"
            alt="마스코트"
            className="absolute left-1/2 top-[30px] size-[100px] -translate-x-1/2 object-contain"
          />
          <p className="absolute left-1/2 top-[147px] -translate-x-1/2 whitespace-nowrap text-[14px] font-bold leading-[20px] text-[#414651] dark:text-[#D5D7DA]">
            나를 대표할 뱃지를 설정해보세요!
          </p>
        </div>
      )}
    </section>
  );
}
