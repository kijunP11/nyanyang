/**
 * F4-3-2 상단 탭: 신규 캐릭터 생성 / 기존 캐릭터 수정
 */
interface GenerationTabsProps {
  activeTab: "new" | "edit";
  onTabChange: (tab: "new" | "edit") => void;
}

export function GenerationTabs({ activeTab, onTabChange }: GenerationTabsProps) {
  return (
    <div className="mb-6 flex border-b border-[#E9EAEB] dark:border-[#333741]">
      <button
        type="button"
        onClick={() => onTabChange("new")}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${
          activeTab === "new"
            ? "border-b-2 border-[#181D27] text-[#181D27] dark:border-white dark:text-white"
            : "text-[#A4A7AE] hover:text-[#535862] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        신규 캐릭터 생성
      </button>
      <button
        type="button"
        onClick={() => onTabChange("edit")}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${
          activeTab === "edit"
            ? "border-b-2 border-[#181D27] text-[#181D27] dark:border-white dark:text-white"
            : "text-[#A4A7AE] hover:text-[#535862] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        기존 캐릭터 수정
      </button>
    </div>
  );
}
