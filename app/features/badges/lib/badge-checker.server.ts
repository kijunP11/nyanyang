/**
 * 뱃지 조건 서버사이드 평가
 * 모든 메트릭을 병렬 조회 후 각 뱃지 조건 평가
 */
import { and, eq, gte, sql } from "drizzle-orm";
import drizzle from "~/core/db/drizzle-client.server";

import { chatRooms, messages, roomMemories } from "~/features/chat/schema";
import { attendanceRecords } from "~/features/attendance/schema";
import { characterLikes, characters } from "~/features/characters/schema";
import { profiles } from "~/features/users/schema";

import { badgeDefinitions } from "../schema";

export interface BadgeMetrics {
  followerCount: number;
  totalLikesReceived: number;
  totalConversations: number;
  firstLogin: boolean;
  profileSetup: boolean;
  characterCount: number;
  maxConsecutiveDays: number;
  totalAttendanceDays: number;
  maxRoomMessageCount: number;
  consecutive3Days: boolean;
  daily50Messages: boolean;
  likesGiven10: boolean;
  memories10: boolean;
  dailyUserMessageCount: number;
  likesGivenCount: number;
  memoriesCount: number;
  dawnAccess: boolean;
  longMessage: boolean;
  searchUsed: boolean;
  anniversary1Year: boolean;
}

async function getFollowerCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ follower_count: profiles.follower_count })
    .from(profiles)
    .where(eq(profiles.profile_id, userId))
    .limit(1);
  return row?.follower_count ?? 0;
}

async function getTotalLikesReceived(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({
      total: sql<number>`COALESCE(SUM(${characters.like_count}), 0)::int`,
    })
    .from(characters)
    .where(eq(characters.creator_id, userId));
  return Number(row?.total ?? 0);
}

async function getTotalConversations(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)::int` })
    .from(chatRooms)
    .where(eq(chatRooms.user_id, userId));
  return Number(row?.count ?? 0);
}

async function getProfileData(userId: string): Promise<{
  name: string | null;
  created_at: Date | null;
}> {
  const [row] = await drizzle
    .select({
      name: profiles.name,
      created_at: profiles.created_at,
    })
    .from(profiles)
    .where(eq(profiles.profile_id, userId))
    .limit(1);
  return {
    name: row?.name ?? null,
    created_at: row?.created_at ?? null,
  };
}

async function getCharacterCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)::int` })
    .from(characters)
    .where(eq(characters.creator_id, userId));
  return Number(row?.count ?? 0);
}

async function getAttendanceStats(
  userId: string
): Promise<{ maxConsecutive: number; totalDays: number }> {
  const rows = await drizzle
    .select({
      consecutive_days: attendanceRecords.consecutive_days,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.user_id, userId));
  const maxConsecutive =
    rows.length > 0
      ? Math.max(...rows.map((r) => r.consecutive_days))
      : 0;
  const totalDays = rows.length;
  return { maxConsecutive, totalDays };
}

async function getMaxRoomMessageCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({
      max: sql<number>`COALESCE(MAX(${chatRooms.message_count}), 0)::int`,
    })
    .from(chatRooms)
    .where(eq(chatRooms.user_id, userId));
  return Number(row?.max ?? 0);
}

async function getDailyUserMessageCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.user_id, userId),
        eq(messages.role, "user"),
        gte(messages.created_at, sql`CURRENT_DATE`)
      )
    );
  return Number(row?.count ?? 0);
}

async function getLikesGivenCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)::int` })
    .from(characterLikes)
    .where(eq(characterLikes.user_id, userId));
  return Number(row?.count ?? 0);
}

async function getMemoriesCount(userId: string): Promise<number> {
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)::int` })
    .from(roomMemories)
    .innerJoin(chatRooms, eq(roomMemories.room_id, chatRooms.room_id))
    .where(eq(chatRooms.user_id, userId));
  return Number(row?.count ?? 0);
}

