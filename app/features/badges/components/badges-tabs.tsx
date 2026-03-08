/**
 * 뱃지 페이지 탭바: 리워드 미션 / 수집한 뱃지
 */
interface BadgesTabsProps {
  activeTab: "missions" | "badges";
  onTabChange: (tab: "missions" | "badges") => void;
}

export function BadgesTabs({ activeTab, onTabChange }: BadgesTabsProps) {
  return (
    <div className="flex h-[60px] border-b border-[#cbd5e1] bg-[#fdfdfd] px-[20px] pt-[6px] dark:border-[#333741] dark:bg-[#0C111D]">
      <button
        type="button"
        onClick={() => onTabChange("missions")}
        className={`flex h-[54px] items-center justify-center px-[20px] text-[16px] font-semibold leading-[24px] transition-colors ${
          activeTab === "missions"
            ? "border-b-2 border-[#535862] text-[#535862] dark:border-white dark:text-white"
            : "text-[#535862] hover:text-[#414651] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        리워드 미션
      </button>
      <button
        type="button"
        onClick={() => onTabChange("badges")}
        className={`flex h-[54px] items-center justify-center px-[20px] text-[16px] font-semibold leading-[24px] transition-colors ${
          activeTab === "badges"
            ? "border-b-2 border-[#535862] text-[#535862] dark:border-white dark:text-white"
            : "text-[#535862] hover:text-[#414651] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        수집한 뱃지
      </button>
    </div>
  );
}
