import type { Route } from "./+types/dashboard.layout";

import { Outlet } from "react-router";
import { Suspense } from "react";
import { Await } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import makeServerClient from "~/core/lib/supa-client.server";

import DashboardSidebar from "../components/dashboard-sidebar";
import DailyAttendanceCard from "../../attendance/components/daily-attendance-card";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  // Fetch attendance data for the card
  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);
  const attendancePromise = fetch(apiUrl.toString(), {
    headers: request.headers,
  })
    .then((res) => (res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }))
    .catch(() => ({ checkedInToday: false, currentStreak: 0 }));

  return {
    user,
    attendancePromise,
  };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, attendancePromise } = loaderData;
  return (
    <SidebarProvider>
      <DashboardSidebar
        user={{
          name: user?.user_metadata.name ?? "",
          avatarUrl: user?.user_metadata.avatar_url ?? "",
          email: user?.email ?? "",
        }}
      />
      <SidebarInset>
        <div className="flex">
          <div className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
            <Outlet />
          </div>
          {/* Right Sidebar - Attendance Card */}
          <Sidebar side="right" variant="inset" collapsible="icon" className="hidden lg:flex">
            <SidebarHeader className="p-4">
              <h2 className="text-sm font-semibold">출석 체크</h2>
            </SidebarHeader>
            <SidebarContent className="p-4">
              <Suspense
                fallback={
                  <div className="bg-card animate-fast-pulse h-64 w-full rounded-xl border" />
                }
              >
                <Await resolve={attendancePromise}>
                  {(attendance) => (
                    <DailyAttendanceCard
                      checkedInToday={attendance.checkedInToday}
                      currentStreak={attendance.currentStreak}
                    />
                  )}
                </Await>
              </Suspense>
            </SidebarContent>
          </Sidebar>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
