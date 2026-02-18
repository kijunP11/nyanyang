/**
 * 뱃지 획득 모달: 획득한 뱃지 표시 + [확인]
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

interface BadgeClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: BadgeDefinition | null;
}

export function BadgeClaimModal({
  open,
  onOpenChange,
  badge,
}: BadgeClaimModalProps) {
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
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-center sm:justify-center">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-lg bg-[#00c4af] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e]"
            >
              확인
            </button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
