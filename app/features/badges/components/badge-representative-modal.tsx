/**
 * 대표 뱃지 설정/해제 확인 모달 — Figma 픽셀 퍼펙트
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-[rgba(16,24,40,0.7)] backdrop-blur-[1px]" />
        <DialogPrimitive.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-[400px] max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-clip rounded-[12px] bg-white p-[24px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)] duration-200 dark:bg-[#181D27]">
          {/* Content */}
          <div className="flex flex-col items-center justify-center gap-[10px]">
            <BadgeIcon
              iconUrl={badge.icon_url}
              category={badge.category}
              name={badge.name}
              size={100}
            />
            <div className="flex w-full flex-col gap-[4px] text-center">
              <DialogPrimitive.Title className="text-[18px] font-semibold leading-[28px] text-[#181d27] dark:text-white">
                {badge.level ? `${badge.level} ${badge.name}` : badge.name}
              </DialogPrimitive.Title>
              <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
                {badge.is_hidden ? "비밀 조건이에요" : badge.description}
              </p>
              {mode === "unset" && (
                <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
                  대표 뱃지를 해제하면 프로필에 표시되지 않아요.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-[24px] flex gap-[12px]">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#2db3a3] disabled:opacity-50 dark:border-[#36c4b3] dark:bg-[#36c4b3]"
            >
              {mode === "set" ? "대표 뱃지로 설정하기" : "대표 뱃지 해제하기"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
            >
              취소하기
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
