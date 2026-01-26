/**
 * Placeholder Replacement Utility
 *
 * 캐릭터 설정에서 {{user}}, {{char}} 등의 플레이스홀더를
 * 실제 값으로 치환합니다.
 *
 * 지원 플레이스홀더:
 * - {{user}} : 사용자 이름
 * - {{char}} : 캐릭터 이름
 */

export interface PlaceholderVariables {
  user: string;
  char: string;
}

/**
 * 텍스트에서 플레이스홀더를 실제 값으로 치환
 *
 * @param text - 치환할 텍스트
 * @param variables - 변수 매핑 객체
 * @returns 치환된 텍스트
 */
export function replacePlaceholders(
  text: string | null | undefined,
  variables: PlaceholderVariables,
): string {
  if (!text) return "";

  let result = text;

  // {{user}} 치환 (대소문자 무시)
  result = result.replace(/\{\{user\}\}/gi, variables.user);

  // {{char}} 치환 (대소문자 무시)
  result = result.replace(/\{\{char\}\}/gi, variables.char);

  return result;
}

/**
 * 캐릭터 객체의 모든 텍스트 필드에서 플레이스홀더 치환
 *
 * @param character - 캐릭터 데이터
 * @param variables - 변수 매핑 객체
 * @returns 플레이스홀더가 치환된 캐릭터 데이터 (원본 수정 안 함)
 */
export function replaceCharacterPlaceholders(
  character: any,
  variables: PlaceholderVariables,
): any {
  const replaced = { ...character };

  // 텍스트 필드들 치환
  const textFields = [
    "greeting_message",
    "system_prompt",
    "description",
    "appearance",
    "personality",
    "role",
    "world_setting",
    "relationship",
    "speech_style",
    "tone",
  ];

  for (const field of textFields) {
    if (replaced[field]) {
      replaced[field] = replacePlaceholders(replaced[field], variables);
    }
  }

  // example_dialogues 배열 치환
  if (
    replaced.example_dialogues &&
    Array.isArray(replaced.example_dialogues)
  ) {
    replaced.example_dialogues = replaced.example_dialogues.map(
      (dialogue: any) => ({
        ...dialogue,
        user: replacePlaceholders(dialogue.user, variables),
        character: replacePlaceholders(dialogue.character, variables),
      }),
    );
  }

  return replaced;
}

