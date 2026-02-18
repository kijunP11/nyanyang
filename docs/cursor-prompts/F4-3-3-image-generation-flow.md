# F4-3-3. 이미지 생성 – 신규 캐릭터 생성 (선택 후) 플로우

## 목표
3-2에서 구현한 이미지 생성 UI에 인터랙션 플로우를 추가한다:
주의사항 모달, 장르 체크 아이콘, 우측 패널 장르 옵션, 로딩 상태, 생성 결과 표시, 사이드바 이미지 스택킹.

## 3-2에서 이미 구현된 것
- 탭, 프롬프트 입력, 장르 카드 선택(ring 표시), 옵션 패널(비율/개수)
- 생성 API 연동 + 젤리 차감
- 버튼 활성/비활성 상태

## 3-3에서 새로 추가할 것

| # | 기능 | 상태 |
|---|------|------|
| 1 | 첫 진입 주의사항 모달 | 신규 |
| 2 | 장르 카드 체크 아이콘 | 기존 ring에 추가 |
| 3 | 우측 패널 "이미지 장르" 섹션 | 신규 |
| 4 | 로딩 상태 (플레이스홀더 + 로딩 아이콘) | 신규 |
| 5 | 생성 결과 이미지 표시 | 신규 |
| 6 | 사이드바 이미지 썸네일 스택킹 | 신규 |

---

## 1. 첫 진입 주의사항 모달

### 새 파일: `components/disclaimer-modal.tsx`

첫 진입 시 1회만 표시. `localStorage`로 동의 여부 저장.

```tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/core/components/ui/dialog";

const DISCLAIMER_KEY = "nyanyang-image-gen-disclaimer-agreed";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem(DISCLAIMER_KEY);
    if (!agreed) setOpen(true);
  }, []);

  const handleAgree = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[480px] gap-0 p-8 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* 캐릭터 일러스트 */}
        <div className="mb-4">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="주의사항"
            className="h-14 w-auto"
          />
        </div>

        {/* 제목 */}
        <DialogHeader className="mb-3 p-0">
          <DialogTitle className="text-left text-lg font-bold text-[#181D27] dark:text-white">
            캐릭터 제작 시 반드시 유의해주세요!
          </DialogTitle>
        </DialogHeader>

        {/* 본문 */}
        <div className="mb-6 space-y-3 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
          <p className="font-semibold">나냥 운영 정책을 지켜주세요!</p>
          <p>
            안전하고 즐거운 대화 환경을 위해 나냥 운영진은 실시간으로
            모니터링하며, 운영 정책 위반 시 캐릭터 삭제 및 계정 차단 조치를
            취할 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>과도한 선정성, 지나치게 공격적이거나 편향적인 표현</li>
            <li>저작권, 초상권 등 타인의 권리를 침해하는 행위</li>
            <li>
              딥페이크, 허위 정보, 미성년자 성적 대상화 등 비윤리적이거나
              불법적인 행위
            </li>
          </ul>
          <p>
            세이프티 캐릭터 세부 가이드라인을 포함한 운영정책을
            반복적으로 위반할 경우, 제재 조치가 강화될 수 있습니다.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleAgree}
          className="w-full rounded-lg bg-[#41C7BD] py-3 text-base font-semibold text-white transition-colors hover:bg-[#38b5ab]"
        >
          동의하고 캐릭터 제작하기
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

### 메인 화면에 추가 (`image-generation.tsx`)

로그인 상태일 때만 모달 렌더링:
```tsx
{isLoggedIn && <DisclaimerModal />}
```

---

## 2. 장르 카드 체크 아이콘

### 수정: `components/genre-cards.tsx`

선택된 카드에 우측 상단 체크 아이콘 추가:

```tsx
import { Check } from "lucide-react";

{/* 기존 button 내부, 맨 마지막에 추가 */}
{selectedGenre === genre.id && (
  <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#41C7BD] text-white shadow">
    <Check className="size-3.5" strokeWidth={3} />
  </div>
)}
```

---

## 3. 우측 패널 "이미지 장르" 섹션

### 수정: `components/options-panel.tsx`

기존 비율/개수 아래에 "이미지 장르" 섹션 추가.

Props 확장:
```typescript
interface OptionsPanelProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  imageCount: number;
  onImageCountChange: (count: number) => void;
  // 새로 추가
  selectedGenre: string | null;
  onGenreChange: (genreId: string | null) => void;
}
```

장르 섹션 UI (비율/개수 아래에 추가):
```tsx
import { GENRES } from "../lib/constants";

