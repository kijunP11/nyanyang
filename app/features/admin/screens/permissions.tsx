/**
 * Admin 권한 관리 — 역할 필터 + 유저 테이블 (/api/admin/users 재사용)
 */
import type { Route } from "./+types/permissions";

import { Search } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

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

const ROLE_FILTERS = [
  { label: "전체", value: "" },
  { label: "일반 유저", value: "user", dotColor: "bg-gray-400" },
  { label: "공식 크리에이터", value: "creator", dotColor: "bg-green-500" },
] as const;

function RoleBadge({ role }: { role: string }) {
  const isCreator = role === "creator";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${isCreator ? "text-green-600" : "text-gray-500"}`}
    >
      <span
        className={`size-1.5 rounded-full ${isCreator ? "bg-green-500" : "bg-gray-400"}`}
      />
      {isCreator ? "공식 크리에이터" : "일반 유저"}
    </span>
  );
}

export default function AdminPermissions() {
  const { users, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const currentRole = searchParams.get("role") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/admin/permissions?search=${encodeURIComponent(searchInput)}&role=${currentRole}`
    );
  };

  const currentPage =
    Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">권한 관리</h1>
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
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() =>
                navigate(
                  `/admin/permissions?search=${searchInput}&role=${f.value}`
                )
              }
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentRole === f.value
                  ? "border-[#181D27] bg-white text-[#181D27]"
                  : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}
            >
              {"dotColor" in f && f.dotColor && (
                <span className={`size-2 rounded-full ${f.dotColor}`} />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E9EAEB] bg-white">
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
                일반 유저 / 공식 크리에이터
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
                <td className="px-4 py-4 text-sm font-medium text-[#181D27]">
                  {user.display_name}
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
                  <RoleBadge role="user" />
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
                  `/admin/permissions?search=${searchInput}&role=${currentRole}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
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
                  `/admin/permissions?search=${searchInput}&role=${currentRole}&offset=${pagination.offset + pagination.limit}`
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
