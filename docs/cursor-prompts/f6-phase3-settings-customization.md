# F6 채팅방 Phase 3: 대화 설정 + 커스터마이징

## 개요
대화 설정 모달(모델 선택, 세션명), 커스터마이징 모달(폰트/배경), 데스크톱 설정 패널(사이드바)을 구현한다. Phase 1에서 생성한 `chat_room_settings` 테이블을 활용한다.

**전제조건**: Phase 1 (스키마 + 리팩토링) 완료, Phase 2 (채팅 개선) 완료

## 사전 작업

shadcn/ui Slider 컴포넌트 추가:
```bash
npx shadcn@latest add slider
```

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `chat/api/room-settings.tsx` | 생성 |
| 2 | `chat/hooks/use-room-settings.ts` | 생성 |
| 3 | `chat/components/conversation-settings-modal.tsx` | 생성 |
| 4 | `chat/components/customizing-modal.tsx` | 생성 |
| 5 | `chat/components/chat-settings-panel.tsx` | 생성 |
| 6 | `chat/screens/chat.tsx` | 수정 |
| 7 | `chat/api/chat.tsx` | 수정 |
| 8 | `app/routes.ts` | 수정 |

---

## 1. `chat/api/room-settings.tsx` (생성)

```typescript
/**
 * Room Settings API
 * GET: 룸 설정 로드 (없으면 기본값)
 * POST: 설정 upsert
 */
import { data } from "react-router";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import drizzle from "~/core/db/drizzle-client.server";
import { chatRooms, chatRoomSettings } from "../schema";

const DEFAULT_SETTINGS = {
  font_size: 16,
  background_image_url: null,
  background_enabled: 1,
  character_nickname: null,
  multi_image: 0,
  response_length: 2000,
  positivity_bias: 0,
  anti_impersonation: 1,
  realtime_output: 1,
};

export async function loader({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const roomId = parseInt(url.searchParams.get("room_id") || "0");
  if (!roomId) throw new Response("room_id required", { status: 400 });

  // 소유권 확인
  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(and(eq(chatRooms.room_id, roomId), eq(chatRooms.user_id, user.id)))
    .limit(1);
  if (!room) throw new Response("Room not found", { status: 404 });

  const [settings] = await drizzle
    .select()
    .from(chatRoomSettings)
    .where(and(eq(chatRoomSettings.room_id, roomId), eq(chatRoomSettings.user_id, user.id)))
    .limit(1);

  return data({ settings: settings || { ...DEFAULT_SETTINGS, room_id: roomId } }, { headers });
}

const updateSchema = z.object({
  room_id: z.number(),
  font_size: z.number().min(12).max(24).optional(),
  background_image_url: z.string().nullable().optional(),
  background_enabled: z.number().min(0).max(1).optional(),
  character_nickname: z.string().nullable().optional(),
  multi_image: z.number().min(0).max(1).optional(),
  response_length: z.number().min(500).max(8000).optional(),
  positivity_bias: z.number().min(0).max(1).optional(),
  anti_impersonation: z.number().min(0).max(1).optional(),
  realtime_output: z.number().min(0).max(1).optional(),
});

export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const body = updateSchema.parse(await request.json());

  // 소유권 확인
  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(and(eq(chatRooms.room_id, body.room_id), eq(chatRooms.user_id, user.id)))
    .limit(1);
  if (!room) throw new Response("Room not found", { status: 404 });

  // upsert: 있으면 update, 없으면 insert
  const [existing] = await drizzle
    .select({ setting_id: chatRoomSettings.setting_id })
    .from(chatRoomSettings)
    .where(and(eq(chatRoomSettings.room_id, body.room_id), eq(chatRoomSettings.user_id, user.id)))
    .limit(1);

  const { room_id, ...updateFields } = body;

  if (existing) {
    await drizzle
      .update(chatRoomSettings)
      .set({ ...updateFields, updated_at: new Date() })
      .where(eq(chatRoomSettings.setting_id, existing.setting_id));
  } else {
    await drizzle
      .insert(chatRoomSettings)
      .values({ room_id, user_id: user.id, ...updateFields });
  }

  return data({ success: true }, { headers });
}
```

