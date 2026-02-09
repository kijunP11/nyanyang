# 캐릭터 위저드 5단계 리빌드 - 구현 명세서

> 이 문서는 기존 4단계 위저드를 플랜에 맞게 5단계로 완전 리빌드하기 위한 상세 구현 명세입니다.
> 기존 파일을 삭제하고 아래 명세대로 새로 생성해주세요.

---

## 0. 삭제 대상 (기존 파일)

```
# 삭제할 파일들
app/features/characters/components/wizard/step-basic.tsx
app/features/characters/components/wizard/step-personality.tsx
app/features/characters/components/wizard/step-tags.tsx
app/features/characters/components/wizard/step-advanced.tsx
app/features/characters/components/wizard/character-wizard.tsx
app/features/characters/components/wizard/wizard-stepper.tsx
app/features/characters/components/wizard/index.ts
app/features/characters/lib/wizard-context.tsx
```

---

## 1. 새 파일 구조

```
app/features/characters/
  lib/
    wizard-types.ts              # 타입 정의
    wizard-validation.ts         # Zod 스키마 (스텝별)
    wizard-context.tsx           # React Context + useReducer
  components/wizard/
    character-wizard.tsx         # 메인 위저드 셸
    wizard-progress-bar.tsx      # 상단 5단계 프로그레스 바
    steps/
      step-profile.tsx           # 1단계
      step-personality.tsx       # 2단계
      step-startup.tsx           # 3단계
      step-ai-settings.tsx       # 4단계
      step-publishing.tsx        # 5단계
    image-upload-field.tsx       # 재사용 이미지 업로드
    example-dialogue-editor.tsx  # 재사용 예시 대화 에디터
    tag-input.tsx                # 재사용 태그 칩 입력
    system-prompt-generator.ts   # 프롬프트 자동생성 유틸
    character-preview-card.tsx   # 미리보기 카드
  screens/
    character-create.tsx         # 리빌드
    character-edit.tsx           # 리빌드 (위저드 + 키워드/안전필터 탭)
```

---

## 2. 다크 테마 디자인 토큰

모든 컴포넌트에서 아래 색상을 일관되게 사용:

```
페이지 배경:     bg-[#1a1a1a]
카드/섹션 배경:   bg-[#232323]
내부 카드 배경:   bg-[#2a2a2a]
보더:           border-[#3f3f46]
보더 (호버):     border-[#6b7280]
주요 텍스트:     text-white
보조 텍스트:     text-[#9ca3af]
비활성 텍스트:   text-[#6b7280]
민트 액센트:     bg-[#14b8a6]  /  text-[#14b8a6]
민트 호버:       hover:bg-[#0d9488]  /  hover:bg-[#14b8a6]/90
에러:           text-red-500  /  border-red-500
인풋:           bg-[#232323] border-[#3f3f46] text-white placeholder:text-[#6b7280]
인풋 포커스:     focus:border-[#14b8a6]
```

---

## 3. 파일별 상세 명세

### 3.1 `lib/wizard-types.ts`

