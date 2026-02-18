/**
 * F4-3-3 첫 진입 주의사항 모달 (localStorage 1회)
 */
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";

const DISCLAIMER_KEY = "nyanyang-image-gen-disclaimer-agreed";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const agreed = localStorage.getItem(DISCLAIMER_KEY);
    if (!agreed) setOpen(true);
  }, []);

  const handleAgree = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[480px] gap-0 p-8 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="mb-4">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="주의사항"
            className="h-14 w-auto"
          />
        </div>

        <DialogHeader className="mb-3 p-0">
          <DialogTitle className="text-left text-lg font-bold text-[#181D27] dark:text-white">
            캐릭터 제작 시 반드시 유의해주세요!
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6 space-y-3 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
          <p className="font-semibold">나냥 운영 정책을 지켜주세요!</p>
          <p>
            안전하고 즐거운 대화 환경을 위해 나냥 운영진은 실시간으로
            모니터링하며, 운영 정책 위반 시 캐릭터 삭제 및 계정 차단 조치를
            취할 수 있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>과도한 선정성, 지나치게 공격적이거나 편향적인 표현</li>
            <li>저작권, 초상권 등 타인의 권리를 침해하는 행위</li>
            <li>
              딥페이크, 허위 정보, 미성년자 성적 대상화 등 비윤리적이거나
              불법적인 행위
            </li>
          </ul>
          <p>
            세이프티 캐릭터 세부 가이드라인을 포함한 운영정책을 반복적으로
            위반할 경우, 제재 조치가 강화될 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAgree}
          className="w-full rounded-lg bg-[#41C7BD] py-3 text-base font-semibold text-white transition-colors hover:bg-[#38b5ab]"
        >
          동의하고 캐릭터 제작하기
        </button>
      </DialogContent>
    </Dialog>
  );
}