function isDawnKST(): boolean {
  const now = new Date();
  const kst = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const hour = kst.getHours();
  return hour >= 2 && hour < 5;
}

async function hasLongMessage(userId: string): Promise<boolean> {
  const [row] = await drizzle
    .select({ message_id: messages.message_id })
    .from(messages)
    .where(
      and(
        eq(messages.user_id, userId),
        eq(messages.role, "user"),
        sql`length(${messages.content}) >= 500`
      )
    )
    .limit(1);
  return !!row;
}

async function isAnniversary1Year(userId: string): Promise<boolean> {
  const [row] = await drizzle
    .select({ created_at: profiles.created_at })
    .from(profiles)
    .where(eq(profiles.profile_id, userId))
    .limit(1);
  if (!row?.created_at) return false;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return new Date(row.created_at) <= oneYearAgo;
}

/** 모든 메트릭 병렬 조회 */
export async function fetchBadgeMetrics(userId: string): Promise<BadgeMetrics> {
  const [
    followerCount,
    totalLikesReceived,
    totalConversations,
    profileData,
    characterCount,
    attendanceStats,
    maxRoomMessageCount,
    dailyUserMsgCount,
    likesGivenCount,
    memoriesCount,
    longMessage,
    anniversary1Year,
  ] = await Promise.all([
    getFollowerCount(userId),
    getTotalLikesReceived(userId),
    getTotalConversations(userId),
    getProfileData(userId),
    getCharacterCount(userId),
    getAttendanceStats(userId),
    getMaxRoomMessageCount(userId),
    getDailyUserMessageCount(userId),
    getLikesGivenCount(userId),
    getMemoriesCount(userId),
    hasLongMessage(userId),
    isAnniversary1Year(userId),
  ]);

  return {
    followerCount,
    totalLikesReceived,
    totalConversations,
    firstLogin: true,
    profileSetup:
      profileData.name != null && String(profileData.name).trim().length > 0,
    characterCount,
    maxConsecutiveDays: attendanceStats.maxConsecutive,
    totalAttendanceDays: attendanceStats.totalDays,
    maxRoomMessageCount,
    consecutive3Days: attendanceStats.maxConsecutive >= 3,
    daily50Messages: dailyUserMsgCount >= 50,
    likesGiven10: likesGivenCount >= 10,
    memories10: memoriesCount >= 10,
    dailyUserMessageCount: dailyUserMsgCount,
    likesGivenCount,
    memoriesCount,
    dawnAccess: isDawnKST(),
    longMessage,
    searchUsed: false,
    anniversary1Year,
  };
}

const THRESHOLD_CHECKERS: Record<
  string,
  (m: BadgeMetrics, threshold: number | null) => boolean
> = {
  follower_count: (m, t) => t != null && m.followerCount >= t,
  total_likes_received: (m, t) => t != null && m.totalLikesReceived >= t,
  total_conversations: (m, t) => t != null && m.totalConversations >= t,
  first_login: (m) => m.firstLogin,
  profile_setup: (m) => m.profileSetup,
  first_character: (m) => m.characterCount > 0,
  attendance_7days: (m) =>
    m.maxConsecutiveDays >= 7 || m.totalAttendanceDays >= 7,
  conversation_10turns: (m, t) =>
    t != null && m.maxRoomMessageCount >= t,
  single_character_100: (m, t) =>
    t != null && m.maxRoomMessageCount >= t,
  consecutive_3days: (m, t) =>
    t != null && m.maxConsecutiveDays >= t,
  daily_50messages: (m) => m.daily50Messages,
  likes_given_10: (m) => m.likesGiven10,
  memories_10: (m) => m.memories10,
  dawn_access: (m) => checkDawnAccess(m),
  long_message: (m) => m.longMessage,
  search_used: (m) => m.searchUsed,
  anniversary_1year: (m) => m.anniversary1Year,
};

function checkDawnAccess(metrics: BadgeMetrics): boolean {
  return metrics.dawnAccess;
}

