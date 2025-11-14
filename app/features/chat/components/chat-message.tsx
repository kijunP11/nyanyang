/**
 * Chat Message Component
 * 
 * Displays individual chat messages (user or character)
 */
import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";

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
          <p className="text-muted-foreground text-xs italic mb-1">
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
          <p
            className="whitespace-pre-wrap break-words"
            style={{ fontSize: `${fontSize}px` }}
          >
            {message.content}
          </p>
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

