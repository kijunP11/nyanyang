/**
 * 대화 설정 모달
 * AI 모델 선택(라디오 + 권장 배지) + 세션명 입력 + [적용하기]
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";
import type { AIModel } from "./model-selector";

const MODELS: { id: AIModel; label: string }[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "claude-sonnet", label: "Claude Sonnet" },
  { id: "opus", label: "Opus" },
  { id: "gpt-4o", label: "GPT-4o" },
];

interface ConversationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: AIModel;
  recommendedModel: string | null;
  roomTitle: string;
  onApply: (model: AIModel, title: string) => void;
}

export function ConversationSettingsModal({
  open,
  onOpenChange,
  currentModel,
  recommendedModel,
  roomTitle,
  onApply,
}: ConversationSettingsModalProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(currentModel);
  const [title, setTitle] = useState(roomTitle);

  useEffect(() => {
    if (open) {
      setSelectedModel(currentModel);
      setTitle(roomTitle);
    }
  }, [open, currentModel, roomTitle]);

  const handleApply = () => {
    onApply(selectedModel, title);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#181D27]">
        <DialogHeader>
          <DialogTitle>대화 설정</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-[#181D27] dark:text-white">
            AI 모델
          </p>
          <div className="space-y-2">
            {MODELS.map((model) => (
              <label
                key={model.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  selectedModel === model.id
                    ? "border-[#14b8a6] bg-[#14b8a6]/5"
                    : "border-[#E9EAEB] hover:border-[#14b8a6]/50 dark:border-[#333741]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    className="accent-[#14b8a6]"
                  />
                  <span className="text-sm text-[#181D27] dark:text-white">
                    {model.label}
                  </span>
                </div>
                {recommendedModel === model.id && (
                  <span className="rounded-full bg-[#14b8a6] px-2 py-0.5 text-xs text-white">
                    권장
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-[#181D27] dark:text-white">
            세션명
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="대화 제목을 입력하세요"
            className="w-full rounded-lg border border-[#E9EAEB] bg-transparent px-4 py-3 text-sm dark:border-[#333741] dark:text-white"
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleApply}
            className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
