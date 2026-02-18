# F4 이미지 생성 — 리뷰 개선사항 수정

## 수정 목록 (3건)

---

### 1. 배열 index key → 고유 ID 사용

현재 `generatedImages`와 `sidebarImages`가 `string[]`(base64 문자열 배열)인데, 새 이미지가 배열 앞에 prepend됨(`[...newImages, ...prev]`). 이 상태에서 `key={i}` (index)를 쓰면 React reconciliation이 비효율적.

#### 변경할 타입

```typescript
// 기존
string[]

// 변경 후
{ id: string; data: string }[]
```

#### 수정 파일 및 내용

**`app/features/image-generation/screens/image-generation.tsx`**

1. state 타입 변경:
```typescript
// 변경 전
const [generatedImages, setGeneratedImages] = useState<string[]>([]);
const [sidebarImages, setSidebarImages] = useState<string[]>([]);

// 변경 후
const [generatedImages, setGeneratedImages] = useState<{ id: string; data: string }[]>([]);
const [sidebarImages, setSidebarImages] = useState<{ id: string; data: string }[]>([]);
```

2. `handleGenerate`에서 이미지 저장 시 ID 부여:
```typescript
// 변경 전
if (result?.images?.length) {
  setGeneratedImages((prev) => [...result.images!, ...prev]);
  setSidebarImages((prev) => [...result.images!, ...prev]);
}

// 변경 후
if (result?.images?.length) {
  const withIds = result.images!.map((data, i) => ({
    id: `${Date.now()}-${i}`,
    data,
  }));
  setGeneratedImages((prev) => [...withIds, ...prev]);
  setSidebarImages((prev) => [...withIds, ...prev]);
}
```

**`app/features/image-generation/components/generation-result.tsx`**

```typescript
// props 타입 변경
interface GenerationResultProps {
  isGenerating: boolean;
  imageCount: number;
  generatedImages: { id: string; data: string }[];  // 변경
}

// 렌더링 변경
{generatedImages.map((img) => (
  <div key={img.id} className="overflow-hidden rounded-xl">    {/* key 변경 */}
    <img
      src={`data:image/png;base64,${img.data}`}                {/* img → img.data */}
      alt={`생성된 이미지`}
      className="aspect-square w-full object-cover"
    />
  </div>
))}
```

**`app/features/image-generation/components/image-generation-sidebar.tsx`**

```typescript
// props 타입 변경
interface ImageGenerationSidebarProps {
  user?: ImageGenerationSidebarUser | null;
  images?: { id: string; data: string }[];  // 변경
}

// 렌더링 변경
{images.map((img) => (
  <div key={img.id} className="overflow-hidden rounded-lg">    {/* key 변경 */}
    <img
      src={`data:image/png;base64,${img.data}`}                {/* img → img.data */}
      alt={`생성된 이미지`}
      className="aspect-square w-full object-cover"
    />
  </div>
))}
```

---

### 2. 사이드바 "+" 버튼 제거

**`app/features/image-generation/components/image-generation-sidebar.tsx`**

현재 line 116-122에 `onClick` 핸들러 없는 빈 버튼이 있음. 삭제.

```tsx
// 이 블록 전체 삭제
<button
  type="button"
  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#E9EAEB] text-[#A4A7AE] transition-colors hover:bg-[#F5F5F5] dark:border-[#333741] dark:text-[#717680] dark:hover:bg-[#1F242F]"
  aria-label="더 생성하기"
>
  <Plus className="size-6" />
</button>
```

`Plus` import도 더 이상 사용하지 않으면 제거.

---

### 3. fetch 응답 `res.ok` 체크 추가

**`app/features/image-generation/screens/image-generation.tsx`**

`handleGenerate` 함수에서 `res.json()` 전에 `res.ok` 체크 추가:

```typescript
// 변경 전
const res = await fetch("/api/image-generation/generate", { ... });
const result = (await res.json()) as ...;

// 변경 후
const res = await fetch("/api/image-generation/generate", { ... });
if (!res.ok) {
  const errorBody = await res.json().catch(() => null) as { error?: string } | null;
  alert(errorBody?.error ?? "이미지 생성 요청에 실패했습니다.");
  return;
}
const result = (await res.json()) as ...;
```

---

## 검증

1. `npm run typecheck` 통과 확인
2. `npm run dev` → 로그인 → 이미지 생성 → 결과 그리드 정상 표시 + 사이드바 썸네일 정상 표시 확인
3. 사이드바에 "+" 버튼 없어진 것 확인
