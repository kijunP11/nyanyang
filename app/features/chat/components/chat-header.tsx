/**
 * Chat Header Component
 * 
 * Displays character information, back button, and menu
 */
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

export function ChatHeader({ character, onMenuClick }: ChatHeaderProps) {
  return (
    <div className="flex h-20 items-center gap-4 border-b bg-background px-4">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


