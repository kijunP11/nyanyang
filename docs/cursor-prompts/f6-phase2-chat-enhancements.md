# F6 채팅방 Phase 2: 채팅 개선 (재생성 가이드 + 요약 + 제안 액션 + 모델 경고)

## 개요
Phase 1에서 리팩토링한 채팅 화면에 4가지 기능을 추가한다:
1. 재생성 시 가이드 입력 + 이전/새 응답 비교
2. 인라인 요약 버튼 + 요약 블록
3. AI 응답 아래 제안 액션 칩
4. 모델 불안정 상세 경고 모달

**전제조건**: Phase 1 리팩토링 완료 (훅/컴포넌트 분리 상태)

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `chat/components/regeneration-dialog.tsx` | 생성 |
| 2 | `chat/components/regeneration-comparison.tsx` | 생성 |
| 3 | `chat/hooks/use-regeneration-history.ts` | 생성 |
| 4 | `chat/components/summary-button.tsx` | 생성 |
| 5 | `chat/components/summary-block.tsx` | 생성 |
| 6 | `chat/components/suggested-actions.tsx` | 생성 |
| 7 | `chat/components/model-warning-modal.tsx` | 생성 |
| 8 | `chat/api/summary.tsx` | 생성 |
| 9 | `chat/api/chat.tsx` | 수정 |
| 10 | `chat/hooks/use-chat-streaming.ts` | 수정 |
| 11 | `chat/screens/chat.tsx` | 수정 |
| 12 | `app/routes.ts` | 수정 |

---

## 1. `chat/components/regeneration-dialog.tsx` (생성)

재생성 전 가이드 텍스트를 입력하는 Dialog.

```typescript
/**
 * 재생성 가이드 입력 다이얼로그
 * "이런 방향으로 다시 써줘" 가이드를 입력 후 재생성
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";

interface RegenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (guidance: string) => void;
  isStreaming: boolean;
}

export function RegenerationDialog({
  open,
  onOpenChange,
  onConfirm,
  isStreaming,
}: RegenerationDialogProps) {
  const [guidance, setGuidance] = useState("");

  const handleConfirm = () => {
    onConfirm(guidance.trim());
    setGuidance("");
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm(""); // 가이드 없이 재생성
    setGuidance("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#232323] border-[#3f3f46] text-white">
        <DialogHeader>
          <DialogTitle>재생성</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            원하는 방향이 있으면 아래에 입력해주세요. 비워두면 그대로 재생성합니다.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="예: 더 감정적으로 표현해줘, 짧게 대답해줘..."
          rows={3}
          className="w-full rounded-lg border border-[#3f3f46] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] focus:outline-none"
        />
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isStreaming}
            className="border-[#3f3f46] text-white hover:bg-white/10"
          >
            그냥 재생성
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isStreaming}
            className="bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            가이드 적용 후 재생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 2. `chat/components/regeneration-comparison.tsx` (생성)

재생성 후 이전/새 응답을 비교하는 컴포넌트. 메시지 위에 인라인으로 표시.

```typescript
/**
 * 재생성 비교 뷰
 * 이전 응답 vs 새 응답, [새 응답 유지] / [이전으로 되돌리기]
 */
import ReactMarkdown from "react-markdown";

interface RegenerationComparisonProps {
  previousContent: string;
  newContent: string;
  onKeepNew: () => void;
  onRevert: () => void;
}

