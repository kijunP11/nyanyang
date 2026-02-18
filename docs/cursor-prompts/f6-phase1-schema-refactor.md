# F6 채팅방 Phase 1: 스키마 + 채팅 화면 리팩토링

## 개요
F6 채팅방 업그레이드의 기반을 만든다. 새 DB 테이블 3개 + 기존 테이블 1개 수정 + chat.tsx 917줄 모놀리스를 훅/컴포넌트로 분리하여 ~350줄로 축소한다.

**중요**: 이 Phase는 **기존 기능을 100% 유지**하면서 코드만 분리하는 것이다. 새 기능은 추가하지 않는다.

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/chat/schema.ts` | 수정 (테이블 추가) |
| 2 | `app/features/comments/schema.ts` | 생성 |
| 3 | `sql/migrations/0013_f6_chat_upgrade.sql` | 생성 |
| 4 | `app/features/chat/hooks/use-chat-streaming.ts` | 생성 |
| 5 | `app/features/chat/hooks/use-chat-branches.ts` | 생성 |
| 6 | `app/features/chat/components/message-bubble.tsx` | 생성 |
| 7 | `app/features/chat/components/message-actions-menu.tsx` | 생성 |
| 8 | `app/features/chat/components/streaming-indicator.tsx` | 생성 |
| 9 | `app/features/chat/components/rollback-dialog.tsx` | 생성 |
| 10 | `app/features/chat/components/chat-input-bar.tsx` | 생성 |
| 11 | `app/features/chat/components/chat-header-bar.tsx` | 생성 |
| 12 | `app/features/chat/screens/chat.tsx` | 수정 (리팩토링) |

---

## 1. `app/features/chat/schema.ts` (수정)

기존 `chatRooms`, `messages`, `roomMemories` 테이블은 그대로 두고, 아래 테이블을 **파일 끝에 추가**한다.

```typescript
/**
 * Chat Room Settings Table
 * per-room 유저 설정 (폰트, 배경, 응답 길이 등)
 */
