/**
 * AI Response Sanitizer
 *
 * AI 응답에서 불필요한 패턴을 제거하고 정제합니다.
 *
 * 제거 대상:
 * - INFO 블록 (```INFO ... ```)
 * - 대사 재출력 패턴 (캐릭터명|"대사")
 * - 잘못된 이미지 형식 (="[이미지]")
 * - 불필요한 공백/줄바꿈
 */

/**
 * INFO 블록 제거
 * 패턴: ```INFO ... ``` 또는 ```info ... ```
 */
function removeInfoBlocks(text: string): string {
  // ```INFO ... ``` 패턴 제거 (멀티라인)
  let result = text.replace(/```INFO[\s\S]*?```/gi, "");

  // INFO 블록이 ``` 없이 있는 경우도 처리
  // 예: INFO\n🕒3월 1일 ... 형태
  result = result.replace(
    /\nINFO\n[🕒🌐📄💼|❤️💦\[\]:\s\w가-힣,.-]+(\n|$)/gi,
    "\n",
  );

  return result;
}

/**
 * 대사 재출력 패턴 제거
 * 패턴: 캐릭터명|"대사" 또는 캐릭터명|"대사"
 */
function removeDialogueReecho(text: string): string {
  // 캐릭터명|"대사" 패턴 제거
  // 예: 에루|"안녕, 만나서 반가워."
  // 예: 에루|"{user} 안녕!"
  let result = text.replace(
    /\n[가-힣a-zA-Z]+\|[""].*?[""](\n|$)/g,
    "\n",
  );

  // 여러 캐릭터가 연속으로 나오는 경우도 처리
  result = result.replace(
    /(\n[가-힣a-zA-Z]+\|[""].*?[""])+(\n|$)/g,
    "\n",
  );

  return result;
}

/**
 * 잘못된 이미지 형식 정리
 * 제거: =" 또는 =""
 */
function cleanImageFormat(text: string): string {
  // =" 또는 ="" 형식 제거
  let result = text.replace(/=[""](\[이미지\])?[""]?/g, "");

  // ="로 시작하는 잘못된 패턴 정리
  result = result.replace(/=[""][^""\n]*[""]?/g, "");

  return result;
}

/**
 * 불필요한 공백/줄바꿈 정리
 */
function cleanWhitespace(text: string): string {
  // 3개 이상 연속된 줄바꿈을 2개로
  let result = text.replace(/\n{3,}/g, "\n\n");

  // 앞뒤 공백 제거
  result = result.trim();

  return result;
}

/**
 * {{user}}, {{char}} 플레이스홀더가 응답에 남아있으면 제거
 * (AI가 플레이스홀더를 그대로 출력한 경우 처리)
 */
function removeLeftoverPlaceholders(
  text: string,
  userName: string,
  charName: string,
): string {
  // AI가 실수로 {{user}}를 출력한 경우 치환
  let result = text.replace(/\{\{user\}\}/gi, userName);
  result = result.replace(/\{\{char\}\}/gi, charName);

  return result;
}

/**
 * 메인 Sanitizer 함수
 *
 * @param response - AI 응답 원본
 * @param userName - 사용자 이름 (플레이스홀더 치환용)
 * @param charName - 캐릭터 이름 (플레이스홀더 치환용)
 * @returns 정제된 응답
 */
export function sanitizeResponse(
  response: string,
  userName: string = "User",
  charName: string = "캐릭터",
): string {
  let result = response;

  // 1. INFO 블록 제거
  result = removeInfoBlocks(result);

  // 2. 대사 재출력 패턴 제거
  result = removeDialogueReecho(result);

  // 3. 잘못된 이미지 형식 정리
  result = cleanImageFormat(result);

  // 4. 남은 플레이스홀더 치환
  result = removeLeftoverPlaceholders(result, userName, charName);

  // 5. 공백 정리 (마지막에 실행)
  result = cleanWhitespace(result);

  return result;
}

/**
 * Sanitizer 필요 여부 확인
 * (디버깅/로깅용)
 */
export function needsSanitization(response: string): boolean {
  const patterns = [
    /```INFO/i,
    /\n[가-힣a-zA-Z]+\|[""].*?[""](\n|$)/,
    /=[""](\[이미지\])?[""]?/,
    /\{\{user\}\}/i,
    /\{\{char\}\}/i,
  ];

  return patterns.some((pattern) => pattern.test(response));
}

