/**
 * Navigation Bar Component
 *
 * Figma 디자인 기반 GNB: 라이트/다크 모드, 5개 메뉴(추천/캐릭터/내 컨텐츠/이미지 생성/뱃지/리워드),
 * 비로그인: 로그인 + 구분선 + 테마토글 + 알림 / 로그인: 발바닥 + 테마토글 + 알림 + 아바타
 */
import {
  Cog,
  Home,
  LogOut,
  Menu,
} from "lucide-react";
import { Link, NavLink } from "react-router";
import { Theme, useTheme } from "remix-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.9618 10.79C18.8045 12.4922 18.1657 14.1144 17.1201 15.4668C16.0744 16.8192 14.6653 17.8458 13.0575 18.4266C11.4497 19.0073 9.7098 19.1181 8.04132 18.7461C6.37283 18.3741 4.84481 17.5346 3.63604 16.3258C2.42727 15.117 1.58776 13.589 1.21572 11.9205C0.843691 10.252 0.954532 8.5121 1.53528 6.90431C2.11602 5.29653 3.14265 3.88738 4.49503 2.84177C5.84741 1.79616 7.46961 1.15732 9.17182 1.00002C8.17523 2.34828 7.69566 4.00947 7.82035 5.68143C7.94503 7.3534 8.66568 8.92508 9.85122 10.1106C11.0368 11.2962 12.6084 12.0168 14.2804 12.1415C15.9524 12.2662 17.6135 11.7866 18.9618 10.79Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.7301 20C11.5543 20.3031 11.3019 20.5547 10.9983 20.7295C10.6947 20.9044 10.3505 20.9965 10.0001 20.9965C9.6497 20.9965 9.30547 20.9044 9.00185 20.7295C8.69824 20.5547 8.44589 20.3031 8.27008 20M16.0001 7C16.0001 5.4087 15.3679 3.88258 14.2427 2.75736C13.1175 1.63214 11.5914 1 10.0001 1C8.40878 1 6.88266 1.63214 5.75744 2.75736C4.63222 3.88258 4.00008 5.4087 4.00008 7C4.00008 14 1.00008 16 1.00008 16H19.0001C19.0001 16 16.0001 14 16.0001 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserMenu({
  name,
  email,
}: {
  name: string;
  email?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex size-10 cursor-pointer items-center justify-center">
          <img
            src="/default-avatar.png"
            alt="프로필"
            className="size-6 rounded-full border-[1.667px] border-white object-cover shadow-[0px_5px_6.667px_-4px_rgba(10,13,18,0.08),0px_1.667px_2.5px_-2px_rgba(10,13,18,0.03)]"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SheetClose asChild>
            <Link to="/dashboard" viewTransition>
              <Home className="size-4" />
              대시보드
            </Link>
          </SheetClose>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <SheetClose asChild>
            <Link to="/characters/create" viewTransition>
              <Cog className="size-4" />
              캐릭터 만들기
            </Link>
          </SheetClose>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <SheetClose asChild>
            <Link to="/logout" viewTransition>
              <LogOut className="size-4" />
              Log out
            </Link>
          </SheetClose>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };
  return (
    <button
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      {theme === Theme.DARK ? (
        <SunIcon className="size-6 text-white" />
      ) : (
        <MoonIcon className="size-5 text-[#181D27]" />
      )}
    </button>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/login"
        viewTransition
        className="whitespace-nowrap text-base font-medium text-black/70 transition-colors hover:text-black dark:text-white"
      >
        로그인
      </Link>
      <div className="h-5 w-px bg-black/30 dark:bg-[#414651]" />
      <div className="flex items-center">
        <ThemeToggle />
        <Link
          to="/notifications"
          className="flex size-10 items-center justify-center"
          aria-label="알림"
        >
          <BellIcon className="size-5 text-[#181D27] dark:text-white" />
        </Link>
      </div>
    </div>
  );
}

const getNavLinkClass = (isActive: boolean) =>
  isActive
    ? "relative flex h-full items-center px-[10px] text-sm font-bold text-[#414651] transition-colors dark:text-white border-b-4 border-[#00C4AF]"
    : "relative flex h-full items-center px-[10px] text-sm font-bold text-[#A4A7AE] transition-colors hover:text-[#414651] dark:hover:text-white";

