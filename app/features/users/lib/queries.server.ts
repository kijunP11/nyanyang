/**
 * User Queries (Server-side)
 *
 * Query functions for likes/following data used by mypage screens.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";

import { characters, characterLikes } from "../../characters/schema";
import { profiles, userFollows } from "../schema";

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * 좋아요한 캐릭터 조회
 */
export async function getLikedCharacters(
  userId: string,
  params: z.infer<typeof paginationSchema>
) {
  const db = drizzle;

  const results = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      avatar_url: characters.avatar_url,
      tags: characters.tags,
      like_count: characters.like_count,
      chat_count: characters.chat_count,
      creator_id: characters.creator_id,
      creator_name: profiles.name,
      gallery_urls: characters.gallery_urls,
      liked_at: characterLikes.created_at,
    })
    .from(characterLikes)
    .innerJoin(characters, eq(characterLikes.character_id, characters.character_id))
    .innerJoin(profiles, eq(characters.creator_id, profiles.profile_id))
    .where(
      and(
        eq(characterLikes.user_id, userId),
        eq(characters.status, "approved"),
        eq(characters.is_public, true)
      )
    )
    .orderBy(desc(characterLikes.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(characterLikes)
    .innerJoin(characters, eq(characterLikes.character_id, characters.character_id))
    .where(
      and(
        eq(characterLikes.user_id, userId),
        eq(characters.status, "approved"),
        eq(characters.is_public, true)
      )
    );

  // 좋아요 목록이므로 is_liked = true
  // is_following은 별도 확인 필요
  const followingIds = await db
    .select({ following_id: userFollows.following_id })
    .from(userFollows)
    .where(eq(userFollows.follower_id, userId));
  const followingSet = new Set(followingIds.map((f) => f.following_id));

  const enrichedResults = results.map((char) => ({
    ...char,
    is_liked: true,
    is_following: followingSet.has(char.creator_id),
  }));

  return {
    characters: enrichedResults,
    pagination: {
      total: Number(count),
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < Number(count),
    },
  };
}

/**
 * 팔로잉 크리에이터의 캐릭터 조회
 */
export async function getFollowingCharacters(
  userId: string,
  params: z.infer<typeof paginationSchema>
) {
  const db = drizzle;

  const results = await db
    .select({
      character_id: characters.character_id,
      name: characters.name,
      display_name: characters.display_name,
      description: characters.description,
      avatar_url: characters.avatar_url,
      tags: characters.tags,
      like_count: characters.like_count,
      chat_count: characters.chat_count,
      creator_id: characters.creator_id,
      creator_name: profiles.name,
      gallery_urls: characters.gallery_urls,
    })
    .from(userFollows)
    .innerJoin(characters, eq(characters.creator_id, userFollows.following_id))
    .innerJoin(profiles, eq(characters.creator_id, profiles.profile_id))
    .where(
      and(
        eq(userFollows.follower_id, userId),
        eq(characters.is_public, true),
        eq(characters.status, "approved")
      )
    )
    .orderBy(desc(characters.created_at))
    .limit(params.limit)
    .offset(params.offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userFollows)
    .innerJoin(characters, eq(characters.creator_id, userFollows.following_id))
    .where(
      and(
        eq(userFollows.follower_id, userId),
        eq(characters.is_public, true),
        eq(characters.status, "approved")
      )
    );

  // 팔로잉 목록이므로 is_following = true
  // is_liked는 별도 확인 필요
  const characterIds = results.map((c) => c.character_id);
  const likedCharacters = characterIds.length > 0
    ? await db
        .select({ character_id: characterLikes.character_id })
        .from(characterLikes)
        .where(
          and(
            eq(characterLikes.user_id, userId),
            sql`${characterLikes.character_id} IN ${characterIds}`
          )
        )
    : [];
  const likedSet = new Set(likedCharacters.map((l) => l.character_id));

  const enrichedResults = results.map((char) => ({
    ...char,
    is_liked: likedSet.has(char.character_id),
    is_following: true,
  }));

  return {
    characters: enrichedResults,
    pagination: {
      total: Number(count),
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < Number(count),
    },
  };
}

/**
 * 팔로우 여부 확인
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const db = drizzle;

  const [result] = await db
    .select({ follow_id: userFollows.follow_id })
    .from(userFollows)
    .where(
      and(
        eq(userFollows.follower_id, followerId),
        eq(userFollows.following_id, followingId)
      )
    )
    .limit(1);

  return !!result;
}

/**
 * 유저 프로필 + 팔로워/팔로잉 카운트 조회
 */
export async function getUserProfileWithCounts(userId: string) {
  const db = drizzle;

  const [profile] = await db
    .select({
      profile_id: profiles.profile_id,
      name: profiles.name,
      avatar_url: profiles.avatar_url,
      follower_count: profiles.follower_count,
      following_count: profiles.following_count,
      verified_at: profiles.verified_at,
    })
    .from(profiles)
    .where(eq(profiles.profile_id, userId))
    .limit(1);

  return profile || null;
}
