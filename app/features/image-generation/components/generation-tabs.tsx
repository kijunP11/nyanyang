/**
 * F4-3-2 상단 탭: 신규 캐릭터 생성 / 기존 캐릭터 수정
 */
interface GenerationTabsProps {
  activeTab: "new" | "edit";
  onTabChange: (tab: "new" | "edit") => void;
}

export function GenerationTabs({ activeTab, onTabChange }: GenerationTabsProps) {
  return (
    <div className="flex h-[60px] border-b border-[#cbd5e1] bg-[#fdfdfd] px-[20px] dark:border-[#333741] dark:bg-[#0C111D]">
      <button
        type="button"
        onClick={() => onTabChange("new")}
        className={`flex h-[54px] items-center justify-center px-[20px] text-[16px] font-semibold leading-[24px] transition-colors ${
          activeTab === "new"
            ? "border-b-2 border-[#535862] text-[#535862] dark:border-white dark:text-white"
            : "text-[#535862] hover:text-[#414651] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        신규 캐릭터 생성
      </button>
      <button
        type="button"
        onClick={() => onTabChange("edit")}
        className={`flex h-[54px] items-center justify-center px-[20px] text-[16px] font-semibold leading-[24px] transition-colors ${
          activeTab === "edit"
            ? "border-b-2 border-[#535862] text-[#535862] dark:border-white dark:text-white"
            : "text-[#535862] hover:text-[#414651] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        기존 캐릭터 수정
      </button>
    </div>
  );
}
