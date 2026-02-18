import type { BadgeCategory } from "../types";

export type { BadgeCategory } from "../types";

export const BADGE_CATEGORIES: { key: BadgeCategory; label: string }[] = [
  { key: "followers", label: "팔로워" },
  { key: "likes", label: "좋아요" },
  { key: "conversations", label: "대화" },
  { key: "onboarding", label: "입문" },
  { key: "engagement", label: "몰입" },
  { key: "hidden", label: "히든" },
];
