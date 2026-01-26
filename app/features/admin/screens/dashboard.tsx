/**
 * Admin Dashboard Screen
 *
 * Main dashboard showing platform statistics and metrics.
 */

import type { Route } from "./+types/dashboard";

import { useLoaderData, Link } from "react-router";
import { useEffect } from "react";

import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Loader: Fetch statistics from API
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

  // Fetch stats from API
  const statsResponse = await fetch(
    new URL("/api/admin/stats", request.url).toString(),
    {
      headers: Object.fromEntries(request.headers.entries()),
    }
  );

  if (!statsResponse.ok) {
    throw new Response("Failed to load statistics", { status: 500 });
  }

  const statsData = await statsResponse.json();

  return { stats: statsData, headers };
}

/**
 * Admin Dashboard Component
 */
export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">
            플랫폼 통계 및 관리 기능에 접근할 수 있습니다.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/admin/users"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-2">유저 관리</h3>
            <p className="text-sm text-muted-foreground">
              사용자 목록, 검색, 정지/탈퇴 관리
            </p>
          </Link>
          <Link
            to="/admin/characters"
            className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-2">캐릭터 관리</h3>
            <p className="text-sm text-muted-foreground">
              승인 대기 목록, 승인/거부, 삭제
            </p>
          </Link>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">결제 조회</h3>
            <p className="text-sm text-muted-foreground">
              거래 내역 및 통계 (구현 예정)
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* User Stats */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              총 사용자
            </h3>
            <p className="text-3xl font-bold">
              {stats.stats.users.total_users.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              오늘: +{stats.stats.users.new_users_today} | 이번 주: +
              {stats.stats.users.new_users_this_week}
            </p>
          </div>

          {/* Character Stats */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              총 캐릭터
            </h3>
            <p className="text-3xl font-bold">
              {stats.stats.characters.total_characters.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              승인 대기: {stats.stats.characters.pending_characters} | 승인됨:{" "}
              {stats.stats.characters.approved_characters}
            </p>
          </div>

          {/* Chat Stats */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              채팅방
            </h3>
            <p className="text-3xl font-bold">
              {stats.stats.chats.total_chat_rooms.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              오늘 활성: {stats.stats.chats.active_chat_rooms_today}
            </p>
          </div>

          {/* Message Stats */}
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              총 메시지
            </h3>
            <p className="text-3xl font-bold">
              {stats.stats.messages.total_messages.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              오늘: {stats.stats.messages.messages_today.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Point Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">포인트 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                총 거래
              </h3>
              <p className="text-2xl font-bold">
                {stats.stats.points.total_transactions.toLocaleString()}
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                획득 포인트
              </h3>
              <p className="text-2xl font-bold text-green-600">
                +{stats.stats.points.total_points_earned.toLocaleString()}P
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                사용 포인트
              </h3>
              <p className="text-2xl font-bold text-red-600">
                -{stats.stats.points.total_points_spent.toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        {/* Top Characters */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">인기 캐릭터 (채팅방 수)</h2>
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">순위</th>
                    <th className="text-left p-4">캐릭터</th>
                    <th className="text-right p-4">채팅방 수</th>
                    <th className="text-right p-4">메시지 수</th>
                    <th className="text-right p-4">좋아요</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCharacters.byChats.slice(0, 5).map((char: any, idx: number) => (
                    <tr key={char.character_id} className="border-b last:border-0">
                      <td className="p-4">#{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {char.avatar_url ? (
                            <img
                              src={char.avatar_url}
                              alt={char.display_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold">
                                {char.display_name[0]}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">{char.display_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {char.chat_count.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {char.message_count.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {char.like_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold mb-4">최근 활동 (30일)</h2>
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 7).map((activity: any) => (
                <div
                  key={activity.date}
                  className="flex justify-between items-center p-3 rounded bg-accent/50"
                >
                  <span className="font-medium">{activity.date}</span>
                  <div className="flex gap-6 text-sm">
                    <span className="text-muted-foreground">
                      메시지: {activity.message_count.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      활성 사용자: {activity.user_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
