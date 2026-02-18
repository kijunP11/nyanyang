/**
 * 스트리밍 인디케이터
 * 타이핑 도트 애니메이션 + 스트리밍 중인 메시지 렌더링
 */
import ReactMarkdown from "react-markdown";

interface CharacterInfo {
  display_name: string | null;
  avatar_url: string | null;
}

interface StreamingIndicatorProps {
  character: CharacterInfo;
  isStreaming: boolean;
  streamingMessage: string;
}

function CharacterAvatar({ character }: { character: CharacterInfo }) {
  if (character.avatar_url) {
    return (
      <img
        src={character.avatar_url}
        alt={character.display_name ?? undefined}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3f3f46]">
      <span className="text-xs font-semibold text-white">
        {(character.display_name ?? "?")[0]}
      </span>
    </div>
  );
}

export function StreamingIndicator({
  character,
  isStreaming,
  streamingMessage,
}: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  if (streamingMessage) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CharacterAvatar character={character} />
        </div>
        <div className="max-w-[280px] rounded-2xl bg-[#2f3032] px-4 py-3">
          <div className="prose prose-sm max-w-none text-sm text-white prose-p:text-white">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} className="my-2 h-auto max-w-full rounded-lg" alt={props.alt ?? "Image"} />
                ),
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {streamingMessage}
            </ReactMarkdown>
          </div>
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        <CharacterAvatar character={character} />
      </div>
      <div className="rounded-2xl bg-[#2f3032] px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
