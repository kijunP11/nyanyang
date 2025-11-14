/**
 * Character Profile Component
 * 
 * Displays character information and disclaimer
 */
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "~/core/components/ui/alert";

interface CharacterProfileProps {
  name: string;
  description?: string;
}

export function CharacterProfile({
  name,
  description,
}: CharacterProfileProps) {
  return (
    <div className="border-b bg-muted/30 p-4">
      <Alert className="bg-muted/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          이 캐릭터는 유저가 기입한 정보를 토대로 제작된 AI 챗봇 입니다. 동명의
          실존인물 혹은 단체와는 관련이 없습니다.
        </AlertDescription>
      </Alert>
      {description && (
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      )}
    </div>
  );
}