---

## 2. `chat/hooks/use-room-settings.ts` (생성)

```typescript
/**
 * 룸 설정 훅
 * 설정 로드/저장, 로컬 상태 관리
 */
import { useState, useEffect, useCallback } from "react";

interface RoomSettings {
  font_size: number;
  background_image_url: string | null;
  background_enabled: number;
  character_nickname: string | null;
  multi_image: number;
  response_length: number;
  positivity_bias: number;
  anti_impersonation: number;
  realtime_output: number;
}

const DEFAULT_SETTINGS: RoomSettings = {
  font_size: 16,
  background_image_url: null,
  background_enabled: 1,
  character_nickname: null,
  multi_image: 0,
  response_length: 2000,
  positivity_bias: 0,
  anti_impersonation: 1,
  realtime_output: 1,
};

export function useRoomSettings(roomId: number) {
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/chat/room-settings?room_id=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const updateSetting = useCallback(
    async <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await fetch("/api/chat/room-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, [key]: value }),
        });
      } catch (error) {
        console.error("Failed to save setting:", error);
      }
    },
    [roomId]
  );

  const updateMultiple = useCallback(
    async (updates: Partial<RoomSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
      try {
        await fetch("/api/chat/room-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomId, ...updates }),
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    [roomId]
  );

  return { settings, isLoading, updateSetting, updateMultiple };
}
```

---

## 3. `chat/components/conversation-settings-modal.tsx` (생성)

대화 시작 전/중 설정 모달: 모델 선택(라디오), 세션명 입력.