```typescript
export interface ExampleDialogue {
  id: string;          // crypto.randomUUID()
  user: string;        // 사용자 메시지
  character: string;   // 캐릭터 응답
}

export interface CharacterFormData {
  // Step 1: 프로필
  name: string;              // 필수, max 50
  display_name: string;      // max 50
  tagline: string;           // max 50
  description: string;       // 필수
  avatar_url: string | null; // base64 data URL (생성) 또는 Supabase URL (편집)
  banner_url: string | null; // 위와 동일

  // Step 2: 설정/성격
  role: string;              // friend | teacher | lover | mentor | companion
  appearance: string;
  personality: string;       // 필수
  speech_style: string;
  example_dialogues: ExampleDialogue[];

  // Step 3: 시작 설정
  greeting_message: string;  // 필수
  relationship: string;
  world_setting: string;

  // Step 4: AI 설정
  system_prompt: string;     // 필수
  enable_memory: boolean;    // default true
  category: string;          // 남성 | 여성 | 기타
  age_rating: string;        // everyone | teen | mature | adult

  // Step 5: 등록 옵션
  tags: string[];
  is_public: boolean;        // default false
  is_nsfw: boolean;          // default false
}

export const WIZARD_STEPS = {
  PROFILE: 1,
  PERSONALITY: 2,
  STARTUP: 3,
  AI_SETTINGS: 4,
  PUBLISHING: 5,
} as const;

export type WizardStep = (typeof WIZARD_STEPS)[keyof typeof WIZARD_STEPS];

export const STEP_LABELS: Record<WizardStep, string> = {
  1: "프로필",
  2: "설정/성격",
  3: "시작 설정",
  4: "AI 설정",
  5: "등록 옵션",
};

export type ValidationErrors = Partial<Record<keyof CharacterFormData, string>>;

export interface WizardState {
  currentStep: WizardStep;
  formData: CharacterFormData;
  isDirty: boolean;
  errors: ValidationErrors;
  characterId: number | null;
  isEditMode: boolean;
  isSavingDraft: boolean;
}

export type WizardAction =
  | { type: "SET_STEP"; payload: WizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "UPDATE_FIELD"; payload: { field: keyof CharacterFormData; value: unknown } }
  | { type: "UPDATE_FIELDS"; payload: Partial<CharacterFormData> }
  | { type: "SET_FORM_DATA"; payload: Partial<CharacterFormData> }
  | { type: "SET_ERRORS"; payload: ValidationErrors }
  | { type: "CLEAR_ERRORS" }
  | { type: "RESET_FORM" }
  | { type: "SET_EDIT_MODE"; payload: { characterId: number; data: Partial<CharacterFormData> } }
  | { type: "SET_CHARACTER_ID"; payload: number }
  | { type: "SET_SAVING_DRAFT"; payload: boolean }
  | { type: "ADD_EXAMPLE_DIALOGUE"; payload: ExampleDialogue }
  | { type: "UPDATE_EXAMPLE_DIALOGUE"; payload: { id: string; data: Partial<ExampleDialogue> } }
  | { type: "REMOVE_EXAMPLE_DIALOGUE"; payload: string };

export const initialFormData: CharacterFormData = {
  name: "",
  display_name: "",
  tagline: "",
  description: "",
  avatar_url: null,
  banner_url: null,
  role: "",
  appearance: "",
  personality: "",
  speech_style: "",
  example_dialogues: [],
  greeting_message: "",
  relationship: "",
  world_setting: "",
  system_prompt: "",
  enable_memory: true,
  category: "",
  age_rating: "everyone",
  tags: [],
  is_public: false,
  is_nsfw: false,
};
```

### 3.2 `lib/wizard-validation.ts`

Zod 스키마 기반. 각 스텝별 validate 함수 + `isStepValid` + `validateCurrentStep` export.

```typescript
// Step 1: name 필수(1~50), description 필수
// Step 2: personality 필수
// Step 3: greeting_message 필수
// Step 4: system_prompt 필수
// Step 5: 필수 필드 없음
```

### 3.3 `lib/wizard-context.tsx`

기존과 동일한 패턴이지만 5단계 반영:
- `WIZARD_STEPS.PUBLISHING` (5) 로 max
- `SET_CHARACTER_ID`, `SET_SAVING_DRAFT` 액션 추가
- `WizardProvider` props: `children`, `initialData?`, `characterId?`
- `useWizard()` hook export

---

### 3.4 `components/wizard/image-upload-field.tsx`

기존 `step-basic.tsx` 안에 있던 `ImageUpload` 컴포넌트를 분리.

```typescript
interface ImageUploadFieldProps {
  label: string;
  value: string | null;                  // 현재 URL (base64 or http)
  onChange: (dataUrl: string) => void;    // base64 data URL 전달
  onRemove: () => void;
  aspectRatio?: "square" | "banner";     // square=원형, banner=16:9
}
```

