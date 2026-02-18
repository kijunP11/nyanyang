# F4 이미지 생성 — A. 이미지 업로드 + B. 기존 캐릭터 수정 탭

## 배경
"기존 캐릭터 수정" 탭은 사용자가 보유한 캐릭터를 선택한 후, 해당 캐릭터의 외형을 유지/수정하여 이미지를 생성하는 기능.

**Figma 스펙 (3-3 항목 2):**
- 상단 탭: "기존 캐릭터 수정" (활성화)
- 좌측 사이드바: 선택된 기존 캐릭터 썸네일 노출
- 프롬프트 placeholder: "바꾸고 싶은 부분을 입력해주세요."
- 버튼: "이미지 업로드 하기" + "이미지 생성하기 🐱 140"
- 빈 상태: 캐릭터 일러스트(?) + 가이드 2개
- 우측 옵션 패널: 비율 + 개수만 (장르 없음)

## 기존 코드 참고

### 캐릭터 데이터
- **스키마**: `app/features/characters/schema.ts`
  - `character_id` (bigint), `name`, `display_name`, `avatar_url`, `appearance` (외형 설명), `description`, `creator_id`
- **내 캐릭터 조회**: `app/features/characters/api/my.tsx` → `/api/characters/my` (GET)
  - `getMyCharacters(userId, params)` from `app/features/characters/lib/queries.server.ts`
  - 반환: `character_id`, `name`, `display_name`, `description`, `avatar_url`, `status` 등
- **캐릭터 상세**: `app/features/characters/api/detail.tsx` → `/api/characters/:id` (GET)

### 이미지 업로드 패턴
- **기존 업로드 API**: `app/features/characters/api/upload-media.tsx`
  - Supabase Storage bucket: `character-media`
  - 파일 경로: `{character_id}/{media_type}/{timestamp}.{ext}`
  - base64 전송 → decode → Storage 업로드 → public URL 반환
  - 검증: 이미지 타입 (`image/*`), 최대 5MB

### 현재 이미지 생성 API
- `app/features/image-generation/api/generate.tsx`
  - 현재 schema: `prompt`, `genre`, `aspectRatio`, `imageCount`
  - DALL-E 3는 이미지 입력을 지원하지 않음
  - 프롬프트만으로 이미지 생성

---

## 구현 범위

### 1단계: "기존 캐릭터 수정" 탭 UI + 캐릭터 선택

### 2단계: 이미지 업로드 기능

### 3단계: 생성 API 확장

---

## 수정/생성 파일

### 1. 새 파일: `app/features/image-generation/components/character-selector.tsx`

캐릭터 선택 모달/그리드. "기존 캐릭터 수정" 탭 진입 시 표시.

```typescript
interface CharacterSelectorProps {
  onSelect: (character: SelectedCharacter) => void;
  onCancel: () => void;
}

interface SelectedCharacter {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  appearance: string | null;
  description: string | null;
}
```

**UI:**
- 사용자의 캐릭터 그리드 표시 (2열)
- 각 카드: avatar 이미지 + 이름 + 설명 (2줄)
- 캐릭터 없을 때: "아직 생성한 캐릭터가 없습니다" + "/characters/create" 링크
- API 호출: `fetch("/api/characters/my")` → 캐릭터 리스트

**동작:**
- "기존 캐릭터 수정" 탭 클릭 시 캐릭터 미선택이면 이 컴포넌트 표시
- 캐릭터 클릭 → `onSelect(character)` → 편집 폼으로 전환

### 2. 새 파일: `app/features/image-generation/components/edit-prompt-input.tsx`

기존 캐릭터 수정용 프롬프트 입력 (신규 탭의 `PromptInput`과 다른 점: upload 버튼, 다른 placeholder)

```typescript
interface EditPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onUploadImage: (file: File) => void;
  isGenerating: boolean;
  jellyCost: number;
  uploadedImagePreview: string | null;  // data URL for preview
}
```

**UI:**
- textarea: placeholder "바꾸고 싶은 부분을 입력해주세요."
- 좌측 버튼: "이미지 업로드 하기" (Upload 아이콘) — hidden file input 트리거
- 우측 버튼: "이미지 생성하기 🐱 {jellyCost}"
- 글자수 카운터: {length}/1000
- 업로드된 이미지 프리뷰 (있을 때): 작은 썸네일 + X 버튼으로 삭제 가능

