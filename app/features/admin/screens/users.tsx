/**
 * Admin 유저 목록 / 검색 — Figma 리디자인
 */
import type { Route } from "./+types/users";

import { Search } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  const usersResponse = await fetch(
    new URL(
      `/api/admin/users?search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!usersResponse.ok) {
    throw new Response("Failed to load users", { status: 500 });
  }

  const usersData = await usersResponse.json();
  return data(
    { users: usersData.users, pagination: usersData.pagination },
    { headers }
  );
}

const STATUS_FILTERS = [
  { label: "전체", value: "" },
  { label: "이용중", value: "active", dotColor: "bg-green-500" },
  { label: "이용 제한", value: "restricted", dotColor: "bg-orange-500" },
  { label: "영구 정지", value: "banned", dotColor: "bg-red-500" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { dot: string; bg: string; text: string; label: string }
  > = {
    active: {
      dot: "bg-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
      label: "이용중",
    },
    restricted: {
      dot: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
      label: "이용 제한",
    },
    banned: {
      dot: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      label: "이용 정지",
    },
  };
  const c = config[status] ?? config.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function VerificationBadge({ verifiedAt }: { verifiedAt: string | null }) {
  const verified = !!verifiedAt;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${verified ? "text-green-600" : "text-gray-400"}`}
    >
      <span
        className={`size-1.5 rounded-full ${verified ? "bg-green-500" : "bg-gray-300"}`}
      />
      {verified ? "인증완료" : "인증안함"}
    </span>
  );
}

export default function AdminUsers() {
  const { users, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const currentStatus = searchParams.get("status") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/admin/users?search=${encodeURIComponent(searchInput)}&status=${currentStatus}`
    );
  };

  const handleStatusFilter = (value: string) => {
    navigate(`/admin/users?search=${searchInput}&status=${value}`);
  };

  const currentPage =
    Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">
        유저 목록 / 검색
      </h1>
      <p className="mb-6 text-sm text-[#535862]">
        닉네임, 이메일, ID로 유저를 검색하고 이용 상태를 관리할 수 있습니다.
      </p>

      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="max-w-[520px] flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="닉네임 • 이메일 • 아이디 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
            />
          </div>
        </form>

        <div className="ml-auto flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleStatusFilter(f.value)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentStatus === f.value
                  ? "border-[#181D27] bg-white text-[#181D27]"
                  : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}
            >
              {"dotColor" in f && (
                <span className={`size-2 rounded-full ${f.dotColor}`} />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">목록</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-[#D5D7DA]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                닉네임
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                이메일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                아이디
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                본인인증(성인) 상태
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr
                key={user.user_id}
                className="border-b border-[#E9EAEB] last:border-0"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-[#D5D7DA]"
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-[#181D27]">
                    {user.display_name}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {user.display_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-[#181D27]">
                        {user.display_name}
                      </p>
                      <p className="text-xs text-[#535862]">
                        {user.email ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[#535862]">
                  {`{${user.user_id.slice(0, 8)}}`}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status="active" />
                </td>
                <td className="px-4 py-4">
                  <VerificationBadge
                    verifiedAt={
                      user.verified_at
                        ? typeof user.verified_at === "string"
                          ? user.verified_at
                          : (user.verified_at as Date)?.toISOString?.()
                        : null
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">
            {currentPage}/{totalPages} 페이지
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users?search=${searchInput}&status=${currentStatus}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
                )
              }
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users?search=${searchInput}&status=${currentStatus}&offset=${pagination.offset + pagination.limit}`
                )
              }
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
