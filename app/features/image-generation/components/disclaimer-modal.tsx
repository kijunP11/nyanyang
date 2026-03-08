/**
 * F4-3-3 첫 진입 주의사항 모달 (localStorage 1회)
 *
 * backdrop-blur 오버레이 + 400px 모달
 */
import { useEffect, useState } from "react";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.7)] backdrop-blur-[8px]">
      <div className="flex w-[400px] flex-col gap-[32px] items-center overflow-clip rounded-[12px] bg-white p-[24px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)] dark:bg-[#181D27]">
        {/* Content */}
        <div className="flex w-full flex-col gap-[20px] items-start justify-center">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="주의사항"
            className="size-[100px] object-cover"
          />
          <div className="flex w-full flex-col gap-[8px] items-start">
            <p className="w-full text-[18px] font-semibold leading-[28px] text-[#181D27] dark:text-white">
              캐릭터 제작 시 반드시 유의해주세요!
            </p>
            <div className="w-full whitespace-pre-wrap text-[14px] leading-[20px] text-[#535862] dark:text-[#94969C]">
              <p>나냥 운영 정책을 지켜주세요!</p>
              <p>
                {"안전하고 즐거운 대화 환경을 위해 나냥 운영진은 "}
                실시간으로 모니터링하며, 운영 정책 위반 시 캐릭터 삭제 및
                {" "}계정 차단 조치를 취할 수 있습니다.
              </p>
              <p>&nbsp;</p>
              <ul className="list-disc ps-[21px]">
                <li>과도한 선정성, 지나치게 공격적이거나 편향적인 표현</li>
                <li>저작권, 초상권 등 타인의 권리를 침해하는 행위</li>
                <li>
                  딥페이크, 허위 정보, 미성년자 성적 대상화 등 비윤리적이거나
                  불법적인 행위
                </li>
              </ul>
              <p>&nbsp;</p>
              <p>
                {"세이프티 캐릭터 세부 가이드라인을 포함한 운영정책을 "}
                반복적으로 위반할 경우, 제재 조치가 강화될 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleAgree}
          className="flex w-full items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#2eb3a3]"
        >
          동의하고 캐릭터 제작하기
        </button>
      </div>
    </div>
  );
}
