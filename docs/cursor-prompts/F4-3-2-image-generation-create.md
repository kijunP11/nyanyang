# F4-3-2. 이미지 생성 – 신규 캐릭터 생성 (선택 전 상태)

## 목표
3-1에서 구현한 이미지 생성 페이지의 로그인 상태 화면을 실제 이미지 생성 UI로 교체한다.
프롬프트 입력, 장르 선택, 옵션(비율/개수) 설정, 이미지 생성 API 연동, 젤리 소모까지 포함한다.

## Figma 디자인 참고 (스크린샷 기반)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NYANYANG  추천  캐릭터  내 컨텐츠  이미지 생성  뱃지/리워드    🌙 🔔 👤 │
├──────────┬──────────────────────────────────────────┬────────────────┤
│생성된이미지│  [신규 캐릭터 생성]  기존 캐릭터 수정      │  이미지 비율     │
│          │                                          │  [1:1] 4:3     │
│          │  ┌──────────────────────────────────┐    │   3:4 16:9 9:16│
│          │  │만들고 싶은 이미지의 특징을 차례대로  │    │               │
│ (사이드바) │  │적어주세요. (성별,포즈,얼굴,표정...)  │    │  이미지 개수    │
│          │  │                                  │    │  [1개] 2개     │
│          │  │ ✨프롬프트 자동생성   이미지생성하기🐱140│    │   3개  4개     │
│          │  │                           0/1000 │    │               │
│          │  └──────────────────────────────────┘    │               │
│          │                                          │               │
│          │  장르별 이미지 생성                         │               │
│          │  어떤 장르의 캐릭터를 만들고 싶으신가요?      │               │
│          │                                          │               │
│          │  [로맨스] [서브컬처] [현대극] [판타지]       │               │
│          │  [액션]  [다크/스릴러] [힐링/일상] [게임/히어로]│              │
│          │                                          │               │
└──────────┴──────────────────────────────────────────┴────────────────┘
```

---

## 1. 파일 구조

### 수정할 파일
```
app/features/image-generation/screens/image-generation.tsx  # 메인 화면 확장
```

### 새로 생성할 파일
```
app/features/image-generation/components/
├── generation-tabs.tsx        # 상단 탭 (신규/기존)
├── prompt-input.tsx           # 프롬프트 입력 영역
├── genre-cards.tsx            # 장르별 이미지 선택
├── options-panel.tsx          # 우측 옵션 패널 (비율/개수)
└── generate-button.tsx        # 생성 버튼 (별도 분리 선택)

app/features/image-generation/api/
└── generate.tsx               # 이미지 생성 API 엔드포인트

