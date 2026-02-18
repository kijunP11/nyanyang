/**
 * 재생성 가이드 입력 다이얼로그
 * "이런 방향으로 다시 써줘" 가이드를 입력 후 재생성
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";

interface RegenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (guidance: string) => void;
  isStreaming: boolean;
}

export function RegenerationDialog({
  open,
  onOpenChange,
  onConfirm,
  isStreaming,
}: RegenerationDialogProps) {
  const [guidance, setGuidance] = useState("");

  const handleConfirm = () => {
    onConfirm(guidance.trim());
    setGuidance("");
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm("");
    setGuidance("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#3f3f46] bg-[#232323] text-white">
        <DialogHeader>
          <DialogTitle>재생성</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            원하는 방향이 있으면 아래에 입력해주세요. 비워두면 그대로 재생성합니다.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="예: 더 감정적으로 표현해줘, 짧게 대답해줘..."
          rows={3}
          className="w-full rounded-lg border border-[#3f3f46] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] focus:outline-none"
        />
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isStreaming}
            className="border-[#3f3f46] text-white hover:bg-white/10"
          >
            그냥 재생성
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isStreaming}
            className="bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            가이드 적용 후 재생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