{/* 이미지 장르 */}
<div className="mt-6">
  <h4 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
    이미지 장르
  </h4>
  <div className="grid grid-cols-4 gap-2">
    {GENRES.map((genre) => (
      <button
        key={genre.id}
        type="button"
        onClick={() =>
          onGenreChange(selectedGenre === genre.id ? null : genre.id)
        }
        className="flex flex-col items-center gap-1"
      >
        {/* 장르 썸네일 (placeholder) */}
        <div
          className={`size-9 overflow-hidden rounded-lg ${
            selectedGenre === genre.id
              ? "ring-2 ring-[#41C7BD]"
              : ""
          }`}
          style={{
            background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}66)`,
          }}
        />
        <span className={`text-[10px] ${
          selectedGenre === genre.id
            ? "font-semibold text-[#41C7BD]"
            : "text-[#535862] dark:text-[#94969C]"
        }`}>
          {genre.label.replace(/\/.*/, "")}
        </span>
      </button>
    ))}
  </div>
</div>
```

### 메인 화면에서 props 전달 (`image-generation.tsx`)

```tsx
<OptionsPanel
  aspectRatio={aspectRatio}
  onAspectRatioChange={setAspectRatio}
  imageCount={imageCount}
  onImageCountChange={setImageCount}
  selectedGenre={selectedGenre}       // 추가
  onGenreChange={setSelectedGenre}    // 추가 (장르 카드와 동기화)
/>
```

---

## 4. 로딩 상태 + 생성 결과 표시

### 새 파일: `components/generation-result.tsx`

생성 중(로딩) + 생성 완료 이미지를 표시하는 영역.
프롬프트 입력 아래, 장르 카드 위에 위치.

```tsx
import { Loader2 } from "lucide-react";

interface GenerationResultProps {
  isGenerating: boolean;
  imageCount: number;
  generatedImages: string[];  // base64 이미지 배열
}

export function GenerationResult({
  isGenerating,
  imageCount,
  generatedImages,
}: GenerationResultProps) {
  // 표시할 것이 없으면 렌더링 안함
  if (!isGenerating && generatedImages.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3">
        {/* 생성 완료된 이미지 */}
        {generatedImages.map((img, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl"
          >
            <img
              src={`data:image/png;base64,${img}`}
              alt={`생성된 이미지 ${i + 1}`}
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}

        {/* 로딩 중 플레이스홀더 */}
        {isGenerating &&
          Array.from({ length: imageCount }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="flex aspect-square items-center justify-center rounded-xl bg-[#F5F5F5] dark:bg-[#1F242F]"
            >
              <Loader2 className="size-8 animate-spin text-[#A4A7AE] dark:text-[#717680]" />
            </div>
          ))}
      </div>
    </div>
  );
}
```

### 메인 화면에서 사용 (`image-generation.tsx`)

State 추가:
```typescript
const [generatedImages, setGeneratedImages] = useState<string[]>([]);
```

레이아웃에 삽입 (PromptInput 아래, GenreCards 위):
```tsx
<PromptInput ... />

<GenerationResult
  isGenerating={isGenerating}
  imageCount={imageCount}
  generatedImages={generatedImages}
/>

<GenreCards ... />
```

handleGenerate 수정:
```typescript
const handleGenerate = async () => {
  if (!prompt.trim() || isGenerating) return;
  setIsGenerating(true);
  try {
    const res = await fetch("/api/image-generation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim(), genre: selectedGenre ?? undefined, aspectRatio, imageCount }),
    });
    const result = await res.json();
    if (result?.error) {
      alert(result.error);
      return;
    }
    if (result?.images?.length) {
      // 생성된 이미지를 기존 결과 앞에 추가
      setGeneratedImages((prev) => [...result.images, ...prev]);
      // 사이드바에도 추가 (아래 #6 참고)
      setSidebarImages((prev) => [...result.images, ...prev]);
    }
  } catch {
    alert("이미지 생성 요청에 실패했습니다.");
  } finally {
    setIsGenerating(false);
  }
};
```

---

## 5. 사이드바 이미지 스택킹

### 수정: `components/image-generation-sidebar.tsx`

Props 확장:
```typescript
interface ImageGenerationSidebarProps {
  user?: ImageGenerationSidebarUser | null;
  images?: string[];  // 추가: base64 이미지 배열
}
```

로그인 상태의 내용을 이미지 리스트로 변경:
```tsx
{isLoggedIn ? (
  <div className="flex flex-1 flex-col overflow-y-auto">
    {images && images.length > 0 ? (
      <div className="grid grid-cols-2 gap-2 p-4">
        {images.map((img, i) => (
          <div key={i} className="overflow-hidden rounded-lg">
            <img
              src={`data:image/png;base64,${img}`}
              alt={`생성된 이미지 ${i + 1}`}
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
        {/* 더 생성하기 버튼 */}
        <button
          type="button"
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#E9EAEB] text-[#A4A7AE] transition-colors hover:bg-[#F5F5F5] dark:border-[#333741] dark:text-[#717680] dark:hover:bg-[#1F242F]"
        >
          <Plus className="size-6" />
        </button>
      </div>
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm text-[#535862] dark:text-[#94969C]">
          아직 생성된 이미지가 없어요
        </p>
      </div>
    )}
  </div>
) : (
  <LoggedOutCTA />
)}
```

Import 추가: `import { Plus } from "lucide-react";`

### 메인 화면에서 props 전달 (`image-generation.tsx`)

State 추가:
```typescript
const [sidebarImages, setSidebarImages] = useState<string[]>([]);
```

```tsx
<ImageGenerationSidebar
  user={isLoggedIn ? user : null}
  images={sidebarImages}    // 추가
/>
```

---

## 6. 메인 화면 최종 State 정리

```typescript
// 기존 (3-2)
const [activeTab, setActiveTab] = useState<"new" | "edit">("new");
const [prompt, setPrompt] = useState("");
const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
const [aspectRatio, setAspectRatio] = useState("1:1");
const [imageCount, setImageCount] = useState(1);
const [isGenerating, setIsGenerating] = useState(false);

// 새로 추가 (3-3)
const [generatedImages, setGeneratedImages] = useState<string[]>([]);
const [sidebarImages, setSidebarImages] = useState<string[]>([]);
```

---

## 7. 수정 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `screens/image-generation.tsx` | DisclaimerModal 추가, generatedImages/sidebarImages state, handleGenerate 수정, GenerationResult 삽입, OptionsPanel에 genre props 전달 |
| `components/genre-cards.tsx` | 선택 시 체크 아이콘 추가 |
| `components/options-panel.tsx` | "이미지 장르" 섹션 추가, selectedGenre/onGenreChange props |
| `components/image-generation-sidebar.tsx` | images prop 추가, 이미지 썸네일 그리드 + "+" 버튼 |
| **신규** `components/disclaimer-modal.tsx` | 주의사항 모달 |
| **신규** `components/generation-result.tsx` | 로딩 + 생성 결과 표시 |

---

## 8. 참고 파일

- Dialog 컴포넌트: `app/core/components/ui/dialog.tsx`
- 기존 사이드바: `app/features/image-generation/components/image-generation-sidebar.tsx`
- 기존 장르 카드: `app/features/image-generation/components/genre-cards.tsx`
- 기존 옵션 패널: `app/features/image-generation/components/options-panel.tsx`
- 기존 메인 화면: `app/features/image-generation/screens/image-generation.tsx`
- 냐냥 이모티콘: `public/냐냥-이모티콘-최종완성본/냐냥-거부.png`

---

## 9. 검증 방법

1. `npm run typecheck` — 타입 에러 없어야 함
2. 로그인 후 `/image-generation` 최초 진입:
   - 주의사항 모달 표시 확인
   - "동의하고 캐릭터 제작하기" 클릭 → 모달 닫힘
   - 새로고침 후 재진입 → 모달 미표시 확인
3. 장르 카드 선택:
   - 체크 아이콘(민트) 표시 확인
   - 우측 패널 "이미지 장르"와 동기화 확인
   - 재클릭으로 해제 확인
4. 프롬프트 입력 후 생성:
   - 로딩 플레이스홀더 표시 확인 (선택한 개수만큼)
   - 생성 완료 → 이미지 그리드 표시
   - 사이드바에 썸네일 누적 확인
5. 여러 번 생성:
   - 메인 영역에 이전 + 새 이미지 모두 표시
   - 사이드바에 순차 누적
