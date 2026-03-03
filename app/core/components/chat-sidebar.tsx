import { useState } from "react";
import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

// --- Figma Icons (Untitled UI) ---

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 11.6667 6.66667"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.833333 0.833333L5.83333 5.83333L10.8333 0.833333"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16.67 16.67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.835 15.835H2.50167C2.05964 15.835 1.63572 15.6594 1.32316 15.3468C1.01059 15.0343 0.835 14.6104 0.835 14.1683V2.50167C0.835 2.05964 1.01059 1.63572 1.32316 1.32316C1.63572 1.01059 2.05964 0.835 2.50167 0.835H5.835M11.6683 12.5017L15.835 8.335M15.835 8.335L11.6683 4.16833M15.835 8.335H5.835"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 2.22222 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.11111 5.55556C1.41794 5.55556 1.66667 5.30683 1.66667 5C1.66667 4.69318 1.41794 4.44444 1.11111 4.44444C0.804286 4.44444 0.555556 4.69318 0.555556 5C0.555556 5.30683 0.804286 5.55556 1.11111 5.55556Z"
        stroke="currentColor"
        strokeWidth="1.11111"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.11111 1.66667C1.41794 1.66667 1.66667 1.41794 1.66667 1.11111C1.66667 0.804286 1.41794 0.555556 1.11111 0.555556C0.804286 0.555556 0.555556 0.804286 0.555556 1.11111C0.555556 1.41794 0.804286 1.66667 1.11111 1.66667Z"
        stroke="currentColor"
        strokeWidth="1.11111"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.11111 9.44444C1.41794 9.44444 1.66667 9.19571 1.66667 8.88889C1.66667 8.58206 1.41794 8.33333 1.11111 8.33333C0.804286 8.33333 0.555556 8.58206 0.555556 8.88889C0.555556 9.19571 0.804286 9.44444 1.11111 9.44444Z"
        stroke="currentColor"
        strokeWidth="1.11111"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Types ---

export interface ChatItem {
  roomId: number;
  characterName: string;
  characterAvatarUrl?: string | null;
  lastMessageAt: string; // ISO date string
}