```typescript
/**
 * 대화 설정 모달
 * AI 모델 선택(라디오 + 권장 배지) + 세션명 입력 + [적용하기]
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import type { AIModel } from "./model-selector";

// 사용 가능한 모델 목록 (model-selector.tsx의 AVAILABLE_MODELS와 동기화)
const MODELS: { id: AIModel; label: string }[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "claude-sonnet", label: "Claude Sonnet" },
  { id: "claude-opus", label: "Claude Opus" },
  { id: "gpt-4o", label: "GPT-4o" },
];

interface ConversationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: AIModel;
  recommendedModel: string | null;
  roomTitle: string;
  onApply: (model: AIModel, title: string) => void;
}

export function ConversationSettingsModal({
  open,
  onOpenChange,
  currentModel,
  recommendedModel,
  roomTitle,
  onApply,
}: ConversationSettingsModalProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(currentModel);
  const [title, setTitle] = useState(roomTitle);

  const handleApply = () => {
    onApply(selectedModel, title);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#181D27] max-w-md">
        <DialogHeader>
          <DialogTitle>대화 설정</DialogTitle>
        </DialogHeader>

        {/* 모델 선택 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-[#181D27] dark:text-white">AI 모델</p>
          <div className="space-y-2">
            {MODELS.map((model) => (
              <label
                key={model.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  selectedModel === model.id
                    ? "border-[#14b8a6] bg-[#14b8a6]/5"
                    : "border-[#E9EAEB] hover:border-[#14b8a6]/50 dark:border-[#333741]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    className="accent-[#14b8a6]"
                  />
                  <span className="text-sm text-[#181D27] dark:text-white">{model.label}</span>
                </div>
                {recommendedModel === model.id && (
                  <span className="rounded-full bg-[#14b8a6] px-2 py-0.5 text-xs text-white">
                    권장
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 세션명 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-[#181D27] dark:text-white">세션명</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="대화 제목을 입력하세요"
            className="w-full rounded-lg border border-[#E9EAEB] bg-transparent px-4 py-3 text-sm dark:border-[#333741] dark:text-white"
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleApply}
            className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. `chat/components/customizing-modal.tsx` (생성)

캐릭터 닉네임, 폰트 크기 슬라이더, 배경 이미지 업로드.

```typescript
/**
 * 대화 커스터마이징 모달
 * 캐릭터 닉네임, 글씨 크기(6단계), 배경 이미지, [적용하기]
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import { Slider } from "~/core/components/ui/slider";
import { ImagePlus } from "lucide-react";

interface CustomizingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterNickname: string | null;
  fontSize: number;
  backgroundImageUrl: string | null;
  onApply: (settings: {
    character_nickname: string | null;
    font_size: number;
    background_image_url: string | null;
  }) => void;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

export function CustomizingModal({
  open,
  onOpenChange,
  characterNickname,
  fontSize,
  backgroundImageUrl,
  onApply,
}: CustomizingModalProps) {
  const [nickname, setNickname] = useState(characterNickname || "");
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [bgUrl, setBgUrl] = useState(backgroundImageUrl);
  const [uploading, setUploading] = useState(false);

  const fontSizeIndex = FONT_SIZES.indexOf(currentFontSize);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("최대 5MB까지 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    try {
      // base64로 변환 후 upload-media API 사용
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/characters/upload-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, type: "chat-background" }),
        });
        const data = await res.json();
        if (data.url) setBgUrl(data.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleApply = () => {
    onApply({
      character_nickname: nickname.trim() || null,
      font_size: currentFontSize,
      background_image_url: bgUrl,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#181D27] max-w-md">
        <DialogHeader>
          <DialogTitle>대화 커스터마이징</DialogTitle>
        </DialogHeader>

        {/* 캐릭터명 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">캐릭터명</p>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="캐릭터명을 입력해주세요!"
            className="w-full rounded-lg border border-[#E9EAEB] bg-transparent px-4 py-3 text-sm dark:border-[#333741] dark:text-white"
          />
          <p className="mt-1 text-xs text-[#9ca3af]">내가 입력한 채팅방입니다!</p>
        </div>

        {/* 채팅방 글씨 크기 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">채팅방 글씨 크기</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9ca3af]">가</span>
            <Slider
              value={[fontSizeIndex >= 0 ? fontSizeIndex : 2]}
              onValueChange={([idx]) => setCurrentFontSize(FONT_SIZES[idx])}
              min={0}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-lg font-bold text-[#181D27] dark:text-white">가</span>
          </div>
          <p className="mt-1 text-center text-xs text-[#9ca3af]">{currentFontSize}px</p>
        </div>

        {/* 대화 배경 설정 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">대화 배경 설정</p>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-[#E9EAEB] bg-[#FAFAFA] p-6 dark:border-[#333741] dark:bg-[#1F242F]">
            {bgUrl ? (
              <img src={bgUrl} alt="배경" className="h-32 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-[#E9EAEB] dark:bg-[#333741]">
                <ImagePlus className="h-10 w-10 text-[#9ca3af]" />
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-[#E9EAEB] px-4 py-2 text-sm text-[#535862] hover:bg-[#F5F5F5] dark:border-[#333741] dark:text-[#94969C]">
              {uploading ? "업로드 중..." : "컴퓨터에서 업로드 하기"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-[#14b8a6]">* 최대 5MB까지 업로드 가능합니다.</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleApply}
            className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. `chat/components/chat-settings-panel.tsx` (생성)

데스크톱 우측 사이드바. 모든 설정 토글.

```typescript
/**
 * 채팅 설정 패널 (데스크톱 사이드바)
 * 크레딧, 이미지, 배경, 폰트, 응답 길이, 각종 토글
 */
import { Switch } from "~/core/components/ui/switch";
import { Slider } from "~/core/components/ui/slider";
import { X, Brain, BookOpen } from "lucide-react";

interface ChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: {
    font_size: number;
    background_enabled: number;
    multi_image: number;
    response_length: number;
    positivity_bias: number;
    anti_impersonation: number;
    realtime_output: number;
  };
  onUpdateSetting: (key: string, value: number | string | null) => void;
  onOpenMemory: () => void;
  jellyBalance?: number;
}

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

