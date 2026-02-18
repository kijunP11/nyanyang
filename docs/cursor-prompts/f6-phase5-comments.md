# F6 채팅방 Phase 5: 댓글 시스템

## 개요
캐릭터 상세 페이지에 댓글/답글/좋아요 기능을 추가한다. Phase 1에서 생성한 `comments` + `comment_likes` 테이블을 활용한다. 쓰레딩은 1단계만 지원 (답글의 답글은 같은 parent로 플래튼).

**전제조건**: Phase 1 (스키마 - comments/comment_likes 테이블 생성) 완료

## 디렉토리 구조

```
app/features/comments/
├── schema.ts              # Phase 1에서 생성 완료 (수정 없음)
├── api/
│   ├── list.tsx           # GET: 캐릭터별 댓글 목록 (커서 페이지네이션)
│   ├── create.tsx         # POST: 댓글/답글 작성
│   ├── delete.tsx         # DELETE: 본인 댓글 소프트 삭제
│   ├── like.tsx           # POST/DELETE: 댓글 좋아요 토글
│   └── upload-image.tsx   # POST: 댓글 이미지 업로드
├── components/
│   ├── comment-section.tsx    # 댓글 전체 섹션 (폼 + 목록)
│   ├── comment-list.tsx       # 댓글 목록 + "더보기" 페이지네이션
│   ├── comment-item.tsx       # 단일 댓글 행
│   ├── comment-reply-list.tsx # 답글 목록 (1단계)
│   └── comment-form.tsx       # 입력 폼: textarea + 이미지 + [작성]
└── lib/
    └── queries.server.ts      # 댓글 CRUD 서버 쿼리
```

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `comments/lib/queries.server.ts` | 생성 |
| 2 | `comments/api/list.tsx` | 생성 |
| 3 | `comments/api/create.tsx` | 생성 |
| 4 | `comments/api/delete.tsx` | 생성 |
| 5 | `comments/api/like.tsx` | 생성 |
| 6 | `comments/api/upload-image.tsx` | 생성 |
| 7 | `comments/components/comment-form.tsx` | 생성 |
| 8 | `comments/components/comment-item.tsx` | 생성 |
| 9 | `comments/components/comment-reply-list.tsx` | 생성 |
| 10 | `comments/components/comment-list.tsx` | 생성 |
| 11 | `comments/components/comment-section.tsx` | 생성 |
| 12 | `characters/screens/detail.tsx` | 수정 |
| 13 | `app/routes.ts` | 수정 |

---

## 1. `comments/lib/queries.server.ts` (생성)

댓글 CRUD 쿼리 함수들. Drizzle ORM 사용.

