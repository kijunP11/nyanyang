/**
 * 메시지 버블 — Figma 픽셀 퍼펙트 (906:16273)
 * AI: bg-[#f5f5f5] rounded-tr/br/bl-8, 왼상단 직각
 * User: 기존 teal 오른쪽 유지
 */
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../hooks/use-chat-streaming";

/* ── Figma 인라인 SVG 아이콘 (Untitled UI) ── */

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 11" fill="none">
      <path d="M0.5 2.5H1.5M1.5 2.5H9.5M1.5 2.5V9.5C1.5 9.76522 1.60536 10.0196 1.79289 10.2071C1.98043 10.3946 2.23478 10.5 2.5 10.5H7.5C7.76522 10.5 8.01957 10.3946 8.20711 10.2071C8.39464 10.0196 8.5 9.76522 8.5 9.5V2.5H1.5ZM3 2.5V1.5C3 1.23478 3.10536 0.98043 3.29289 0.792893C3.48043 0.605357 3.73478 0.5 4 0.5H6C6.26522 0.5 6.51957 0.605357 6.70711 0.792893C6.89464 0.98043 7 1.23478 7 1.5V2.5M4 5V8M6 5V8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 9.56067" fill="none">
      <path d="M5.00001 9.06066H9.50001M7.25001 0.81066C7.44892 0.611748 7.71871 0.5 8.00001 0.5C8.1393 0.5 8.27722 0.527435 8.40591 0.580738C8.53459 0.634041 8.65152 0.712169 8.75001 0.81066C8.8485 0.909152 8.92663 1.02608 8.97993 1.15476C9.03324 1.28345 9.06067 1.42137 9.06067 1.56066C9.06067 1.69995 9.03324 1.83787 8.97993 1.96656C8.92663 2.09524 8.8485 2.21217 8.75001 2.31066L2.50001 8.56066L0.500011 9.06066L1.00001 7.06066L7.25001 0.81066Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 9.99763" fill="none">
      <path d="M0.5 0.998817V3.99882M0.5 3.99882H3.5M0.5 3.99882L2.82 1.81882C3.35737 1.28117 4.02219 0.88842 4.7524 0.677204C5.48262 0.465988 6.25445 0.443193 6.99586 0.610946C7.73727 0.7787 8.4241 1.13153 8.99227 1.63653C9.56043 2.14152 9.99142 2.78221 10.245 3.49882M11.5 8.99882V5.99882M11.5 5.99882H8.5M11.5 5.99882L9.18 8.17882C8.64263 8.71646 7.97781 9.10921 7.2476 9.32043C6.51738 9.53165 5.74555 9.55444 5.00414 9.38669C4.26273 9.21893 3.5759 8.8661 3.00773 8.36111C2.43957 7.85612 2.00858 7.21542 1.755 6.49882" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 9.5H8.5C9.05229 9.5 9.5 9.05229 9.5 8.5V1.5C9.5 0.947715 9.05229 0.5 8.5 0.5H1.5C0.947715 0.5 0.5 0.947715 0.5 1.5V8.5C0.5 9.05229 0.947715 9.5 1.5 9.5ZM1.5 9.5L7 4L9.5 6.5M4 3.25C4 3.66421 3.66421 4 3.25 4C2.83579 4 2.5 3.66421 2.5 3.25C2.5 2.83579 2.83579 2.5 3.25 2.5C3.66421 2.5 4 2.83579 4 3.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 11" fill="none">
      <path d="M3.295 6.255L6.71 8.245M6.705 2.755L3.295 4.745M9.5 2C9.5 2.82843 8.82843 3.5 8 3.5C7.17157 3.5 6.5 2.82843 6.5 2C6.5 1.17157 7.17157 0.5 8 0.5C8.82843 0.5 9.5 1.17157 9.5 2ZM3.5 5.5C3.5 6.32843 2.82843 7 2 7C1.17157 7 0.5 6.32843 0.5 5.5C0.5 4.67157 1.17157 4 2 4C2.82843 4 3.5 4.67157 3.5 5.5ZM9.5 9C9.5 9.82843 8.82843 10.5 8 10.5C7.17157 10.5 6.5 9.82843 6.5 9C6.5 8.17157 7.17157 7.5 8 7.5C8.82843 7.5 9.5 8.17157 9.5 9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── 액션 아이콘 버튼 ── */

function ActionButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex size-[24px] items-center justify-center rounded-full border-[0.5px] border-[#d5d7da] bg-[#f5f5f5] text-[#717680] transition-colors hover:bg-[#e9eaeb] hover:text-[#414651]"
    >
      {children}
    </button>
  );
}

/* ── Types ── */

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
  isLastAssistant?: boolean;
}

export function MessageBubble({
  message,
  character,
  onRollback,
  onRegenerate,
  isStreaming,
  onImageClick,
  isLastAssistant,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRealMessage =
    typeof message.message_id === "number" &&
    message.message_id > 0 &&
    message.message_id < 1_000_000_000;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[560px] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] bg-[#36c4b3] p-[14px]">
          <div className="text-[14px] leading-[20px] text-white">
            <ReactMarkdown
              components={{
                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // AI 메시지
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="max-w-[560px] rounded-tr-[8px] rounded-br-[8px] rounded-bl-[8px] bg-[#f5f5f5] p-[14px]">
        <div className="text-[14px] leading-[20px] text-[#535862]">
          <ReactMarkdown
            components={{
              img: ({ src, alt, ...props }) => (
                <img
                  {...props}
                  src={src}
                  alt={alt ?? ""}
                  className="my-2 w-full cursor-pointer rounded-[8px] object-cover transition-opacity hover:opacity-80"
                  onClick={() => src && onImageClick?.(src)}
                />
              ),
              p: (props) => <p className="mb-2 last:mb-0" {...props} />,
              strong: (props) => (
                <strong
                  className="text-[16px] font-semibold leading-[24px] text-black"
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* 액션 아이콘 row — 마지막 AI 메시지에만 표시 */}
      {isLastAssistant && isRealMessage && (
        <div className="flex w-full max-w-[560px] items-center justify-between">
          <ActionButton
            onClick={() => onRollback(message.message_id)}
            title="삭제"
          >
            <TrashIcon />
          </ActionButton>
          <div className="flex items-center gap-[12px]">
            <ActionButton title="편집">
              <EditIcon />
            </ActionButton>
            <ActionButton
              onClick={() => onRegenerate(message.message_id)}
              title="재생성"
            >
              <RefreshIcon />
            </ActionButton>
            <ActionButton title="이미지">
              <ImageIcon />
            </ActionButton>
            <ActionButton title="공유">
              <ShareIcon />
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