export function ChatSettingsPanel({
  open,
  onClose,
  settings,
  onUpdateSetting,
  onOpenMemory,
  jellyBalance = 0,
}: ChatSettingsPanelProps) {
  if (!open) return null;

  const fontSizeIndex = FONT_SIZES.indexOf(settings.font_size);

  return (
    <div className="w-80 border-l border-[#3f3f46] bg-[#1a1a1a] text-white overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#3f3f46] px-4 py-3">
        <h3 className="text-sm font-semibold">채팅 설정</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* 크레딧 */}
        <div className="rounded-lg bg-[#232323] p-3">
          <p className="text-xs text-[#9ca3af]">잔여 크레딧</p>
          <p className="text-lg font-bold text-[#14b8a6]">
            {jellyBalance.toLocaleString()} 젤리
          </p>
        </div>

        {/* 멀티 이미지 */}
        <SettingRow
          label="멀티 이미지"
          checked={settings.multi_image === 1}
          onChange={(v) => onUpdateSetting("multi_image", v ? 1 : 0)}
        />

        {/* 배경 이미지 */}
        <SettingRow
          label="배경 이미지"
          checked={settings.background_enabled === 1}
          onChange={(v) => onUpdateSetting("background_enabled", v ? 1 : 0)}
        />

        {/* 폰트 크기 */}
        <div>
          <p className="mb-2 text-sm text-[#d1d5db]">글씨 크기</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280]">가</span>
            <Slider
              value={[fontSizeIndex >= 0 ? fontSizeIndex : 2]}
              onValueChange={([idx]) => onUpdateSetting("font_size", FONT_SIZES[idx])}
              min={0}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-base font-bold">가</span>
          </div>
        </div>

        {/* 응답 길이 */}
        <div>
          <p className="mb-2 text-sm text-[#d1d5db]">응답 길이</p>
          <Slider
            value={[settings.response_length]}
            onValueChange={([val]) => onUpdateSetting("response_length", val)}
            min={500}
            max={8000}
            step={500}
          />
          <p className="mt-1 text-xs text-[#6b7280]">{settings.response_length} tokens</p>
        </div>

        {/* 토글들 */}
        <SettingRow
          label="긍정 바이어스"
          checked={settings.positivity_bias === 1}
          onChange={(v) => onUpdateSetting("positivity_bias", v ? 1 : 0)}
        />
        <SettingRow
          label="사칭 방지"
          checked={settings.anti_impersonation === 1}
          onChange={(v) => onUpdateSetting("anti_impersonation", v ? 1 : 0)}
        />
        <SettingRow
          label="실시간 출력"
          checked={settings.realtime_output === 1}
          onChange={(v) => onUpdateSetting("realtime_output", v ? 1 : 0)}
        />

        {/* 링크 */}
        <button
          onClick={onOpenMemory}
          className="flex w-full items-center gap-2 rounded-lg border border-[#3f3f46] px-3 py-2 text-sm hover:bg-white/10"
        >
          <Brain className="h-4 w-4" />
          요약 관리
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#d1d5db]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
```

---

## 6. `chat/screens/chat.tsx` (수정)

### 6-1. import 추가
```typescript
import { useRoomSettings } from "../hooks/use-room-settings";
import { ConversationSettingsModal } from "../components/conversation-settings-modal";
import { CustomizingModal } from "../components/customizing-modal";
import { ChatSettingsPanel } from "../components/chat-settings-panel";
```

### 6-2. 훅/상태 추가
```typescript
const { settings, updateSetting, updateMultiple } = useRoomSettings(room.room_id);
const [convSettingsOpen, setConvSettingsOpen] = useState(false);
const [customizingOpen, setCustomizingOpen] = useState(false);
const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
```

### 6-3. 메시지 버블에 fontSize 적용

`MessageBubble`에 `fontSize` prop 전달, 또는 컨테이너에 CSS 변수 설정:
```typescript
<div className="space-y-4 px-4 py-6" style={{ fontSize: `${settings.font_size}px` }}>
```

### 6-4. 배경 이미지 설정 반영

기존 캐릭터 아바타 블러 배경 옆에 커스텀 배경 조건 추가:
```typescript
{settings.background_enabled === 1 && settings.background_image_url ? (
  <div className="absolute inset-0 z-0" style={{
    backgroundImage: `url(${settings.background_image_url})`,
    backgroundSize: "cover", backgroundPosition: "center",
  }} />
) : room.character.avatar_url ? (
  // 기존 블러 배경
) : null}
```

### 6-5. 설정 패널 레이아웃

채팅 영역 옆에 사이드바:
```typescript
<div className="relative flex flex-1 overflow-hidden">
  {/* 기존 채팅 영역 */}
  <div className="relative z-10 mx-auto flex h-full w-full max-w-[600px] flex-col bg-black/60">
    ...
  </div>

  {/* 설정 패널 (데스크톱) */}
  <ChatSettingsPanel
    open={settingsPanelOpen}
    onClose={() => setSettingsPanelOpen(false)}
    settings={settings}
    onUpdateSetting={updateSetting}
    onOpenMemory={() => setIsMemoryDrawerOpen(true)}
  />