**파일 입력 제한:**
- accept: "image/jpeg,image/png,image/webp,image/gif"
- 최대 5MB (프론트 검증)
- 초과 시 alert("이미지 크기는 최대 5MB까지 가능합니다.")

### 3. 새 파일: `app/features/image-generation/components/edit-empty-state.tsx`

기존 캐릭터 수정 탭의 빈 상태 (이미지 생성 전)

```typescript
interface EditEmptyStateProps {
  character: SelectedCharacter;
}
```

**UI (Figma 참조):**
- 중앙 큰 영역에 캐릭터 현재 avatar 이미지 표시 (없으면 "?" 일러스트)
- 하단 2열 가이드:
  - 좌측: 냐냥 이모티콘 + "이미지를 업로드하거나 선택하세요." + "jpg, jpeg, png, webp, gif 형식을 지원하며, 최대 5MB까지 첨부할 수 있습니다."
  - 우측: 냐냥 이모티콘 + "이미지 결과가 이곳에 나타나요." + "다양한 결과를 확인하고, 마음에 드는 이미지를 선택해보세요."

냐냥 이모티콘 경로:
- 좌측 (거부/x): `/냐냥-이모티콘-최종완성본/냐냥-거부.png`
- 우측 (기쁨): `/냐냥-이모티콘-최종완성본/냐냥-기쁨.png` (또는 적절한 이모티콘)

### 4. 수정: `app/features/image-generation/screens/image-generation.tsx`

**새 state 추가:**
```typescript
const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null);
const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null);
```

**탭 전환 로직:**
- `activeTab === "edit"` 일 때:
  - `selectedCharacter`가 없으면 → `<CharacterSelector>` 표시
  - `selectedCharacter`가 있으면 → 편집 폼 표시:
    - `<EditPromptInput>` (upload 버튼 포함)
    - 이미지 생성 전: `<EditEmptyState character={selectedCharacter} />`
    - 이미지 생성 후: `<GenerationResult>` (기존 컴포넌트 재사용)
- `activeTab === "new"` 일 때: 기존 로직 유지 (변경 없음)

**OptionsPanel 분기:**
- edit 탭: 장르 관련 props 제거 → `selectedGenre={null}` + `onGenreChange={() => {}}` + `hideGenre={true}`
- 또는 OptionsPanel에 `showGenre` prop 추가

**handleGenerate 수정:**
```typescript
const handleGenerate = async () => {
  if (!prompt.trim() || isGenerating) return;
  setIsGenerating(true);
  try {
    const body: Record<string, unknown> = {
      prompt: prompt.trim(),
      aspectRatio,
      imageCount,
    };

    // 신규 탭일 때만 장르 포함
    if (activeTab === "new" && selectedGenre) {
      body.genre = selectedGenre;
    }

    // 기존 캐릭터 수정 탭일 때 캐릭터 정보 포함
    if (activeTab === "edit" && selectedCharacter) {
      body.characterId = selectedCharacter.id;
      body.characterAppearance = selectedCharacter.appearance;
      body.characterName = selectedCharacter.name;
    }

    const res = await fetch("/api/image-generation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // ... 기존 응답 처리 로직 동일
  }
  // ...
};
```

**이미지 업로드 핸들러:**
```typescript
const handleUploadImage = (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    alert("이미지 크기는 최대 5MB까지 가능합니다.");
    return;
  }
  const preview = URL.createObjectURL(file);
  setUploadedImage({ file, preview });
};
```

**탭 전환 시 상태 초기화:**
```typescript
const handleTabChange = (tab: "new" | "edit") => {
  setActiveTab(tab);
  setPrompt("");
  setGeneratedImages([]);
  setSelectedImageId(null);
  // edit → new 전환 시 캐릭터 초기화하지 않음 (재진입 시 유지)
};
```

### 5. 수정: `app/features/image-generation/components/options-panel.tsx`

**`showGenre` prop 추가:**
```typescript
interface OptionsPanelProps {
  // ... 기존 props
  showGenre?: boolean;  // 추가, 기본값 true
}
```

`showGenre`가 false이면 "이미지 장르" 섹션을 렌더링하지 않음:
```tsx
{showGenre !== false && (
  <div className="mt-6">
    <h4>이미지 장르</h4>
    {/* 장르 그리드 */}
  </div>
)}
```

