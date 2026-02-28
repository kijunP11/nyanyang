/**
 * Navigation Bar Component
 *
 * Figma 디자인 기반 GNB: 라이트/다크 모드, 5개 메뉴(추천/캐릭터/내 컨텐츠/이미지 생성/뱃지/리워드),
 * 비로그인: 로그인 + 구분선 + 테마토글 + 알림 / 로그인: 발바닥 + 테마토글 + 알림 + 아바타
 */
import {
  Bell,
  Cog,
  Home,
  LogOut,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { Link, NavLink } from "react-router";
import { Theme, useTheme } from "remix-themes";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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

function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex size-10 cursor-pointer items-center justify-center">
          <Avatar className="size-6 rounded-full border-[1.667px] border-white shadow-[0px_5px_6.667px_-4px_rgba(10,13,18,0.08),0px_1.667px_2.5px_-2px_rgba(10,13,18,0.03)]">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{name.slice(0, 2)}</AvatarFallback>
          </Avatar>
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
        <Sun className="size-6 text-white" />
      ) : (
        <Moon className="size-6 text-[#181D27]" />
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
          <Bell className="size-6 text-[#181D27] dark:text-white" />
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
                      <Bell className="size-6 text-[#181D27] dark:text-white" />
                    </Link>
                    <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
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
                  <Bell className="size-6 text-[#181D27] dark:text-white" />
                </Link>
              </SheetClose>
              {name && (
                <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
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