app/features/image-generation/lib/
└── constants.ts               # 장르, 비율, 개수 상수 정의
```

### 라우트 추가 (app/routes.ts)
```diff
  ...prefix("/api", [
+   ...prefix("/image-generation", [
+     route("/generate", "features/image-generation/api/generate.tsx"),
+   ]),
    ...prefix("/settings", [
```

---

## 2. 상수 정의: `lib/constants.ts`

```typescript
export const GENRES = [
  { id: "romance", label: "로맨스", sub: "순정/첫사랑/감성", color: "#F43F5E" },
  { id: "subculture", label: "서브컬처", sub: "코덕/키치/VTuber", color: "#8B5CF6" },
  { id: "modern", label: "현대극", sub: "로맨/오피스/뉴에라", color: "#3B82F6" },
  { id: "fantasy", label: "판타지", sub: "로판/이세계/다판시", color: "#6366F1" },
  { id: "action", label: "액션", sub: "핵선/밀리/무협", color: "#EF4444" },
  { id: "dark", label: "다크/스릴러", sub: "미스드/마법", color: "#1F2937" },
  { id: "healing", label: "힐링/일상", sub: "따뜻한 감성", color: "#10B981" },
  { id: "game", label: "게임/히어로", sub: "게임감성", color: "#0EA5E9" },
] as const;

export const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "4:3", label: "4:3", width: 1024, height: 768 },
  { id: "3:4", label: "3:4", width: 768, height: 1024 },
  { id: "16:9", label: "16:9", width: 1024, height: 576 },
  { id: "9:16", label: "9:16", width: 576, height: 1024 },
] as const;

export const IMAGE_COUNTS = [1, 2, 3, 4] as const;

// 이미지 1장당 젤리 비용
export const JELLY_COST_PER_IMAGE = 140;

export const MAX_PROMPT_LENGTH = 1000;
```

---

## 3. 메인 화면: `image-generation.tsx` (수정)

로그인 상태의 "곧 추가됩니다" 부분을 아래 구조로 교체:

```tsx
{isLoggedIn ? (
  <div className="flex h-full">
    {/* 중앙 메인 콘텐츠 */}
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[800px] px-6 py-6">
        {/* 1. 상단 탭 */}
        <GenerationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 2. 프롬프트 입력 영역 */}
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          onAutoGenerate={handleAutoGenerate}
          isGenerating={isGenerating}
          jellyCost={jellyCost}
        />

        {/* 3. 장르별 이미지 선택 */}
        <GenreCards
          selectedGenre={selectedGenre}
          onSelect={setSelectedGenre}
        />
      </div>
    </div>

    {/* 우측 옵션 패널 */}
    <OptionsPanel
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
      imageCount={imageCount}
      onImageCountChange={setImageCount}
    />
  </div>
) : (
  <LoginRequiredOverlay />
)}
```

### State 관리 (useState)

```typescript
const [activeTab, setActiveTab] = useState<"new" | "edit">("new");
const [prompt, setPrompt] = useState("");
const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
const [aspectRatio, setAspectRatio] = useState("1:1");
const [imageCount, setImageCount] = useState(1);
const [isGenerating, setIsGenerating] = useState(false);

const jellyCost = imageCount * JELLY_COST_PER_IMAGE;
```

---

## 4. 상단 탭: `generation-tabs.tsx`

```tsx
interface GenerationTabsProps {
  activeTab: "new" | "edit";
  onTabChange: (tab: "new" | "edit") => void;
}

export function GenerationTabs({ activeTab, onTabChange }: GenerationTabsProps) {
  return (
    <div className="mb-6 flex border-b border-[#E9EAEB] dark:border-[#333741]">
      <button
        type="button"
        onClick={() => onTabChange("new")}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${
          activeTab === "new"
            ? "border-b-2 border-[#181D27] text-[#181D27] dark:border-white dark:text-white"
            : "text-[#A4A7AE] hover:text-[#535862] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        신규 캐릭터 생성
      </button>
      <button
        type="button"
        onClick={() => onTabChange("edit")}
        className={`px-4 py-3 text-sm font-semibold transition-colors ${
          activeTab === "edit"
            ? "border-b-2 border-[#181D27] text-[#181D27] dark:border-white dark:text-white"
            : "text-[#A4A7AE] hover:text-[#535862] dark:text-[#717680] dark:hover:text-[#94969C]"
        }`}
      >
        기존 캐릭터 수정
      </button>
    </div>
  );
}
```

---

## 5. 프롬프트 입력: `prompt-input.tsx`

```tsx
import { Sparkles } from "lucide-react";
import { MAX_PROMPT_LENGTH } from "../lib/constants";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onAutoGenerate: () => void;
  isGenerating: boolean;
  jellyCost: number;
}

export function PromptInput({
  value, onChange, onGenerate, onAutoGenerate, isGenerating, jellyCost,
}: PromptInputProps) {
  const canGenerate = value.trim().length > 0 && !isGenerating;

  return (
    <div className="mb-8 rounded-xl border border-[#E9EAEB] p-5 dark:border-[#333741]">
      {/* 텍스트 입력 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
        placeholder="만들고 싶은 이미지의 특징을 차례대로 적어주세요.&#10;(성별, 포즈, 얼굴, 표정, 자세, 구도, 의상, 배경 등)"
        className="min-h-[80px] w-full resize-none bg-transparent text-sm text-[#181D27] placeholder:text-[#A4A7AE] focus:outline-none dark:text-white dark:placeholder:text-[#717680]"
        rows={3}
      />

      {/* 하단 버튼 영역 */}
      <div className="mt-3 flex items-center justify-between">
        {/* 프롬프트 자동생성 */}
        <button
          type="button"
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-[#E9EAEB] px-3 py-2 text-sm font-medium text-[#535862] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 dark:border-[#333741] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
        >
          <Sparkles className="size-4" />
          프롬프트 자동생성
        </button>

        <div className="flex items-center gap-3">
          {/* 이미지 생성하기 버튼 */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="flex items-center gap-2 rounded-lg bg-[#41C7BD] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#38b5ab] disabled:cursor-not-allowed disabled:bg-[#E9EAEB] disabled:text-[#A4A7AE] dark:disabled:bg-[#333741] dark:disabled:text-[#717680]"
          >
            이미지 생성하기
            <span className="flex items-center gap-1">
              🐱 {jellyCost}
            </span>
          </button>
        </div>
      </div>

      {/* 글자수 카운트 */}
      <div className="mt-2 text-right text-xs text-[#A4A7AE] dark:text-[#717680]">
        {value.length}/{MAX_PROMPT_LENGTH}
      </div>
    </div>
  );
}
```

---

## 6. 장르별 이미지 선택: `genre-cards.tsx`

```tsx
import { GENRES } from "../lib/constants";

interface GenreCardsProps {
  selectedGenre: string | null;
  onSelect: (genreId: string | null) => void;
}

export function GenreCards({ selectedGenre, onSelect }: GenreCardsProps) {
  return (
    <section>
      <h3 className="mb-1 text-lg font-bold text-[#181D27] dark:text-white">
        장르별 이미지 생성
      </h3>
      <p className="mb-4 text-sm text-[#535862] dark:text-[#94969C]">
        어떤 장르의 캐릭터를 만들고 싶으신가요?
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() =>
              onSelect(selectedGenre === genre.id ? null : genre.id)
            }
            className={`group relative aspect-[4/5] overflow-hidden rounded-xl transition-all ${
              selectedGenre === genre.id
                ? "ring-2 ring-[#41C7BD] ring-offset-2 dark:ring-offset-[#0C111D]"
                : "hover:scale-[1.02]"
            }`}
          >
            {/* Placeholder 배경 (나중에 실제 이미지로 교체) */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}66)`,
              }}
            />

            {/* 하단 텍스트 오버레이 */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
              <p className="text-sm font-bold text-white">
                {genre.label}{" "}
                <span className="text-xs font-normal text-white/70">
                  ({genre.sub})
                </span>
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
```

---

## 7. 우측 옵션 패널: `options-panel.tsx`

```tsx
import { ASPECT_RATIOS, IMAGE_COUNTS } from "../lib/constants";

interface OptionsPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
}

export function OptionsPanel({
  aspectRatio, onAspectRatioChange,
  imageCount, onImageCountChange,
}: OptionsPanelProps) {
  return (
    <aside className="hidden w-[180px] shrink-0 border-l border-[#E9EAEB] bg-white p-4 dark:border-[#333741] dark:bg-[#0C111D] lg:block">
      {/* 이미지 비율 */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
          이미지 비율
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onAspectRatioChange(ratio.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                aspectRatio === ratio.id
                  ? "border-[#41C7BD] bg-[#41C7BD]/10 text-[#41C7BD]"
                  : "border-[#E9EAEB] text-[#535862] hover:border-[#D5D7DA] dark:border-[#333741] dark:text-[#94969C] dark:hover:border-[#414651]"
              }`}
            >
              {/* 비율 아이콘 (비율에 맞는 사각형) */}
              <RatioIcon ratio={ratio.id} selected={aspectRatio === ratio.id} />
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 개수 */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
          이미지 개수
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {IMAGE_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onImageCountChange(count)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                imageCount === count
                  ? "border-[#41C7BD] bg-[#41C7BD] text-white"
                  : "border-[#E9EAEB] text-[#535862] hover:border-[#D5D7DA] dark:border-[#333741] dark:text-[#94969C] dark:hover:border-[#414651]"
              }`}
            >
              {count}개
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

/** 비율에 맞는 사각형 아이콘 */
function RatioIcon({ ratio, selected }: { ratio: string; selected: boolean }) {
  const sizes: Record<string, { w: number; h: number }> = {
    "1:1": { w: 20, h: 20 },
    "4:3": { w: 24, h: 18 },
    "3:4": { w: 18, h: 24 },
    "16:9": { w: 28, h: 16 },
    "9:16": { w: 16, h: 28 },
  };
  const s = sizes[ratio] || sizes["1:1"];
  return (
    <div
      className={`rounded-sm border ${
        selected ? "border-[#41C7BD]" : "border-[#D5D7DA] dark:border-[#414651]"
      }`}
      style={{ width: s.w, height: s.h }}
    />
  );
}
```

---

## 8. 이미지 생성 API: `api/generate.tsx`

### 패턴 참고
- 포인트 차감: `app/features/chat/api/chat.tsx` (lines 303-564)
- 포인트 사용 API: `app/features/points/api/usage.tsx`

### 구현

```tsx
import type { Route } from "./+types/generate";
import { data } from "react-router";
import { openai } from "@ai-sdk/openai";
import { experimental_generateImage as generateImage } from "ai";
import { eq } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { userPoints, pointTransactions } from "~/features/points/schema";
import { JELLY_COST_PER_IMAGE, ASPECT_RATIOS } from "../lib/constants";

export async function action({ request }: Route.ActionArgs) {
  // 1. 인증 확인
  const [client, headers] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return data({ error: "Unauthorized" }, { status: 401, headers });

  // 2. 요청 파싱
  const body = await request.json();
  const { prompt, genre, aspectRatio = "1:1", imageCount = 1 } = body;

  if (!prompt || prompt.trim().length === 0) {
    return data({ error: "프롬프트를 입력해주세요" }, { status: 400, headers });
  }

  // 3. 비용 계산 및 잔액 확인
  const totalCost = imageCount * JELLY_COST_PER_IMAGE;

  const [pointRecord] = await drizzle
    .select()
    .from(userPoints)
    .where(eq(userPoints.user_id, user.id));

  if (!pointRecord || pointRecord.current_balance < totalCost) {
    return data(
      { error: "젤리가 부족합니다", required: totalCost, balance: pointRecord?.current_balance ?? 0 },
      { status: 400, headers }
    );
  }

  // 4. 비율 정보 가져오기
  const ratioConfig = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0];

  // 5. 프롬프트 구성 (장르 컨텍스트 포함)
  const fullPrompt = genre
    ? `${genre} genre anime character: ${prompt}`
    : `anime character: ${prompt}`;

  try {
    // 6. 이미지 생성 (OpenAI DALL-E)
    const result = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: fullPrompt,
      n: imageCount,
      size: `${ratioConfig.width}x${ratioConfig.height}`,
    });

    // 7. 포인트 차감
    const newBalance = pointRecord.current_balance - totalCost;
    const newTotalSpent = pointRecord.total_spent + totalCost;

    await drizzle
      .update(userPoints)
      .set({ current_balance: newBalance, total_spent: newTotalSpent })
      .where(eq(userPoints.user_id, user.id));

    await drizzle.insert(pointTransactions).values({
      user_id: user.id,
      amount: -totalCost,
      balance_after: newBalance,
      type: "usage",
      reason: `이미지 생성 (${imageCount}장)`,
      reference_id: `img_gen_${Date.now()}`,
    });

    // 8. 결과 반환
    return data(
      {
        images: result.images.map((img) => ({
          base64: img.base64,
          // 또는 URL 방식이면 img.url
        })),
        cost: totalCost,
        remainingBalance: newBalance,
      },
      { headers }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return data(
      { error: "이미지 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 500, headers }
    );
  }
}
```

### 중요 참고
- `experimental_generateImage`는 Vercel AI SDK v5에서 제공
- 만약 import이 안 되면 OpenAI API를 직접 호출하는 방식으로 대체:
  ```typescript
  import OpenAI from "openai";
  const client = new OpenAI();
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: imageCount,
    size: `${ratioConfig.width}x${ratioConfig.height}`,
  });
  ```
- `OPENAI_API_KEY` 환경변수가 `.env`에 설정되어 있어야 함

---

## 9. 프롬프트 자동생성 기능

메인 화면의 `handleAutoGenerate`에서 기존 채팅 AI를 활용하여 프롬프트를 생성한다.
간단한 구현:

```typescript
async function handleAutoGenerate() {
  if (!selectedGenre) return;

  setIsGenerating(true);
  try {
    // 장르 기반 프롬프트 자동 생성 (서버 API 또는 클라이언트에서 간단히)
    const genre = GENRES.find((g) => g.id === selectedGenre);
    const suggestions = [
      `${genre?.label} 장르의 캐릭터, 신비로운 분위기, 긴 머리카락, 환상적인 배경`,
      `${genre?.label} 스타일의 캐릭터, 강렬한 눈빛, 도시 배경, 현대적 의상`,
      // ... 장르별 샘플 프롬프트
    ];
    setPrompt(suggestions[Math.floor(Math.random() * suggestions.length)]);
  } finally {
    setIsGenerating(false);
  }
}
```

> 추후 AI 기반 프롬프트 생성 API를 별도로 만들 수도 있음 (GPT로 프롬프트 추천)

---

## 10. 색상 참고

| 용도 | Light | Dark |
|------|-------|------|
| 탭 활성 border | `border-[#181D27]` | `dark:border-white` |
| 탭 비활성 텍스트 | `text-[#A4A7AE]` | `dark:text-[#717680]` |
| 입력 border | `border-[#E9EAEB]` | `dark:border-[#333741]` |
| CTA 버튼 (민트) | `bg-[#41C7BD]` | 동일 |
| CTA 비활성 | `bg-[#E9EAEB] text-[#A4A7AE]` | `dark:bg-[#333741] dark:text-[#717680]` |
| 옵션 선택 | `border-[#41C7BD] bg-[#41C7BD]/10` | 동일 |
| 옵션 개수 선택 | `bg-[#41C7BD] text-white` | 동일 |
| 우측 패널 배경 | `bg-white` | `dark:bg-[#0C111D]` |
| 젤리 아이콘 | 🐱 이모지 (기존 패턴) | 동일 |

---

## 11. import 규칙

```typescript
// Supabase client
import makeServerClient from "~/core/lib/supa-client.server";
// DB client
import drizzle from "~/core/db/drizzle-client.server";
// Auth guard
import { requireAuthentication } from "~/core/lib/guards.server";
// Points schema
import { userPoints, pointTransactions } from "~/features/points/schema";
// 기존 컴포넌트
import { ImageGenerationSidebar } from "../components/image-generation-sidebar";
import { LoginRequiredOverlay } from "../components/login-required-overlay";
```

---

## 12. 환경 변수 (.env에 추가 필요)

```env
OPENAI_API_KEY=sk-...your-key-here...
```

---

## 13. 검증 방법

1. `npm run typecheck` — 타입 에러 없어야 함
2. `npm run dev` 실행 후:
   - 비로그인: 기존 3-1 blur + 모달 유지되는지 확인
   - 로그인 후 `/image-generation`:
     - 상단 탭 2개 표시 ("신규 캐릭터 생성" 활성)
     - 프롬프트 입력 영역 표시 (placeholder 텍스트, 0/1000)
     - 프롬프트 비어있을 때 "이미지 생성하기" 버튼 비활성
     - 장르 카드 8개 (placeholder 그라데이션)
     - 우측 패널: 비율 5개(1:1 기본선택), 개수 4개(1개 기본선택)
     - 장르 카드 클릭 시 선택 표시 (민트 ring)
     - 프롬프트 입력 후 생성 버튼 활성화
3. API 테스트 (OPENAI_API_KEY 설정 후):
   - 프롬프트 입력 + 생성 버튼 → 이미지 생성 확인
   - 젤리 차감 확인

---

## 참고 파일

- 메인 화면 (3-1): `app/features/image-generation/screens/image-generation.tsx`
- 사이드바: `app/features/image-generation/components/image-generation-sidebar.tsx`
- 로그인 오버레이: `app/features/image-generation/components/login-required-overlay.tsx`
- 채팅 API (AI + 포인트 패턴): `app/features/chat/api/chat.tsx`
- 포인트 스키마: `app/features/points/schema.ts`
- 포인트 사용 API: `app/features/points/api/usage.tsx`
- 홈 레이아웃 패턴: `app/features/home/screens/home.tsx`
- 기존 라우트: `app/routes.ts`
