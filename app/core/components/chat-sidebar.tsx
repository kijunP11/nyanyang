import { useState } from "react";
import { ChevronDown, LogOut, Mail, MoreVertical } from "lucide-react";
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
        <div className="rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
          <p className="mb-4 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
            로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!
          </p>

          {/* Social Login Buttons */}
          <div className="mb-3 flex items-center justify-center gap-3">
            {/* Kakao */}
            <Link
              to="/auth/social/start/kakao"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full bg-[#FEE500] transition-opacity hover:opacity-90"
              aria-label="카카오톡으로 로그인"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="#000000"
              >
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.788 5.108 4.488 6.467l-1.142 4.225a.35.35 0 0 0 .538.384l4.907-3.238c.39.037.787.062 1.209.062 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
              </svg>
            </Link>
            {/* Google */}
            <Link
              to="/auth/social/start/google"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full border border-[#D5D7DA] bg-white transition-opacity hover:opacity-90 dark:border-[#414651] dark:bg-[#1F242F]"
              aria-label="구글로 로그인"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </Link>
          </div>

          {/* Email Login */}
          <Link
            to="/login"
            viewTransition
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-medium text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
          >
            <Mail className="size-4" />
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
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#181D27]">
      {/* Header */}
      <div className="flex h-[57px] items-center px-4">
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
            <div className="rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
              <p className="mb-3 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
                아직 첫 대화를 시작하지 않으셨네요! 마음에 드는 캐릭터와 첫 대화를
                시작해보세요 :)
              </p>
              <Link
                to="/characters"
                viewTransition
                className="flex w-full items-center justify-center rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-medium text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
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
