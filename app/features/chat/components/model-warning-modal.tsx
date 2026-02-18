/**
 * 모델 불안정 경고 모달
 * 현재 모델 상태 + 대체 모델 추천 + 전환 버튼
 */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { AIModel } from "./model-selector";

interface ModelWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: AIModel;
  alternatives: AIModel[];
  onSwitchModel: (model: AIModel) => void;
}

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "claude-sonnet": "Claude Sonnet",
  "claude-opus": "Claude Opus",
  "claude-haiku": "Claude Haiku",
};

export function ModelWarningModal({
  open,
  onOpenChange,
  currentModel,
  alternatives,
  onSwitchModel,
}: ModelWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#3f3f46] bg-[#232323] text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <DialogTitle>모델 상태: 불안정</DialogTitle>
              <DialogDescription className="text-[#9ca3af]">
                현재 {MODEL_LABELS[currentModel] ?? currentModel} 모델이 불안정합니다.
                다른 모델 사용을 권장합니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 space-y-2">
          <p className="text-xs text-[#9ca3af]">추천 대체 모델</p>
          {alternatives.map((model) => (
            <button
              key={model}
              onClick={() => {
                onSwitchModel(model);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-[#3f3f46] px-4 py-3 text-sm text-white transition-colors hover:border-[#14b8a6] hover:bg-[#14b8a6]/10"
            >
              <span>{MODEL_LABELS[model] ?? model}</span>
              <span className="text-xs text-[#14b8a6]">전환</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#3f3f46] text-white hover:bg-white/10"
          >
            현재 모델 유지
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
