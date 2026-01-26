/**
 * Chat Header Component
 *
 * Displays character information, back button, and menu
 */
import { ArrowLeft, MoreVertical, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";

export interface CharacterInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string;
  description?: string;
}

interface ChatHeaderProps {
  character: CharacterInfo;
  onMenuClick?: () => void;
  onResetConversation?: () => Promise<void>;
  hasMessages?: boolean;
  isResetting?: boolean;
}

export function ChatHeader({
  character,
  onMenuClick,
  onResetConversation,
  hasMessages = false,
  isResetting = false,
}: ChatHeaderProps) {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  const handleResetConfirm = async () => {
    if (onResetConversation) {
      await onResetConversation();
    }
    setIsResetDialogOpen(false);
  };

  return (
    <>
      <div className="bg-background flex h-20 items-center gap-4 border-b px-4">
        {/* Back Button */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        {/* Character Avatar */}
        <Avatar className="h-14 w-14">
          <AvatarImage src={character.avatarUrl} alt={character.name} />
          <AvatarFallback>{character.name.slice(0, 2)}</AvatarFallback>
        </Avatar>

        {/* Character Info */}
        <div className="flex-1">
          <h2 className="text-base font-semibold">{character.name}</h2>
          <p className="text-muted-foreground text-xs">
            {character.status || "알수없음"}
          </p>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuItem>대화 저장</DropdownMenuItem>
            <DropdownMenuItem>공유하기</DropdownMenuItem>
            {hasMessages && onResetConversation && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleResetClick}
                  className="text-destructive focus:text-destructive"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  대화 새로 시작
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대화를 새로 시작할까요?</DialogTitle>
            <DialogDescription>
              지금까지의 대화 내용과 {character.name}의 기억이 모두 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isResetting}>
                취소
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleResetConfirm}
              disabled={isResetting}
            >
              {isResetting ? "초기화 중..." : "새로 시작"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