export interface ChatSidebarUser {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

interface ChatSidebarProps {
  user?: ChatSidebarUser | null;
  chats?: ChatItem[];
}

// --- Helpers ---

function groupChatsByPeriod(chats: ChatItem[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const today: ChatItem[] = [];
  const thisWeek: ChatItem[] = [];
  const older: ChatItem[] = [];

  for (const chat of chats) {
    const d = new Date(chat.lastMessageAt);
    if (d >= todayStart) {
      today.push(chat);
    } else if (d >= weekAgo) {
      thisWeek.push(chat);
    } else {
      older.push(chat);
    }
  }
  return { today, thisWeek, older };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= todayStart) {
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// --- Subcomponents ---

function SectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <CollapsibleTrigger
      onClick={onToggle}
      className="flex w-full items-center justify-between px-[16px] pb-[12px] pt-[16px]"
    >
      <span className="text-[14px] font-semibold leading-[20px] text-[#1E293B] dark:text-white">
        {label}
      </span>
      <div className="flex items-center gap-[8px]">
        <span className="text-[14px] leading-[20px] text-[#475569] dark:text-white">
          {count}개
        </span>
        <ChevronDownIcon
          className={`size-5 text-[#475569] transition-transform dark:text-white ${
            open ? "" : "-rotate-90"
          }`}
        />
      </div>
    </CollapsibleTrigger>
  );
}

function ChatListItem({ chat }: { chat: ChatItem }) {
  return (
    <Link
      to={`/chat/${chat.roomId}`}
      viewTransition
      className="flex items-start gap-[8px] bg-[#FAFAFA] px-[16px] py-[12px] transition-colors hover:bg-[#F5F5F5] dark:bg-[#1F242F] dark:hover:bg-[#252B37]"
    >
      <div className="flex flex-1 items-center gap-[8px]">
        <Avatar className="size-[36px] shrink-0">
          <AvatarImage src={chat.characterAvatarUrl ?? undefined} />
          <AvatarFallback className="bg-[#E9EAEB] text-[12px] text-[#535862] dark:bg-[#333741] dark:text-[#D5D7DA]">
            {chat.characterName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="truncate text-[14px] font-semibold leading-[20px] text-black dark:text-white">
            {chat.characterName}
          </span>
          <span className="text-[12px] leading-[18px] text-[#717680] dark:text-[#94969C]">
            {formatTime(chat.lastMessageAt)}
          </span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 p-[5.33px]"
        aria-label="더보기"
        onClick={(e) => e.preventDefault()}
      >
        <DotsVerticalIcon className="size-[8.89px] text-[#535862] dark:text-[#717680]" />
      </button>
    </Link>
  );
}

function ChatSection({
  label,
  chats,
  defaultOpen = true,
}: {
  label: string;
  chats: ChatItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (chats.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-[#CBD5E1] py-[8px] last:border-b-0 dark:border-[#414651]">
      <SectionHeader
        label={label}
        count={chats.length}
        open={open}
        onToggle={() => setOpen(!open)}
      />
      <CollapsibleContent>
        <div className="flex flex-col">
          {chats.map((chat) => (
            <ChatListItem key={chat.roomId} chat={chat} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function UserFooter({ user }: { user: ChatSidebarUser }) {
  return (
    <div className="flex flex-col gap-[24px] bg-[#FAFAFA] px-[16px] py-[32px] dark:bg-[#181D27]">
      <div className="h-px w-full bg-[#E9EAEB] dark:bg-[#414651]" />
      <div className="flex items-start justify-between px-[8px]">
        <div className="flex items-center gap-[12px]">
          <img
            src="/default-avatar.png"
            alt="프로필"
            className="size-[40px] shrink-0 rounded-[200px] object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-[20px] text-[#181D27] dark:text-white">
              {user.name}
            </p>
            {user.email && (
              <p className="truncate text-[14px] leading-[20px] text-[#535862] dark:text-[#717680]">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <Link
          to="/logout"
          viewTransition
          className="shrink-0 text-[#717680] transition-colors hover:text-[#535862] dark:text-[#D5D7DA] dark:hover:text-white"
          aria-label="로그아웃"
        >
          <LogOutIcon className="size-[20px]" />
        </Link>
      </div>
    </div>
  );
}

function LoggedOutCTA() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" />
      <div className="flex flex-col gap-[24px] px-[16px] pb-[32px]">
        {/* Divider — Figma: #E9EAEB 1px */}
        <div className="h-px w-full bg-[#E9EAEB] dark:bg-[#414651]" />
        {/* Login Card — Figma: bg #F5F5F5, rounded-[8px], px-16 py-20, gap-16 */}
        <div className="flex flex-col gap-[16px] rounded-[8px] bg-[#F5F5F5] px-[16px] py-[20px] dark:bg-[#252B37]">
          <p className="text-[14px] font-semibold leading-[20px] text-[#181D27] dark:text-[#FDFDFD]">
            로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!
          </p>

          {/* Social Login Buttons */}
          <div className="flex items-center justify-center gap-[16px]">
            {/* Kakao */}
            <Link
              to="/auth/social/start/kakao"
              viewTransition
              className="flex size-[48px] items-center justify-center rounded-[500px] border border-[#D5D7DA] bg-[#FFE812] transition-opacity hover:opacity-90"
              aria-label="카카오톡으로 로그인"
            >
              <svg
                className="size-[24px]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 22.125C24 23.1606 23.1606 24 22.125 24H1.875C0.839438 24 0 23.1606 0 22.125V1.875C0 0.839438 0.839438 0 1.875 0H22.125C23.1606 0 24 0.839438 24 1.875V22.125Z"
                  fill="#FFE812"
                />
                <path
                  d="M12 3.375C6.61519 3.375 2.25 6.81684 2.25 11.0625C2.25 13.8074 4.07494 16.2159 6.82013 17.576C6.67078 18.091 5.86041 20.8895 5.82816 21.1093C5.82816 21.1093 5.80875 21.2745 5.91572 21.3375C6.02269 21.4005 6.1485 21.3516 6.1485 21.3516C6.45525 21.3087 9.70566 19.0255 10.2682 18.6291C10.8303 18.7087 11.409 18.75 12 18.75C17.3848 18.75 21.75 15.3082 21.75 11.0625C21.75 6.81684 17.3848 3.375 12 3.375Z"
                  fill="black"
                />
              </svg>
            </Link>
            {/* Google */}
            <Link
              to="/auth/social/start/google"
              viewTransition
              className="flex size-[48px] items-center justify-center rounded-[500px] border border-[#D5D7DA] bg-white transition-opacity hover:opacity-90"
              aria-label="구글로 로그인"
            >
              <svg
                className="size-[18px]"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.8247 9.20746C17.8247 8.59567 17.7751 7.98057 17.6693 7.37869H9.18018V10.8444H14.0415C13.8397 11.9622 13.1916 12.951 12.2425 13.5793V15.8281H15.1427C16.8458 14.2606 17.8247 11.9457 17.8247 9.20746Z"
                  fill="#4285F4"
                />
                <path
                  d="M9.18008 18.0005C11.6074 18.0005 13.6544 17.2035 15.1459 15.8278L12.2457 13.5791C11.4388 14.128 10.3971 14.4389 9.18338 14.4389C6.83541 14.4389 4.8446 12.8548 4.13029 10.7251H1.13745V13.0433C2.66529 16.0825 5.77717 18.0005 9.18008 18.0005V18.0005Z"
                  fill="#34A853"
                />
                <path
                  d="M4.12708 10.7253C3.75008 9.60748 3.75008 8.39712 4.12708 7.27936V4.96115H1.13755C-0.13895 7.50423 -0.13895 10.5004 1.13755 13.0435L4.12708 10.7253V10.7253Z"
                  fill="#FBBC04"
                />
                <path
                  d="M9.18007 3.56225C10.4632 3.5424 11.7033 4.02523 12.6326 4.9115L15.2021 2.34196C13.5751 0.814129 11.4156 -0.0258495 9.18007 0.000606499C5.77717 0.000606499 2.66528 1.91867 1.13745 4.96111L4.12698 7.27931C4.83798 5.1463 6.83211 3.56225 9.18007 3.56225V3.56225Z"
                  fill="#EA4335"
                />
              </svg>
            </Link>
          </div>

          {/* Email Login */}
          <Link
            to="/login"
            viewTransition
            className="flex w-full items-center justify-center rounded-[8px] border border-[#D5D7DA] bg-white px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#F5F5F5] dark:bg-[#717680] dark:text-white dark:hover:bg-[#717680]/90"
          >
            이메일로 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function ChatSidebar({ user, chats = [] }: ChatSidebarProps) {
  const isLoggedIn = !!user;
  const grouped = groupChatsByPeriod(chats);
  const hasChats = chats.length > 0;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#E2E8F0] bg-[#FDFDFD] dark:border-[#414651] dark:bg-[#181D27]">
      {/* Header */}
      <div className="flex items-center border-b border-[#CBD5E1] px-[16px] py-[20px] dark:border-[#414651]">
        <h2
          className={
            isLoggedIn
              ? "text-[14px] font-semibold leading-[20px] text-black dark:text-white"
              : "text-[16px] font-bold leading-[24px] text-black dark:text-white"
          }
        >
          채팅
        </h2>
      </div>

      {/* Content */}
      {!isLoggedIn ? (
        <LoggedOutCTA />
      ) : !hasChats ? (
        /* Logged in, no chats */
        <div className="flex flex-1 flex-col">
          <Collapsible defaultOpen className="border-b border-[#CBD5E1] py-[8px] dark:border-[#414651]">
            <SectionHeader
              label="오늘"
              count={0}
              open={true}
              onToggle={() => {}}
            />
          </Collapsible>
          <div className="flex-1" />
          {/* Empty CTA 카드 */}
          <div className="px-[16px] pb-[16px]">
            <div className="flex flex-col gap-[16px] rounded-[8px] bg-[#F5F5F5] px-[16px] py-[20px] dark:bg-[#252B37]">
              <p className="text-[14px] font-semibold leading-[20px] text-[#181D27] dark:text-[#FDFDFD]">
                아직 첫 대화를 시작하지 않으셨네요! 마음에 드는 캐릭터와 첫 대화를
                시작해보세요 :)
              </p>
              <Link
                to="/characters"
                viewTransition
                className="flex w-full items-center justify-center rounded-[8px] border border-[#D5D7DA] bg-white px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#F5F5F5] dark:bg-[#717680] dark:text-white dark:hover:bg-[#717680]/90"
              >
                탐색하기
              </Link>
            </div>
          </div>
          <UserFooter user={user} />
        </div>
      ) : (
        /* Logged in, has chats */
        <div className="flex flex-1 flex-col gap-[4px]">
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#E8E8E8] [&::-webkit-scrollbar-thumb]:rounded-[100px] [&::-webkit-scrollbar-thumb]:bg-[#7A7A7A]">
            <ChatSection label="오늘" chats={grouped.today} />
            <ChatSection
              label="최근 일주일"
              chats={grouped.thisWeek}
              defaultOpen={true}
            />
            {grouped.older.length > 0 && (
              <ChatSection
                label="이전"
                chats={grouped.older}
                defaultOpen={false}
              />
            )}
          </div>
          <UserFooter user={user} />
        </div>
      )}
    </aside>
  );
}
