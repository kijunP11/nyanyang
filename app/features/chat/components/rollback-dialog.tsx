/**
 * 롤백 확인 다이얼로그
 */
import { Button } from "~/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import type { ChatMessage } from "../hooks/use-chat-streaming";

interface RollbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rollbackMessageId: number | null;
  messageList: ChatMessage[];
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RollbackDialog({
  open,
  onOpenChange,
  rollbackMessageId,
  messageList,
  onConfirm,
  isSubmitting,
}: RollbackDialogProps) {
  const targetMessage = rollbackMessageId
    ? messageList.find((msg) => msg.message_id === rollbackMessageId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대화 되돌리기</DialogTitle>
          <DialogDescription>
            이 메시지로 대화를 되돌리시겠습니까? 현재 대화는 유지되며, 이 메시지부터 새로운 대화를 시작할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {targetMessage && (
          <div className="my-4 rounded-lg bg-[#2f3032] p-4">
            <p className="mb-2 text-sm font-medium text-white">되돌릴 메시지:</p>
            <div className="text-sm text-[#9ca3af]">
              {targetMessage.content.substring(0, 200)}
              {targetMessage.content.length > 200 ? "..." : ""}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "처리 중..." : "되돌리기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