```typescript
/**
 * 댓글 서버 쿼리 함수
 *
 * 모든 함수는 서버 사이드에서만 호출된다.
 * RLS가 걸려있지만, Drizzle(DATABASE_URL 직결)로 조회하므로 RLS 우회됨.
 * → 쿼리 내에서 user_id 필터를 직접 적용한다.
 */
import { eq, and, isNull, desc, lt, sql } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";

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
  const db = drizzle;

  // 최상위 댓글만 (parent_id IS NULL)
  const conditions = [
    eq(comments.character_id, characterId),
    isNull(comments.parent_id),
  ];

  if (cursor) {
    conditions.push(lt(comments.comment_id, cursor));
  }

  const rows = await db
    .select()
    .from(comments)
    .where(and(...conditions))
    .orderBy(desc(comments.created_at))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // 프로필 + 좋아요 + 답글 카운트를 batch로 가져오기
  const commentIds = items.map((c) => c.comment_id);

  // 답글 카운트 (서브쿼리로)
  const replyCounts: Record<number, number> = {};
  if (commentIds.length > 0) {
    const replyRows = await db
      .select({
        parent_id: comments.parent_id,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(
        and(
          sql`${comments.parent_id} = ANY(ARRAY[${sql.raw(commentIds.join(","))}]::int[])`,
        )
      )
      .groupBy(comments.parent_id);

    for (const row of replyRows) {
      if (row.parent_id) replyCounts[row.parent_id] = row.count;
    }
  }

  // 현재 유저의 좋아요 상태
  const likedSet = new Set<number>();
  if (userId && commentIds.length > 0) {
    const likeRows = await db
      .select({ comment_id: commentLikes.comment_id })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.user_id, userId),
          sql`${commentLikes.comment_id} = ANY(ARRAY[${sql.raw(commentIds.join(","))}]::int[])`,
        )
      );
    for (const row of likeRows) {
      likedSet.add(row.comment_id);
    }
  }

  const enriched: CommentWithAuthor[] = items.map((c) => ({
    ...c,
    author_name: null,   // 프로필 조인은 클라이언트에서 별도 처리하거나 여기서 추가
    author_avatar_url: null,
    isLiked: likedSet.has(c.comment_id),
    isOwner: userId ? c.user_id === userId : false,
    reply_count: replyCounts[c.comment_id] ?? 0,
  }));

  return {
    comments: enriched,
    nextCursor: hasMore ? items[items.length - 1].comment_id : null,
  };
}

/**
 * 댓글의 답글 목록 조회
 */
export async function getReplies(
  parentId: number,
  userId: string | null
): Promise<CommentWithAuthor[]> {
  const db = drizzle;

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.parent_id, parentId))
    .orderBy(comments.created_at); // 답글은 오래된 순

  const commentIds = rows.map((c) => c.comment_id);

  // 현재 유저의 좋아요 상태
  const likedSet = new Set<number>();
  if (userId && commentIds.length > 0) {
    const likeRows = await db
      .select({ comment_id: commentLikes.comment_id })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.user_id, userId),
          sql`${commentLikes.comment_id} = ANY(ARRAY[${sql.raw(commentIds.join(","))}]::int[])`,
        )
      );
    for (const row of likeRows) {
      likedSet.add(row.comment_id);
    }
  }

  return rows.map((c) => ({
    ...c,
    author_name: null,
    author_avatar_url: null,
    isLiked: likedSet.has(c.comment_id),
    isOwner: userId ? c.user_id === userId : false,
    reply_count: 0, // 답글의 답글은 없음
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
  const db = drizzle;

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
  const db = drizzle;

  const [updated] = await db
    .update(comments)
    .set({ is_deleted: 1 })
    .where(
      and(
        eq(comments.comment_id, commentId),
        eq(comments.user_id, userId) // 본인 댓글만
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
  const db = drizzle;

  if (liked) {
    // 좋아요 추가
    try {
      await db.insert(commentLikes).values({
        comment_id: commentId,
        user_id: userId,
      });
      // 카운트 증가
      await db
        .update(comments)
        .set({ like_count: sql`${comments.like_count} + 1` })
        .where(eq(comments.comment_id, commentId));
    } catch (err: any) {
      if (err.code === "23505") return; // 중복 무시
      throw err;
    }
  } else {
    // 좋아요 삭제
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
```

---

## 2. `comments/api/list.tsx` (생성)

GET: 캐릭터별 댓글 목록 (커서 페이지네이션).

```typescript
/**
 * 댓글 목록 API
 *
 * GET /api/comments/list?character_id=123&cursor=456
 * 답글은 별도: GET /api/comments/list?parent_id=789
 */
import type { Route } from "./+types/list";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

import { getComments, getReplies } from "../lib/queries.server";

const querySchema = z.object({
  character_id: z.coerce.number().int().positive().optional(),
  parent_id: z.coerce.number().int().positive().optional(),
  cursor: z.coerce.number().int().positive().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);

  // 인증 유저 확인 (비인증도 조회 가능하나 좋아요/소유권 표시 불가)
  const {
    data: { user },
  } = await client.auth.getUser();

  const url = new URL(request.url);
  const { success, data: params } = querySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );

  if (!success) {
    return data({ error: "Invalid parameters" }, { status: 400, headers });
  }

  try {
    // 답글 조회
    if (params.parent_id) {
      const replies = await getReplies(params.parent_id, user?.id ?? null);
      return data({ replies }, { headers });
    }

    // 최상위 댓글 조회
    if (!params.character_id) {
      return data({ error: "character_id required" }, { status: 400, headers });
    }

    const result = await getComments(
      params.character_id,
      user?.id ?? null,
      params.cursor
    );

    return data(result, { headers });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return data({ error: "Failed to fetch comments" }, { status: 500, headers });
  }
}
```

---

## 3. `comments/api/create.tsx` (생성)

POST: 댓글/답글 작성.

```typescript
/**
 * 댓글 작성 API
 *
 * POST /api/comments/create
 * Body: { character_id, content, image_url?, parent_id? }
 */
import type { Route } from "./+types/create";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { createComment } from "../lib/queries.server";

const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
  content: z.string().min(1).max(1000),
  image_url: z.string().nullable().optional(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const comment = await createComment(
      validData.character_id,
      user.id,
      validData.content,
      validData.image_url ?? null,
      validData.parent_id ?? null
    );

    return data({ success: true, comment }, { headers });
  } catch (err) {
    console.error("Error creating comment:", err);
    return data({ error: "Failed to create comment" }, { status: 500, headers });
  }
}
```

