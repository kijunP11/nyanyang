/**
 * Admin 태그 / 세이프티 설정 — API 캐릭터 데이터 (age_rating / is_nsfw)
 */
import type { Route } from "./+types/character-settings";

import { MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
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

  const res = await fetch(
    new URL(
      `/api/admin/characters?status=all&search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!res.ok) {
    throw new Response("Failed to load characters", { status: 500 });
  }
  const result = await res.json();
  return data(
    { characters: result.characters, pagination: result.pagination },
    { headers }
  );
}

const SAFETY_FILTERS = [
  { label: "전체", value: "" },
  { label: "전체 이용가", value: "everyone", dotColor: "bg-green-500" },
  { label: "청소년 이용불가", value: "mature", dotColor: "bg-red-500" },
] as const;

function getSafety(char: any): {
  label: string;
  color: string;
  dot: string;
} {
  if (
    char.is_nsfw ||
    (char.age_rating && char.age_rating !== "everyone")
  ) {
    return {
      label: "청소년 이용불가",
      color: "text-red-600",
      dot: "bg-red-500",
    };
  }
  return {
    label: "전체 이용가",
    color: "text-green-600",
    dot: "bg-green-500",
  };
}

export default function AdminCharacterSettings() {
  const { characters: chars, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const currentFilter = searchParams.get("filter") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      `/admin/characters/settings?search=${encodeURIComponent(searchInput)}&filter=${currentFilter}`
    );
  };

  const currentPage =
    Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const tagsDisplay = (char: any) => {
    const t = char.tags;
    if (Array.isArray(t) && t.length) return t.map((x: string) => `#${x}`).join(" ");
    return "—";
  };

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">
        태그 / 세이프티 설정
      </h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터의 태그와 연령 등급을 조회·수정할 수 있습니다.
      </p>

      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="max-w-[520px] flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 · 제작자 · 태그로 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
            />
          </div>
        </form>
        <div className="ml-auto flex gap-2">
          {SAFETY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() =>
                navigate(
                  `/admin/characters/settings?search=${searchInput}&filter=${f.value}`
                )
              }
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentFilter === f.value
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
        <div className="flex items-center justify-between border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">리스트</h2>
          <button
            type="button"
            className="text-[#717680] hover:text-[#181D27]"
          >
            <MoreVertical className="size-5" />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                캐릭터명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                작품명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                태그 수정
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                세이프티 설정
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                만든 일자 ↓
              </th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chars.map((char: any) => {
              const sf = getSafety(char);
              return (
                <tr
                  key={char.character_id}
                  className="border-b border-[#E9EAEB] last:border-0"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={char.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {char.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-[#181D27]">
                        {char.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.tagline || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {tagsDisplay(char)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${sf.color}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${sf.dot}`}
                      />{" "}
                      {sf.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.created_at
                      ? new Date(char.created_at).toLocaleDateString("ko-KR")
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/characters/settings?search=${searchInput}&filter=${currentFilter}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
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
                  `/admin/characters/settings?search=${searchInput}&filter=${currentFilter}&offset=${pagination.offset + pagination.limit}`
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
