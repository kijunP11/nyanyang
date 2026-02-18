/**
 * Admin Sidebar — 아코디언 메뉴 (8개 그룹) + 검색 + 하단 프로필
 */
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Home,
  Layers,
  Lock,
  LogOut,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";

interface AdminSidebarProps {
  admin: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

const MENU_GROUPS = [
  {
    id: "home",
    label: "홈",
    icon: Home,
    items: [] as { label: string; href: string; badge?: number }[],
    href: "/admin",
  },
  {
    id: "users",
    label: "유저관리",
    icon: Users,
    items: [
      { label: "유저 목록 / 검색", href: "/admin/users" },
      { label: "신고 내역 / 제재 관리", href: "/admin/reports/users", badge: 10 },
      { label: "권한 관리", href: "/admin/permissions" },
    ],
  },
  {
    id: "characters",
    label: "캐릭터 관리",
    icon: Layers,
    items: [
      { label: "캐릭터 목록", href: "/admin/characters" },
      { label: "신고 캐릭터", href: "/admin/reports/characters", badge: 10 },
      { label: "승인 / 숨김 관리", href: "/admin/characters/moderation" },
      { label: "태그 / 세이프티 설정", href: "/admin/characters/settings" },
    ],
  },
  {
    id: "chat",
    label: "채팅 / 콘텐츠",
    icon: MessageSquare,
    items: [
      { label: "신고 채팅 로그 목록", href: "/admin/reports/chats" },
      { label: "금칙어 관리 화면", href: "/admin/chat/banned-words" },
    ],
  },
  {
    id: "payments",
    label: "결제 / 포인트",
    icon: CreditCard,
    items: [
      { label: "결제 내역", href: "/admin/payments" },
      { label: "환불 관리", href: "/admin/payments/refunds", badge: 10 },
      { label: "포인트 / 티켓 / 추천인 관리", href: "/admin/points" },
    ],
  },
  {
    id: "stats",
    label: "통계 / 모니터링",
    icon: BarChart3,
    items: [
      { label: "사용 지표 (DAU / MAU)", href: "/admin/stats/usage" },
    ],
  },
  {
    id: "notices",
    label: "공지 / 운영",
    icon: Bell,
    items: [
      { label: "공지사항 관리", href: "/admin/notices" },
    ],
  },
  {
    id: "settings",
    label: "보안 / 설정",
    icon: Lock,
    items: [
      { label: "운영자 계정 관리", href: "/admin/settings/accounts" },
      { label: "권한 레벨 관리", href: "/admin/settings/roles", badge: 10 },
      { label: "감사 로그", href: "/admin/settings/audit-log" },
      { label: "보안 설정 (2FA / IP)", href: "/admin/settings/security" },
    ],
  },
];

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-[#E9EAEB] bg-white overflow-y-auto">
      <div className="flex flex-col p-4 gap-4">
        <img src="/logo3.png" alt="NYANYANG" className="h-[30px]" />
        <div className="flex items-center gap-2 rounded-lg border border-[#E9EAEB] bg-[#F9FAFB] px-3 py-2">
          <Search className="size-4 text-[#717680]" />
          <input
            type="search"
            placeholder="Search"
            className="flex-1 min-w-0 bg-transparent text-sm text-[#181D27] placeholder:text-[#717680] outline-none"
          />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 pb-4">
        {MENU_GROUPS.map((group) => {
          const Icon = group.icon;
          if (group.items.length === 0) {
            return (
              <NavLink
                key={group.id}
                to={group.href ?? "/admin"}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#F5F5F5] text-[#181D27]"
                      : "text-[#414651] hover:bg-[#F9FAFB]"
                  }`
                }
              >
                <Icon className="size-5 shrink-0" />
                <span>{group.label}</span>
                <ChevronDown className="size-4 ml-auto shrink-0" />
              </NavLink>
            );
          }
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleMenu(group.id)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#414651] hover:bg-[#F9FAFB] rounded-lg transition-colors"
              >
                <Icon className="size-5 shrink-0" />
                <span>{group.label}</span>
                {openMenuId === group.id ? (
                  <ChevronUp className="size-4 ml-auto shrink-0" />
                ) : (
                  <ChevronDown className="size-4 ml-auto shrink-0" />
                )}
              </button>
              {openMenuId === group.id && (
                <div className="flex flex-col">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center pl-11 pr-4 py-2 text-sm rounded-lg ${
                          isActive
                            ? "bg-[#F5F5F5] text-[#181D27] font-semibold"
                            : "text-[#414651] hover:bg-[#F9FAFB]"
                        }`
                      }
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="ml-auto shrink-0 rounded-full bg-[#F5F5F5] px-2 py-0.5 text-xs font-medium text-[#535862]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#E9EAEB] p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={admin.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {admin.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[#181D27]">
              {admin.name}
            </p>
            <p className="truncate text-xs text-[#535862]">admin setting</p>
          </div>
          <Link
            to="/logout"
            className="shrink-0 text-[#717680] hover:text-[#181D27]"
          >
            <LogOut className="size-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
