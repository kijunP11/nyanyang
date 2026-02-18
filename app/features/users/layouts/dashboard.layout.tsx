import type { Route } from "./+types/dashboard.layout";

import { eq } from "drizzle-orm";
import { data, Outlet } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getUserProfileWithCounts } from "../lib/queries.server";
import type { DashboardLayoutContext } from "../types";
import { userPoints } from "../../points/schema";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  const profile = user ? await getUserProfileWithCounts(user.id) : null;

  const url = new URL(request.url);
  const apiUrl = new URL("/api/attendance/checkin", url.origin);

  const [attendanceData, pointsData] = await Promise.all([
    fetch(apiUrl.toString(), { headers: request.headers })
      .then((res) =>
        res.ok ? res.json() : { checkedInToday: false, currentStreak: 0 }
      )
      .catch(() => ({ checkedInToday: false, currentStreak: 0 })),
    user
      ? drizzle
          .select()
          .from(userPoints)
          .where(eq(userPoints.user_id, user.id))
          .limit(1)
          .then(([result]) =>
            result
              ? {
                  current_balance: result.current_balance,
                  total_earned: result.total_earned,
                  total_spent: result.total_spent,
                }
              : { current_balance: 0, total_earned: 0, total_spent: 0 }
          )
          .catch(() => ({
            current_balance: 0,
            total_earned: 0,
            total_spent: 0,
          }))
      : { current_balance: 0, total_earned: 0, total_spent: 0 },
  ]);

  return data(
    {
      user,
      profile,
      attendanceData,
      points: pointsData,
    } satisfies DashboardLayoutContext,
    { headers }
  );
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#181D27]">
      <Outlet context={loaderData} />
    </div>
  );
}
