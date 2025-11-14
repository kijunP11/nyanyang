/**
 * Message Actions Component
 * 
 * Actions for individual messages: rollback, regenerate, branch
 */
import { ArrowLeft, RefreshCw, GitBranch } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

interface MessageActionsProps {
  messageId: string;
  onRollback?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onBranch?: (messageId: string) => void;
}

export function MessageActions({
  messageId,
  onRollback,
  onRegenerate,
  onBranch,
}: MessageActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <span className="text-xs">⋯</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onRollback?.(messageId)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          이 메시지로 되돌리기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRegenerate?.(messageId)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          재생성
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBranch?.(messageId)}>
          <GitBranch className="mr-2 h-4 w-4" />
          새 대화 분기 생성
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


