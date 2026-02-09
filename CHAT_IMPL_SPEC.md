# CHAT_IMPL_SPEC.md — 채팅방 기능 보강

## 개요

Figma "초안" 섹션 3 (채팅방) 분석 결과, **현재 chat.tsx 레이아웃은 이미 Figma 와이어프레임과 일치**합니다.
(3패널 블러 배경, 중앙 채팅 패널, 헤더, 면책 배너, 버블 메시지, 입력바 등)

따라서 이 스펙은 **Figma 요청사항 메모에 기재된 미구현 기능**을 보강하는 데 집중합니다.

## Figma 요청사항 vs 현재 구현

| 요구사항 | 현재 상태 | 우선순위 |
|----------|----------|---------|
| AI 모델 선택 (Gemini/Claude/Opus) | ✅ ModelSelector 구현됨 | — |
| 권장 모델 표시 (제작자 지정) | ❌ 미구현 | Medium |
| 대화 커스터마이징 (글꼴/색상/말풍선/배경) | ❌ 미구현 | Low (차후) |
| 🔄 롤백/분기 | ✅ branch-manager + rollback dialog | — |
| ♻️ 재생성 (가이드 입력, 이전 비교) | ❌ 미구현 | **High** |
| 🧠 요약 메모리 | ✅ memory-drawer + memory-manager | — |
| 💾 대화 저장/공유 | ❌ 미구현 | Low (차후) |
| 모델 상태 알림 배너 | △ 컴포넌트 존재, 미연동 | Medium |

**이번 스펙 범위:** High + Medium 우선순위 3개

1. **메시지 재생성 (Regenerate)** — High
2. **모델 상태 배너 연동** — Medium
3. **권장 모델 표시** — Medium

## 파일 구조

```
수정 대상:
  app/features/chat/screens/chat.tsx                    # 재생성 버튼 + 모델 배너 연동
  app/features/chat/api/chat.tsx                        # 재생성 API 지원 (regenerate mode)
  app/features/characters/schema.ts                     # recommended_model 컬럼 추가 (optional)

기존 활용 (수정 가능):
  app/features/chat/components/model-status-banner.tsx   # 다크 테마 적용 + chat.tsx에 연동
  app/features/chat/components/model-selector.tsx        # 권장 모델 하이라이트

신규 생성 없음 (기존 파일 수정으로 처리)
```

## Phase 1: 메시지 재생성 (Regenerate)

### 1-1. 기능 설명

사용자가 AI 응답에 만족하지 못할 때 **같은 맥락에서 다른 응답을 생성**하는 기능.

- AI 메시지 호버 시 "재생성" 버튼 표시 (기존 "되돌리기" 옆)
- 클릭 → 해당 AI 메시지를 삭제하고 같은 user 메시지로 새 응답 생성
- 선택적: 가이드 텍스트 입력 ("더 길게", "분위기를 바꿔서" 등)

### 1-2. UI 변경 — `chat.tsx`

**메시지 액션 영역 (기존 "되돌리기" 옆에 추가):**

```tsx
{/* AI 메시지에만 재생성 버튼 표시 */}
{msg.role === "assistant" && typeof msg.message_id === 'number' && msg.message_id > 0 && (
  <button
    onClick={() => handleRegenerate(msg.message_id)}
    className="flex items-center gap-1 text-xs text-[#9ca3af] opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100"
    title="재생성"
    disabled={isStreaming}
  >
    <RefreshCw className="h-3 w-3" />
    재생성
  </button>
)}
```

**재생성 핸들러:**

```typescript
const handleRegenerate = async (aiMessageId: number) => {
  if (isStreaming) return;

  // 재생성할 AI 메시지 찾기
  const aiMsgIndex = messageList.findIndex(m => m.message_id === aiMessageId);
  if (aiMsgIndex === -1) return;

  // 바로 직전 user 메시지 찾기
  const userMsg = messageList
    .slice(0, aiMsgIndex)
    .reverse()
    .find(m => m.role === "user");
  if (!userMsg) return;

  // AI 메시지를 목록에서 제거 (UI 즉시 반영)
  setMessageList(prev => prev.filter(m => m.message_id !== aiMessageId));

  // 스트리밍 시작
  setIsStreaming(true);
  setStreamingMessage("");

  try {
    const response = await fetch("/api/chat/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: room.room_id,
        message: userMsg.content,
        model: selectedModel,
        regenerate: true,               // 재생성 플래그
        replace_message_id: aiMessageId, // 교체할 메시지 ID
      }),
    });

    // ... 기존 스트리밍 로직 동일 ...
  } catch (error) {
    // 에러 시 원래 메시지 복원
    setMessageList(prev => {
      const restored = [...prev];
      restored.splice(aiMsgIndex, 0, messageList[aiMsgIndex]);
      return restored;
    });
    setIsStreaming(false);
  }
};
```

