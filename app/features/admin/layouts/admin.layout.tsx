/**
 * Admin Layout — 어드민 전용 사이드바 레이아웃 (GNB 없음)
 */
import type { Route } from "./+types/admin.layout";

import { Outlet, data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { getUserProfileWithCounts } from "~/features/users/lib/queries.server";

import { AdminSidebar } from "../components/admin-sidebar";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const profile = await getUserProfileWithCounts(user.id);

  return data(
    {
      admin: {
        name: profile?.name || (user.user_metadata?.name as string) || "admin",
        email: user.email || "",
        avatarUrl:
          (profile?.avatar_url as string | null) ||
          (user.user_metadata?.avatar_url as string | null) ||
          null,
      },
    },
    { headers }
  );
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar admin={loaderData.admin} />
      <main className="flex-1 overflow-auto">
        <Outlet context={loaderData} />
      </main>
    </div>
  );
}