</div>
```

### 6-6. 헤더 메뉴에 설정 버튼 추가

`ChatHeaderBar`에 `onSettingsClick`, `onCustomizingClick` prop 추가:
- 메뉴 드롭다운에 "대화 설정", "커스터마이징" 버튼 2개 추가
- 데스크톱에서는 "설정 패널" 버튼도 추가

### 6-7. 모달 JSX 추가
```typescript
<ConversationSettingsModal
  open={convSettingsOpen}
  onOpenChange={setConvSettingsOpen}
  currentModel={selectedModel}
  recommendedModel={room.character.recommended_model}
  roomTitle={room.title}
  onApply={(model, title) => {
    setSelectedModel(model);
    // title 업데이트는 별도 API 호출 또는 revalidator 사용
  }}
/>

<CustomizingModal
  open={customizingOpen}
  onOpenChange={setCustomizingOpen}
  characterNickname={settings.character_nickname}
  fontSize={settings.font_size}
  backgroundImageUrl={settings.background_image_url}
  onApply={(s) => updateMultiple(s)}
/>
```

---

## 7. `chat/api/chat.tsx` (수정)

`max_output_tokens` 파라미터 수용:
```typescript
// bodySchema에 추가
max_output_tokens: z.number().min(500).max(8000).optional(),
anti_impersonation: z.boolean().optional(),
```

AI 호출 시 `maxTokens` 적용 및 사칭 방지 프롬프트 조건부 포함.

---

## 8. `app/routes.ts` (수정)

기존 `/api/chat` 블록에 추가:
```typescript
route("/room-settings", "features/chat/api/room-settings.tsx"),
```

---

## 검증 체크리스트

1. `npm run typecheck` 통과
2. 대화 설정 모달 → 모델 선택 + 세션명 변경 → [적용하기] → 반영
3. 커스터마이징 모달 → 폰트 크기 슬라이더 → 채팅 글씨 크기 변경
4. 배경 이미지 업로드 → 채팅 화면 배경 변경
5. 설정 패널 토글 ON/OFF → 즉시 반영 + DB 저장
6. 페이지 새로고침 → 설정값 유지

## 참고 파일

- `app/features/chat/schema.ts` (chatRoomSettings 테이블, Phase 1에서 추가)
- `app/features/chat/hooks/use-chat-streaming.ts` (Phase 1)
- `app/features/chat/components/chat-header-bar.tsx` (Phase 1)
- `app/features/characters/api/upload-media.tsx` (이미지 업로드 패턴)
- `app/core/components/ui/slider.tsx` (새로 추가할 shadcn 컴포넌트)
- `app/core/components/ui/switch.tsx` (기존 shadcn 컴포넌트)
