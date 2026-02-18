/**
 * 채팅 브랜치 관리 훅
 * 롤백, 브랜치 전환, branchFetcher 상태 관리
 */
import { useState, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";

interface UseChatBranchesOptions {
  roomId: number;
}

export function useChatBranches({ roomId }: UseChatBranchesOptions) {
  const branchFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackMessageId, setRollbackMessageId] = useState<number | null>(null);

  useEffect(() => {
    if (branchFetcher.state === "idle" && branchFetcher.data) {
      if (branchFetcher.data.success) {
        revalidator.revalidate();
      } else if (branchFetcher.data.error) {
        alert(`분기 작업 실패: ${branchFetcher.data.error}`);
      }
    }
  }, [branchFetcher.state, branchFetcher.data, revalidator]);

  const openRollbackDialog = (messageId: number) => {
    setRollbackMessageId(messageId);
    setShowRollbackDialog(true);
  };

  const confirmRollback = () => {
    if (!rollbackMessageId) return;
    branchFetcher.submit(
      { room_id: roomId, parent_message_id: rollbackMessageId },
      { method: "POST", action: "/api/chat/branch", encType: "application/json" }
    );
    setShowRollbackDialog(false);
    setRollbackMessageId(null);
  };

  const switchBranch = (branchName: string) => {
    branchFetcher.submit(
      { room_id: roomId, branch_name: branchName },
      { method: "PUT", action: "/api/chat/branch", encType: "application/json" }
    );
  };

  return {
    branchFetcher,
    showRollbackDialog,
    setShowRollbackDialog,
    rollbackMessageId,
    openRollbackDialog,
    confirmRollback,
    switchBranch,
  };
}
