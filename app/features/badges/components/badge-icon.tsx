/**
 * 뱃지 아이콘
 *
 * - active (claimable/earned): 원형 뱃지 아이콘 (icon_url)
 * - inactive (locked): 정사각형 씬 일러스트 (icon_url → "-locked" 파생)
 * - 폴백: 카테고리별 이모지
 */
import type { BadgeCategory } from "../types";

const CATEGORY_EMOJI: Record<BadgeCategory, string> = {
  followers: "👥",
  likes: "❤️",
  conversations: "💬",
  onboarding: "🐱",
  engagement: "💕",
  hidden: "🌙",
};

/** /badges/followers-lv1.png → /badges/followers-lv1-locked.png */
function toLockedUrl(iconUrl: string): string {
  return iconUrl.replace(/\.png$/, "-locked.png");
}

interface BadgeIconProps {
  iconUrl: string | null;
  category: BadgeCategory;
  name: string;
  size?: number;
  inactive?: boolean;
  className?: string;
}

export function BadgeIcon({
  iconUrl,
  category,
  name,
  size = 60,
  inactive = false,
  className = "",
}: BadgeIconProps) {
  if (iconUrl?.trim()) {
    // locked → 정사각형 씬 일러스트
    if (inactive) {
      return (
        <img
          src={toLockedUrl(iconUrl)}
          alt={name}
          className={`shrink-0 rounded-[2px] object-cover ${className}`}
          style={{ width: size, height: size }}
        />
      );
    }

    // active → 원형 뱃지 아이콘
    return (
      <img
        src={iconUrl}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 폴백 (icon_url 없는 뱃지)
  const inactiveClass = inactive
    ? "[mix-blend-mode:luminosity] opacity-70"
    : "";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#E9EAEB] text-2xl dark:bg-[#333741] ${inactiveClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {CATEGORY_EMOJI[category] ?? "🏅"}
    </div>
  );
}
