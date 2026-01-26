/**
 * Admin Characters Management Screen
 *
 * Character moderation with approve, reject, and delete functionality.
 */

import type { Route } from "./+types/characters";

import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { useState } from "react";

import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Loader: Fetch characters from API
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Get search params
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "pending";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  // Fetch characters from API
  const charactersResponse = await fetch(
    `/api/admin/characters?search=${encodeURIComponent(search)}&status=${status}&offset=${offset}&limit=${limit}`,
    {
      headers: Object.fromEntries(request.headers.entries()),
    }
  );

  if (!charactersResponse.ok) {
    throw new Response("Failed to load characters", { status: 500 });
  }

  const charactersData = await charactersResponse.json();

  return {
    characters: charactersData.characters,
    pagination: charactersData.pagination,
    currentStatus: charactersData.status,
    headers,
  };
}

/**
 * Admin Characters Management Component
 */
export default function AdminCharacters() {
  const { characters, pagination, currentStatus } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/characters?search=${encodeURIComponent(searchInput)}&status=${currentStatus}`);
  };

  const handleStatusChange = (newStatus: string) => {
    navigate(`/admin/characters?status=${newStatus}`);
  };

  const handleApprove = async (characterId: number, displayName: string) => {
    const note = prompt(`${displayName} 캐릭터를 승인합니다. 메모 (선택사항):`);

    if (!confirm(`${displayName} 캐릭터를 승인하시겠습니까?`)) return;

    try {
      const response = await fetch("/api/admin/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId, moderation_note: note || undefined }),
      });

      if (response.ok) {
        alert("캐릭터가 승인되었습니다.");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (err) {
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (characterId: number, displayName: string) => {
    const note = prompt(`${displayName} 캐릭터를 거부하는 이유를 입력하세요:`);
    if (!note) return;

    if (!confirm(`${displayName} 캐릭터를 거부하시겠습니까?`)) return;

    try {
      const response = await fetch("/api/admin/characters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId, moderation_note: note }),
      });

      if (response.ok) {
        alert("캐릭터가 거부되었습니다.");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (err) {
      alert("거부 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (characterId: number, displayName: string) => {
    const reason = prompt(`${displayName} 캐릭터를 삭제하는 이유를 입력하세요:`);
    if (!reason) return;

    if (!confirm(`${displayName} 캐릭터를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const response = await fetch("/api/admin/characters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId, reason }),
      });

      if (response.ok) {
        alert("캐릭터가 삭제되었습니다.");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (err) {
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">캐릭터 관리</h1>
          <p className="text-muted-foreground">
            캐릭터 검토, 승인/거부, 삭제 기능
          </p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => handleStatusChange("pending")}
            className={`px-4 py-2 font-medium transition-colors ${
              currentStatus === "pending"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            승인 대기
          </button>
          <button
            onClick={() => handleStatusChange("approved")}
            className={`px-4 py-2 font-medium transition-colors ${
              currentStatus === "approved"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            승인됨
          </button>
          <button
            onClick={() => handleStatusChange("rejected")}
            className={`px-4 py-2 font-medium transition-colors ${
              currentStatus === "rejected"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            거부됨
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 또는 설명으로 검색..."
              className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              검색
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
          <span>총 {pagination.total.toLocaleString()}개</span>
          <span>
            {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)}
          </span>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {characters.map((character: any) => (
            <div key={character.character_id} className="rounded-lg border bg-card overflow-hidden">
              {/* Character Image */}
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.display_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-primary/10 flex items-center justify-center">
                  <span className="text-6xl font-semibold">
                    {character.display_name[0]}
                  </span>
                </div>
              )}

              {/* Character Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{character.display_name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {character.description}
                </p>

                {/* Metadata */}
                <div className="flex gap-2 mb-3 text-xs flex-wrap">
                  {character.category && (
                    <span className="px-2 py-1 rounded-full bg-primary/10">
                      {character.category}
                    </span>
                  )}
                  {character.is_nsfw && (
                    <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-600">
                      NSFW
                    </span>
                  )}
                  {character.is_public ? (
                    <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                      공개
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-gray-500/10">
                      비공개
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>채팅: {character.chat_count}</span>
                  <span>메시지: {character.message_count}</span>
                  <span>좋아요: {character.like_count}</span>
                </div>

                {/* Creator */}
                <div className="text-xs text-muted-foreground mb-3">
                  제작자: {character.creator.display_name} ({character.creator.email})
                </div>

                {/* Moderation Note */}
                {character.moderation_note && (
                  <div className="text-xs p-2 rounded bg-accent mb-3">
                    메모: {character.moderation_note}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {currentStatus === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(character.character_id, character.display_name)}
                        className="flex-1 px-3 py-2 text-sm rounded-md bg-green-500 text-white hover:bg-green-600"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(character.character_id, character.display_name)}
                        className="flex-1 px-3 py-2 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600"
                      >
                        거부
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(character.character_id, character.display_name)}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {characters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">캐릭터가 없습니다.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center gap-2">
            {pagination.offset > 0 && (
              <button
                onClick={() =>
                  navigate(
                    `/admin/characters?search=${searchInput}&status=${currentStatus}&offset=${Math.max(0, pagination.offset - pagination.limit)}&limit=${pagination.limit}`
                  )
                }
                className="px-4 py-2 rounded-md border bg-card hover:bg-accent"
              >
                이전
              </button>
            )}
            {pagination.hasMore && (
              <button
                onClick={() =>
                  navigate(
                    `/admin/characters?search=${searchInput}&status=${currentStatus}&offset=${pagination.offset + pagination.limit}&limit=${pagination.limit}`
                  )
                }
                className="px-4 py-2 rounded-md border bg-card hover:bg-accent"
              >
                다음
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
