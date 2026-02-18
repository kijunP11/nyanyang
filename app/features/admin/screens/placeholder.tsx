/**
 * Admin Placeholder — 미구현 어드민 서브페이지
 */
export default function AdminPlaceholder() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#F5F5F5]">
        <svg
          className="size-8 text-[#A4A7AE]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#535862]">
        이 페이지는 준비 중입니다.
      </p>
      <p className="mt-1 text-xs text-[#717680]">
        다음 업데이트에서 제공될 예정입니다.
      </p>
    </div>
  );
}
