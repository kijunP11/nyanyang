/**
 * 젤리 소진 알림 모달
 *
 * 채팅 중 포인트 부족 시 표시.
 * [취소] → 모달 닫기, [구매하기] → 구매 Sheet 열기
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/core/components/ui/alert-dialog";

interface JellyDepletionModalProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export function JellyDepletionModal({
  open,
  onClose,
  onPurchase,
}: JellyDepletionModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg">
            젤리가 모두 소진되었어요
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            대화를 계속하려면 젤리를 충전해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 rounded-lg border-[#D5D7DA] dark:border-[#414651]"
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onPurchase}
            className="flex-1 rounded-lg bg-[#00c4af] text-white hover:bg-[#00b39e]"
          >
            구매하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