동작:
- 클릭 또는 드래그앤드롭으로 이미지 선택
- `FileReader.readAsDataURL(file)` → base64 data URL을 `onChange`로 전달
- 5MB 제한, image/* only
- `value`가 존재하면 미리보기 표시 + X 버튼
- square일 때 `h-32 w-32 rounded-full`, banner일 때 `h-32 w-full rounded-lg`
- **주의**: `URL.createObjectURL` 대신 `FileReader.readAsDataURL` 사용 (context에 저장 가능하도록)

### 3.5 `components/wizard/example-dialogue-editor.tsx`

기존 `step-personality.tsx` 안에 있던 `ExampleDialogueItem` + 추가/삭제 UI를 분리.

```typescript
interface ExampleDialogueEditorProps {
  dialogues: ExampleDialogue[];
  onAdd: () => void;
  onUpdate: (id: string, data: Partial<ExampleDialogue>) => void;
  onRemove: (id: string) => void;
}
```

- "추가" 버튼 클릭 → `onAdd()` (부모에서 `crypto.randomUUID()`로 ID 생성)
- 각 아이템: user input + character textarea + 삭제 버튼
- 빈 상태: "예시 대화를 추가하면 AI가 캐릭터의 말투와 성격을 더 잘 이해할 수 있습니다"

### 3.6 `components/wizard/tag-input.tsx`

기존 `step-tags.tsx` 안에 있던 `TagInput` 분리.

```typescript
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  maxTags?: number;           // default 10
  suggestions?: string[];     // 추천 태그 목록
}
```

### 3.7 `components/wizard/system-prompt-generator.ts`

순수 함수. API 호출 없음.

```typescript
export function generateSystemPrompt(data: Partial<CharacterFormData>): string
```

로직:
```
당신은 "{name}"입니다.

{role이 있으면}
## 역할
{role의 한글 라벨} 역할을 합니다.

{appearance가 있으면}
## 외모
{appearance}

## 성격
{personality}

{speech_style이 있으면}
## 말투
{speech_style} 스타일로 대화합니다.

{relationship이 있으면}
## 관계
사용자와의 관계: {relationship}

{world_setting이 있으면}
## 세계관
{world_setting}

## 지침
- 항상 캐릭터에 맞는 말투와 성격을 유지하세요.
- 사용자와 자연스럽게 대화하세요.
- 설정에 벗어나는 행동은 하지 마세요.
```

### 3.8 `components/wizard/character-preview-card.tsx`

```typescript
interface CharacterPreviewCardProps {
  formData: CharacterFormData;
}
```

detail.tsx의 디자인 참조:
- 아바타 (원형 80px, formData.avatar_url 또는 이니셜)
- 이름, tagline
- 배지: 공개/비공개, NSFW, 카테고리
- description 미리보기
- 태그 칩 목록
- 첫 인사말 말풍선

---

### 3.9 `components/wizard/wizard-progress-bar.tsx`

```typescript
interface WizardProgressBarProps {
  currentStep: WizardStep;
  formData: CharacterFormData;
  onStepClick: (step: WizardStep) => void;
}
```

5단계 표시. 기존 `wizard-stepper.tsx` 와 동일한 패턴이지만 스텝 5개:
- 데스크톱: 원형 번호 + 라벨 + 연결선
- 모바일: 도트 + "N/5: 라벨"
- 현재: 민트 배경, 완료: 초록 체크, 미래: 회색 보더

### 3.10 `components/wizard/steps/step-profile.tsx` (1단계)

필드:
| 필드 | 컴포넌트 | 필수 | 비고 |
|------|---------|------|------|
| avatar_url | `<ImageUploadField aspectRatio="square" />` | - | 원형 |
| banner_url | `<ImageUploadField aspectRatio="banner" />` | - | 16:9 |
| name | Input max 50 | * | |
| display_name | Input max 50 | - | placeholder: "비워두면 캐릭터 이름 사용" |
| tagline | Input max 50 | - | "한 줄 소개" |
| description | Textarea rows=3 | * | |

updateField는 `useWizard().dispatch`로.

### 3.11 `components/wizard/steps/step-personality.tsx` (2단계)

필드:
| 필드 | 컴포넌트 | 필수 | 비고 |
|------|---------|------|------|
| role | Select | - | 친구/선생님/연인/멘토/동반자 |
| appearance | Textarea rows=2 | - | "외모" |
| personality | Textarea rows=3 | * | "성격" |
| speech_style | Input | - | "말투" |
| example_dialogues | `<ExampleDialogueEditor />` | - | |

ROLE_OPTIONS:
```typescript
const ROLE_OPTIONS = [
  { value: "friend", label: "친구" },
  { value: "teacher", label: "선생님" },
  { value: "lover", label: "연인" },
  { value: "mentor", label: "멘토" },
  { value: "companion", label: "동반자" },
];
```

### 3.12 `components/wizard/steps/step-startup.tsx` (3단계)

필드:
| 필드 | 컴포넌트 | 필수 | 비고 |
|------|---------|------|------|
| greeting_message | Textarea rows=3 | * | "첫 인사말" |
| relationship | Input | - | "나와의 관계" |
| world_setting | Textarea rows=3 | - | "세계관" |

### 3.13 `components/wizard/steps/step-ai-settings.tsx` (4단계)

필드:
| 필드 | 컴포넌트 | 필수 | 비고 |
|------|---------|------|------|
| system_prompt | Textarea rows=8 | * | "시스템 프롬프트" |
| (버튼) | Button | - | "자동 생성" → `generateSystemPrompt(formData)` 결과를 system_prompt에 채움 |
| enable_memory | Switch | - | "메모리 기능" default true |
| category | Select | - | 남성/여성/기타 |
| age_rating | Radio cards | - | 전체/청소년/성인/성인전용 |

**"자동 생성" 버튼 동작:**
```typescript
import { generateSystemPrompt } from "../system-prompt-generator";

const handleAutoGenerate = () => {
  const prompt = generateSystemPrompt(formData);
  dispatch({ type: "UPDATE_FIELD", payload: { field: "system_prompt", value: prompt } });
};
```

CATEGORY_OPTIONS:
```typescript
const CATEGORY_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
];
```

AGE_RATING_OPTIONS:
```typescript
const AGE_RATING_OPTIONS = [
  { value: "everyone", label: "전체 이용가", description: "모든 연령 이용 가능" },
  { value: "teen", label: "청소년 이용가", description: "13세 이상 권장" },
  { value: "mature", label: "성인용", description: "18세 이상만 이용 가능" },
  { value: "adult", label: "성인전용", description: "성인 인증 필요" },
];
```

### 3.14 `components/wizard/steps/step-publishing.tsx` (5단계)

필드:
| 필드 | 컴포넌트 | 비고 |
|------|---------|------|
| tags | `<TagInput />` | 최대 10개 |
| is_public | Switch | "공개 캐릭터" |
| is_nsfw | Switch | "NSFW 콘텐츠" |
| (미리보기) | `<CharacterPreviewCard formData={formData} />` | |

하단에 "캐릭터 만들기" / "저장하기" 버튼은 character-wizard.tsx의 네비게이션에서 처리.

### 3.15 `components/wizard/character-wizard.tsx` (메인 셸)

```typescript
interface CharacterWizardProps {
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
}
```

구조:
```tsx
<div className="min-h-screen bg-[#1a1a1a] px-4 py-8">
  <div className="mx-auto max-w-2xl">
    {/* 헤더: 제목 + 설명 */}
    {/* WizardProgressBar */}
    {/* 카드: 현재 스텝 렌더링 */}
    <div className="rounded-xl border border-[#3f3f46] bg-[#232323] p-6">
      {renderStep()}
    </div>
    {/* 네비게이션 버튼 */}
    <div className="mt-6 flex items-center justify-between">
      {/* 왼쪽: 이전 + 취소 */}
      {/* 오른쪽: 임시저장 + 다음/제출 */}
    </div>
  </div>