---

## 4. `comments/api/delete.tsx` (생성)

DELETE: 본인 댓글 소프트 삭제.

```typescript
/**
 * 댓글 삭제 API
 *
 * DELETE /api/comments/delete
 * Body: { comment_id }
 */
import type { Route } from "./+types/delete";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { softDeleteComment } from "../lib/queries.server";

const bodySchema = z.object({
  comment_id: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData } = bodySchema.safeParse(body);

    if (!success) {
      return data({ error: "Invalid comment_id" }, { status: 400, headers });
    }

    const deleted = await softDeleteComment(validData.comment_id, user.id);

    if (!deleted) {
      return data({ error: "Comment not found or not authorized" }, { status: 404, headers });
    }

    return data({ success: true }, { headers });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return data({ error: "Failed to delete comment" }, { status: 500, headers });
  }
}
```

---

## 5. `comments/api/like.tsx` (생성)

POST/DELETE: 댓글 좋아요 토글. `characters/api/like.tsx` 패턴을 따른다.

```typescript
/**
 * 댓글 좋아요 API
 *
 * POST /api/comments/like — 좋아요 추가
 * DELETE /api/comments/like — 좋아요 제거
 * Body: { comment_id }
 */
import type { Route } from "./+types/like";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { toggleCommentLike } from "../lib/queries.server";

const bodySchema = z.object({
  comment_id: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { success, data: validData } = bodySchema.safeParse(body);

    if (!success) {
      return data({ error: "Invalid comment_id" }, { status: 400, headers });
    }

    const liked = request.method === "POST";
    await toggleCommentLike(validData.comment_id, user.id, liked);

    return data({ success: true, liked }, { headers });
  } catch (err) {
    console.error("Error toggling comment like:", err);
    return data({ error: "Failed to process like" }, { status: 500, headers });
  }
}
```

---

## 6. `comments/api/upload-image.tsx` (생성)

POST: 댓글 이미지 업로드. `characters/api/upload-media.tsx` 패턴을 따른다.

