/**
 * 최대 출력 조정 모달
 *
 * 슬라이더로 max_output_tokens(response_length) 설정.
 * 범위: 500 ~ 8000 (chat-settings-panel과 동일)
 */
import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/core/components/ui/dialog";
import { Slider } from "~/core/components/ui/slider";

interface MaxOutputModalProps {
  open: boolean;
  onClose: () => void;
  currentValue: number;
  onSave: (value: number) => void;
}

const PRESETS = [
  { value: 500, label: "짧게" },
  { value: 1000, label: "보통" },
  { value: 2000, label: "길게" },
  { value: 4000, label: "최대" },
  { value: 8000, label: "무제한" },
];

export function MaxOutputModal({
  open,
  onClose,
  currentValue,
  onSave,
}: MaxOutputModalProps) {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    if (open) {
      setValue(currentValue);
    }
  }, [open, currentValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const closestPreset = PRESETS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>응답 길이 조정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-[#00c4af]">{value}</span>
            <p className="mt-1 text-sm text-[#717680] dark:text-[#94969C]">
              최대 토큰 ({closestPreset.label})
            </p>
          </div>

          <Slider
            value={[value]}
            onValueChange={([v]) => setValue(v ?? 2000)}
            min={500}
            max={8000}
            step={500}
            className="w-full"
          />

          <div className="flex justify-between text-[10px] text-[#A4A7AE]">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue(p.value)}
                className={`rounded-full px-2 py-0.5 transition-colors ${
                  value === p.value
                    ? "bg-[#00c4af]/10 text-[#00c4af]"
                    : "hover:text-[#00c4af]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-[#A4A7AE] dark:text-[#717680]">
            값이 클수록 AI가 더 긴 응답을 생성합니다. 토큰이 많을수록 젤리 소비량도 증가합니다.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-[#00c4af] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e]"
          >
            적용
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
