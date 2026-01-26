import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Coins,
  User,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/core/components/ui/sidebar";

import SidebarMain from "./sidebar-main";
import SidebarUser from "./sidebar-user";

const data = {
  navMain: [
    {
      title: "대시보드",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "개요",
          url: "/dashboard",
        },
        {
          title: "내 콘텐츠",
          url: "/dashboard/my-content",
        },
      ],
    },
    {
      title: "캐릭터",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "캐릭터 탐색",
          url: "/characters",
        },
        {
          title: "캐릭터 만들기",
          url: "/characters/create",
        },
      ],
    },
    {
      title: "채팅",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "채팅방 목록",
          url: "/rooms",
        },
      ],
    },
    {
      title: "포인트",
      url: "#",
      icon: Coins,
      items: [
        {
          title: "포인트 충전",
          url: "/points",
        },
        {
          title: "결제 내역",
          url: "/dashboard/payments",
        },
      ],
    },
    {
      title: "출석체크",
      url: "/attendance",
      icon: Calendar,
      items: [],
    },
    {
      title: "계정",
      url: "#",
      icon: User,
      items: [
        {
          title: "프로필 수정",
          url: "/account/edit",
        },
        {
          title: "설정",
          url: "#",
        },
      ],
    },
  ],
};

export default function DashboardSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <img src="/logo3.png" alt="NYANYANG" className="h-6" />
          <span className="font-semibold text-lg">NYANYANG</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
