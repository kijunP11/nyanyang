/**
 * 메시지 버블 컴포넌트
 * AI (왼쪽, avatar) / User (오른쪽) 메시지 렌더링
 */
import ReactMarkdown from "react-markdown";
import { RotateCcw, RefreshCw } from "lucide-react";
import type { ChatMessage } from "../hooks/use-chat-streaming";

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
}

interface MessageBubbleProps {
  message: ChatMessage;
  character: CharacterInfo;
  onRollback: (messageId: number) => void;
  onRegenerate: (messageId: number) => void;
  isStreaming: boolean;
  onImageClick?: (imageUrl: string) => void;
}

export function MessageBubble({
  message,
  character,
  onRollback,
  onRegenerate,
  isStreaming,
  onImageClick,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  // Optimistic 메시지(message_id = Date.now())에는 액션 버튼 숨김
  const isRealMessage =
    typeof message.message_id === "number" &&
    message.message_id > 0 &&
    message.message_id < 1_000_000_000;

  return (
    <div className={`group flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar - AI만 */}
      {!isUser && (
        <div className="flex-shrink-0">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.display_name ?? undefined}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-[#3f3f46]">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {(character.display_name ?? "?")[0]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bubble + Actions */}
      <div className={`flex flex-col ${isUser ? "items-end" : ""}`}>
        <div
          className={`max-w-[280px] rounded-2xl px-4 py-3 ${
            isUser ? "bg-[#14b8a6] text-white" : "bg-gray-200 text-gray-900 dark:bg-[#2f3032] dark:text-white"
          }`}
        >
          <div className={`prose prose-sm max-w-none text-sm ${isUser ? "text-white prose-p:text-white prose-strong:text-white prose-em:text-white" : "text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-em:text-gray-900 dark:text-white dark:prose-p:text-white dark:prose-strong:text-white dark:prose-em:text-white"}`}>
            <ReactMarkdown
              components={{
                img: ({ src, alt, ...props }) => (
                  <img
                    {...props}
                    src={src}
                    alt={alt ?? ""}
                    className="my-2 max-h-64 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-80"
                    onClick={() => src && onImageClick?.(src)}
                  />
                ),
                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-[#9ca3af]">
            {new Date(message.created_at).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isRealMessage && (
            <button
              onClick={() => onRollback(message.message_id)}
              className="flex items-center gap-1 text-xs text-gray-500 opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100 dark:text-[#9ca3af]"
              title="이 메시지로 되돌리기"
            >
              <RotateCcw className="h-3 w-3" />
              되돌리기
            </button>
          )}
          {!isUser && isRealMessage && (
            <button
              onClick={() => onRegenerate(message.message_id)}
              className="flex items-center gap-1 text-xs text-gray-500 opacity-0 transition-opacity hover:text-[#14b8a6] group-hover:opacity-100 dark:text-[#9ca3af]"
              title="재생성"
              disabled={isStreaming}
            >
              <RefreshCw className="h-3 w-3" />
              재생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