/** 단일 뱃지 조건 충족 여부 */
export async function evaluateSingleBadge(
  userId: string,
  badgeId: number
): Promise<boolean> {
  const [def] = await drizzle
    .select()
    .from(badgeDefinitions)
    .where(eq(badgeDefinitions.badge_id, badgeId))
    .limit(1);
  if (!def) return false;

  const metrics = await fetchBadgeMetrics(userId);
  const checker = THRESHOLD_CHECKERS[def.metric_type];
  if (!checker) return false;
  return checker(metrics, def.threshold);
}

/** 모든 뱃지에 대해 조건 충족 여부 반환 */
export async function evaluateAllBadges(
  userId: string
): Promise<Map<number, boolean>> {
  const [defs, metrics] = await Promise.all([
    drizzle
      .select()
      .from(badgeDefinitions)
      .orderBy(badgeDefinitions.sort_order),
    fetchBadgeMetrics(userId),
  ]);

  const result = new Map<number, boolean>();
  for (const def of defs) {
    const checker = THRESHOLD_CHECKERS[def.metric_type];
    const ok = checker ? checker(metrics, def.threshold) : false;
    result.set(def.badge_id, ok);
  }
  return result;
}

/** 뱃지 진행도 */
export interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

function getMetricProgress(
  metricType: string,
  threshold: number | null,
  metrics: BadgeMetrics
): { current: number; target: number } {
  const t = threshold ?? 1;
  switch (metricType) {
    case "follower_count":
      return { current: metrics.followerCount, target: t };
    case "total_likes_received":
      return { current: metrics.totalLikesReceived, target: t };
    case "total_conversations":
      return { current: metrics.totalConversations, target: t };
    case "first_login":
      return { current: metrics.firstLogin ? 1 : 0, target: 1 };
    case "profile_setup":
      return { current: metrics.profileSetup ? 1 : 0, target: 1 };
    case "first_character":
      return { current: Math.min(metrics.characterCount, 1), target: 1 };
    case "attendance_7days":
      return {
        current: Math.max(
          metrics.maxConsecutiveDays,
          metrics.totalAttendanceDays
        ),
        target: t,
      };
    case "conversation_10turns":
      return { current: metrics.maxRoomMessageCount, target: t };
    case "single_character_100":
      return { current: metrics.maxRoomMessageCount, target: t };
    case "consecutive_3days":
      return { current: metrics.maxConsecutiveDays, target: t };
    case "daily_50messages":
      return { current: metrics.dailyUserMessageCount, target: 50 };
    case "likes_given_10":
      return { current: metrics.likesGivenCount, target: 10 };
    case "memories_10":
      return { current: metrics.memoriesCount, target: 10 };
    case "dawn_access":
      return { current: metrics.dawnAccess ? 1 : 0, target: 1 };
    case "long_message":
      return { current: metrics.longMessage ? 1 : 0, target: 1 };
    case "search_used":
      return { current: metrics.searchUsed ? 1 : 0, target: 1 };
    case "anniversary_1year":
      return { current: metrics.anniversary1Year ? 1 : 0, target: 1 };
    default:
      return { current: 0, target: 1 };
  }
}

/** 모든 뱃지의 진행도 계산 */
export async function fetchBadgeProgress(
  userId: string
): Promise<Map<number, BadgeProgress>> {
  const [defs, metrics] = await Promise.all([
    drizzle
      .select()
      .from(badgeDefinitions)
      .orderBy(badgeDefinitions.sort_order),
    fetchBadgeMetrics(userId),
  ]);

  const result = new Map<number, BadgeProgress>();
  for (const def of defs) {
    const { current, target } = getMetricProgress(
      def.metric_type,
      def.threshold,
      metrics
    );
    const percentage =
      target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : current > 0
          ? 100
          : 0;
    result.set(def.badge_id, { current, target, percentage });
  }
  return result;
}
