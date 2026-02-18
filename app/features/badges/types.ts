export type BadgeCategory =
  | "followers"
  | "likes"
  | "conversations"
  | "onboarding"
  | "engagement"
  | "hidden";

export interface BadgeDefinition {
  badge_id: number;
  category: BadgeCategory;
  name: string;
  level: string | null;
  description: string;
  metric_type: string;
  threshold: number | null;
  icon_url: string | null;
  sort_order: number;
  is_hidden: boolean;
  reward_points: number;
}

export interface UserBadge {
  user_badge_id: number;
  user_id: string;
  badge_id: number;
  claimed_at: string;
  is_representative: boolean;
}

export type BadgeStatus =
  | "locked"
  | "claimable"
  | "earned"
  | "representative";
