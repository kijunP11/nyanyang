/**
 * Navigation Bar Component
 *
 * A responsive navigation header that adapts to different screen sizes and user authentication states.
 * This component provides the main navigation interface for the application, including:
 *
 * - Responsive design with desktop and mobile layouts
 * - User authentication state awareness (logged in vs. logged out)
 * - User profile menu with avatar and dropdown options
 * - Theme switching functionality
 * - Mobile-friendly navigation drawer
 *
 * The component handles different states:
 * - Loading state with skeleton placeholders
 * - Authenticated state with user profile information
 * - Unauthenticated state with sign in/sign up buttons
 */
import { CogIcon, HomeIcon, LogOutIcon, MenuIcon, SearchIcon, SunIcon, MoonIcon } from "lucide-react";
import { Link, NavLink } from "react-router";
import { Theme, useTheme } from "remix-themes";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "./ui/sheet";

/**
 * UserMenu Component
 *
 * Displays the authenticated user's profile menu with avatar and dropdown options.
 * This component is shown in the navigation bar when a user is logged in and provides
 * quick access to user-specific actions and information.
 *
 * Features:
 * - Avatar display with image or fallback initials
 * - User name and email display
 * - Quick navigation to dashboard
 * - Logout functionality
 *
 * @param name - The user's display name
 * @param email - The user's email address (optional)
 * @param avatarUrl - URL to the user's avatar image (optional)
 * @returns A dropdown menu component with user information and actions
 */
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
      {/* Avatar as the dropdown trigger */}
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer rounded-lg">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* Dropdown content with user info and actions - 항상 다크 스타일 */}
      <DropdownMenuContent className="w-56 border-white/10 bg-[#232323] text-white">
        {/* User information display */}
        <DropdownMenuLabel className="grid flex-1 text-left text-sm leading-tight text-white">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs text-white/60">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        {/* Dashboard link */}
        <DropdownMenuItem asChild className="text-white/80 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
          <SheetClose asChild>
            <Link to="/dashboard" viewTransition>
              <HomeIcon className="size-4" />
              대시보드
            </Link>
          </SheetClose>
        </DropdownMenuItem>
        
        {/* Character Creation link */}
        <DropdownMenuItem asChild className="text-white/80 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
          <SheetClose asChild>
            <Link to="/characters/create" viewTransition>
              <CogIcon className="size-4" />
              캐릭터 만들기
            </Link>
          </SheetClose>
        </DropdownMenuItem>

        {/* Logout link */}
        <DropdownMenuItem asChild className="text-white/80 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
          <SheetClose asChild>
            <Link to="/logout" viewTransition>
              <LogOutIcon className="size-4" />
              Log out
            </Link>
          </SheetClose>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * AuthButtons Component
 *
 * Displays authentication buttons (Sign in and Sign up) for unauthenticated users.
 * Figma design: 로그인 텍스트 (흰색 70%) + | 구분선 + 회원가입 버튼 (민트)
 */
function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      {/* Sign in text link */}
      <SheetClose asChild>
        <Link 
          to="/login" 
          viewTransition
          className="text-sm font-bold text-white/70 hover:text-white transition-colors"
        >
          로그인
        </Link>
      </SheetClose>

      {/* Separator */}
      <div className="h-5 w-px bg-white/20" />

      {/* Sign up button (민트색) */}
      <Button
        variant="default"
        className="h-[34px] rounded-[2px] bg-[#00c4af] px-3 text-sm font-bold text-white hover:bg-[#00c4af]/90"
        asChild
      >
        <SheetClose asChild>
          <Link to="/join" viewTransition>
            회원가입
          </Link>
        </SheetClose>
      </Button>
    </div>
  );
}

/**
 * SearchInput Component
 * 
 * Search input UI (껍데기 only, 기능 연결 나중에)
 * Figma: #2f3032 배경, 320px (데스크톱) / full (모바일), placeholder
 */
function SearchInput({ className }: { className?: string }) {
  return (
    <div className={`relative flex h-10 items-center rounded-md border border-[#6b7280] bg-[#2f3032] ${className ?? "w-[320px]"}`}>
      <input
        type="text"
        placeholder="컨텐츠명, 창작자명, #태그명으로 검색"
        className="h-full w-full cursor-pointer bg-transparent px-3 text-sm text-white placeholder:text-[#9ca3af] focus:outline-none"
        readOnly
      />
      <div className="absolute right-3">
        <SearchIcon className="size-4 text-[#9ca3af]" />
      </div>
    </div>
  );
}

/**
 * ThemeToggle Component
 * 
 * 원형 40px 테마 토글 버튼
 */
function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex size-10 items-center justify-center rounded-full bg-[#2f3032] transition-colors hover:bg-[#3f4042]"
      aria-label="Toggle theme"
    >
      {theme === Theme.DARK ? (
        <SunIcon className="size-5 text-white" />
      ) : (
        <MoonIcon className="size-5 text-white" />
      )}
    </button>
  );
}