export function NavigationBar({
  name,
  email,
  avatarUrl,
  loading,
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  loading: boolean;
}) {
  return (
    <Sheet>
      <nav className="h-[57px] w-full border-b border-black/20 bg-white dark:bg-[#181D27]">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-5">
          <div className="flex h-full items-center gap-[82px]">
            <Link to="/" className="flex shrink-0 items-center">
              <img src="/logo.svg" alt="NYANYANG" className="h-[30px] w-[158px]" />
            </Link>
            <div className="hidden h-full items-center gap-1 md:flex">
              <NavLink
                to="/"
                end
                viewTransition
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                추천
              </NavLink>
              <NavLink
                to="/characters"
                viewTransition
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                캐릭터
              </NavLink>
              <NavLink
                to="/my-content"
                viewTransition
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                내 컨텐츠
              </NavLink>
              <NavLink
                to="/image-generation"
                viewTransition
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                이미지 생성
              </NavLink>
              <NavLink
                to="/badges"
                viewTransition
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                뱃지/리워드
              </NavLink>
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {loading ? (
              <div className="flex items-center">
                <div className="size-6 animate-pulse rounded-full bg-black/10 dark:bg-white/20" />
              </div>
            ) : (
              <>
                {name ? (
                  <div className="flex items-center">
                    <Link
                      to="/dashboard"
                      className="flex size-10 items-center justify-center"
                      aria-label="대시보드"
                    >
                      <img
                        src="/pawprint.svg"
                        alt=""
                        className="size-6"
                      />
                    </Link>
                    <ThemeToggle />
                    <Link
                      to="/notifications"
                      className="flex size-10 items-center justify-center"
                      aria-label="알림"
                    >
                      <BellIcon className="size-5 text-[#181D27] dark:text-white" />
                    </Link>
                    <UserMenu name={name} email={email} />
                  </div>
                ) : (
                  <AuthButtons />
                )}
              </>
            )}
          </div>

          <SheetTrigger
            className="flex size-10 items-center justify-center text-[#181D27] dark:text-white md:hidden"
            aria-label="메뉴 열기"
          >
            <Menu className="size-6" />
          </SheetTrigger>
        </div>
      </nav>

      <SheetContent className="border-black/10 bg-white dark:border-white/10 dark:bg-[#181D27]">
        <SheetHeader className="flex flex-col gap-1 pt-8">
          <SheetClose asChild>
            <NavLink
              to="/"
              end
              viewTransition
              className={({ isActive }) =>
                isActive
                  ? "block px-2 py-2 text-sm font-bold text-[#414651] dark:text-white"
                  : "block px-2 py-2 text-sm font-bold text-[#A4A7AE] hover:text-[#414651] dark:hover:text-white"
              }
            >
              추천
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/characters"
              viewTransition
              className={({ isActive }) =>
                isActive
                  ? "block px-2 py-2 text-sm font-bold text-[#414651] dark:text-white"
                  : "block px-2 py-2 text-sm font-bold text-[#A4A7AE] hover:text-[#414651] dark:hover:text-white"
              }
            >
              캐릭터
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/my-content"
              viewTransition
              className={({ isActive }) =>
                isActive
                  ? "block px-2 py-2 text-sm font-bold text-[#414651] dark:text-white"
                  : "block px-2 py-2 text-sm font-bold text-[#A4A7AE] hover:text-[#414651] dark:hover:text-white"
              }
            >
              내 컨텐츠
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/image-generation"
              viewTransition
              className={({ isActive }) =>
                isActive
                  ? "block px-2 py-2 text-sm font-bold text-[#414651] dark:text-white"
                  : "block px-2 py-2 text-sm font-bold text-[#A4A7AE] hover:text-[#414651] dark:hover:text-white"
              }
            >
              이미지 생성
            </NavLink>
          </SheetClose>
          <SheetClose asChild>
            <NavLink
              to="/badges"
              viewTransition
              className={({ isActive }) =>
                isActive
                  ? "block px-2 py-2 text-sm font-bold text-[#414651] dark:text-white"
                  : "block px-2 py-2 text-sm font-bold text-[#A4A7AE] hover:text-[#414651] dark:hover:text-white"
              }
            >
              뱃지/리워드
            </NavLink>
          </SheetClose>
        </SheetHeader>
        <SheetFooter className="mt-8 flex flex-row items-center gap-2 px-2">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/20" />
          ) : (
            <>
              <ThemeToggle />
              <SheetClose asChild>
                <Link
                  to="/notifications"
                  className="flex size-10 items-center justify-center"
                  aria-label="알림"
                >
                  <BellIcon className="size-5 text-[#181D27] dark:text-white" />
                </Link>
              </SheetClose>
              {name && (
                <UserMenu name={name} email={email} />
              )}
              {!name && (
                <SheetClose asChild>
                  <Link
                    to="/login"
                    viewTransition
                    className="text-base font-medium text-black/70 dark:text-white"
                  >
                    로그인
                  </Link>
                </SheetClose>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
