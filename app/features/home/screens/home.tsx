/**
 * Home Page Component
 *
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 *
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 * - Story grid sections with cards
 */
import type { Route } from "./+types/home";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useFetcher } from "react-router";
import { data } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent } from "~/core/components/ui/card";
import { Dialog, DialogContent } from "~/core/components/ui/dialog";
import i18next from "~/core/lib/i18next.server";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "~/database.types";
import { CharacterCard } from "~/features/characters/components/character-card";
import { AttendanceCheck } from "~/features/home/components/attendance-check";
import {
  NoticeBanner,
  type NoticeData,
} from "~/features/home/components/notice-banner";

type Character = Database["public"]["Tables"]["characters"]["Row"];
type ChatRoom = Database["public"]["Tables"]["chat_rooms"]["Row"];
type ChatRoomWithCharacter = ChatRoom & { characters: Character | null };
type AttendanceRecord =
  Database["public"]["Tables"]["attendance_records"]["Row"];

interface LoaderData {
  title: string;
  subtitle: string;
  myCharacters: Character[];
  recentChats: ChatRoomWithCharacter[];
  popularCharacters: Character[];
  attendanceRecord: AttendanceRecord | null;
  consecutiveDays: number;
  notices: NoticeData[];
  isLoggedIn: boolean;
}

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 */
export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request);
  const [client] = makeServerClient(request);

  // 기본값 설정
  const defaultData: LoaderData = {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
    myCharacters: [],
    recentChats: [],
    popularCharacters: [],
    attendanceRecord: null,
    consecutiveDays: 0,
    notices: [],
    isLoggedIn: false,
  };

  try {
    // 로그인 유저 확인
    const {
      data: { user },
    } = await client.auth.getUser();

    // 오늘 날짜 계산
    const today = new Date().toISOString().split("T")[0];

    // 병렬 쿼리 실행
    const [
      myCharactersResult,
      recentChatsResult,
      popularCharactersResult,
      attendanceResult,
    ] = await Promise.all([
      // 1. 내 캐릭터 (로그인한 경우만)
      user
        ? client
            .from("characters")
            .select("*")
            .eq("creator_id", user.id)
            .order("created_at", { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [] }),

      // 2. 최근 대화 (로그인한 경우만)
      user
        ? client
            .from("chat_rooms")
            .select("*, characters(*)")
            .eq("user_id", user.id)
            .order("last_message_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // 3. 인기 캐릭터 (누구나)
      client
        .from("characters")
        .select("*")
        .eq("is_public", true)
        .eq("status", "approved")
        .order("like_count", { ascending: false })
        .limit(8),

      // 4. 오늘 출석 기록 (로그인한 경우만)
      user
        ? client
            .from("attendance_records")
            .select("*")
            .eq("user_id", user.id)
            .eq("attendance_date", today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // 연속 출석일 계산
    const attendanceRecord = attendanceResult.data as AttendanceRecord | null;
    const consecutiveDays = attendanceRecord?.consecutive_days || 0;

    // 공지사항 Mock 데이터 (추후 DB 연동 시 수정)
    const notices: NoticeData[] = [
      {
        id: "1",
        type: "event",
        title: "신규 캐릭터 이벤트",
        content: "새로운 캐릭터를 만들고 보상을 받아보세요!",
        date: "2024-01-15",
        link: "/characters/create",
      },
    ];

    return {
      ...defaultData,
      myCharacters: (myCharactersResult.data as Character[]) || [],
      recentChats: (recentChatsResult.data as ChatRoomWithCharacter[]) || [],
      popularCharacters: (popularCharactersResult.data as Character[]) || [],
      attendanceRecord,
      consecutiveDays,
      notices,
      isLoggedIn: !!user,
    };
  } catch (error) {
    console.error("Home loader error:", error);
    // 에러 발생 시에도 페이지가 깨지지 않도록 기본값 반환
    return defaultData;
  }
}

/**
 * Action function for handling attendance check
 */
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. 중복 체크
    const { data: existing } = await client
      .from("attendance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle();

    if (existing) {
      return data({ error: "Already checked today" }, { status: 400 });
    }

    // 2. 연속일 계산
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const { data: yesterdayRecord } = await client
      .from("attendance_records")
      .select("consecutive_days")
      .eq("user_id", user.id)
      .eq("attendance_date", yesterday)
      .maybeSingle();

    const consecutiveDays = yesterdayRecord
      ? yesterdayRecord.consecutive_days + 1
      : 1;
    const pointsToAward = 100;

    // 3. 현재 포인트 조회
    const { data: userPoints } = await client
      .from("user_points")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // 4. 출석 기록 저장
    await client.from("attendance_records").insert({
      user_id: user.id,
      attendance_date: today,
      consecutive_days: consecutiveDays,
      points_awarded: pointsToAward,
    });

    // 5. 포인트 업데이트 (onConflict 옵션 추가)
    await client.from("user_points").upsert(
      {
        user_id: user.id,
        current_balance: (userPoints?.current_balance || 0) + pointsToAward,
        total_earned: (userPoints?.total_earned || 0) + pointsToAward,
      },
      { onConflict: "user_id" },
    );

    return data({
      success: true,
      consecutiveDays,
      pointsAwarded: pointsToAward,
    });
  } catch (error) {
    console.error("Attendance check error:", error);
    return data({ error: "Failed to check attendance" }, { status: 500 });
  }
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const {
    myCharacters,
    recentChats,
    popularCharacters,
    attendanceRecord,
    consecutiveDays: loaderConsecutiveDays,
    notices,
    isLoggedIn,
  } = loaderData;

  // Action 결과가 있으면 연속일 업데이트
  const consecutiveDays =
    actionData &&
    "success" in actionData &&
    actionData.success &&
    actionData.consecutiveDays
      ? actionData.consecutiveDays
      : loaderConsecutiveDays;

  const isCheckedIn =
    !!attendanceRecord ||
    (actionData && "success" in actionData && actionData.success === true);

  // 출석체크 팝업 상태 관리
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  // 로그인했고 오늘 출석 안 했으면 자동으로 팝업 열기 (LocalStorage + 날짜 기반)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const hasClosedToday = localStorage.getItem(`attendance-closed-${today}`);

    if (isLoggedIn && !isCheckedIn && !hasClosedToday) {
      setIsAttendanceDialogOpen(true);
    }
  }, [isLoggedIn, isCheckedIn]);

  // 출석 완료 후 1.5초 딜레이로 팝업 닫기
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      const timer = setTimeout(() => {
        setIsAttendanceDialogOpen(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const handleCheckIn = () => {
    fetcher.submit({}, { method: "POST" });
  };

  // Dialog 닫기 핸들러 (LocalStorage에 저장)
  const handleDialogChange = (open: boolean) => {
    setIsAttendanceDialogOpen(open);
    if (!open && !isCheckedIn) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(`attendance-closed-${today}`, "true");
    }
  };

  return (
    <div className="container mx-auto flex flex-col gap-12 py-8">
      {/* Hero Section */}
      <section className="from-primary/5 flex flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-b to-transparent py-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
          {t("home.title")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          {t("home.subtitle")}
        </p>
        <div className="flex gap-4">
          <Link to="/characters">
            <Button size="lg">캐릭터 둘러보기</Button>
          </Link>
          <Link to="/characters/create">
            <Button variant="outline" size="lg">
              캐릭터 만들기
            </Button>
          </Link>
        </div>
      </section>

      {/* Widget Section: Notices */}
      {notices.length > 0 && (
        <section>
          <NoticeBanner notices={notices} />
        </section>
      )}

      {/* 출석체크 팝업 */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <AttendanceCheck
            dailyReward={100}
            cumulativeDays={consecutiveDays}
            cumulativeReward={consecutiveDays >= 7 ? 500 : 0}
            checkedIn={isCheckedIn}
            onCheckIn={handleCheckIn}
          />
        </DialogContent>
      </Dialog>

      {/* My Characters Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">내 캐릭터</h2>
          <Link
            to="/characters"
            className="text-muted-foreground cursor-pointer text-sm hover:underline"
          >
            전체보기
          </Link>
        </div>

        {myCharacters.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {myCharacters.map((character) => (
              <CharacterCard
                key={character.character_id}
                character={character}
              />
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border-muted rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground mb-4">
              아직 만든 캐릭터가 없어요
            </p>
            <Link to="/characters/create">
              <Button variant="outline">첫 캐릭터 만들기</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Recent Chats Section */}
      {recentChats.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">최근 대화</h2>
          </div>
          <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
            {recentChats.map((room) => (
              <Link
                key={room.room_id}
                to={`/chat/${room.character_id}`}
                className="w-72 flex-shrink-0"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-4">
                    {/* Avatar */}
                    <div className="bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                      {room.characters?.avatar_url ? (
                        <img
                          src={room.characters.avatar_url}
                          alt={room.characters.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          🎭
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        {room.characters?.name || "알 수 없는 캐릭터"}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {room.last_message || "대화 내용 없음"}
                      </p>
                      <span className="text-muted-foreground mt-2 block text-xs">
                        {room.last_message_at
                          ? new Date(room.last_message_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Characters Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">인기 캐릭터</h2>
          <Link
            to="/characters?sort=popular"
            className="text-muted-foreground cursor-pointer text-sm hover:underline"
          >
            전체보기
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {popularCharacters.map((character) => (
            <CharacterCard key={character.character_id} character={character} />
          ))}
        </div>
      </section>
    </div>
  );
}