</div>
```

**네비게이션 버튼 레이아웃:**
- 좌측: `이전` (첫 스텝 제외) + `취소`
- 우측: `임시저장` (ghost 스타일) + `다음` 또는 `캐릭터 만들기`/`저장하기` (마지막 스텝)

**"다음" 클릭 시:** `validateCurrentStep()` → 에러 있으면 `SET_ERRORS`, 없으면 `NEXT_STEP`
**"제출" 클릭 시:** 모든 스텝 validation → 첫 번째 invalid 스텝으로 이동 → 모두 valid면 `onSubmit()`

---

## 4. 화면 통합 명세

### 4.1 `screens/character-create.tsx`

**loader:** 인증 확인, 미인증 → redirect("/login")

**action:** `request.json()` 으로 파싱

```typescript
export async function action({ request }: Route.ActionArgs) {
  // 1. 인증 확인
  // 2. const body = await request.json();
  // 3. body._action 에 따라 분기:

  // _action === "create"
  //   - Zod 전체 검증
  //   - characters 테이블 INSERT (status: "approved")
  //   - avatar/banner가 base64 data URL이면 → upload-media API 내부 로직 재사용 (또는 fetch)
  //   - character_safety_filters INSERT (기본값)
  //   - return { success: true, characterId }

  // _action === "save_draft"
  //   - characters 테이블 INSERT (status: "draft")
  //   - return { success: true, characterId, isDraft: true }
}
```

**컴포넌트:**
```tsx
function CharacterCreateInner() {
  const { state } = useWizard();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // fetch POST /characters/create (현재 라우트) with JSON body
    // formData에서 avatar_url/banner_url이 "data:" 시작이면 제출 데이터에 포함
    // 성공 → navigate(`/characters/${result.characterId}`)
  };

  const handleSaveDraft = async () => {
    // fetch POST with _action: "save_draft"
    // 첫 임시저장: characterId 받으면 → navigate(`/characters/${id}/edit`) (편집 모드로 전환)
    // 이후 임시저장: 이미 characterId가 있으면 UPDATE
  };

  return (
    <WizardProvider>
      <CharacterWizard onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} onCancel={...} />
    </WizardProvider>
  );
}
```

**이미지 업로드 흐름 (생성 모드):**
1. 이미지 선택 → base64 data URL을 context의 `avatar_url`/`banner_url`에 저장
2. 미리보기: `<img src={dataUrl}>` 로 표시
3. 제출 시: 캐릭터 레코드 먼저 생성 → characterId 받음
4. base64 data URL이 있으면 `/api/characters/upload-media` 에 POST:
   ```json
   {
     "character_id": 123,
     "media_type": "avatar",
     "file_data": "data:image/png;base64,...",
     "file_name": "avatar.png",
     "file_type": "image/png"
   }
   ```
5. 업로드 완료 후 character 레코드의 URL이 자동으로 Supabase Storage URL로 갱신됨

### 4.2 `screens/character-edit.tsx`

**loader:** 기존 로직 유지 (character + keywords + safetyFilter 조회)

**데이터 매핑 (loader → WizardProvider initialData):**
```typescript
const initialData: Partial<CharacterFormData> = {
  name: character.name,
  display_name: character.display_name || "",
  tagline: character.tagline || "",
  description: character.description || "",
  avatar_url: character.avatar_url,
  banner_url: character.banner_url,
  role: character.role || "",
  appearance: character.appearance || "",
  personality: character.personality || "",
  speech_style: character.speech_style || "",
  example_dialogues: (character.example_dialogues as any[] || []).map((d, i) => ({
    id: crypto.randomUUID(),
    user: d.user || "",
    character: d.character || "",
  })),
  greeting_message: character.greeting_message || "",
  relationship: character.relationship || "",
  world_setting: character.world_setting || "",
  system_prompt: character.system_prompt || "",
  enable_memory: character.enable_memory ?? true,
  category: character.category || "",
  age_rating: character.age_rating || "everyone",
  tags: Array.isArray(character.tags) ? character.tags : [],
  is_public: character.is_public,
  is_nsfw: character.is_nsfw,
};
```

**action:** `request.json()` 으로 파싱

```typescript
// _action === "update"
//   - characters 테이블 UPDATE (모든 wizard 필드)
//   - avatar/banner가 "data:" 시작이면 upload-media API 호출
//   - return { success: true }

