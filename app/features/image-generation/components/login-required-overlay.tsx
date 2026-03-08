/**
 * Login Required Overlay (F4-3-1)
 *
 * 비로그인 시 메인 영역 전체: blur 배경 + 로그인 모달
 * absolute positioned overlay — 콘텐츠 위에 올라감
 */
import { Link } from "react-router";

export function LoginRequiredOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[8px] bg-[rgba(16,24,40,0.7)]">
      <div className="flex w-[400px] flex-col gap-[32px] items-center overflow-clip rounded-[12px] bg-white p-[24px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)] dark:bg-[#181D27]">
        {/* Content */}
        <div className="flex w-full flex-col gap-[20px] items-start justify-center">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="로그인 필요"
            className="size-[100px] object-cover"
          />
          <div className="flex w-full flex-col gap-[8px] items-start">
            <p className="w-full text-[18px] font-semibold leading-[28px] text-[#181D27] dark:text-white">
              해당 페이지는 로그인 후 사용 가능합니다!
            </p>
            <p className="w-full whitespace-pre-line text-[14px] font-normal leading-[20px] text-[#535862] dark:text-[#94969C]">
              {"로그인 후 캐릭터 생성이 가능합니다.\n지금 로그인하고 나만의 캐릭터를 시작해보세요."}
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/login"
          viewTransition
          className="flex w-full items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#2eb3a3]"
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
