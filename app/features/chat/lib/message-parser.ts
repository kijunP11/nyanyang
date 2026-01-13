/**
 * Message Parser Utility
 *
 * 채팅 메시지에서 마크다운 이미지 문법을 파싱하여
 * 텍스트와 이미지를 분리합니다.
 *
 * 지원 형식:
 * - ![](https://example.com/image.png)
 * - ![]("https://example.com/image.png")
 * - ![대체텍스트](url)
 */

export interface MessagePart {
  type: "text" | "image";
  content: string;
  alt?: string; // 이미지의 경우 alt 텍스트
}

/**
 * URL이 유효한 이미지 URL인지 검증
 * - http:// 또는 https://로 시작해야 함 (보안)
 */
function isValidImageUrl(url: string): boolean {
  // 따옴표 제거 (![](\"url\") 형식 지원)
  const cleanUrl = url.replace(/^["']|["']$/g, "").trim();

  // http:// 또는 https://로 시작하는지 확인
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return false;
  }

  try {
    new URL(cleanUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * 메시지 content를 파싱하여 텍스트와 이미지 부분으로 분리
 *
 * @param content - 원본 메시지 내용
 * @returns MessagePart 배열
 */
export function parseMessageContent(content: string): MessagePart[] {
  if (!content || typeof content !== "string") {
    return [{ type: "text", content: "" }];
  }

  const parts: MessagePart[] = [];

  // 마크다운 이미지 정규식: ![alt](url) 또는 ![]("url")
  // - alt 텍스트는 선택사항
  // - url은 따옴표로 감싸져 있을 수도 있음
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, altText, rawUrl] = match;
    const matchStart = match.index;

    // 이미지 앞의 텍스트 추가
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart);
      if (textBefore.trim()) {
        parts.push({ type: "text", content: textBefore });
      }
    }

    // URL 정리 (따옴표 제거)
    const cleanUrl = rawUrl.replace(/^["']|["']$/g, "").trim();

    // 유효한 이미지 URL인 경우에만 이미지로 처리
    if (isValidImageUrl(cleanUrl)) {
      parts.push({
        type: "image",
        content: cleanUrl,
        alt: altText || undefined,
      });
    } else {
      // 유효하지 않은 URL은 원본 텍스트 그대로 표시
      parts.push({ type: "text", content: fullMatch });
    }

    lastIndex = matchStart + fullMatch.length;
  }

  // 마지막 이미지 이후의 텍스트 추가
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // 파싱 결과가 없으면 원본 텍스트 반환
  if (parts.length === 0) {
    return [{ type: "text", content }];
  }

  return parts;
}

/**
 * 메시지에 이미지가 포함되어 있는지 확인
 */
export function hasImages(content: string): boolean {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
  return imageRegex.test(content);
}