### 1-3. API 변경 — `chat/api/chat.tsx`

기존 `POST /api/chat/message` 엔드포인트에 `regenerate` 모드 추가:

```typescript
// 요청 body에 추가 필드
const bodySchema = z.object({
  room_id: z.number(),
  message: z.string(),
  model: z.string().optional(),
  regenerate: z.boolean().optional().default(false),
  replace_message_id: z.number().optional(),
});

// regenerate=true일 때:
// 1. replace_message_id에 해당하는 기존 AI 메시지를 soft-delete (is_deleted = 1)
// 2. user 메시지는 재전송하지 않음 (이미 DB에 있음)
// 3. 새 AI 응답 생성 → 같은 sequence_number 위치에 INSERT
// 4. SSE 스트리밍은 동일
```

**주의:** 재생성 시 user 메시지를 다시 INSERT하면 안 됨. 기존 user 메시지를 기준으로 AI 응답만 새로 생성.

### 1-4. import 추가

```typescript
import { RefreshCw } from "lucide-react";  // chat.tsx에 추가
```

## Phase 2: 모델 상태 배너 연동

### 2-1. 기능 설명

AI 모델 서버가 불안정할 때 채팅방 상단에 경고 배너를 표시하고 대안 모델 전환을 유도.

### 2-2. `model-status-banner.tsx` 다크 테마 적용

현재 컴포넌트는 light 테마 기반 (`Alert variant="destructive"`). 다크 테마로 수정:

```tsx
export function ModelStatusBanner({
  status,
  currentModel,
  recommendedAlternatives = [],
  onSwitchModel,
}: ModelStatusBannerProps) {
  if (status === "stable") return null;

  return (
    <div className="mx-4 mt-2 flex items-center gap-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-4 py-3">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#f59e0b]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#f59e0b]">
          모델 상태: {status === "unstable" ? "불안정" : "중단"}
        </p>
        <p className="text-xs text-[#9ca3af]">
          현재 모델({currentModel})이 불안정합니다. 다른 모델을 권장합니다.
        </p>
      </div>
      {recommendedAlternatives.length > 0 && (
        <div className="flex gap-2">
          {recommendedAlternatives.map((model) => (
            <button
              key={model}
              onClick={() => onSwitchModel?.(model)}
              className="rounded-md bg-[#f59e0b] px-3 py-1 text-xs font-medium text-white hover:bg-[#d97706]"
            >
              {model}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2-3. `chat.tsx`에 배너 연동

```tsx
import { ModelStatusBanner, type ModelStatus } from "../components/model-status-banner";

// 상태 관리 (간단 구현: 하드코딩 또는 API 폴링)
const [modelStatus, setModelStatus] = useState<ModelStatus>("stable");

// 면책 배너 아래에 삽입
{/* 모델 상태 배너 */}
<ModelStatusBanner
  status={modelStatus}
  currentModel={selectedModel}
  recommendedAlternatives={["gemini-2.5-flash", "claude-sonnet"]}
  onSwitchModel={(model) => setSelectedModel(model as AIModel)}
/>
```

**모델 상태 감지:** 메시지 전송 실패 시 `modelStatus`를 "unstable"로 설정하고, 성공 시 "stable"로 복구하는 간단한 로직으로 구현.

```typescript
// handleSend의 catch 블록에 추가
catch (error) {
  setModelStatus("unstable");
  // ... 기존 에러 처리 ...
}

