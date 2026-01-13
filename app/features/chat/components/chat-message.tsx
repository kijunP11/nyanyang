/**
 * Chat Message Component
 *
 * Displays individual chat messages (user or character)
 * Supports markdown image syntax: ![alt](url)
 */
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";

import { parseMessageContent, type MessagePart } from "../lib/message-parser";

export interface ChatMessage {
  id: string;
  role: "user" | "character";
  content: string;
  timestamp: Date;
  characterName?: string;
  characterAvatar?: string;
  action?: string; // e.g., "*손을 흔들며 밝게 인사한다*"
}

interface ChatMessageProps {
  message: ChatMessage;
  userBubbleColor?: string;
  characterBubbleColor?: string;
  fontSize?: number;
}

/**
 * 이미지 컴포넌트 - 로드 실패 시 대체 텍스트 표시
 * 캐시된 이미지의 onLoad 타이밍 이슈 해결을 위해 img.complete 체크
 */
function MessageImage({
  src,
  alt,
  fontSize,
}: {
  src: string;
  alt?: string;
  fontSize: number;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // 캐시된 이미지 처리: 이미 로드된 이미지인지 확인
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      // 이미지가 이미 로드됨 (캐시에서 불러온 경우)
      setIsLoading(false);
    }
  }, [src]);

  if (hasError) {
    return (
      <span
        className="text-muted-foreground italic"
        style={{ fontSize: `${fontSize}px` }}
      >
        [이미지를 불러올 수 없습니다]
      </span>
    );
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block">
      {isLoading && (
        <div className="bg-muted my-2 h-32 w-48 animate-pulse rounded-lg" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt || "이미지"}
        className={`my-2 max-w-[300px] cursor-pointer rounded-lg transition-opacity hover:opacity-90 ${isLoading ? "h-0 opacity-0" : "opacity-100"}`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </a>
  );
}

/**
 * 메시지 콘텐츠 렌더러 - 텍스트와 이미지를 분리하여 렌더링
 */
function MessageContent({
  content,
  fontSize,
}: {
  content: string;
  fontSize: number;
}) {
  const parts = parseMessageContent(content);

  return (
    <>
      {parts.map((part: MessagePart, index: number) =>
        part.type === "text" ? (
          <p
            key={index}
            className="whitespace-pre-wrap break-words"
            style={{ fontSize: `${fontSize}px` }}
          >
            {part.content}
          </p>
        ) : (
          <MessageImage
            key={index}
            src={part.content}
            alt={part.alt}
            fontSize={fontSize}
          />
        ),
      )}
    </>
  );
}

export function ChatMessage({
  message,
  userBubbleColor = "#41C7BD",
  characterBubbleColor = "#3f3f46",
  fontSize = 14,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={message.characterAvatar} />
          <AvatarFallback>
            {message.characterName?.slice(0, 2) || "AI"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} max-w-[70%]`}
      >
        {!isUser && message.characterName && (
          <span className="text-muted-foreground text-xs">
            {message.characterName}
          </span>
        )}

        {message.action && (
          <p className="text-muted-foreground mb-1 text-xs italic">
            {message.action}
          </p>
        )}

        <div
          className="rounded-lg px-4 py-2"
          style={{
            backgroundColor: isUser ? userBubbleColor : characterBubbleColor,
            color: isUser ? "white" : undefined,
          }}
        >
          <MessageContent content={message.content} fontSize={fontSize} />
        </div>

        <span className="text-muted-foreground text-xs">
          {message.timestamp.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isUser && (
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>나</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
