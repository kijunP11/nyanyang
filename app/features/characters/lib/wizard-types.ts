/**
 * Character Wizard Types
 *
 * Type definitions for the 5-step character creation wizard.
 */

/**
 * Example Dialogue Type
 */
export interface ExampleDialogue {
  id: string; // crypto.randomUUID()
  user: string; // 사용자 메시지
  character: string; // 캐릭터 응답
}

/**
 * Character Form Data
 */
export interface CharacterFormData {
  // Step 1: 프로필
  name: string; // 필수, max 50
  display_name: string; // max 50
  tagline: string; // max 50
  description: string; // 필수
  avatar_url: string | null; // base64 data URL (생성) 또는 Supabase URL (편집)
  banner_url: string | null; // 위와 동일

  // Step 2: 설정/성격
  role: string; // friend | teacher | lover | mentor | companion
  appearance: string;
  personality: string; // 필수
  speech_style: string;
  example_dialogues: ExampleDialogue[];

  // Step 3: 시작 설정
  greeting_message: string; // 필수
  relationship: string;
  world_setting: string;

  // Step 4: AI 설정
  system_prompt: string; // 필수
  enable_memory: boolean; // default true
  gender: string; // male | female | other (캐릭터 성별)
  age_rating: string; // everyone | teen | mature | adult

  // Step 5: 등록 옵션
  tags: string[];
  category: string; // 장르: romance | fantasy | action | comedy | drama | horror | scifi | slice_of_life | mystery | adventure | other
  is_public: boolean; // default false
  is_nsfw: boolean; // default false
}

/**
 * Wizard Steps
 */
export const WIZARD_STEPS = {
  PROFILE: 1,
  PERSONALITY: 2,
  STARTUP: 3,
  AI_SETTINGS: 4,
  PUBLISHING: 5,
} as const;

export type WizardStep = (typeof WIZARD_STEPS)[keyof typeof WIZARD_STEPS];

/**
 * Step Labels
 */
export const STEP_LABELS: Record<WizardStep, string> = {
  1: "프로필",
  2: "설정/성격",
  3: "시작 설정",
  4: "AI 설정",
  5: "등록 옵션",
};

/**
 * Validation Errors Type
 */
export type ValidationErrors = Partial<Record<keyof CharacterFormData, string>>;

/**
 * Wizard State
 */
export interface WizardState {
  currentStep: WizardStep;
  formData: CharacterFormData;
  isDirty: boolean;
  errors: ValidationErrors;
  characterId: number | null;
  isEditMode: boolean;
  isSavingDraft: boolean;
}

/**
 * Wizard Actions
 */
export type WizardAction =
  | { type: "SET_STEP"; payload: WizardStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | {
      type: "UPDATE_FIELD";
      payload: { field: keyof CharacterFormData; value: unknown };
    }
  | { type: "UPDATE_FIELDS"; payload: Partial<CharacterFormData> }
  | { type: "SET_FORM_DATA"; payload: Partial<CharacterFormData> }
  | { type: "SET_ERRORS"; payload: ValidationErrors }
  | { type: "CLEAR_ERRORS" }
  | { type: "RESET_FORM" }
  | {
      type: "SET_EDIT_MODE";
      payload: { characterId: number; data: Partial<CharacterFormData> };
    }
  | { type: "SET_CHARACTER_ID"; payload: number }
  | { type: "SET_SAVING_DRAFT"; payload: boolean }
  | { type: "ADD_EXAMPLE_DIALOGUE"; payload: ExampleDialogue }
  | {
      type: "UPDATE_EXAMPLE_DIALOGUE";
      payload: { id: string; data: Partial<ExampleDialogue> };
    }
  | { type: "REMOVE_EXAMPLE_DIALOGUE"; payload: string };

/**
 * Initial Form Data
 */
export const initialFormData: CharacterFormData = {
  // Step 1
  name: "",
  display_name: "",
  tagline: "",
  description: "",
  avatar_url: null,
  banner_url: null,

  // Step 2
  role: "",
  appearance: "",
  personality: "",
  speech_style: "",
  example_dialogues: [],

  // Step 3
  greeting_message: "",
  relationship: "",
  world_setting: "",

  // Step 4
  system_prompt: "",
  enable_memory: true,
  gender: "",
  age_rating: "everyone",

  // Step 5
  tags: [],
  category: "",
  is_public: false,
  is_nsfw: false,
};

/**
 * Role Options
 */
export const ROLE_OPTIONS = [
  { value: "friend", label: "친구" },
  { value: "teacher", label: "선생님" },
  { value: "lover", label: "연인" },
  { value: "mentor", label: "멘토" },
  { value: "companion", label: "동반자" },
] as const;

/**
 * Gender Options
 */
export const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
] as const;

/**
 * Category Options (장르)
 */
export const CATEGORY_OPTIONS = [
  { value: "romance", label: "로맨스" },
  { value: "fantasy", label: "판타지" },
  { value: "action", label: "액션" },
  { value: "comedy", label: "코미디" },
  { value: "drama", label: "드라마" },
  { value: "horror", label: "호러" },
  { value: "scifi", label: "SF" },
  { value: "slice_of_life", label: "일상" },
  { value: "mystery", label: "미스터리" },
  { value: "adventure", label: "어드벤처" },
  { value: "other", label: "기타" },
] as const;

/**
 * Age Rating Options
 */
export const AGE_RATING_OPTIONS = [
  {
    value: "everyone",
    label: "전체 이용가",
    description: "모든 연령 이용 가능",
  },
  { value: "teen", label: "청소년 이용가", description: "13세 이상 권장" },
  { value: "mature", label: "성인용", description: "18세 이상만 이용 가능" },
  { value: "adult", label: "성인전용", description: "성인 인증 필요" },
] as const;

/**
 * Popular Tags for suggestions
 */
export const POPULAR_TAGS = [
  "귀여움",
  "판타지",
  "연애",
  "일상",
  "힐링",
  "학원물",
  "이세계",
  "동물",
  "로맨스",
  "코미디",
  "츤데레",
  "상냥함",
] as const;
