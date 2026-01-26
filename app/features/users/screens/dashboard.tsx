import type { Route } from "./+types/dashboard";

import { and, eq, sql } from "drizzle-orm";
import { Bot, Calendar, Coins, MessageSquare } from "lucide-react";
import { Link, useLoaderData } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { chatRooms } from "../../chat/schema";
import { userPoints } from "../../points/schema";

export const meta: Route.MetaFunction = () => {
  return [{ title: `대시보드 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const db = drizzle;

  // Fetch all data in parallel
  const [pointsData, roomsData, charactersData] = await Promise.all([
    // Points balance
    db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1)
      .then(([result]) => {
        if (!result) {
          // Create default point record
          return db
            .insert(userPoints)
            .values({
              user_id: user.id,
              current_balance: 0,
              total_earned: 0,
              total_spent: 0,
            })
            .returning()
            .then(([newRecord]) => newRecord);
        }
        return result;
      })
      .catch(() => ({
        current_balance: 0,
        total_earned: 0,
        total_spent: 0,
      })),
    // Rooms count
    db
      .select({ count: sql<number>`count(*)` })
      .from(chatRooms)
      .where(eq(chatRooms.user_id, user.id))
      .then(([result]) => Number(result?.count || 0))
      .catch(() => 0),
    // Characters count (public and approved)
    db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(
        and(eq(characters.is_public, true), eq(characters.status, "approved")),
      )
      .then(([result]) => Number(result?.count || 0))
      .catch(() => 0),
  ]);

  return {
    points: {
      current_balance: pointsData.current_balance || 0,
      total_earned: pointsData.total_earned || 0,
      total_spent: pointsData.total_spent || 0,
    },
    roomsCount: roomsData,
    charactersCount: charactersData,
  };
}

export default function Dashboard() {
  const { points, roomsCount, charactersCount } =
    useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-2">
          NYANYANG에 오신 것을 환영합니다!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 포인트 잔액 */}
        <Link
          to="/points"
          className="bg-card text-card-foreground hover:bg-accent rounded-lg border p-6 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                포인트 잔액
              </p>
              <p className="mt-1 text-2xl font-bold">
                {points.current_balance.toLocaleString()}P
              </p>
            </div>
            <Coins className="h-8 w-8 text-[#41C7BD]" />
          </div>
        </Link>

        {/* 채팅방 개수 */}
        <Link
          to="/rooms"
          className="bg-card text-card-foreground hover:bg-accent rounded-lg border p-6 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                내 채팅방
              </p>
              <p className="mt-1 text-2xl font-bold">{roomsCount}개</p>
            </div>
            <MessageSquare className="h-8 w-8 text-[#41C7BD]" />
          </div>
        </Link>

        {/* 캐릭터 개수 */}
        <Link
          to="/characters"
          className="bg-card text-card-foreground hover:bg-accent rounded-lg border p-6 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                전체 캐릭터
              </p>
              <p className="mt-1 text-2xl font-bold">{charactersCount}개</p>
            </div>
            <Bot className="h-8 w-8 text-[#41C7BD]" />
          </div>
        </Link>

        {/* 출석체크 */}
        <Link
          to="/attendance"
          className="bg-card text-card-foreground hover:bg-accent rounded-lg border p-6 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                출석체크
              </p>
              <p className="mt-1 text-2xl font-bold">체크인</p>
            </div>
            <Calendar className="h-8 w-8 text-[#41C7BD]" />
          </div>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 빠른 액션 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">빠른 액션</h2>
          <div className="flex flex-col gap-2">
            <Link
              to="/characters"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              → 캐릭터 탐색하기
            </Link>
            <Link
              to="/characters/create"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              → 캐릭터 만들기
            </Link>
            <Link
              to="/points"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              → 포인트 충전하기
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">통계</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">총 획득 포인트</span>
              <span className="font-medium">
                {points.total_earned.toLocaleString()}P
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">총 사용 포인트</span>
              <span className="font-medium">
                {points.total_spent.toLocaleString()}P
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