```typescript
/**
 * 댓글 이미지 업로드 API
 *
 * POST /api/comments/upload-image
 * Body: { file_data (base64), file_name, file_type }
 */
import type { Route } from "./+types/upload-image";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const uploadSchema = z.object({
  file_data: z.string(),
  file_name: z.string(),
  file_type: z.string().refine((type) => type.startsWith("image/"), {
    message: "이미지 파일만 업로드 가능합니다",
  }),
});

const STORAGE_BUCKET = "comment-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const [client] = makeServerClient(request);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { success, data: validData } = uploadSchema.safeParse(body);

    if (!success) {
      return data({ error: "유효성 검사 실패" }, { status: 400 });
    }

    // base64 디코딩
    const base64Data = validData.file_data.split(",")[1] || validData.file_data;
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_FILE_SIZE) {
      return data({ error: "파일 크기는 5MB를 초과할 수 없습니다" }, { status: 400 });
    }

    // 파일 경로: comments/{userId}/{timestamp}.{ext}
    const ext = validData.file_name.split(".").pop();
    const filePath = `comments/${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: validData.file_type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Comment image upload error:", uploadError);
      return data({ error: "업로드 실패" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = client.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return data({ success: true, url: publicUrl });
  } catch (err) {
    console.error("Comment upload error:", err);
    return data({ error: "업로드 중 오류" }, { status: 500 });
  }
}
```

**참고**: Supabase Storage에 `comment-images` 버킷이 없으면 Supabase Dashboard에서 생성해야 한다 (Public bucket).

---

## 7. `comments/components/comment-form.tsx` (생성)

댓글 입력 폼: textarea + 이미지 첨부 + [작성] 버튼.

```typescript
/**
 * 댓글 입력 폼
 *
 * 최상위 댓글 / 답글 작성 모두 사용.
 * 이미지 첨부 시 base64 → /api/comments/upload-image → URL 받아서 submit.
 */
import { useState, useRef } from "react";
import { useFetcher } from "react-router";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface CommentFormProps {
  characterId: number;
  parentId?: number | null;
  placeholder?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  characterId,
  parentId = null,
  placeholder = "댓글을 입력하세요...",
  onSuccess,
  autoFocus = false,
}: CommentFormProps) {
  const fetcher = useFetcher();
  const uploadFetcher = useFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isSubmitting = fetcher.state === "submitting";
  const isUploading = uploadFetcher.state === "submitting";

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    // 프리뷰
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);

      // 업로드
      uploadFetcher.submit(
        {
          file_data: dataUrl,
          file_name: file.name,
          file_type: file.type,
        },
        {
          method: "POST",
          action: "/api/comments/upload-image",
          encType: "application/json",
        }
      );
    };
    reader.readAsDataURL(file);
  };

  // 업로드 완료 시 URL 저장
  if (uploadFetcher.data?.url && !imageUrl) {
    setImageUrl(uploadFetcher.data.url);
  }

  // 이미지 제거
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
  };

  // 댓글 제출
  const handleSubmit = () => {
    if (!content.trim() && !imageUrl) return;

    fetcher.submit(
      {
        character_id: characterId,
        content: content.trim(),
        image_url: imageUrl,
        parent_id: parentId,
      },
      {
        method: "POST",
        action: "/api/comments/create",
        encType: "application/json",
      }
    );

    // 초기화
    setContent("");
    setImagePreview(null);
    setImageUrl(null);
    onSuccess?.();
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#E9EAEB] p-3 dark:border-[#333741]">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="w-full resize-none bg-transparent text-sm text-[#181D27] outline-none placeholder:text-[#A4A7AE] dark:text-white dark:placeholder:text-[#717680]"
        maxLength={1000}
      />

      {/* 이미지 프리뷰 */}
      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="첨부 이미지"
            className="max-h-32 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -right-1 -top-1 rounded-full bg-[#181D27] p-0.5 text-white"
          >
            <X className="h-3 w-3" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
      )}

      {/* 하단 툴바 */}
      <div className="flex items-center justify-between">
        <label className="cursor-pointer rounded-md p-1.5 text-[#717680] transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]">
          <ImagePlus className="h-4 w-4" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading || (!content.trim() && !imageUrl)}
          className="rounded-lg bg-[#00c4af] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "작성 중..." : "작성"}
        </button>
      </div>
    </div>
  );
}
```

---

## 8. `comments/components/comment-item.tsx` (생성)

단일 댓글 행: 프로필 아이콘 + 이름 + 내용 + 이미지 + 좋아요 + 답글 버튼.

```typescript
/**
 * 단일 댓글 컴포넌트
 */
import { useState } from "react";
import { useFetcher } from "react-router";
import { Heart, MessageCircle, Trash2, User } from "lucide-react";

