import type { Route } from "./+types/notice-list";

import { eq, desc, and } from "drizzle-orm";
import { Link, useSearchParams } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";

import { notices } from "../schema";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `공지사항 | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "공지사항 및 이벤트 안내" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as
    | "notice"
    | "event"
    | null;

  const conditions = [eq(notices.status, "published")];
  if (type) {
    conditions.push(eq(notices.type, type));
  }

  const items = await drizzle
    .select({
      notice_id: notices.notice_id,
      type: notices.type,
      title: notices.title,
      slug: notices.slug,
      tag: notices.tag,
      published_at: notices.published_at,
    })
    .from(notices)
    .where(and(...conditions))
    .orderBy(desc(notices.published_at));

  return { items };
}

export default function NoticeList({
  loaderData: { items },
}: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = searchParams.get("type");

  function handleTab(type: string | null) {
    if (type) {
      setSearchParams({ type });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold">공지사항</h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-4 border-b border-border">
        <button
          onClick={() => handleTab(null)}
          className={`pb-3 text-sm font-medium transition-colors ${
            !currentType
              ? "border-b-2 border-[#36C4B3] text-[#36C4B3]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => handleTab("notice")}
          className={`pb-3 text-sm font-medium transition-colors ${
            currentType === "notice"
              ? "border-b-2 border-[#36C4B3] text-[#36C4B3]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          공지사항
        </button>
        <button
          onClick={() => handleTab("event")}
          className={`pb-3 text-sm font-medium transition-colors ${
            currentType === "event"
              ? "border-b-2 border-[#36C4B3] text-[#36C4B3]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          이벤트
        </button>
      </div>

      {/* List */}
      <div className="mt-4 divide-y divide-border">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            등록된 공지사항이 없습니다.
          </p>
        )}
        {items.map((item, idx) => (
          <Link
            key={item.notice_id}
            to={`/notices/${item.slug}`}
            className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/50"
          >
            {/* Row number */}
            <span className="w-10 shrink-0 text-center text-sm text-muted-foreground">
              {idx + 1}
            </span>

            {/* Tag badge */}
            {item.tag && (
              <span className="shrink-0 rounded bg-[#36C4B3] px-2 py-0.5 text-xs font-medium text-white dark:bg-[rgba(0,196,175,0.3)] dark:text-[#36C4B3]">
                {item.tag}
              </span>
            )}

            {/* Title */}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {item.title}
            </span>

            {/* Date */}
            <span className="shrink-0 text-xs text-[rgba(0,0,0,0.7)] dark:text-[rgba(255,255,255,0.7)]">
              {item.published_at
                ? new Date(item.published_at).toLocaleDateString("ko-KR")
                : ""}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