// 스트리밍 성공 시 (data.done 수신 시)
if (data.done) {
  setModelStatus("stable");
  // ... 기존 성공 처리 ...
}
```

## Phase 3: 권장 모델 표시

### 3-1. 기능 설명

캐릭터 제작자가 캐릭터에 "권장 모델"을 설정하면, 채팅방에서 해당 모델이 하이라이트됨.

### 3-2. Schema 변경 (Optional)

`characters` 테이블에 `recommended_model` 컬럼 추가:

```typescript
// app/features/characters/schema.ts
recommended_model: text(),  // 'gemini-2.5-pro' | 'claude-sonnet' | null
```

> **대안 (스키마 변경 없이):** `characters.metadata` JSON 컬럼이 있다면 그 안에 저장. 또는 처음에는 스킵하고 기본 모델 사용.

### 3-3. Loader에서 권장 모델 반환

```typescript
// chat.tsx loader에서 character 조회 시 추가
const [room] = await db
  .select({
    // ... 기존 필드 ...
    character: {
      // ... 기존 필드 ...
      recommended_model: characters.recommended_model,  // 추가
    },
  })
  // ...

return { room, messages: messageList, branches };
```

### 3-4. UI — 권장 모델 배지 + 자동 선택

```tsx
// 초기 모델 선택: 캐릭터 권장 모델 우선
const [selectedModel, setSelectedModel] = useState<AIModel>(
  (room.character.recommended_model as AIModel) || "gemini-2.5-flash"
);

// 헤더 모델 뱃지에 "권장" 표시
<span className="rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white">
  {selectedModel.toUpperCase().replace("GEMINI-", "").replace("-", " ")}
  {room.character.recommended_model === selectedModel && (
    <span className="ml-1 text-[10px] opacity-80">권장</span>
  )}
</span>
```

### 3-5. ModelSelector에서 권장 모델 하이라이트

```tsx
// model-selector.tsx의 ModelOption에 이미 recommended 필드 있음
// chat.tsx에서 availableModels를 전달할 때 권장 모델 마킹

const modelsWithRecommended = defaultModels.map(m => ({
  ...m,
  recommended: m.id === room.character.recommended_model ? true : m.recommended,
}));
```

## 구현 순서

1. **Phase 1:** 재생성 기능 (chat.tsx UI + API 수정)
2. **Phase 2:** 모델 상태 배너 (기존 컴포넌트 다크 테마 + 연동)
3. **Phase 3:** 권장 모델 (schema 추가 + loader 수정 + UI)
4. **검증:** `npm run typecheck` → 0 errors

## 차후 구현 (이번 스펙 범위 밖)

| 기능 | 설명 | 복잡도 |
|------|------|--------|
| 대화 커스터마이징 | 글꼴 크기, 말풍선 색상, 배경 이미지 설정 패널 | High |
| 대화 저장/공유 | 프로필 갤러리에 대화 스냅샷 저장 | High |
| 가이드 입력 재생성 | 재생성 시 "더 길게" 등 가이드 텍스트 입력 | Medium |
| 이전 버전 비교 | 재생성 전/후 메시지 비교 UI | Medium |
| 크랙 스타일 메시지 | 소설형 메시지 포맷 (캐릭터명 \| 대사 + 지문) | Medium |

## 참조 파일

| 파일 | 참조 목적 |
|------|----------|
| `app/features/chat/screens/chat.tsx` (737줄) | 수정 대상 메인 파일 |
| `app/features/chat/api/chat.tsx` | 재생성 API 추가 |
| `app/features/chat/components/model-status-banner.tsx` | 다크 테마 수정 + 연동 |
| `app/features/chat/components/model-selector.tsx` | 권장 모델 하이라이트 |
| `app/features/chat/schema.ts` | messages 테이블 구조 참고 |
| `app/features/characters/schema.ts` | recommended_model 컬럼 추가 |
| `app/features/chat/lib/branch-manager.server.ts` | 분기 로직 참고 |

## 주의 사항

### 재생성 vs 롤백 차이

- **롤백:** 특정 메시지 시점으로 돌아가 새 분기 생성 (기존 대화 보존)
- **재생성:** 마지막 AI 응답만 교체 (분기 없음, 단순 교체)

### 재생성 시 DB 처리

1. 기존 AI 메시지: `is_deleted = 1`로 soft-delete
2. 새 AI 메시지: 같은 `sequence_number`에 INSERT
3. `chat_rooms.last_message` 업데이트
4. 포인트 차감 (새 AI 응답 생성 비용)

### 모델 상태 감지 한계

현재는 간단한 클라이언트 사이드 감지 (에러 발생 시 unstable). 서버 사이드 health check API는 차후 구현.