export function RegenerationComparison({
  previousContent,
  newContent,
  onKeepNew,
  onRevert,
}: RegenerationComparisonProps) {
  return (
    <div className="mx-4 my-2 rounded-lg border border-[#3f3f46] bg-[#1a1a1a] p-4">
      <p className="mb-3 text-xs font-semibold text-[#14b8a6]">재생성 비교</p>

      {/* 이전 응답 */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-[#6b7280]">이전 응답</p>
        <div className="rounded-lg bg-[#2f3032] p-3 text-sm text-[#9ca3af] line-through opacity-60">
          {previousContent.substring(0, 300)}
          {previousContent.length > 300 ? "..." : ""}
        </div>
      </div>

      {/* 새 응답 */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-[#14b8a6]">새 응답</p>
        <div className="rounded-lg bg-[#2f3032] p-3 text-sm text-white">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            }}
          >
            {newContent.substring(0, 300)}
            {newContent.length > 300 ? "..." : ""}
          </ReactMarkdown>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onRevert}
          className="rounded-lg border border-[#3f3f46] px-3 py-1.5 text-xs text-[#9ca3af] hover:bg-white/10"
        >
          이전으로 되돌리기
        </button>
        <button
          onClick={onKeepNew}
          className="rounded-lg bg-[#14b8a6] px-3 py-1.5 text-xs text-white hover:bg-[#0d9488]"
        >
          새 응답 유지
        </button>
      </div>
    </div>
  );
}
```

---

## 3. `chat/hooks/use-regeneration-history.ts` (생성)

재생성 이전 콘텐츠를 임시 저장하는 훅.

```typescript
/**
 * 재생성 히스토리 훅
 * 마지막 재생성의 이전/새 콘텐츠를 추적
 */
import { useState, useCallback } from "react";

interface RegenerationRecord {
  messageId: number;
  previousContent: string;
  newContent: string;
}

export function useRegenerationHistory() {
  const [comparison, setComparison] = useState<RegenerationRecord | null>(null);

  const recordRegeneration = useCallback(
    (messageId: number, previousContent: string, newContent: string) => {
      setComparison({ messageId, previousContent, newContent });
    },
    []
  );

  const clearComparison = useCallback(() => {
    setComparison(null);
  }, []);

  return { comparison, recordRegeneration, clearComparison };
}
```

---

## 4. `chat/components/summary-button.tsx` (생성)

"최근 대화 요약하기" 인라인 버튼. 20메시지마다 메시지 사이에 렌더링.

```typescript
/**
 * 요약 버튼: 채팅 메시지 사이에 인라인으로 표시
 */
import { FileText } from "lucide-react";

interface SummaryButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function SummaryButton({ onClick, isLoading }: SummaryButtonProps) {
  return (
    <div className="flex justify-center py-2">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-full border border-[#3f3f46] bg-[#232323] px-4 py-2 text-xs text-[#9ca3af] transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6] disabled:opacity-50"
      >
        <FileText className="h-3.5 w-3.5" />
        {isLoading ? "요약 중..." : "최근 대화 요약하기"}
      </button>
    </div>
  );
}
```

---

## 5. `chat/components/summary-block.tsx` (생성)

요약 내용을 인라인 카드로 표시. 시스템 메시지 스타일.

```typescript
/**
 * 요약 블록: 채팅 중 인라인 요약 카드
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Trash2 } from "lucide-react";

interface SummaryBlockProps {
  content: string;
  messageRangeStart: number | null;
  messageRangeEnd: number | null;
  createdAt: string;
  onDelete?: () => void;
}

export function SummaryBlock({
  content,
  messageRangeStart,
  messageRangeEnd,
  createdAt,
  onDelete,
}: SummaryBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const preview = content.length > 150 ? content.substring(0, 150) + "..." : content;

  return (
    <div className="mx-4 my-3 rounded-lg border border-[#3f3f46]/50 bg-[#1a1a2e] p-4">
      {/* 헤더 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#14b8a6]" />
          <span className="text-xs font-semibold text-[#14b8a6]">대화 요약</span>
          {messageRangeStart != null && messageRangeEnd != null && (
            <span className="text-xs text-[#6b7280]">
              메시지 {messageRangeStart}-{messageRangeEnd}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded p-1 text-[#6b7280] hover:text-red-400"
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-[#6b7280] hover:text-white"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 내용 */}
      <p className="text-sm leading-relaxed text-[#d1d5db]">
        {expanded ? content : preview}
      </p>

      {/* 날짜 */}
      <p className="mt-2 text-xs text-[#6b7280]">
        {new Date(createdAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
```

---

## 6. `chat/components/suggested-actions.tsx` (생성)

AI 응답 아래 빠른 액션 칩.

```typescript
/**
 * 제안 액션 칩
 * AI 응답 아래에 표시, 클릭 시 해당 텍스트를 다음 메시지로 전송
 */

interface SuggestedActionsProps {
  actions: string[];
  onSelect: (action: string) => void;
  disabled: boolean;
}

const DEFAULT_ACTIONS = ["계속", "다른 방향으로", "더 자세히"];

export function SuggestedActions({
  actions,
  onSelect,
  disabled,
}: SuggestedActionsProps) {
  const displayActions = actions.length > 0 ? actions : DEFAULT_ACTIONS;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {displayActions.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="rounded-full border border-[#3f3f46] bg-[#232323] px-3 py-1.5 text-xs text-[#d1d5db] transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6] disabled:opacity-50"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
```

---

## 7. `chat/components/model-warning-modal.tsx` (생성)

모델 불안정 상세 경고 모달. 기존 `ModelStatusBanner` 클릭 시 오픈.

```typescript
/**
 * 모델 불안정 경고 모달
 * 현재 모델 상태 + 대체 모델 추천 + 전환 버튼
 */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { AIModel } from "./model-selector";

interface ModelWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: AIModel;
  alternatives: AIModel[];
  onSwitchModel: (model: AIModel) => void;
}

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "claude-sonnet": "Claude Sonnet",
  "claude-opus": "Claude Opus",
  "claude-haiku": "Claude Haiku",
};

export function ModelWarningModal({
  open,
  onOpenChange,
  currentModel,
  alternatives,
  onSwitchModel,
}: ModelWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#232323] border-[#3f3f46] text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <DialogTitle>모델 상태: 불안정</DialogTitle>
              <DialogDescription className="text-[#9ca3af]">
                현재 {MODEL_LABELS[currentModel] || currentModel} 모델이 불안정합니다.
                다른 모델 사용을 권장합니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 space-y-2">
          <p className="text-xs text-[#9ca3af]">추천 대체 모델</p>
          {alternatives.map((model) => (
            <button
              key={model}
              onClick={() => {
                onSwitchModel(model);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-[#3f3f46] px-4 py-3 text-sm text-white transition-colors hover:border-[#14b8a6] hover:bg-[#14b8a6]/10"
            >
              <span>{MODEL_LABELS[model] || model}</span>
              <span className="text-xs text-[#14b8a6]">전환</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#3f3f46] text-white hover:bg-white/10"
          >
            현재 모델 유지
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. `chat/api/summary.tsx` (생성)

수동 요약 트리거 + 요약 목록 조회 API.

```typescript
/**
 * Summary API
 * POST: 수동 요약 생성
 * GET: 룸의 요약 목록
 */
import { data } from "react-router";
import { z } from "zod";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import { createConversationSummary, getRoomMemories } from "../lib/memory-manager.server";
import drizzle from "~/core/db/drizzle-client.server";
import { chatRooms } from "../schema";
import { eq, and } from "drizzle-orm";

// POST: 수동 요약 트리거
export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const body = z.object({
    room_id: z.number(),
    character_name: z.string().optional(),
  }).parse(await request.json());

  // 룸 소유권 확인
  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(and(eq(chatRooms.room_id, body.room_id), eq(chatRooms.user_id, user.id)))
    .limit(1);

  if (!room) throw new Response("Room not found", { status: 404 });

  try {
    await createConversationSummary(body.room_id, body.character_name || "캐릭터");
    return data({ success: true }, { headers });
  } catch (error) {
    console.error("Summary creation failed:", error);
    return data({ success: false, error: "요약 생성에 실패했습니다." }, { headers, status: 500 });
  }
}

// GET: 요약 목록
export async function loader({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const roomId = parseInt(url.searchParams.get("room_id") || "0");
  if (!roomId) throw new Response("room_id required", { status: 400 });

  // 룸 소유권 확인
  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(and(eq(chatRooms.room_id, roomId), eq(chatRooms.user_id, user.id)))
    .limit(1);

  if (!room) throw new Response("Room not found", { status: 404 });

  const memories = await getRoomMemories(roomId);
  const summaries = memories.filter((m) => m.memory_type === "summary");

  return data({ summaries }, { headers });
}
```

**`app/routes.ts`에 추가** (`/api/chat` 블록 안):
```typescript
route("/summary", "features/chat/api/summary.tsx"),
```

---

## 9. `chat/api/chat.tsx` (수정)

### 9-1. bodySchema에 `guidance` 필드 추가

요청 바디 스키마에 추가:
```typescript
guidance: z.string().optional(), // 재생성 시 방향 힌트
```

### 9-2. 재생성 시 guidance를 시스템 프롬프트에 삽입

regenerate 처리 부분에서, `guidance`가 있으면 시스템 메시지에 추가:
```typescript
if (body.regenerate && body.guidance) {
  // context 메시지 배열의 시스템 메시지 뒤에 삽입
  contextMessages.splice(1, 0, {
    role: "system",
    content: `[재생성 가이드] 사용자가 이런 방향을 원합니다: ${body.guidance}`,
  });
}
```

### 9-3. SSE done 이벤트에 `suggested_actions` 추가

스트리밍 완료 후 done 이벤트 전송 시:
```typescript
// done 이벤트에 제안 액션 포함
const suggestedActions = ["계속", "다른 방향으로", "더 자세히"];
controller.enqueue(encoder.encode(
  `data: ${JSON.stringify({
    done: true,
    tokens: totalTokens,
    cost: pointCost,
    suggested_actions: suggestedActions,
  })}\n\n`
));
```

**참고**: AI가 제안 액션을 생성하는 것은 추후 고도화 시 추가. 현재는 고정 프리셋 사용.

---

## 10. `chat/hooks/use-chat-streaming.ts` (수정)

### 10-1. `regenerateMessage`에 guidance 파라미터 추가

```typescript
const regenerateMessage = async (aiMessageId: number, guidance?: string) => {
  // ... 기존 로직 ...
  body: JSON.stringify({
    room_id: roomId,
    message: userMsg.content,
    model: selectedModel,
    regenerate: true,
    replace_message_id: aiMessageId,
    guidance, // 추가
  }),
  // ...
};
```

### 10-2. done 이벤트에서 suggested_actions 파싱

SSE 파싱 부분에서:
```typescript
if (data.done) {
  // ... 기존 로직 ...
  if (data.suggested_actions) {
    setSuggestedActions(data.suggested_actions);
  }
}
```

`suggestedActions` 상태를 훅에 추가하고 반환값에 포함:
```typescript
const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
// return에 추가: suggestedActions, setSuggestedActions
```

---

## 11. `chat/screens/chat.tsx` (수정)

### 11-1. import 추가
```typescript
import { RegenerationDialog } from "../components/regeneration-dialog";
import { RegenerationComparison } from "../components/regeneration-comparison";
import { useRegenerationHistory } from "../hooks/use-regeneration-history";
import { SummaryButton } from "../components/summary-button";
import { SummaryBlock } from "../components/summary-block";
import { SuggestedActions } from "../components/suggested-actions";
import { ModelWarningModal } from "../components/model-warning-modal";
```

### 11-2. 상태 + 훅 추가
```typescript
const { comparison, recordRegeneration, clearComparison } = useRegenerationHistory();
const [regenDialogOpen, setRegenDialogOpen] = useState(false);
const [regenTargetId, setRegenTargetId] = useState<number | null>(null);
const [modelWarningOpen, setModelWarningOpen] = useState(false);
const [summaryLoading, setSummaryLoading] = useState(false);
const [summaries, setSummaries] = useState<any[]>([]);
```

### 11-3. 메시지 목록에 요약 블록 삽입

메시지 렌더링 루프에서 20메시지 간격으로 요약 버튼/블록 삽입:
```typescript
{messageList.map((msg, index) => (
  <>
    {/* 20메시지마다 요약 버튼 */}
    {index > 0 && index % 20 === 0 && (
      <SummaryButton onClick={handleSummary} isLoading={summaryLoading} />
    )}
    <MessageBubble ... />
  </>
))}
```

### 11-4. 마지막 AI 메시지 아래에 제안 액션

```typescript
{!isStreaming && messageList.length > 0 && messageList[messageList.length - 1].role === "assistant" && (
  <SuggestedActions
    actions={suggestedActions}
    onSelect={sendMessage}
    disabled={isStreaming}
  />
)}
```

### 11-5. ModelStatusBanner에 클릭 핸들러 연결

```typescript
<ModelStatusBanner
  status={modelStatus}
  currentModel={selectedModel}
  recommendedAlternatives={["gemini-2.5-flash", "claude-sonnet"]}
  onSwitchModel={(model) => setSelectedModel(model as AIModel)}
  onClick={() => setModelWarningOpen(true)} // 배너 클릭 → 모달 오픈
/>
```

**참고**: `ModelStatusBanner`에 `onClick` prop이 없으면 추가해야 함. 배너 전체를 button/div로 감싸고 onClick 전달.

### 11-6. 다이얼로그/모달 추가 (JSX 끝에)

```typescript
<RegenerationDialog
  open={regenDialogOpen}
  onOpenChange={setRegenDialogOpen}
  onConfirm={(guidance) => {
    if (regenTargetId != null) regenerateMessage(regenTargetId, guidance);
  }}
  isStreaming={isStreaming}
/>

<ModelWarningModal
  open={modelWarningOpen}
  onOpenChange={setModelWarningOpen}
  currentModel={selectedModel}
  alternatives={["gemini-2.5-flash", "claude-sonnet", "gpt-4o"]}
  onSwitchModel={(model) => setSelectedModel(model)}
/>
```

### 11-7. MessageBubble의 onRegenerate를 가이드 다이얼로그로 연결

기존 `onRegenerate={regenerateMessage}` 대신:
```typescript
onRegenerate={(messageId) => {
  setRegenTargetId(messageId);
  setRegenDialogOpen(true);
}}
```

---

## 12. `app/routes.ts` (수정)

기존 `/api/chat` 블록(lines 75-79)에 추가:
```typescript
...prefix("/api", [
  ...prefix("/chat", [
    route("/message", "features/chat/api/chat.tsx"),
    route("/branch", "features/chat/api/branch.tsx"),
    route("/memory", "features/chat/api/memory.tsx"),
    route("/summary", "features/chat/api/summary.tsx"), // 추가
  ]),
]),
```

---

## 검증 체크리스트

1. `npm run typecheck` 통과
2. 채팅에서 AI 메시지 재생성 → 가이드 다이얼로그 표시 → 가이드 입력 후 재생성 → AI 응답이 가이드 방향 반영
3. "그냥 재생성" → 가이드 없이 기존과 동일하게 재생성
4. AI 응답 아래 제안 액션 칩(계속/다른 방향으로/더 자세히) 표시 → 클릭 시 해당 텍스트 전송
5. 모델 불안정 배너 클릭 → 경고 모달 표시 → 대체 모델 전환
6. `POST /api/chat/summary` → 요약 생성 확인

## 참고 파일

- `app/features/chat/hooks/use-chat-streaming.ts` (Phase 1에서 생성)
- `app/features/chat/components/message-bubble.tsx` (Phase 1에서 생성)
- `app/features/chat/components/model-status-banner.tsx` (기존)
- `app/features/chat/lib/memory-manager.server.ts` (기존: createConversationSummary, getRoomMemories)
- `app/features/chat/api/chat.tsx` (기존 채팅 API)
