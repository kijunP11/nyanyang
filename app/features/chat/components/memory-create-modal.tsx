/**
 * 메모리 생성 모달
 *
 * content: 자유 텍스트
 * type: summary | fact | user_note (select)
 * importance: 1-10 (Slider)
 */
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/core/components/ui/dialog";
import { Slider } from "~/core/components/ui/slider";

interface MemoryCreateModalProps {
  open: boolean;
  onClose: () => void;
  roomId: number;
  onSuccess: () => void;
}

const MEMORY_TYPES = [
  { value: "user_note", label: "사용자 노트" },
  { value: "fact", label: "사실" },
  { value: "summary", label: "요약" },
] as const;

export function MemoryCreateModal({
  open,
  onClose,
  roomId,
  onSuccess,
}: MemoryCreateModalProps) {
  const fetcher = useFetcher();

  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState<string>("user_note");
  const [importance, setImportance] = useState(5);

  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (open) {
      setContent("");
      setMemoryType("user_note");
      setImportance(5);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!content.trim()) return;

    fetcher.submit(
      {
        roomId,
        content: content.trim(),
        memoryType,
        importance,
      },
      {
        method: "POST",
        action: "/api/chat/memory",
        encType: "application/json",
      }
    );
  };

  useEffect(() => {
    const data = fetcher.data as { success?: boolean } | undefined;
    if (fetcher.state === "idle" && data?.success) {
      setContent("");
      setMemoryType("user_note");
      setImportance(5);
      onSuccess();
    }
  }, [fetcher.state, fetcher.data, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 메모리 추가</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              유형
            </label>
            <select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              className="w-full rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            >
              {MEMORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="기억할 내용을 입력하세요..."
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-[#E9EAEB] bg-white px-3 py-2 text-sm outline-none focus:border-[#00c4af] dark:border-[#333741] dark:bg-[#1F242F] dark:text-white"
            />
            <p className="mt-1 text-right text-xs text-[#A4A7AE]">
              {content.length}/500
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-[#414651] dark:text-[#D5D7DA]">
              <span>중요도</span>
              <span className="text-xs text-[#00c4af]">{importance}</span>
            </label>
            <Slider
              value={[importance]}
              onValueChange={([v]) => setImportance(v ?? 5)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#A4A7AE]">
              <span>낮음</span>
              <span>높음</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex-1 rounded-lg bg-[#00c4af] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