// _action === "save_draft"
//   - characters 테이블 UPDATE (status: "draft")
//   - return { success: true, isDraft: true }

// _action === "add_keyword"     → 기존 로직 그대로
// _action === "delete_keyword"  → 기존 로직 그대로
// _action === "update_safety"   → 기존 로직 그대로
```

**컴포넌트 구조:**
```tsx
export default function CharacterEdit({ loaderData }: Route.ComponentProps) {
  const { character } = loaderData;

  return (
    <Tabs defaultValue="wizard">
      <TabsList className="grid w-full grid-cols-3 bg-[#232323] border-[#3f3f46]">
        <TabsTrigger value="wizard">캐릭터 정보</TabsTrigger>
        <TabsTrigger value="keywords">키워드북</TabsTrigger>
        <TabsTrigger value="safety">안전 필터</TabsTrigger>
      </TabsList>

      <TabsContent value="wizard">
        <WizardProvider initialData={initialData} characterId={character.character_id}>
          <CharacterWizard
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            onCancel={handleCancel}
          />
        </WizardProvider>
      </TabsContent>

      <TabsContent value="keywords">
        {/* 기존 키워드 관리 UI 재사용 — 다크 테마 적용 */}
      </TabsContent>

      <TabsContent value="safety">
        {/* 기존 안전 필터 UI 재사용 — 다크 테마 적용 */}
      </TabsContent>
    </Tabs>
  );
}
```

키워드/안전필터 탭의 기존 코드는 다크 테마 색상만 적용해서 유지. `Form method="post"` + `formData` 방식 그대로.

---

## 5. 임시저장 흐름

```
[생성 모드 - 첫 임시저장]
1. 사용자가 "임시저장" 클릭
2. POST /characters/create { ...formData, _action: "save_draft" }
3. action에서 status: "draft"로 INSERT
4. return { characterId, isDraft: true }
5. 클라이언트: navigate(`/characters/${characterId}/edit`)
   → 이후 편집 모드로 전환

