/**
 * Admin Users Management Screen
 *
 * User list with search, suspend, and delete functionality.
 */

import type { Route } from "./+types/users";

import { useLoaderData, useNavigate, useSearchParams, Form } from "react-router";
import { useState } from "react";

import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Loader: Fetch users from API
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
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  // Fetch users from API
  const usersResponse = await fetch(
    `/api/admin/users?search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
    {
      headers: Object.fromEntries(request.headers.entries()),
    }
  );

  if (!usersResponse.ok) {
    throw new Response("Failed to load users", { status: 500 });
  }

  const usersData = await usersResponse.json();

  return { users: usersData.users, pagination: usersData.pagination, headers };
}

/**
 * Admin Users Management Component
 */
export default function AdminUsers() {
  const { users, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/users?search=${encodeURIComponent(searchInput)}`);
  };

  const handleSuspend = async (userId: string, displayName: string) => {
    const reason = prompt(`${displayName} 사용자를 정지하는 이유를 입력하세요:`);
    if (!reason) return;

    if (!confirm(`${displayName} 사용자를 정지하시겠습니까?`)) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reason }),
      });

      if (response.ok) {
        alert("사용자가 정지되었습니다.");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (err) {
      alert("정지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (userId: string, displayName: string) => {
    const reason = prompt(`${displayName} 사용자를 삭제하는 이유를 입력하세요:`);
    if (!reason) return;

    if (!confirm(`${displayName} 사용자를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reason }),
      });

      if (response.ok) {
        alert("사용자가 삭제되었습니다.");
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
          <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
          <p className="text-muted-foreground">
            사용자 목록 조회, 검색, 정지 및 삭제 기능
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
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
          <span>총 {pagination.total.toLocaleString()}명</span>
          <span>
            {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)}
          </span>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-card mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">사용자</th>
                  <th className="text-left p-4">이메일</th>
                  <th className="text-right p-4">포인트</th>
                  <th className="text-right p-4">획득</th>
                  <th className="text-right p-4">사용</th>
                  <th className="text-center p-4">가입일</th>
                  <th className="text-center p-4">작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.user_id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold">
                              {user.display_name?.[0] || "?"}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">{user.display_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {user.points?.current_balance?.toLocaleString() || 0}P
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {user.points?.total_earned?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {user.points?.total_spent?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 text-center text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleSuspend(user.user_id, user.display_name)}
                          className="px-3 py-1 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600"
                        >
                          정지
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id, user.display_name)}
                          className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center gap-2">
            {pagination.offset > 0 && (
              <button
                onClick={() =>
                  navigate(
                    `/admin/users?search=${searchInput}&offset=${Math.max(0, pagination.offset - pagination.limit)}&limit=${pagination.limit}`
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
                    `/admin/users?search=${searchInput}&offset=${pagination.offset + pagination.limit}&limit=${pagination.limit}`
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