**호출부 (`image-generation.tsx`):**
```tsx
<OptionsPanel
  aspectRatio={aspectRatio}
  onAspectRatioChange={setAspectRatio}
  imageCount={imageCount}
  onImageCountChange={setImageCount}
  selectedGenre={selectedGenre}
  onGenreChange={setSelectedGenre}
  showGenre={activeTab === "new"}        // 추가
/>
```

### 6. 수정: `app/features/image-generation/api/generate.tsx`

**bodySchema 확장:**
```typescript
const bodySchema = z.object({
  prompt: z.string().min(1, "프롬프트를 입력해주세요"),
  genre: z.string().nullable().optional(),
  aspectRatio: z.string().optional().default("1:1"),
  imageCount: z.number().int().min(1).max(4).optional().default(1),
  // 기존 캐릭터 수정용 (optional)
  characterId: z.number().optional(),
  characterAppearance: z.string().nullable().optional(),
  characterName: z.string().nullable().optional(),
});
```

**프롬프트 구성 로직 변경:**
```typescript
let fullPrompt: string;

if (parsed.characterId) {
  // 기존 캐릭터 수정 모드
  const parts: string[] = [];
  if (parsed.characterName) parts.push(`Character name: ${parsed.characterName}`);
  if (parsed.characterAppearance) parts.push(`Appearance: ${parsed.characterAppearance}`);
  parts.push(`Modification request: ${prompt}`);
  fullPrompt = `anime character based on existing design: ${parts.join(". ")}`;
} else {
  // 신규 캐릭터 생성 모드 (기존 로직)
  const genreLabel = genre
    ? GENRES.find((g) => g.id === genre)?.label ?? genre
    : "";
  fullPrompt = genreLabel.length > 0
    ? `${genreLabel} genre anime character: ${prompt}`
    : `anime character: ${prompt}`;
}
```

### 7. 수정: `app/features/image-generation/components/image-generation-sidebar.tsx`

**캐릭터 선택 상태 표시 (edit 탭):**
props에 `selectedCharacter` 추가:
```typescript
interface ImageGenerationSidebarProps {
  // ... 기존 props
  selectedCharacter?: SelectedCharacter | null;
}
```

사이드바 상단에 선택된 캐릭터 표시 (images 위에):
```tsx
{selectedCharacter && (
  <div className="border-b border-[#E9EAEB] p-4 dark:border-[#333741]">
    <div className="flex items-center gap-3">
      {selectedCharacter.avatarUrl ? (
        <img
          src={selectedCharacter.avatarUrl}
          alt={selectedCharacter.name}
          className="size-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#1F242F]">
          <User className="size-5 text-[#A4A7AE]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#181D27] dark:text-white">
          {selectedCharacter.displayName || selectedCharacter.name}
        </p>
        <p className="truncate text-xs text-[#535862] dark:text-[#94969C]">
          수정 중
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 파일 요약

| 파일 | 변경 | 설명 |
|------|------|------|
| `components/character-selector.tsx` | 새 파일 | 캐릭터 선택 그리드 |
| `components/edit-prompt-input.tsx` | 새 파일 | 수정 탭용 프롬프트 (업로드 버튼 포함) |
| `components/edit-empty-state.tsx` | 새 파일 | 수정 탭 빈 상태 가이드 UI |
| `screens/image-generation.tsx` | 수정 | 탭 분기, 캐릭터 선택 state, upload 핸들러 |
| `components/options-panel.tsx` | 수정 | `showGenre` prop 추가 |
| `api/generate.tsx` | 수정 | 캐릭터 정보 받아 프롬프트 구성 |
| `components/image-generation-sidebar.tsx` | 수정 | 선택된 캐릭터 표시 |

## 검증
1. `npm run typecheck` 통과
2. `npm run dev` →
   - "기존 캐릭터 수정" 탭 클릭 → 캐릭터 선택 그리드 표시
   - 캐릭터 없으면 빈 상태 + 생성 링크
   - 캐릭터 선택 → 편집 폼, 프롬프트 입력, 우측 패널에 장르 없음
   - "이미지 업로드 하기" → 파일 선택 → 프리뷰 표시
   - 5MB 초과 파일 → alert
   - "이미지 생성하기" → 생성 완료 → 결과 표시
   - 사이드바에 선택된 캐릭터 정보 표시