[편집 모드 - 임시저장]
1. POST /characters/:characterId/edit { ...formData, _action: "save_draft" }
2. action에서 status: "draft"로 UPDATE
3. toast 알림 "임시저장 완료"
```

---

## 6. 구현 순서 (권장)

```
Phase 1: 기반 (3개)
  1. lib/wizard-types.ts
  2. lib/wizard-validation.ts
  3. lib/wizard-context.tsx

Phase 2: 재사용 컴포넌트 (5개)
  4. components/wizard/image-upload-field.tsx
  5. components/wizard/tag-input.tsx
  6. components/wizard/example-dialogue-editor.tsx
  7. components/wizard/system-prompt-generator.ts
  8. components/wizard/character-preview-card.tsx

Phase 3: 위저드 셸 + 스텝 (7개)
  9.  components/wizard/wizard-progress-bar.tsx
  10. components/wizard/steps/step-profile.tsx
  11. components/wizard/steps/step-personality.tsx
  12. components/wizard/steps/step-startup.tsx
  13. components/wizard/steps/step-ai-settings.tsx
  14. components/wizard/steps/step-publishing.tsx
  15. components/wizard/character-wizard.tsx

Phase 4: 화면 통합 (2개)
  16. screens/character-create.tsx
  17. screens/character-edit.tsx
```

---

## 7. 참조 파일 (수정 불필요)

| 파일 | 용도 |
|------|------|
| `app/features/characters/schema.ts` | DB 스키마 확인 |
| `app/features/characters/api/upload-media.tsx` | 이미지 업로드 API (그대로 사용) |
| `app/routes.ts` | 라우트 확인 (`/characters/create`, `/:characterId/edit`) |
| `app/core/components/ui/switch.tsx` | Switch 컴포넌트 |
| `app/core/components/ui/select.tsx` | Select 컴포넌트 |
| `app/core/components/ui/badge.tsx` | Badge 컴포넌트 |
| `app/core/components/ui/tabs.tsx` | Tabs 컴포넌트 |

---

## 8. 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] /characters/create 접속 → 5단계 위저드 표시
- [ ] 각 단계 필수 필드 미입력 시 에러 표시
- [ ] 이미지 업로드 → 미리보기 표시
- [ ] "자동 생성" 버튼 → system_prompt 필드에 텍스트 채워짐
- [ ] 5단계 미리보기 카드에 입력 내용 반영
- [ ] 최종 제출 → 캐릭터 생성 → 상세 페이지로 이동
- [ ] 임시저장 → draft 상태로 저장 → 편집 모드 전환
- [ ] /characters/:id/edit 접속 → 데이터 프리필
- [ ] 편집 모드 → 키워드/안전필터 탭 동작
- [ ] 다크 테마 일관성 확인