export const chatRoomSettings = pgTable(
  "chat_room_settings",
  {
    setting_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    room_id: integer()
      .notNull()
      .references(() => chatRooms.room_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    // 커스터마이징
    font_size: integer().notNull().default(16),
    background_image_url: text(),
    background_enabled: integer().notNull().default(1), // 0 or 1
    character_nickname: text(), // per-room 캐릭터 별명
    multi_image: integer().notNull().default(0), // 0 or 1

    // AI 설정
    response_length: integer().notNull().default(2000), // max output tokens
    positivity_bias: integer().notNull().default(0), // 0 or 1
    anti_impersonation: integer().notNull().default(1), // 0 or 1
    realtime_output: integer().notNull().default(1), // 0 or 1

    ...timestamps,
  },
  (table) => [
    unique("chat_room_settings_room_user_unique").on(table.room_id, table.user_id),
    pgPolicy("select-own-room-settings-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-own-room-settings-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("update-own-room-settings-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("delete-own-room-settings-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
```

**import 추가**: `unique`를 `drizzle-orm/pg-core`에서 임포트한다.

---

## 2. `app/features/comments/schema.ts` (생성)

`app/features/badges/schema.ts` 패턴을 따른다.

```typescript
/**
 * Comments Schema
 * 캐릭터에 대한 댓글/답글 시스템
 */
import { sql } from "drizzle-orm";
import {
  integer,
  pgPolicy,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";
import { timestamps } from "~/core/db/helpers";
import { characters } from "../characters/schema";

/**
 * Comments Table
 * 1단계 쓰레딩: parent_id IS NULL = 최상위, NOT NULL = 답글
 */
export const comments = pgTable(
  "comments",
  {
    comment_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    character_id: integer()
      .notNull()
      .references(() => characters.character_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    content: text().notNull(),
    image_url: text(),
    parent_id: integer(), // self-reference, FK는 SQL에서 추가
    like_count: integer().notNull().default(0),
    is_deleted: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    // 공개 읽기 (삭제되지 않은 것만)
    pgPolicy("select-comments-public", {
      for: "select",
      to: anonRole,
      as: "permissive",
      using: sql`${table.is_deleted} = 0`,
    }),
    pgPolicy("select-comments-authenticated", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${table.is_deleted} = 0`,
    }),
    // 본인만 작성
    pgPolicy("insert-own-comments-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // 본인만 수정
    pgPolicy("update-own-comments-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    // 본인만 삭제
    pgPolicy("delete-own-comments-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Comment Likes Table
 */
export const commentLikes = pgTable(
  "comment_likes",
  {
    like_id: uuid().primaryKey().defaultRandom(),
    comment_id: integer()
      .notNull()
      .references(() => comments.comment_id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    unique("comment_likes_unique").on(table.comment_id, table.user_id),
    pgPolicy("select-own-comment-likes", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("insert-own-comment-likes", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
    pgPolicy("delete-own-comment-likes", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
```

---

## 3. `sql/migrations/0013_f6_chat_upgrade.sql` (생성)

`sql/migrations/0005_create_notices.sql`의 수동 마이그레이션 헤더 패턴을 따른다.

```sql
-- ⚠️ MANUAL MIGRATION — not tracked by Drizzle journal (_journal.json)
--
-- How to apply:
--   Run this SQL directly in Supabase SQL Editor or psql.
--   DO NOT use `npm run db:migrate` — it won't pick up this file.
--
-- Why manual:
--   db:generate has a pre-existing snapshot collision (0003/0004 share the same prevId)
--   plus unrelated pending schema diffs, so automated generation was not possible.
--
-- Tables created: chat_room_settings, comments, comment_likes
-- Columns added: room_memories.created_by

-- ============================================================
-- 1. chat_room_settings (per-room 유저 설정)
-- ============================================================
CREATE TABLE IF NOT EXISTS "chat_room_settings" (
  "setting_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "room_id" integer NOT NULL REFERENCES "chat_rooms"("room_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "font_size" integer NOT NULL DEFAULT 16,
  "background_image_url" text,
  "background_enabled" integer NOT NULL DEFAULT 1,
  "character_nickname" text,
  "multi_image" integer NOT NULL DEFAULT 0,
  "response_length" integer NOT NULL DEFAULT 2000,
  "positivity_bias" integer NOT NULL DEFAULT 0,
  "anti_impersonation" integer NOT NULL DEFAULT 1,
  "realtime_output" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE("room_id", "user_id")
);

ALTER TABLE "chat_room_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-own-room-settings-policy" ON "chat_room_settings"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert-own-room-settings-policy" ON "chat_room_settings"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update-own-room-settings-policy" ON "chat_room_settings"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-room-settings-policy" ON "chat_room_settings"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. comments (캐릭터 댓글)
-- ============================================================
CREATE TABLE IF NOT EXISTS "comments" (
  "comment_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "character_id" integer NOT NULL REFERENCES "characters"("character_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "image_url" text,
  "parent_id" integer REFERENCES "comments"("comment_id") ON DELETE CASCADE,
  "like_count" integer NOT NULL DEFAULT 0,
  "is_deleted" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-comments-public" ON "comments"
  FOR SELECT TO anon
  USING (is_deleted = 0);

CREATE POLICY "select-comments-authenticated" ON "comments"
  FOR SELECT TO authenticated
  USING (is_deleted = 0);

CREATE POLICY "insert-own-comments-policy" ON "comments"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update-own-comments-policy" ON "comments"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-comments-policy" ON "comments"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. comment_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "like_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "comment_id" integer NOT NULL REFERENCES "comments"("comment_id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE("comment_id", "user_id")
);

ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-own-comment-likes" ON "comment_likes"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert-own-comment-likes" ON "comment_likes"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete-own-comment-likes" ON "comment_likes"
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. room_memories에 created_by 컬럼 추가
-- ============================================================
ALTER TABLE "room_memories" ADD COLUMN IF NOT EXISTS "created_by" text DEFAULT 'auto';
```

---

## 4. `app/features/chat/hooks/use-chat-streaming.ts` (생성)

`chat.tsx`에서 스트리밍 관련 로직을 추출한다. 현재 chat.tsx의 `handleSend` (lines 155-263)과 `handleRegenerate` (lines 267-377)을 이 훅으로 옮긴다.

```typescript
/**
 * 채팅 스트리밍 훅
 * handleSend, handleRegenerate, 메시지 리스트, 스트리밍 상태를 관리한다.
 */
import { useState, useEffect, useRef } from "react";
import type { ModelStatus } from "../components/model-status-banner";
import type { AIModel } from "../components/model-selector";

// 메시지 타입 (chat.tsx loader 반환값과 동일)
export interface ChatMessage {
  message_id: number;
  room_id: number;
  user_id: string;
  role: string;
  content: string;
  sequence_number: number;
  tokens_used: number | null;
  cost: number | null;
  parent_message_id: number | null;
  branch_name: string | null;
  is_active_branch: number;
  is_deleted: number;
  created_at: Date;
  updated_at: Date;
}

interface UseChatStreamingOptions {
  roomId: number;
  initialMessages: ChatMessage[];
  selectedModel: AIModel;
}

export function useChatStreaming({
  roomId,
  initialMessages,
  selectedModel,
}: UseChatStreamingOptions) {
  const [messageList, setMessageList] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("stable");

  // initialMessages가 변경되면 (revalidation) 업데이트
  useEffect(() => {
    setMessageList(initialMessages);
  }, [initialMessages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistic update
    const optimisticUserMsg: ChatMessage = {
      message_id: Date.now(),
      room_id: roomId,
      user_id: "",
      role: "user",
      content: userMessage,
      sequence_number: messageList.length + 1,
      tokens_used: 0,
      cost: 0,
      parent_message_id: null,
      branch_name: null,
      is_active_branch: 1,
      is_deleted: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    setMessageList((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          message: userMessage,
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      await processStream(response, messageList.length + 2);
    } catch (error) {
      console.error("Error sending message:", error);
      setModelStatus("unstable");
      setIsStreaming(false);
      setStreamingMessage("");
      setMessageList((prev) => prev.slice(0, -1));
      alert("메시지 전송에 실패했습니다.");
    }
  };

  const regenerateMessage = async (aiMessageId: number) => {
    if (isStreaming) return;

    const aiMsgIndex = messageList.findIndex((m) => m.message_id === aiMessageId);
    if (aiMsgIndex === -1) return;

    const userMsg = messageList
      .slice(0, aiMsgIndex)
      .reverse()
      .find((m) => m.role === "user");
    if (!userMsg) return;

    const originalAiMsg = messageList[aiMsgIndex];
    setMessageList((prev) => prev.filter((m) => m.message_id !== aiMessageId));
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          message: userMsg.content,
          model: selectedModel,
          regenerate: true,
          replace_message_id: aiMessageId,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate message");

      await processStream(response, originalAiMsg.sequence_number);
    } catch (error) {
      console.error("Error regenerating message:", error);
      setModelStatus("unstable");
      setMessageList((prev) => {
        const restored = [...prev];
        restored.splice(aiMsgIndex, 0, originalAiMsg);
        return restored;
      });
      setIsStreaming(false);
      setStreamingMessage("");
      alert("메시지 재생성에 실패했습니다.");
    }
  };

  // SSE 스트림 처리 (sendMessage와 regenerateMessage에서 공통 사용)
  const processStream = async (response: Response, sequenceNumber: number) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let done = false;
    let fullResponse = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }

              if (data.done) {
                setModelStatus("stable");
                const aiMessage: ChatMessage = {
                  message_id: Date.now() + 1,
                  room_id: roomId,
                  user_id: "",
                  role: "assistant",
                  content: fullResponse,
                  sequence_number: sequenceNumber,
                  tokens_used: data.tokens || 0,
                  cost: data.cost || 0,
                  parent_message_id: null,
                  branch_name: null,
                  is_active_branch: 1,
                  is_deleted: 0,
                  created_at: new Date(),
                  updated_at: new Date(),
                };
                setMessageList((prev) => [...prev, aiMessage]);
                setStreamingMessage("");
                setIsStreaming(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    }
  };

  return {
    messageList,
    setMessageList,
    isStreaming,
    streamingMessage,
    modelStatus,
    setModelStatus,
    sendMessage,
    regenerateMessage,
  };
}
```

---

## 5. `app/features/chat/hooks/use-chat-branches.ts` (생성)

`chat.tsx`의 브랜치 관련 로직을 추출한다 (lines 379-425).

```typescript
/**
 * 채팅 브랜치 관리 훅
 * 롤백, 브랜치 전환, branchFetcher 상태 관리
 */
import { useState, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";

interface UseChatBranchesOptions {
  roomId: number;
}

export function useChatBranches({ roomId }: UseChatBranchesOptions) {
  const branchFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackMessageId, setRollbackMessageId] = useState<number | null>(null);

  useEffect(() => {
    if (branchFetcher.state === "idle" && branchFetcher.data) {
      if (branchFetcher.data.success) {
        revalidator.revalidate();
      } else if (branchFetcher.data.error) {
        alert(`분기 작업 실패: ${branchFetcher.data.error}`);
      }
    }
  }, [branchFetcher.state, branchFetcher.data, revalidator]);

  const openRollbackDialog = (messageId: number) => {
    setRollbackMessageId(messageId);
    setShowRollbackDialog(true);
  };

  const confirmRollback = () => {
    if (!rollbackMessageId) return;
    branchFetcher.submit(
      { room_id: roomId, parent_message_id: rollbackMessageId },
      { method: "POST", action: "/api/chat/branch", encType: "application/json" }
    );
    setShowRollbackDialog(false);
    setRollbackMessageId(null);
  };

  const switchBranch = (branchName: string) => {
    branchFetcher.submit(
      { room_id: roomId, branch_name: branchName },
      { method: "PUT", action: "/api/chat/branch", encType: "application/json" }
    );
  };

  return {
    branchFetcher,
    showRollbackDialog,
    setShowRollbackDialog,
    rollbackMessageId,
    setRollbackMessageId,
    openRollbackDialog,
    confirmRollback,
    switchBranch,
  };
}
```

---

## 6. `app/features/chat/components/message-bubble.tsx` (생성)

`chat.tsx` lines 643-730의 메시지 렌더링을 추출한다.

```typescript
/**
 * 메시지 버블 컴포넌트
 * AI (왼쪽, avatar) / User (오른쪽) 메시지 렌더링
 */
import ReactMarkdown from "react-markdown";
import { RotateCcw, RefreshCw } from "lucide-react";
import type { ChatMessage } from "../hooks/use-chat-streaming";

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
}

interface MessageBubbleProps {
  message: ChatMessage;
  character: CharacterInfo;
  onRollback: (messageId: number) => void;
  onRegenerate: (messageId: number) => void;
  isStreaming: boolean;
}

export function MessageBubble({
  message,
  character,
  onRollback,
  onRegenerate,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRealMessage = typeof message.message_id === "number" && message.message_id > 0;

  return (
    <div className={`group flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar - AI만 */}
      {!isUser && (
        <div className="flex-shrink-0">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.display_name ?? undefined}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
              <span className="text-xs font-semibold text-white">
                {(character.display_name ?? "?")[0]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bubble + Actions */}
      <div className={`flex flex-col ${isUser ? "items-end" : ""}`}>
        <div
          className={`max-w-[280px] rounded-2xl px-4 py-3 ${
            isUser ? "bg-[#14b8a6] text-white" : "bg-[#2f3032] text-white"
          }`}
        >
          <div className="prose prose-sm max-w-none text-sm text-white prose-p:text-white prose-strong:text-white prose-em:text-white">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} className="my-2 h-auto max-w-full rounded-lg" alt={props.alt || "Image"} />
                ),
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-[#9ca3af]">
            {new Date(message.created_at).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isRealMessage && (
            <button
              onClick={() => onRollback(message.message_id)}
              className="flex items-center gap-1 text-xs text-[#9ca3af] opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100"
              title="이 메시지로 되돌리기"
            >
              <RotateCcw className="h-3 w-3" />
              되돌리기
            </button>
          )}
          {!isUser && isRealMessage && (
            <button
              onClick={() => onRegenerate(message.message_id)}
              className="flex items-center gap-1 text-xs text-[#9ca3af] opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100"
              title="재생성"
              disabled={isStreaming}
            >
              <RefreshCw className="h-3 w-3" />
              재생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. `app/features/chat/components/message-actions-menu.tsx` (생성)

기존 `message-actions.tsx`를 대체하는 통합 컨텍스트 메뉴. Phase 2에서 재생성 가이드 등이 추가될 예정이므로 확장 가능하게 만든다.

```typescript
/**
 * 메시지 액션 드롭다운 메뉴
 * 복사, 재생성(AI만), 되돌리기, 브랜치 생성
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, RefreshCw, RotateCcw, GitBranch } from "lucide-react";

interface MessageActionsMenuProps {
  messageId: number;
  role: string; // "user" | "assistant"
  content: string;
  onRegenerate: (messageId: number) => void;
  onRollback: (messageId: number) => void;
  isStreaming: boolean;
}

export function MessageActionsMenu({
  messageId,
  role,
  content,
  onRegenerate,
  onRollback,
  isStreaming,
}: MessageActionsMenuProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded p-1 text-[#9ca3af] opacity-0 transition-opacity hover:text-white group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#232323] border-[#3f3f46]">
        <DropdownMenuItem onClick={handleCopy} className="text-white hover:bg-white/10">
          <Copy className="mr-2 h-4 w-4" />
          복사
        </DropdownMenuItem>
        {role === "assistant" && (
          <DropdownMenuItem
            onClick={() => onRegenerate(messageId)}
            disabled={isStreaming}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            재생성
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onRollback(messageId)}
          className="text-white hover:bg-white/10"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          되돌리기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 8. `app/features/chat/components/streaming-indicator.tsx` (생성)

`chat.tsx` lines 733-800의 스트리밍/타이핑 인디케이터를 추출한다.

```typescript
/**
 * 스트리밍 인디케이터
 * 타이핑 도트 애니메이션 + 스트리밍 중인 메시지 렌더링
 */
import ReactMarkdown from "react-markdown";

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
}

interface StreamingIndicatorProps {
  character: CharacterInfo;
  isStreaming: boolean;
  streamingMessage: string;
}

function CharacterAvatar({ character }: { character: CharacterInfo }) {
  if (character.avatar_url) {
    return (
      <img
        src={character.avatar_url}
        alt={character.display_name ?? undefined}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
      <span className="text-xs font-semibold text-white">
        {(character.display_name ?? "?")[0]}
      </span>
    </div>
  );
}

export function StreamingIndicator({
  character,
  isStreaming,
  streamingMessage,
}: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  // 스트리밍 메시지가 있으면 내용 표시
  if (streamingMessage) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CharacterAvatar character={character} />
        </div>
        <div className="max-w-[280px] rounded-2xl bg-[#2f3032] px-4 py-3">
          <div className="prose prose-sm max-w-none text-sm text-white prose-p:text-white">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} className="my-2 h-auto max-w-full rounded-lg" alt={props.alt || "Image"} />
                ),
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {streamingMessage}
            </ReactMarkdown>
          </div>
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
        </div>
      </div>
    );
  }

  // 아직 내용이 없으면 타이핑 도트
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        <CharacterAvatar character={character} />
      </div>
      <div className="rounded-2xl bg-[#2f3032] px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
```

---

## 9. `app/features/chat/components/rollback-dialog.tsx` (생성)

`chat.tsx` lines 871-912의 롤백 다이얼로그를 추출한다.

```typescript
/**
 * 롤백 확인 다이얼로그
 */
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import type { ChatMessage } from "../hooks/use-chat-streaming";

interface RollbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rollbackMessageId: number | null;
  messageList: ChatMessage[];
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RollbackDialog({
  open,
  onOpenChange,
  rollbackMessageId,
  messageList,
  onConfirm,
  isSubmitting,
}: RollbackDialogProps) {
  const targetMessage = rollbackMessageId
    ? messageList.find((msg) => msg.message_id === rollbackMessageId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대화 되돌리기</DialogTitle>
          <DialogDescription>
            이 메시지로 대화를 되돌리시겠습니까? 현재 대화는 유지되며, 이 메시지부터 새로운 대화를 시작할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {targetMessage && (
          <div className="my-4 rounded-lg bg-[#2f3032] p-4">
            <p className="mb-2 text-sm font-medium text-white">되돌릴 메시지:</p>
            <div className="text-sm text-[#9ca3af]">
              {targetMessage.content.substring(0, 200)}
              {targetMessage.content.length > 200 ? "..." : ""}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "처리 중..." : "되돌리기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. `app/features/chat/components/chat-input-bar.tsx` (생성)

`chat.tsx` lines 807-860의 입력 영역을 추출한다.

```typescript
/**
 * 채팅 입력 바
 * 텍스트 입력 + *지문*/"대사" 퀵 버튼 + 전송 버튼
 */
import { useState } from "react";
import { Send, Plus } from "lucide-react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    onSend(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className="bg-[#232323] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3f3f46] text-white hover:bg-[#52525b]"
          title="첨부"
        >
          <Plus className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#3f3f46] px-4 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지를 입력하세요..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#9ca3af] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => setInputValue((prev) => prev + "*지문*")}
            className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
          >
            *지문*
          </button>
          <button
            onClick={() => setInputValue((prev) => prev + '"대사"')}
            className="rounded-md px-2 py-1 text-xs text-[#9ca3af] hover:bg-white/10 hover:text-white"
          >
            "대사"
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || disabled}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#14b8a6] text-white hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

---

## 11. `app/features/chat/components/chat-header-bar.tsx` (생성)

`chat.tsx` lines 478-583의 헤더 + 드롭다운 메뉴를 추출한다.

```typescript
/**
 * 채팅 헤더 바
 * 뒤로가기, 캐릭터 아바타/이름, 모델 배지, 메뉴(모델선택, 메모리, 브랜치)
 */
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Brain, Menu } from "lucide-react";
import { ModelSelector, type AIModel } from "./model-selector";

interface BranchInfo {
  branch_name: string;
  message_count: number;
  is_active: boolean;
}

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
  recommended_model: string | null;
}

interface ChatHeaderBarProps {
  character: CharacterInfo;
  roomTitle: string;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onMemoryClick: () => void;
  branches: BranchInfo[];
  onSwitchBranch: (branchName: string) => void;
}

export function ChatHeaderBar({
  character,
  roomTitle,
  selectedModel,
  onModelChange,
  onMemoryClick,
  branches,
  onSwitchBranch,
}: ChatHeaderBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative flex items-center justify-between bg-[#232323]/90 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.display_name ?? undefined}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f3f46]">
            <span className="text-lg font-semibold text-white">
              {(character.display_name ?? "?")[0]}
            </span>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-white">{character.display_name}</h2>
          <p className="text-sm text-[#9ca3af]">{roomTitle || "알수없음"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white">
          {selectedModel.toUpperCase().replace("GEMINI-", "").replace("-", " ")}
          {character.recommended_model === selectedModel && (
            <span className="ml-1 text-[10px] opacity-80">권장</span>
          )}
        </span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-4 top-full z-50 mt-2 w-56 rounded-lg bg-[#232323] p-2 shadow-lg"
        >
          <div className="mb-2 border-b border-[#3f3f46] pb-2">
            <p className="px-3 py-1 text-xs text-[#9ca3af]">AI 모델</p>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={(model) => {
                onModelChange(model);
                setShowMenu(false);
              }}
            />
          </div>

          <button
            onClick={() => {
              onMemoryClick();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <Brain className="h-4 w-4" />
            메모리 관리
          </button>

          {branches.length > 1 && (
            <div className="mt-2 border-t border-[#3f3f46] pt-2">
              <p className="px-3 py-1 text-xs text-[#9ca3af]">대화 분기</p>
              {branches.map((branch) => (
                <button
                  key={branch.branch_name}
                  onClick={() => {
                    onSwitchBranch(branch.branch_name);
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                    branch.is_active
                      ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <span>{branch.branch_name}</span>
                  <span className="text-xs text-[#9ca3af]">{branch.message_count}개</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 12. `app/features/chat/screens/chat.tsx` (리팩토링)

위에서 추출한 훅/컴포넌트를 조합하여 ~350줄로 축소한다.

**핵심**: loader는 그대로 유지. 컴포넌트만 리팩토링.

```typescript
/**
 * Chat Screen (리팩토링)
 * 훅과 컴포넌트를 조합한 메인 채팅 화면
 */
import type { Route } from "./+types/chat";
import { useLoaderData, useOutletContext } from "react-router";
import { useState, useEffect, useRef } from "react";
import { eq, desc } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { chatRooms, messages } from "../schema";
import { getActiveBranchMessages, getRoomBranches } from "../lib/branch-manager.server";

import { ChatSidebar, type ChatItem } from "~/core/components/chat-sidebar";
import type { NavigationOutletContext } from "~/core/layouts/navigation.layout";

import { useChatStreaming } from "../hooks/use-chat-streaming";
import { useChatBranches } from "../hooks/use-chat-branches";
import type { AIModel } from "../components/model-selector";
import { ModelStatusBanner } from "../components/model-status-banner";
import MemoryDrawer from "../components/memory-drawer";

import { ChatHeaderBar } from "../components/chat-header-bar";
import { ChatInputBar } from "../components/chat-input-bar";
import { MessageBubble } from "../components/message-bubble";
import { StreamingIndicator } from "../components/streaming-indicator";
import { RollbackDialog } from "../components/rollback-dialog";

// ─── Loader (기존 그대로 유지) ───
export async function loader({ request, params }: Route.LoaderArgs) {
  // ... 기존 loader 코드 그대로 복사 (lines 46-114) ...
}

// ─── Component ───
export default function ChatScreen() {
  const { room, messages: initialMessages, branches, allRooms } = useLoaderData<typeof loader>();
  const { user: navUser } = useOutletContext<NavigationOutletContext>();

  const [selectedModel, setSelectedModel] = useState<AIModel>(
    (room.character.recommended_model as AIModel) || "gemini-2.5-flash"
  );
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 훅
  const {
    messageList, isStreaming, streamingMessage,
    modelStatus, setModelStatus,
    sendMessage, regenerateMessage,
  } = useChatStreaming({ roomId: room.room_id, initialMessages, selectedModel });

  const {
    branchFetcher, showRollbackDialog, setShowRollbackDialog,
    rollbackMessageId, openRollbackDialog, confirmRollback, switchBranch,
  } = useChatBranches({ roomId: room.room_id });

  // 사이드바 데이터
  const sidebarChats: ChatItem[] = allRooms.map((r) => ({
    roomId: r.room_id,
    characterName: r.character_name ?? "Unknown",
    characterAvatarUrl: r.character_avatar_url,
    lastMessageAt: (r.last_message_at ?? r.created_at).toISOString(),
  }));

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, streamingMessage]);

  const characterInfo = {
    display_name: room.character.display_name,
    avatar_url: room.character.avatar_url,
    recommended_model: room.character.recommended_model,
  };

  return (
    <div className="flex h-[calc(100vh-57px)] w-full overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <ChatSidebar
          user={navUser ? { name: navUser.name, email: navUser.email, avatarUrl: navUser.avatarUrl } : null}
          chats={sidebarChats}
        />
      </div>

      {/* Chat Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 블러 배경 */}
        {room.character.avatar_url && (
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: `url(${room.character.avatar_url})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "blur(20px)", transform: "scale(1.1)",
          }} />
        )}
        <div className="absolute inset-0 z-0 bg-black/50" />

        {/* 메인 채팅 */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[600px] flex-col bg-black/60">
          {/* Header */}
          <ChatHeaderBar
            character={characterInfo}
            roomTitle={room.title}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onMemoryClick={() => setIsMemoryDrawerOpen(true)}
            branches={branches}
            onSwitchBranch={switchBranch}
          />

          {/* 면책 배너 */}
          <div className="bg-[#3f3f46]/80 px-4 py-2 text-center text-xs text-[#9ca3af]">
            이 캐릭터는 유저가 기입한 정보를 토대로 제작된 AI 챗봇입니다. 동명의 실존인물 혹은 단체와는 관련이 없습니다.
          </div>

          {/* 모델 상태 배너 */}
          <ModelStatusBanner
            status={modelStatus}
            currentModel={selectedModel}
            recommendedAlternatives={["gemini-2.5-flash", "claude-sonnet"]}
            onSwitchModel={(model) => setSelectedModel(model as AIModel)}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-4 py-6">
              {/* Empty state */}
              {messageList.length === 0 && !isStreaming && (
                <EmptyState character={characterInfo} roomTitle={room.title} greetingMessage={room.character.greeting_message} />
              )}

              {/* 메시지 목록 */}
              {messageList.map((msg) => (
                <MessageBubble
                  key={msg.message_id}
                  message={msg}
                  character={characterInfo}
                  onRollback={openRollbackDialog}
                  onRegenerate={regenerateMessage}
                  isStreaming={isStreaming}
                />
              ))}

              {/* 스트리밍 */}
              <StreamingIndicator
                character={characterInfo}
                isStreaming={isStreaming}
                streamingMessage={streamingMessage}
              />

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
        </div>

        {/* Memory Drawer */}
        <MemoryDrawer
          roomId={room.room_id}
          open={isMemoryDrawerOpen}
          onOpenChange={setIsMemoryDrawerOpen}
        />

        {/* Rollback Dialog */}
        <RollbackDialog
          open={showRollbackDialog}
          onOpenChange={setShowRollbackDialog}
          rollbackMessageId={rollbackMessageId}
          messageList={messageList}
          onConfirm={confirmRollback}
          isSubmitting={branchFetcher.state === "submitting"}
        />
      </div>
    </div>
  );
}

// ─── Empty State (인라인 서브 컴포넌트) ───
function EmptyState({
  character,
  roomTitle,
  greetingMessage,
}: {
  character: { display_name: string | null; avatar_url: string | null };
  roomTitle: string;
  greetingMessage: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {character.avatar_url ? (
        <img src={character.avatar_url} alt={character.display_name ?? undefined} className="mb-4 h-24 w-24 rounded-full object-cover" />
      ) : (
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#3f3f46]">
          <span className="text-3xl font-semibold text-white">{(character.display_name ?? "?")[0]}</span>
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold text-white">{character.display_name}</h3>
      <p className="mb-6 text-sm text-[#9ca3af]">{roomTitle}</p>
      {greetingMessage && (
        <div className="max-w-[320px] rounded-2xl bg-[#2f3032] px-4 py-3 text-center">
          <p className="text-sm leading-relaxed text-white">{greetingMessage}</p>
        </div>
      )}
      <p className="mt-6 text-xs text-[#6b7280]">아래에 메시지를 입력해서 대화를 시작해보세요</p>
    </div>
  );
}
```

**주의**: loader 함수는 기존 코드(lines 46-114)를 **그대로 복사**한다. 변경하지 않는다.

---

## 검증 체크리스트

1. **SQL 마이그레이션**: Supabase SQL Editor에서 `0013_f6_chat_upgrade.sql` 실행 → 에러 없이 완료
2. **테이블 확인**: `SELECT count(*) FROM chat_room_settings;` → 0 (빈 테이블)
3. **테이블 확인**: `SELECT count(*) FROM comments;` → 0
4. **컬럼 확인**: `SELECT created_by FROM room_memories LIMIT 1;` → 에러 없음
5. **타입체크**: `npm run typecheck` 통과
6. **개발 서버**: `npm run dev` → 채팅 페이지 정상 동작
7. **기능 테스트**: 메시지 전송 → 스트리밍 → 재생성 → 롤백 → 브랜치 전환 모두 기존과 동일

---

## 참고 파일 (읽기 전용)

- `app/features/chat/screens/chat.tsx` — 리팩토링 대상 (917줄)
- `app/features/chat/schema.ts` — 기존 스키마 (chatRooms, messages, roomMemories)
- `app/features/chat/lib/branch-manager.server.ts` — 브랜치 매니저 (import 유지)
- `app/features/chat/components/model-selector.tsx` — ModelSelector, AIModel 타입 (import 유지)
- `app/features/chat/components/model-status-banner.tsx` — ModelStatusBanner (import 유지)
- `app/features/chat/components/memory-drawer.tsx` — MemoryDrawer (import 유지)
- `app/core/components/chat-sidebar.tsx` — ChatSidebar, ChatItem 타입 (import 유지)
- `app/features/badges/schema.ts` — RLS 정책 패턴 참고
- `sql/migrations/0005_create_notices.sql` — 수동 마이그레이션 헤더 패턴 참고
