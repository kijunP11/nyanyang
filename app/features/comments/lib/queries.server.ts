/**
 * 댓글 서버 쿼리 함수
 *
 * 모든 함수는 서버 사이드에서만 호출된다.
 * RLS가 걸려있지만, Drizzle(DATABASE_URL 직결)로 조회하므로 RLS 우회됨.
 * → 쿼리 내에서 user_id 필터를 직접 적용한다.
 */
import { eq, and, isNull, desc, lt, sql, inArray } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { profiles } from "~/features/users/schema";

import { comments, commentLikes } from "../schema";

/** 댓글 + 작성자 프로필 조인 타입 */
export interface CommentWithAuthor {
  comment_id: number;
  character_id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  parent_id: number | null;
  like_count: number;
  is_deleted: number;
  created_at: Date | null;
  updated_at: Date | null;
  // 조인 필드
  author_name: string | null;
  author_avatar_url: string | null;
  // 현재 유저 관련
  isLiked: boolean;
  isOwner: boolean;
  reply_count: number;
}

/**
 * 캐릭터별 최상위 댓글 목록 조회 (커서 페이지네이션)
 */
export async function getComments(
  characterId: number,
  userId: string | null,
  cursor?: number,
  limit = 20
): Promise<{ comments: CommentWithAuthor[]; nextCursor: number | null }> {
  const conditions = [
    eq(comments.character_id, characterId),
    isNull(comments.parent_id),
  ];

  if (cursor !== undefined && cursor !== null) {
    conditions.push(lt(comments.comment_id, cursor));
  }

  const rows = await db
    .select({
      comment_id: comments.comment_id,
      character_id: comments.character_id,
      user_id: comments.user_id,
      content: comments.content,
      image_url: comments.image_url,
      parent_id: comments.parent_id,
      like_count: comments.like_count,
      is_deleted: comments.is_deleted,
      created_at: comments.created_at,
      updated_at: comments.updated_at,
      author_name: profiles.name,
      author_avatar_url: profiles.avatar_url,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.user_id, profiles.profile_id))
    .where(and(...conditions))
    .orderBy(desc(comments.created_at))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const commentIds = items.map((c) => c.comment_id);

  if (commentIds.length === 0) {
    return {
      comments: items.map((c) => ({
        ...c,
        author_name: c.author_name ?? null,
        author_avatar_url: c.author_avatar_url ?? null,
        isLiked: false,
        isOwner: userId ? c.user_id === userId : false,
        reply_count: 0,
      })),
      nextCursor: null,
    };
  }

  // 답글 카운트 (is_deleted 포함해도 됨 - 삭제된 답글도 숫자에 포함)
  const replyRows = await db
    .select({
      parent_id: comments.parent_id,
      count: sql<number>`count(*)::int`,
    })
    .from(comments)
    .where(inArray(comments.parent_id, commentIds))
    .groupBy(comments.parent_id);

  const replyCounts: Record<number, number> = {};
  for (const row of replyRows) {
    if (row.parent_id != null) replyCounts[row.parent_id] = row.count;
  }

  // 현재 유저의 좋아요 상태
  const likedSet = new Set<number>();
  if (userId) {
    const likeRows = await db
      .select({ comment_id: commentLikes.comment_id })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.user_id, userId),
          inArray(commentLikes.comment_id, commentIds)
        )
      );
    for (const row of likeRows) {
      likedSet.add(row.comment_id);
    }
  }

  const enriched: CommentWithAuthor[] = items.map((c) => ({
    ...c,
    author_name: c.author_name ?? null,
    author_avatar_url: c.author_avatar_url ?? null,
    isLiked: likedSet.has(c.comment_id),
    isOwner: userId ? c.user_id === userId : false,
    reply_count: replyCounts[c.comment_id] ?? 0,
  }));

  return {
    comments: enriched,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1].comment_id : null,
  };
}

/**
 * 댓글의 답글 목록 조회
 */
export async function getReplies(
  parentId: number,
  userId: string | null
): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      comment_id: comments.comment_id,
      character_id: comments.character_id,
      user_id: comments.user_id,
      content: comments.content,
      image_url: comments.image_url,
      parent_id: comments.parent_id,
      like_count: comments.like_count,
      is_deleted: comments.is_deleted,
      created_at: comments.created_at,
      updated_at: comments.updated_at,
      author_name: profiles.name,
      author_avatar_url: profiles.avatar_url,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.user_id, profiles.profile_id))
    .where(eq(comments.parent_id, parentId))
    .orderBy(comments.created_at);

  const commentIds = rows.map((c) => c.comment_id);
  const likedSet = new Set<number>();

  if (userId && commentIds.length > 0) {
    const likeRows = await db
      .select({ comment_id: commentLikes.comment_id })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.user_id, userId),
          inArray(commentLikes.comment_id, commentIds)
        )
      );
    for (const row of likeRows) {
      likedSet.add(row.comment_id);
    }
  }

  return rows.map((c) => ({
    ...c,
    author_name: c.author_name ?? null,
    author_avatar_url: c.author_avatar_url ?? null,
    isLiked: likedSet.has(c.comment_id),
    isOwner: userId ? c.user_id === userId : false,
    reply_count: 0,
  }));
}

/**
 * 댓글 생성
 */
export async function createComment(
  characterId: number,
  userId: string,
  content: string,
  imageUrl: string | null = null,
  parentId: number | null = null
) {
  const [newComment] = await db
    .insert(comments)
    .values({
      character_id: characterId,
      user_id: userId,
      content,
      image_url: imageUrl,
      parent_id: parentId,
    })
    .returning();

  return newComment;
}

/**
 * 댓글 소프트 삭제 (is_deleted = 1)
 */
export async function softDeleteComment(commentId: number, userId: string) {
  const [updated] = await db
    .update(comments)
    .set({ is_deleted: 1 })
    .where(
      and(
        eq(comments.comment_id, commentId),
        eq(comments.user_id, userId)
      )
    )
    .returning();

  return updated;
}

/**
 * 댓글 좋아요 토글
 */
export async function toggleCommentLike(
  commentId: number,
  userId: string,
  liked: boolean
) {
  if (liked) {
    try {
      await db.insert(commentLikes).values({
        comment_id: commentId,
        user_id: userId,
      });
      await db
        .update(comments)
        .set({ like_count: sql`${comments.like_count} + 1` })
        .where(eq(comments.comment_id, commentId));
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "23505") return;
      throw err;
    }
  } else {
    const [deleted] = await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.comment_id, commentId),
          eq(commentLikes.user_id, userId)
        )
      )
      .returning();

    if (deleted) {
      await db
        .update(comments)
        .set({ like_count: sql`GREATEST(${comments.like_count} - 1, 0)` })
        .where(eq(comments.comment_id, commentId));
    }
  }
}
