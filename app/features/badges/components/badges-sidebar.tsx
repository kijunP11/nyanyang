/**
 * 뱃지 페이지 좌측 사이드바: 채팅 헤더 + 오늘 섹션 + 유저 프로필
 */

interface BadgesSidebarUser {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

interface BadgesSidebarProps {
  user: BadgesSidebarUser | null;
}

function ChevronDownIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="#94969C"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.333 14.167L17.5 10m0 0-4.167-4.167M17.5 10H7.5m0-7.5h-1.333c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C2.967 4.02 2.967 4.58 2.967 5.7v8.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.428.218.988.218 2.108.218H7.5"
        stroke="#535862"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BadgesSidebar({ user }: BadgesSidebarProps) {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col overflow-clip border-r border-[#e2e8f0] bg-[#fdfdfd] dark:border-[#333741] dark:bg-[#181D27]">
      {/* Header */}
      <div className="flex h-[60px] items-center border-b border-[#cbd5e1] px-[16px] py-[20px] dark:border-[#333741]">
        <h2 className="text-[14px] font-semibold leading-[20px] text-black dark:text-white">
          채팅
        </h2>
      </div>

      {/* 오늘 section */}
      <div className="border-b border-[#cbd5e1] py-[8px] dark:border-[#333741]">
        <div className="flex items-center gap-[16px] px-[16px] pb-[12px] pt-[16px]">
          <span className="flex-1 text-[14px] font-semibold leading-[20px] text-[#1e293b] dark:text-white">
            오늘
          </span>
          <div className="flex items-center gap-[8px]">
            <span className="text-[14px] leading-[20px] text-[#475569] dark:text-[#94969C]">
              0개
            </span>
            <ChevronDownIcon />
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer — user profile */}
      {user && (
        <div className="flex flex-col gap-[24px] bg-[#fafafa] px-[16px] py-[32px] dark:bg-[#0C111D]">
          <div className="h-px w-full bg-[#D5D7DA] dark:bg-[#333741]" />
          <div className="flex items-start gap-[12px] px-[8px]">
            <div className="size-[40px] shrink-0 overflow-hidden rounded-[200px] bg-[#E9EAEB] dark:bg-[#333741]">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src="/default-avatar.png"
                  alt={user.name}
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold leading-[20px] text-[#181d27] dark:text-white">
                {user.name}
              </p>
              {user.email && (
                <p className="truncate text-[14px] leading-[20px] text-[#535862] dark:text-[#94969C]">
                  {user.email}
                </p>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-[8px] p-[8px]"
              aria-label="로그아웃"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
