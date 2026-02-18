/**
 * 키워드북 생성 다이얼로그
 */
import { useState } from "react";
import { useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

interface CreateBookDialogProps {
  open: boolean;
  onClose: () => void;
  bookType: "user" | "character" | "unclassified";
  onSuccess: () => void;
}

export default function CreateBookDialog({
  open,
  onClose,
  bookType,
  onSuccess,
}: CreateBookDialogProps) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;

    fetcher.submit(
      JSON.stringify({ title: title.trim(), book_type: bookType }),
      {
        method: "POST",
        action: "/api/keywords/create-book",
        encType: "application/json",
      }
    );

    setTitle("");
    onClose();
    setTimeout(onSuccess, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>키워드북 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="book-title"
              className="text-sm font-medium text-[#181D27]"
            >
              키워드북 이름
            </Label>
            <Input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="키워드북 이름을 입력하세요"
              className="mt-1 border-[#D5D7DA]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#D5D7DA]"
          >
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || fetcher.state !== "idle"}
            className="bg-[#00c4af] hover:bg-[#00b39e] text-white"
          >
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
