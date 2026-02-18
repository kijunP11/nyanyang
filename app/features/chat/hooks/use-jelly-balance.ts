/**
 * 젤리 잔액 추적 훅
 *
 * balance: 현재 잔액
 * isLow: 1000 미만 경고
 * isDepleted: 0 이하 소진
 * refresh(): 수동 새로고침
 */
import { useFetcher } from "react-router";
import { useEffect, useCallback } from "react";

interface UseJellyBalanceReturn {
  balance: number;
  isLow: boolean;
  isDepleted: boolean;
  isLoading: boolean;
  refresh: () => void;
}

const LOW_THRESHOLD = 1000;

export function useJellyBalance(): UseJellyBalanceReturn {
  const fetcher = useFetcher();

  const refresh = useCallback(() => {
    fetcher.load("/api/points/balance");
  }, [fetcher]);

  useEffect(() => {
    refresh();
  }, []);

  const balance = fetcher.data?.balance?.current_balance ?? 0;

  return {
    balance,
    isLow: balance > 0 && balance < LOW_THRESHOLD,
    isDepleted: balance <= 0,
    isLoading: fetcher.state === "loading",
    refresh,
  };
}
