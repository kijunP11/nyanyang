/**
 * 뱃지 아이콘: icon_url 있으면 img, 없으면 카테고리별 이모지
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
  size = 48,
  inactive = false,
  className = "",
}: BadgeIconProps) {
  const inactiveClass = inactive
    ? "grayscale opacity-50"
    : "";

  if (iconUrl?.trim()) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${inactiveClass} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#E9EAEB] text-2xl dark:bg-[#333741] ${inactiveClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {CATEGORY_EMOJI[category] ?? "🏅"}
    </div>
  );
}
