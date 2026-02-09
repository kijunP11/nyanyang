/**
 * Character List Screen
 *
 * Displays all available characters with search, filter, and sort options.
 */

// @ts-expect-error - Route types generated when registered in routes.ts
import type { Route } from "./+types/list";

import { Link, useLoaderData, useSearchParams } from "react-router";
import { useState } from "react";

/**
 * Loader function for fetching characters
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);

  // Fetch characters from API
  const apiUrl = new URL("/api/characters/list", url.origin);
  Object.entries(searchParams).forEach(([key, value]) => {
    apiUrl.searchParams.set(key, value);
  });

  const response = await fetch(apiUrl.toString(), {
    headers: request.headers,
  });

  if (!response.ok) {
    throw new Response("Failed to fetch characters", { status: response.status });
  }

  const data = await response.json();
  return data;
}

/**
 * Character List Screen Component
 */
export default function CharacterListScreen() {
  const { characters, pagination } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    params.delete("offset"); // Reset to first page
    setSearchParams(params);
  };

  // Handle filter/sort change
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("offset"); // Reset to first page
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">캐릭터 탐색</h1>
          <p className="text-[#9ca3af] mt-2">
            AI 캐릭터와 대화를 시작해보세요
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 또는 태그 검색..."
              className="flex-1 rounded-md border border-[#3f3f46] bg-[#232323] px-4 py-2 text-sm text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#14b8a6] px-6 py-2 text-sm font-medium text-white hover:bg-[#0d9488]"
            >
              검색
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <select
              value={searchParams.get("category") || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="rounded-md border border-[#3f3f46] bg-[#232323] px-3 py-2 text-sm text-white focus:border-[#14b8a6] focus:outline-none"
            >
              <option value="">모든 카테고리</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>

            {/* Age Rating Filter */}
            <select
              value={searchParams.get("age_rating") || ""}
              onChange={(e) => handleFilterChange("age_rating", e.target.value)}
              className="rounded-md border border-[#3f3f46] bg-[#232323] px-3 py-2 text-sm text-white focus:border-[#14b8a6] focus:outline-none"
            >
              <option value="">모든 연령</option>
              <option value="general">전체이용가</option>
              <option value="teen">청소년</option>
              <option value="mature">성인</option>
            </select>

            {/* Sort */}
            <select
              value={searchParams.get("sort") || "popularity"}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="rounded-md border border-[#3f3f46] bg-[#232323] px-3 py-2 text-sm text-white focus:border-[#14b8a6] focus:outline-none"
            >
              <option value="popularity">인기순</option>
              <option value="recent">최신순</option>
            </select>
          </div>
        </div>

        {/* Character Grid */}
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9ca3af]">
              검색 결과가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((char: any) => (
              <Link
                key={char.character_id}
                to={`/characters/${char.character_id}`}
                className="block rounded-lg border border-[#3f3f46] bg-[#232323] overflow-hidden hover:border-[#14b8a6] transition-colors"
              >
                {/* Character Image */}
                {char.avatar_url ? (
                  <img
                    src={char.avatar_url}
                    alt={char.display_name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-[#14b8a6]/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-[#9ca3af]">
                      {char.display_name[0]}
                    </span>
                  </div>
                )}

                {/* Character Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-white mb-1 truncate">
                    {char.display_name}
                  </h3>
                  <p className="text-sm text-[#9ca3af] line-clamp-2 mb-3">
                    {char.description}
                  </p>

                  {/* Tags */}
                  {char.tags && char.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {char.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs rounded-md bg-[#14b8a6]/10 text-[#14b8a6]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>❤️ {char.like_count || 0}</span>
                    <span>💬 {char.chat_count || 0}</span>
                    <span>👁️ {char.view_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("offset", String(pagination.offset + pagination.limit));
                setSearchParams(params);
              }}
              className="rounded-md bg-[#14b8a6] px-6 py-2 text-sm font-medium text-white hover:bg-[#0d9488]"
            >
              더보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
