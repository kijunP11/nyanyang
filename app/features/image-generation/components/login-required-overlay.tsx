/**
 * Login Required Overlay (F4-3-1)
 *
 * 비로그인 시 메인 영역 전체: blur 배경 + 로그인 모달
 */
import { Link } from "react-router";

function BlurredBackground() {
  return (
    <div className="h-full w-full p-8 opacity-50 blur-[6px]">
      <div className="mb-6 flex gap-4">
        <div className="h-10 w-24 rounded-lg bg-[#E9EAEB] dark:bg-[#333741]" />
        <div className="h-10 w-32 rounded-lg bg-[#E9EAEB] dark:bg-[#333741]" />
        <div className="h-10 flex-1 rounded-lg bg-[#E9EAEB] dark:bg-[#333741]" />
      </div>

      <div className="mb-8 h-12 w-full rounded-xl bg-[#F5F5F5] dark:bg-[#1F242F]" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-xl bg-[#E9EAEB] dark:bg-[#333741]"
          />
        ))}
      </div>
    </div>
  );
}

export function LoginRequiredOverlay() {
  return (
    <div className="relative flex h-full min-h-[calc(100vh-57px)] items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <BlurredBackground />
      </div>

      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-[#0C111D]/60" />

      <div className="relative z-10 mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-xl dark:bg-[#181D27]">
        <div className="mb-6 flex justify-start">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt="로그인 필요"
            className="h-16 w-auto"
          />
        </div>

        <h2 className="mb-2 text-xl font-bold text-[#181D27] dark:text-white">
          해당 페이지는 로그인 후 사용 가능합니다!
        </h2>

        <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
          로그인 후 캐릭터 생성이 가능합니다.{"\n"}
          지금 로그인하고 나만의 캐릭터를 시작해보세요.
        </p>

        <Link
          to="/login"
          viewTransition
          className="flex w-full items-center justify-center rounded-lg bg-[#41C7BD] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#38b5ab]"
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
