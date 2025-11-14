/**
 * Chat Settings Component
 * 
 * Customization options: font size, colors, bubble colors, theme, background
 */
import { Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Separator } from "~/core/components/ui/separator";

export interface ChatSettings {
  fontSize: number;
  userBubbleColor: string;
  characterBubbleColor: string;
  theme: "light" | "dark";
  backgroundImage?: string;
}

interface ChatSettingsProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
}

export function ChatSettingsDialog({
  settings,
  onSettingsChange,
}: ChatSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>대화 설정</DialogTitle>
          <DialogDescription>
            대화 화면을 원하는 대로 커스터마이징하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="fontSize">글꼴 크기</Label>
            <Input
              id="fontSize"
              type="number"
              min="12"
              max="24"
              value={localSettings.fontSize}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  fontSize: parseInt(e.target.value) || 14,
                })
              }
            />
          </div>

          <Separator />

          {/* Bubble Colors */}
          <div className="space-y-3">
            <Label>말풍선 색상</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="userBubble" className="w-24">
                  내 메시지
                </Label>
                <Input
                  id="userBubble"
                  type="color"
                  value={localSettings.userBubbleColor}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      userBubbleColor: e.target.value,
                    })
                  }
                  className="h-10 w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="characterBubble" className="w-24">
                  캐릭터 메시지
                </Label>
                <Input
                  id="characterBubble"
                  type="color"
                  value={localSettings.characterBubbleColor}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      characterBubbleColor: e.target.value,
                    })
                  }
                  className="h-10 w-20"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">테마</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value: "light" | "dark") =>
                setLocalSettings({ ...localSettings, theme: value })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">라이트 모드</SelectItem>
                <SelectItem value="dark">다크 모드</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Background Image */}
          <div className="space-y-2">
            <Label htmlFor="background">배경 이미지 (URL)</Label>
            <Input
              id="background"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={localSettings.backgroundImage || ""}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  backgroundImage: e.target.value || undefined,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


