/**
 * 재생성 히스토리 훅
 * 마지막 재생성의 이전/새 콘텐츠를 추적
 */
import { useState, useCallback } from "react";

interface RegenerationRecord {
  messageId: number;
  previousContent: string;
  newContent: string;
}

export function useRegenerationHistory() {
  const [comparison, setComparison] = useState<RegenerationRecord | null>(null);

  const recordRegeneration = useCallback(
    (messageId: number, previousContent: string, newContent: string) => {
      setComparison({ messageId, previousContent, newContent });
    },
    []
  );

  const clearComparison = useCallback(() => {
    setComparison(null);
  }, []);

  return { comparison, recordRegeneration, clearComparison };
}
