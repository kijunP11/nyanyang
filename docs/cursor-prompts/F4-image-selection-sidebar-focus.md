# F4 이미지 생성 — 이미지 선택 + 사이드바 클릭 포커싱

## 배경
F4-3-3 스펙 중 미구현 항목 2개:
- **(C)** 생성된 이미지 클릭 → 선택 상태 저장, 단일 선택, 시각적 강조
- **(D)** 사이드바 썸네일 클릭 → 메인 영역 해당 이미지로 스크롤 + 선택

이미지는 이미 `{ id: string; data: string }[]` 타입으로 고유 ID가 있음.

---

## 수정 파일 (3개)

### 1. `app/features/image-generation/screens/image-generation.tsx`

**state 추가:**
```typescript
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
```

**선택 핸들러:**
```typescript
const handleSelectImage = (id: string) => {
  setSelectedImageId((prev) => (prev === id ? null : id));
};
```

**생성 완료 시 첫 번째 이미지 자동 선택** — `handleGenerate` 내부, `setGeneratedImages` 뒤에:
```typescript
if (result?.images?.length) {
  const withIds = result.images.map((data, i) => ({
    id: `${Date.now()}-${i}`,
    data,
  }));
  setGeneratedImages((prev) => [...withIds, ...prev]);
  setSidebarImages((prev) => [...withIds, ...prev]);
  setSelectedImageId(withIds[0].id);  // ← 추가
}
```

**props 전달** — `GenerationResult`에:
```tsx
<GenerationResult
  isGenerating={isGenerating}
  imageCount={imageCount}
  generatedImages={generatedImages}
  selectedImageId={selectedImageId}        // 추가
  onSelectImage={handleSelectImage}        // 추가
/>
```

**props 전달** — `ImageGenerationSidebar`에:
```tsx
<ImageGenerationSidebar
  user={isLoggedIn ? user : null}
  images={sidebarImages}
  selectedImageId={selectedImageId}        // 추가
  onSelectImage={handleSelectImage}        // 추가
/>
```

---

### 2. `app/features/image-generation/components/generation-result.tsx`

**props 타입 추가:**
```typescript
interface GenerationResultProps {
  isGenerating: boolean;
  imageCount: number;
  generatedImages: { id: string; data: string }[];
  selectedImageId: string | null;          // 추가
  onSelectImage: (id: string) => void;     // 추가
}
```

**이미지 렌더링 변경:**
```tsx
{generatedImages.map((img) => (
  <div
    key={img.id}
    id={`gen-img-${img.id}`}                           // 스크롤 타겟
    onClick={() => onSelectImage(img.id)}
    className={`cursor-pointer overflow-hidden rounded-xl transition-all ${
      selectedImageId === img.id
        ? "ring-2 ring-[#41C7BD] ring-offset-2 dark:ring-offset-[#0C111D]"
        : "hover:opacity-90"
    }`}
  >
    <img
      src={`data:image/png;base64,${img.data}`}
      alt="생성된 이미지"
      className="aspect-square w-full object-cover"
    />
  </div>
))}
```

---

### 3. `app/features/image-generation/components/image-generation-sidebar.tsx`

**props 타입 추가:**
```typescript
interface ImageGenerationSidebarProps {
  user?: ImageGenerationSidebarUser | null;
  images?: { id: string; data: string }[];
  selectedImageId?: string | null;         // 추가
  onSelectImage?: (id: string) => void;    // 추가
}
```

**destructure 추가:**
```typescript
export function ImageGenerationSidebar({
  user,
  images = [],
  selectedImageId,          // 추가
  onSelectImage,            // 추가
}: ImageGenerationSidebarProps) {
```

**썸네일 클릭 핸들러 함수:**
```typescript
const handleThumbnailClick = (id: string) => {
  onSelectImage?.(id);
  // 메인 영역의 해당 이미지로 스크롤
  setTimeout(() => {
    document
      .getElementById(`gen-img-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 0);
};
```

**썸네일 렌더링 변경:**
```tsx
{images.map((img) => (
  <div
    key={img.id}
    onClick={() => handleThumbnailClick(img.id)}
    className={`cursor-pointer overflow-hidden rounded-lg transition-all ${
      selectedImageId === img.id
        ? "ring-2 ring-[#41C7BD]"
        : "hover:opacity-80"
    }`}
  >
    <img
      src={`data:image/png;base64,${img.data}`}
      alt="생성된 이미지"
      className="aspect-square w-full object-cover"
    />
  </div>
))}
```

---

## 동작 시나리오
1. 이미지 생성 완료 → 첫 번째 이미지 자동 선택 (ring 표시)
2. 메인 영역 이미지 클릭 → 해당 이미지 선택 (이전 선택 해제)
3. 같은 이미지 다시 클릭 → 선택 해제 (toggle)
4. 사이드바 썸네일 클릭 → 해당 이미지 선택 + 메인 영역 스크롤
5. 선택된 이미지는 메인/사이드바 양쪽 동시에 ring 강조

## 검증
1. `npm run typecheck` 통과
2. `npm run dev` → 이미지 생성 → 첫 번째 이미지 자동 선택 확인
3. 메인 영역 이미지 클릭 → ring 강조 확인
4. 사이드바 썸네일 클릭 → 메인 스크롤 + ring 확인
5. 같은 이미지 재클릭 → 선택 해제 확인
