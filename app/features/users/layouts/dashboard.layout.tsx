import type { Route } from "./+types/dashboard.layout";

import { data, Outlet } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfileWithCounts } from "../lib/queries.server";
import type { DashboardLayoutContext } from "../types";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  // 프로필 데이터 (팔로워/팔로잉 카운트 포함)
  const profile = user ? await getUserProfileWithCounts(user.id) : null;

  // 출석 데이터
  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);
  const attendanceData = await fetch(apiUrl.toString(), {
    headers: request.headers,
  })
    .then((res) => (res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }))
    .catch(() => ({ checkedInToday: false, currentStreak: 0 }));

  return data(
    {
      user,
      profile,
      attendanceData,
    } satisfies DashboardLayoutContext,
    { headers }
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-[#111111]">
      <Outlet context={loaderData} />
    </div>
  );
}
