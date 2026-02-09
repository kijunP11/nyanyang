/**
 * Dashboard Layout Context Types
 *
 * Shared types for dashboard layout and child screens.
 */

import type { User } from "@supabase/supabase-js";

export interface DashboardProfile {
  profile_id: string;
  name: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  verified_at: Date | null;
}

export interface DashboardAttendance {
  checkedInToday: boolean;
  currentStreak: number;
}

export interface DashboardLayoutContext {
  user: User | null;
  profile: DashboardProfile | null;
  attendanceData: DashboardAttendance;
}

/**
 * Character data for grid card and modal
 */
export interface CharacterCardData {
  character_id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  avatar_url: string | null;
  tags: string[] | null;
  like_count: number;
  chat_count?: number;
  creator_id: string;
  creator_name?: string | null;
  gallery_urls?: string[] | unknown;
  is_liked?: boolean;
  is_following?: boolean;
}
