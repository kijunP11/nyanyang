/**
 * 대표 뱃지 설정/해제 확인 모달
 */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import type { BadgeDefinition } from "../types";
import { BadgeIcon } from "./badge-icon";

interface BadgeRepresentativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: BadgeDefinition | null;
  mode: "set" | "unset";
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function BadgeRepresentativeModal({
  open,
  onOpenChange,
  badge,
  mode,
  onConfirm,
  isSubmitting = false,
}: BadgeRepresentativeModalProps) {
  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[12px] bg-white p-6 shadow-lg dark:bg-[#181D27]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <BadgeIcon
              iconUrl={badge.icon_url}
              category={badge.category}
              name={badge.name}
              size={80}
            />
            <DialogTitle className="text-center text-xl">
              {badge.name}
              {badge.level && (
                <span className="ml-2 text-base font-normal text-[#535862] dark:text-[#94969C]">
                  {badge.level}
                </span>
              )}
            </DialogTitle>
            <p className="text-center text-sm text-[#535862] dark:text-[#94969C]">
              {badge.is_hidden
                ? "비밀 조건이에요 🤫"
                : badge.description}
            </p>
            {mode === "unset" && (
              <p className="text-center text-sm text-[#535862] dark:text-[#94969C]">
                대표 뱃지를 해제하면 프로필에 표시되지 않아요.
              </p>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 sm:justify-center">
          {mode === "set" ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-[#D5D7DA] bg-white px-4 py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-lg bg-[#00c4af] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
              >
                대표 뱃지로 설정하기
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-[#D5D7DA] bg-white px-4 py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-lg bg-[#00c4af] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e] disabled:opacity-50"
              >
                대표 뱃지 해제하기
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
