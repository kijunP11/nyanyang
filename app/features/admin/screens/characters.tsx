/**
 * Admin 캐릭터 목록 / 검색 — Figma 테이블 리디자인
 */
import type { Route } from "./+types/characters";

import { Pencil, Search, Trash2 } from "lucide-react";
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

const STATUS_FILTERS = [
  { label: "전체", value: "" },
  { label: "공개", value: "public", dotColor: "bg-green-500" },
  { label: "비공개", value: "private", dotColor: "bg-gray-400" },
  { label: "숨김", value: "hidden", dotColor: "bg-orange-500" },
  { label: "블라인드", value: "blind", dotColor: "bg-red-500" },
] as const;

function getDisplayStatus(char: any): {
  label: string;
  color: string;
  dot: string;
} {
  if (char.status === "rejected")
    return { label: "블라인드", color: "text-red-600", dot: "bg-red-500" };
  if (char.status === "archived")
    return { label: "숨김", color: "text-orange-600", dot: "bg-orange-500" };
  if (char.status === "approved" && char.is_public)
    return { label: "공개", color: "text-green-600", dot: "bg-green-500" };
  return { label: "비공개", color: "text-gray-500", dot: "bg-gray-400" };
}

export default function AdminCharacters() {
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
      `/admin/characters?search=${encodeURIComponent(searchInput)}&filter=${currentFilter}`
    );
  };

  const currentPage =
    Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">
        캐릭터 목록 / 검색
      </h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터를 조회하고 공개 상태 및 제재 여부를 관리할 수 있습니다.
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
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() =>
                navigate(
                  `/admin/characters?search=${searchInput}&filter=${f.value}`
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
                캐릭터 이름
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                제작자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                태그
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
                신고 여부
              </th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chars.map((char: any) => {
              const ds = getDisplayStatus(char);
              const tagsArray = Array.isArray(char.tags)
                ? char.tags
                : typeof char.tags === "string"
                  ? (() => {
                      try {
                        return JSON.parse(char.tags);
                      } catch {
                        return [];
                      }
                    })()
                  : [];
              return (
                <tr
                  key={char.character_id}
                  className="border-b border-[#E9EAEB] last:border-0"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-[#D5D7DA]"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-[#181D27]">
                    {char.display_name}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={char.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {char.creator?.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">
                          {char.creator?.display_name}
                        </p>
                        <p className="text-xs text-[#535862]">
                          {(char.creator as any)?.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {tagsArray.length
                      ? tagsArray.map((t: string) => `#${t}`).join(" ")
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${ds.color}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${ds.dot}`}
                      />
                      {ds.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">없음</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Pencil className="size-4" />
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
            {currentPage}/{totalPages} 페이지
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/characters?search=${searchInput}&filter=${currentFilter}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
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
                  `/admin/characters?search=${searchInput}&filter=${currentFilter}&offset=${pagination.offset + pagination.limit}`
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