/**
 * Nav link style helper
 * Figma: 활성 탭 - 흰색 + #14b8a6 하단 바 (3px), 비활성 탭 - rgba(153,163,183,0.7)
 * 언더바는 네비바 최하단에 붙도록 h-full + after:bottom-0 사용
 */
const getNavLinkClass = (isActive: boolean) =>
  isActive
    ? "relative h-full flex items-center text-sm font-bold text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-[#14b8a6]"
    : "h-full flex items-center text-sm font-bold text-[rgba(153,163,183,0.7)] hover:text-white transition-colors";

/**
 * NavigationBar Component
 *
 * Figma 디자인 기반 리디자인:
 * - 배경: #232323 (항상 다크)
 * - 높이: 60px 고정
 * - 메뉴: 스토리, 내 작품, 포인트, 이용 가이드 (4개)
 * - 로그인 후: 검색창 + 테마 토글 + 유저 메뉴
 */
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
    <nav className="h-[60px] w-full border-b border-white/10 bg-[#232323]">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between px-5 md:px-10">
        {/* Left side: Logo + Navigation links */}
        <div className="flex h-full items-center gap-8">
          {/* Application logo */}
          <Link to="/">
            <img src="/logo3.png" alt="NYANYANG" className="h-6" />
          </Link>

          {/* Desktop navigation links (hidden on mobile) */}
          <div className="hidden h-full items-center gap-6 md:flex">
            <NavLink
              to="/blog"
              viewTransition
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              스토리
            </NavLink>
            <NavLink
              to="/dashboard/my-content"
              viewTransition
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              내 작품
            </NavLink>
            <NavLink
              to="/points"
              viewTransition
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              포인트
            </NavLink>
            <NavLink
              to="/guide"
              viewTransition
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              이용 가이드
            </NavLink>
          </div>
        </div>

        {/* Right side: Search (logged in) + Theme + Auth */}
        <div className="hidden items-center gap-4 md:flex">
          {/* 로그인 후: 검색창 표시 */}
          {name && <SearchInput />}
          
          {/* 테마 토글 (로그인 후에만) */}
          {name && <ThemeToggle />}

          {/* Conditional rendering based on authentication state */}
          {loading ? (
            <div className="flex items-center">
              <div className="size-8 animate-pulse rounded-lg bg-white/20" />
            </div>
          ) : (
            <>
              {name ? (
                <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
              ) : (
                <AuthButtons />
              )}
            </>
          )}
        </div>

        {/* Mobile menu trigger (hidden on desktop) */}
        <SheetTrigger className="size-6 text-white md:hidden">
          <MenuIcon />
        </SheetTrigger>
        
        {/* Mobile navigation drawer */}
        <SheetContent className="border-white/10 bg-[#232323]">
          <SheetHeader className="flex flex-col gap-4 pt-8">
            {/* Mobile search (로그인 후) */}
            {name && (
              <div className="px-2">
                <SearchInput className="w-full" />
              </div>
            )}
            
            {/* Mobile navigation links */}
            <SheetClose asChild>
              <NavLink
                to="/blog"
                className={({ isActive }) =>
                  isActive
                    ? "px-2 py-2 text-white font-bold"
                    : "px-2 py-2 text-[rgba(153,163,183,0.7)] font-bold hover:text-white"
                }
              >
                스토리
              </NavLink>
            </SheetClose>
            <SheetClose asChild>
              <NavLink
                to="/dashboard/my-content"
                className={({ isActive }) =>
                  isActive
                    ? "px-2 py-2 text-white font-bold"
                    : "px-2 py-2 text-[rgba(153,163,183,0.7)] font-bold hover:text-white"
                }
              >
                내 작품
              </NavLink>
            </SheetClose>
            <SheetClose asChild>
              <NavLink
                to="/points"
                className={({ isActive }) =>
                  isActive
                    ? "px-2 py-2 text-white font-bold"
                    : "px-2 py-2 text-[rgba(153,163,183,0.7)] font-bold hover:text-white"
                }
              >
                포인트
              </NavLink>
            </SheetClose>
            <SheetClose asChild>
              <NavLink
                to="/guide"
                className={({ isActive }) =>
                  isActive
                    ? "px-2 py-2 text-white font-bold"
                    : "px-2 py-2 text-[rgba(153,163,183,0.7)] font-bold hover:text-white"
                }
              >
                이용 가이드
              </NavLink>
            </SheetClose>
          </SheetHeader>
          
          {/* Mobile footer */}
          {loading ? (
            <div className="flex items-center px-2 pt-8">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/20" />
            </div>
          ) : (
            <SheetFooter className="mt-8 px-2">
              {name ? (
                <div className="flex items-center justify-between">
                  <ThemeToggle />
                  <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
                </div>
              ) : (
                <AuthButtons />
              )}
            </SheetFooter>
          )}
        </SheetContent>
      </div>
    </nav>
  );
}
