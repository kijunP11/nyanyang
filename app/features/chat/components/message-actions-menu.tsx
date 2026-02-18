/**
 * 메시지 액션 드롭다운 메뉴
 * 복사, 재생성(AI만), 되돌리기. Phase 2에서 재생성 가이드 등 확장 예정.
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, RefreshCw, RotateCcw } from "lucide-react";

interface MessageActionsMenuProps {
  messageId: number;
  role: string;
  content: string;
  onRegenerate: (messageId: number) => void;
  onRollback: (messageId: number) => void;
  isStreaming: boolean;
}

export function MessageActionsMenu({
  messageId,
  role,
  content,
  onRegenerate,
  onRollback,
  isStreaming,
}: MessageActionsMenuProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded p-1 text-[#9ca3af] opacity-0 transition-opacity hover:text-white group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-[#3f3f46] bg-[#232323]">
        <DropdownMenuItem onClick={handleCopy} className="text-white hover:bg-white/10">
          <Copy className="mr-2 h-4 w-4" />
          복사
        </DropdownMenuItem>
        {role === "assistant" && (
          <DropdownMenuItem
            onClick={() => onRegenerate(messageId)}
            disabled={isStreaming}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            재생성
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onRollback(messageId)}
          className="text-white hover:bg-white/10"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          되돌리기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