import type { CommentWithAuthor } from "../lib/queries.server";

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply?: (commentId: number) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, onReply, isReply = false }: CommentItemProps) {
  const likeFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const isDeleted = comment.is_deleted === 1;
  const isDeleting = deleteFetcher.state === "submitting";

  // 좋아요 토글
  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikeCount((prev) => prev + (newState ? 1 : -1));

    likeFetcher.submit(
      { comment_id: comment.comment_id },
      {
        method: newState ? "POST" : "DELETE",
        action: "/api/comments/like",
        encType: "application/json",
      }
    );
  };

  // 삭제
  const handleDelete = () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    deleteFetcher.submit(
      { comment_id: comment.comment_id },
      {
        method: "DELETE",
        action: "/api/comments/delete",
        encType: "application/json",
      }
    );
  };

  // 삭제된 댓글
  if (isDeleted) {
    return (
      <div className={`flex gap-3 py-3 ${isReply ? "pl-10" : ""}`}>
        <p className="text-sm italic text-[#A4A7AE] dark:text-[#717680]">
          삭제된 댓글입니다.
        </p>
      </div>
    );
  }

  // 시간 포맷
  const timeAgo = comment.created_at
    ? formatTimeAgo(new Date(comment.created_at))
    : "";

  return (
    <div className={`flex gap-3 py-3 ${isReply ? "pl-10" : ""}`}>
      {/* 아바타 */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9EAEB] dark:bg-[#333741]">
        {comment.author_avatar_url ? (
          <img
            src={comment.author_avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-[#717680]" />
        )}
      </div>

      {/* 내용 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#181D27] dark:text-white">
            {comment.author_name ?? "익명"}
          </span>
          <span className="text-xs text-[#A4A7AE] dark:text-[#717680]">
            {timeAgo}
          </span>
        </div>

        <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#414651] dark:text-[#D5D7DA]">
          {comment.content}
        </p>

        {/* 이미지 */}
        {comment.image_url && (
          <img
            src={comment.image_url}
            alt="첨부 이미지"
            className="mt-2 max-h-48 rounded-lg object-cover"
          />
        )}

        {/* 액션 버튼 */}
        <div className="mt-1.5 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-red-500 dark:text-[#94969C]"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {!isReply && onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.comment_id)}
              className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-[#00c4af] dark:text-[#94969C]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {comment.reply_count > 0 && <span>{comment.reply_count}</span>}
            </button>
          )}

          {comment.isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-xs text-[#717680] transition-colors hover:text-red-500 dark:text-[#94969C]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 간단한 timeAgo 포맷 */
function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}
```

---

## 9. `comments/components/comment-reply-list.tsx` (생성)

답글 목록: 부모 댓글 아래 들여쓰기 표시. 접기/펼치기.

```typescript
/**
 * 답글 목록 + 답글 입력 폼
 *
 * 답글 보기 클릭 시 로드. 1단계만 지원.
 */
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import type { CommentWithAuthor } from "../lib/queries.server";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";

interface CommentReplyListProps {
  parentId: number;
  characterId: number;
  replyCount: number;
}

export function CommentReplyList({
  parentId,
  characterId,
  replyCount,
}: CommentReplyListProps) {
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  // 답글 펼치기 시 로드
  useEffect(() => {
    if (isOpen && !fetcher.data) {
      fetcher.load(`/api/comments/list?parent_id=${parentId}`);
    }
  }, [isOpen, parentId]);

  const replies: CommentWithAuthor[] = fetcher.data?.replies ?? [];
  const isLoading = fetcher.state === "loading";

  if (replyCount === 0 && !showReplyForm) {
    return null;
  }

  return (
    <div className="ml-10">
      {/* 답글 펼치기/접기 */}
      {replyCount > 0 && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="mb-1 text-xs font-semibold text-[#00c4af]"
        >
          {isOpen ? "답글 접기" : `답글 ${replyCount}개 보기`}
        </button>
      )}

      {/* 답글 목록 */}
      {isOpen && (
        <div>
          {isLoading ? (
            <p className="py-2 text-xs text-[#A4A7AE]">로딩 중...</p>
          ) : (
            replies.map((reply) => (
              <CommentItem key={reply.comment_id} comment={reply} isReply />
            ))
          )}
        </div>
      )}

      {/* 답글 입력 폼 */}
      {showReplyForm && (
        <div className="mt-2">
          <CommentForm
            characterId={characterId}
            parentId={parentId}
            placeholder="답글을 입력하세요..."
            autoFocus
            onSuccess={() => {
              setShowReplyForm(false);
              setIsOpen(true);
              // 답글 목록 새로고침
              fetcher.load(`/api/comments/list?parent_id=${parentId}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 10. `comments/components/comment-list.tsx` (생성)

최상위 댓글 목록 + "더보기" 버튼.

```typescript
/**
 * 댓글 목록 + 더보기 페이지네이션
 */
import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "react-router";

import type { CommentWithAuthor } from "../lib/queries.server";
import { CommentItem } from "./comment-item";
import { CommentReplyList } from "./comment-reply-list";
import { CommentForm } from "./comment-form";

interface CommentListProps {
  characterId: number;
}

export function CommentList({ characterId }: CommentListProps) {
  const fetcher = useFetcher();
  const [allComments, setAllComments] = useState<CommentWithAuthor[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // 초기 로드
  useEffect(() => {
    fetcher.load(`/api/comments/list?character_id=${characterId}`);
  }, [characterId]);

  // fetcher 결과 처리
  useEffect(() => {
    if (fetcher.data?.comments) {
      if (!cursor) {
        // 초기 로드
        setAllComments(fetcher.data.comments);
      } else {
        // 추가 로드
        setAllComments((prev) => [...prev, ...fetcher.data.comments]);
      }
      setHasMore(!!fetcher.data.nextCursor);
      setCursor(fetcher.data.nextCursor ?? null);
    }
  }, [fetcher.data]);

  // 더보기
  const loadMore = useCallback(() => {
    if (!cursor || fetcher.state === "loading") return;
    fetcher.load(
      `/api/comments/list?character_id=${characterId}&cursor=${cursor}`
    );
  }, [cursor, characterId, fetcher.state]);

  // 새 댓글 작성 후 새로고침
  const handleNewComment = () => {
    setCursor(null);
    setHasMore(true);
    fetcher.load(`/api/comments/list?character_id=${characterId}`);
  };

  const isLoading = fetcher.state === "loading" && allComments.length === 0;

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-[#A4A7AE]">
          댓글을 불러오는 중...
        </p>
      ) : allComments.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#A4A7AE] dark:text-[#717680]">
          아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!
        </p>
      ) : (
        <>
          {allComments.map((comment) => (
            <div key={comment.comment_id}>
              <CommentItem
                comment={comment}
                onReply={(id) =>
                  setReplyingTo(replyingTo === id ? null : id)
                }
              />
              {/* 답글 영역 */}
              <CommentReplyList
                parentId={comment.comment_id}
                characterId={characterId}
                replyCount={comment.reply_count}
              />
              {/* 답글 입력 폼 (인라인) */}
              {replyingTo === comment.comment_id && (
                <div className="ml-10 mt-1">
                  <CommentForm
                    characterId={characterId}
                    parentId={comment.comment_id}
                    placeholder="답글을 입력하세요..."
                    autoFocus
                    onSuccess={() => {
                      setReplyingTo(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* 더보기 버튼 */}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={fetcher.state === "loading"}
              className="w-full py-3 text-center text-sm font-semibold text-[#00c4af] transition-colors hover:text-[#00b39e]"
            >
              {fetcher.state === "loading" ? "로딩 중..." : "더보기"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 11. `comments/components/comment-section.tsx` (생성)

댓글 전체 섹션: 제목 + 작성 폼 + 목록. 캐릭터 상세 페이지에 임베드된다.

```typescript
/**
 * 댓글 섹션 (캐릭터 상세 페이지용)
 *
 * 상단: 제목 + 댓글 수
 * 중간: 댓글 작성 폼
 * 하단: 댓글 목록
 */
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentSectionProps {
  characterId: number;
}

export function CommentSection({ characterId }: CommentSectionProps) {
  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-bold text-[#181D27] dark:text-white">
        댓글
      </h3>

      {/* 작성 폼 */}
      <div className="mb-4">
        <CommentForm characterId={characterId} />
      </div>

      {/* 댓글 목록 */}
      <CommentList characterId={characterId} />
    </section>
  );
}
```

---

## 12. `characters/screens/detail.tsx` (수정)

캐릭터 상세 페이지 하단에 댓글 섹션을 추가한다.

**추가할 import:**
```typescript
import { CommentSection } from "~/features/comments/components/comment-section";
```

**JSX에 추가** (기존 content div 마지막, 닫는 `</div>` 직전):
```tsx
{/* 댓글 섹션 */}
<div className="mt-6 rounded-lg border border-[#3f3f46] bg-[#232323] p-6">
  <CommentSection characterId={character.character_id} />
</div>
```

---

## 13. `app/routes.ts` (수정)

댓글 API 라우트 5개 추가.

**`/api` prefix 블록 안에 추가:**
```typescript
...prefix("/comments", [
  route("/list", "features/comments/api/list.tsx"),
  route("/create", "features/comments/api/create.tsx"),
  route("/delete", "features/comments/api/delete.tsx"),
  route("/like", "features/comments/api/like.tsx"),
  route("/upload-image", "features/comments/api/upload-image.tsx"),
]),
```

---

## 참고 파일 (읽기 전용 - 수정하지 않음)

| 파일 | 용도 |
|------|------|
| `app/features/comments/schema.ts` | Phase 1에서 생성한 comments + commentLikes 테이블 스키마 |
| `app/features/characters/api/like.tsx` | 좋아요 토글 패턴 (POST/DELETE, 원자적 카운트) |
| `app/features/characters/api/upload-media.tsx` | 이미지 업로드 패턴 (base64 → Storage) |

## Supabase Storage 사전 준비

Supabase Dashboard에서 `comment-images` 버킷을 **Public** 으로 생성해야 한다.

## 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] 캐릭터 상세 페이지 하단에 댓글 섹션 표시
- [ ] 댓글 작성 → 목록에 즉시 표시
- [ ] 이미지 첨부 댓글 작성 → 이미지 표시
- [ ] 답글 달기 → 부모 댓글 아래 들여쓰기 표시
- [ ] 답글 N개 보기 → 펼치기/접기 동작
- [ ] 댓글 좋아요 토글 → 카운트 즉시 반영
- [ ] 본인 댓글만 삭제 버튼 표시 → 삭제 시 "삭제된 댓글입니다" 표시
- [ ] 더보기 버튼 → 추가 댓글 로드 (커서 페이지네이션)
- [ ] 비로그인 유저도 댓글 목록 조회 가능 (작성/좋아요 불가)
