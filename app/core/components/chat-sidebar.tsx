import { useState } from "react";
import { ChevronDown, LogOut, MoreVertical } from "lucide-react";
import { Link } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

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
      className="flex w-full items-center justify-between px-4 py-2"
    >
      <span className="text-xs font-medium text-[#717680] dark:text-[#94969C]">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#A4A7AE] dark:text-[#717680]">
          {count}개
        </span>
        <ChevronDown
          className={`size-3.5 text-[#A4A7AE] transition-transform dark:text-[#717680] ${
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
      className="group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#1F242F]"
    >
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={chat.characterAvatarUrl ?? undefined} />
        <AvatarFallback className="bg-[#E9EAEB] text-xs text-[#535862] dark:bg-[#333741] dark:text-[#D5D7DA]">
          {chat.characterName.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[#181D27] dark:text-white">
          {chat.characterName}
        </span>
      </div>
      <span className="shrink-0 text-xs text-[#A4A7AE] dark:text-[#717680]">
        {formatTime(chat.lastMessageAt)}
      </span>
      <button
        type="button"
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="더보기"
        onClick={(e) => e.preventDefault()}
      >
        <MoreVertical className="size-4 text-[#A4A7AE] dark:text-[#717680]" />
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
    <Collapsible open={open} onOpenChange={setOpen}>
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
    <div className="flex items-center gap-3 border-t border-[#E9EAEB] px-4 py-4 dark:border-[#333741]">
      <Avatar className="size-9">
        <AvatarImage src={user.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-[#E9EAEB] text-sm text-[#535862] dark:bg-[#333741] dark:text-[#D5D7DA]">
          {user.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#181D27] dark:text-white">
          {user.name}
        </p>
        {user.email && (
          <p className="truncate text-xs text-[#535862] dark:text-[#94969C]">
            {user.email}
          </p>
        )}
      </div>
      <Link
        to="/logout"
        viewTransition
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#A4A7AE] transition-colors hover:bg-[#F5F5F5] hover:text-[#535862] dark:text-[#717680] dark:hover:bg-[#1F242F] dark:hover:text-[#D5D7DA]"
        aria-label="로그아웃"
      >
        <LogOut className="size-4" />
      </Link>
    </div>
  );
}

function LoggedOutCTA() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" />
      <div className="px-4 pb-6">
        <div className="rounded-lg bg-[#F5F5F5] px-4 py-5 dark:bg-[#252B37]">
          <p className="mb-4 text-sm font-semibold leading-5 text-[#181D27] dark:text-[#FDFDFD]">
            로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!
          </p>

          {/* Social Login Buttons */}
          <div className="mb-4 flex items-center justify-center gap-4">
            {/* Kakao */}
            <Link
              to="/auth/social/start/kakao"
              viewTransition
              className="flex size-12 items-center justify-center rounded-full border border-[#D5D7DA] bg-[#FFE812] transition-opacity hover:opacity-90"
              aria-label="카카오톡으로 로그인"
            >
              <svg
                className="size-6"
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
              className="flex size-12 items-center justify-center rounded-full border border-[#D5D7DA] bg-white transition-opacity hover:opacity-90"
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
            className="flex w-full items-center justify-center rounded-lg border border-[#D5D7DA] px-3.5 py-2 text-sm font-semibold text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#F5F5F5] dark:bg-[#717680] dark:text-white dark:hover:bg-[#717680]/90"
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
      <div className="flex h-[57px] items-center border-b border-[#CBD5E1] px-4 dark:border-[#414651]">
        <h2 className="text-base font-bold text-[#181D27] dark:text-white">
          채팅
        </h2>
      </div>

      {/* Content */}
      {!isLoggedIn ? (
        <LoggedOutCTA />
      ) : !hasChats ? (
        /* Logged in, no chats */
        <div className="flex flex-1 flex-col">
          <Collapsible defaultOpen>
            <SectionHeader
              label="오늘"
              count={0}
              open={true}
              onToggle={() => {}}
            />
          </Collapsible>
          <div className="flex-1" />
          {/* Empty CTA 카드 */}
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-[#F5F5F5] p-4 dark:bg-[#252B37]">
              <p className="mb-3 text-sm leading-relaxed text-[#181D27] dark:text-[#94969C]">
                아직 첫 대화를 시작하지 않으셨네요! 마음에 드는 캐릭터와 첫 대화를
                시작해보세요 :)
              </p>
              <Link
                to="/characters"
                viewTransition
                className="flex w-full items-center justify-center rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-semibold text-[#414651] shadow-xs transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
              >
                탐색하기
              </Link>
            </div>
          </div>
          <UserFooter user={user} />
        </div>
      ) : (
        /* Logged in, has chats */
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
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
