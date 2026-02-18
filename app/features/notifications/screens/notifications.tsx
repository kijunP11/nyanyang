/**
 * 알림 페이지 (F8) — 5탭(전체/소식/좋아요/댓글/팔로우) + 빈 상태
 */
import type { Route } from "./+types/notifications";

import { MessageCircle } from "lucide-react";
import { data, useLoaderData, useSearchParams } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { NotificationItem } from "../components/notification-item";
import { getNotifications } from "../lib/queries.server";
import type { NotificationType } from "../lib/queries.server";

export const meta: Route.MetaFunction = () => [
  { title: `알림 | ${import.meta.env.VITE_APP_NAME}` },
];

const TABS = [
  { id: "all", label: "전체" },
  { id: "checkin", label: "소식" },
  { id: "like", label: "좋아요" },
  { id: "comment", label: "댓글" },
  { id: "follow", label: "팔로우" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") as TabId | null;
  const type: NotificationType | undefined =
    tab && tab !== "all" ? (tab as NotificationType) : undefined;

  const items = await getNotifications(user.id, type);

  return data({ items }, { headers });
}

export default function Notifications() {
  const { items } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabId) || "all";

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (tabId === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <h1 className="text-xl font-semibold text-black">알림</h1>

        <div className="flex border-b border-[#E9EAEB]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 pb-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-black text-black"
                  : "text-[#717680] hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#F5F5F5]">
              <MessageCircle className="size-8 text-[#A4A7AE]" />
            </div>
            <p className="text-sm font-medium text-[#535862]">
              받은 알림이 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <NotificationItem
                key={item.notification_id}
                notification={{
                  notification_id: item.notification_id,
                  type: item.type,
                  title: item.title,
                  body: item.body,
                  subtitle: item.subtitle ?? null,
                  created_at:
                    item.created_at instanceof Date
                      ? item.created_at.toISOString()
                      : String(item.created_at),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
