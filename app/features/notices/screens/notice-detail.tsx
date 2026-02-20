import type { Route } from "./+types/notice-detail";

import { eq, and } from "drizzle-orm";
import { data } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";

import { notices } from "../schema";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) {
    return [{ title: `404 | ${import.meta.env.VITE_APP_NAME}` }];
  }
  return [
    { title: `${data.notice.title} | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: data.notice.title },
  ];
};

export async function loader({ params }: Route.LoaderArgs) {
  const [notice] = await drizzle
    .select()
    .from(notices)
    .where(
      and(eq(notices.slug, params.slug), eq(notices.status, "published")),
    )
    .limit(1);

  if (!notice) {
    throw data(null, { status: 404 });
  }

  return { notice };
}

export default function NoticeDetail({
  loaderData: { notice },
}: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#181D27]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black dark:text-white">
          {notice.title}
        </h1>

        {/* Tag + Date */}
        <div className="mt-3 flex items-center gap-3">
          {notice.tag && (
            <span className="bg-[#36C4B3] px-2 py-1 text-xs font-normal text-black dark:bg-[rgba(0,196,175,0.3)] dark:text-white">
              {notice.tag}
            </span>
          )}
          <span className="text-xs text-[rgba(0,0,0,0.7)] dark:text-[rgba(255,255,255,0.7)]">
            {notice.published_at
              ? new Date(notice.published_at).toLocaleDateString("ko-KR")
              : ""}
          </span>
        </div>

        {/* Top divider */}
        <hr className="mt-4 border-border" />

        {/* Content */}
        <div className="py-6 text-sm leading-[1.5] text-[rgba(0,0,0,0.7)] whitespace-pre-wrap dark:text-[rgba(255,255,255,0.7)]">
          {notice.content}
        </div>

        {/* Bottom divider */}
        <hr className="border-border" />
      </div>
    </div>
  );
}
