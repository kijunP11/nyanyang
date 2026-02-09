/**
 * Home Page Component
 *
 * 메인 홈 페이지 - Figma V2 디자인 (세로형 카드 + 가로 스크롤)
 */
import type { Route } from "./+types/home";

import { Link, data } from "react-router";

import i18next from "~/core/lib/i18next.server";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "database.types";

import { HeroCarousel, type HeroSlide } from "../components/hero-carousel";
import type { NoticeData } from "../components/notice-banner";
import { ScrollSection } from "../components/scroll-section";
import { VerticalCharacterCard } from "../components/vertical-character-card";

type Character = Database["public"]["Tables"]["characters"]["Row"];
type AttendanceRecord =
  Database["public"]["Tables"]["attendance_records"]["Row"];

type CharacterWithCreator = Character & { creator_name: string | null };

interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
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
  const [client, headers] = makeServerClient(request);

  // 기본값 설정
  const defaultData: LoaderData = {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
    featuredCharacters: [],
    popularCharacters: [],
    newestCharacters: [],
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
      featuredResult,
      popularResult,
      newestResult,
      attendanceResult,
    ] = await Promise.all([
      // 1. 추천 캐릭터 (좋아요 순)
      client
        .from("characters")
        .select("*")
        .eq("is_public", true)
        .eq("status", "approved")
        .order("like_count", { ascending: false })
        .limit(10),

      // 2. 실시간 인기 (조회수 순)
      client
        .from("characters")
        .select("*")
        .eq("is_public", true)
        .eq("status", "approved")
        .order("view_count", { ascending: false })
        .limit(10),

      // 3. 크리에이터 신작 (최신순)
      client
        .from("characters")
        .select("*")
        .eq("is_public", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10),

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

    // 모든 캐릭터의 creator_id 추출
    const allCharacters = [
      ...(featuredResult.data || []),
      ...(popularResult.data || []),
      ...(newestResult.data || []),
    ];
    const creatorIds = [...new Set(allCharacters.map((c) => c.creator_id))];

    // profiles 일괄 조회
    const { data: profiles } = creatorIds.length > 0
      ? await client
          .from("profiles")
          .select("profile_id, name")
          .in("profile_id", creatorIds)
      : { data: [] };

    // creator_id → name 매핑
    const profileMap = new Map(
      (profiles || []).map((p) => [p.profile_id, p.name])
    );

    // creator_name 추가
    const addCreatorName = (chars: Character[]): CharacterWithCreator[] =>
      chars.map((c) => ({
        ...c,
        creator_name: profileMap.get(c.creator_id) || null,
      }));

    // 연속 출석일 계산
    const attendanceRecord = attendanceResult.data as AttendanceRecord | null;
    const consecutiveDays = attendanceRecord?.consecutive_days || 0;

    // 공지사항 Mock 데이터
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

    return data(
      {
        ...defaultData,
        featuredCharacters: addCreatorName(featuredResult.data || []),
        popularCharacters: addCreatorName(popularResult.data || []),
        newestCharacters: addCreatorName(newestResult.data || []),
        attendanceRecord,
        consecutiveDays,
        notices,
        isLoggedIn: !!user,
      },
      { headers }
    );
  } catch (error) {
    console.error("Home loader error:", error);
    return data(defaultData, { headers });
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    featuredCharacters,
    popularCharacters,
    newestCharacters,
    attendanceRecord,
    consecutiveDays,
    notices,
    isLoggedIn,
  } = loaderData;

  const isCheckedIn = !!attendanceRecord;

  // 히어로 슬라이드 데이터
  const heroSlides: HeroSlide[] = [
    {
      image: "/nft.jpg",
      title: "나만의 AI 캐릭터와 대화하세요",
      description: "다양한 캐릭터들이 기다리고 있어요",
      badge: "이벤트",
      link: "/characters",
    },
    {
      image: "/nft-2.jpg",
      title: "캐릭터를 직접 만들어보세요",
      description: "나만의 특별한 캐릭터를 창작해보세요",
      link: "/characters/create",
    },
    {
      image: "/blog/hello-world.jpg",
      title: "매일 출석하고 포인트 받기",
      description: "꾸준히 방문하면 더 많은 혜택이!",
      link: "/attendance",
    },
  ];

  return (
    <div className="min-h-screen bg-[#111111]">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* 1. 히어로 캐러셀 */}
        <HeroCarousel slides={heroSlides} />

        {/* 2. 공지 배너 */}
        {notices.length > 0 && (
          <section className="flex items-center gap-3 rounded-lg bg-[#232323] px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#14b8a6]/20">
              <span className="text-lg">📢</span>
            </div>
            <p className="flex-1 truncate text-sm text-white">
              {notices[0].title}: {notices[0].content}
            </p>
            {notices[0].link && (
              <Link
                to={notices[0].link}
                className="flex-shrink-0 text-sm text-[#14b8a6] hover:underline"
              >
                자세히 →
              </Link>
            )}
          </section>
        )}

        {/* 3. 출석체크 배너 */}
        {isLoggedIn && (
          <Link
            to="/attendance"
            className={`flex items-center justify-between rounded-xl px-6 py-5 transition-transform hover:scale-[1.01] ${
              isCheckedIn
                ? "border border-[#14b8a6]/30 bg-[#14b8a6]/10"
                : "bg-gradient-to-r from-[#14b8a6] to-[#0d9488]"
            }`}
          >
            <div>
              <p
                className={`text-lg font-bold ${isCheckedIn ? "text-[#14b8a6]" : "text-white"}`}
              >
                {isCheckedIn
                  ? "오늘 출석 완료! 내일도 방문해주세요"
                  : "매일매일 출석체크"}
              </p>
              <p
                className={`text-sm ${isCheckedIn ? "text-[#9ca3af]" : "text-white/80"}`}
              >
                {isCheckedIn
                  ? `${consecutiveDays}일 연속 출석 중`
                  : "일일/누적보상 한번에 수령하세요!"}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 ${isCheckedIn ? "text-[#14b8a6]" : "text-white"}`}
            >
              <span className="text-2xl">{isCheckedIn ? "✅" : "🐱"}</span>
              <span className="text-lg font-bold">NYANYANG</span>
            </div>
          </Link>
        )}

        {/* 4. 검색 바 + 태그 필터 */}
        <section className="flex flex-col gap-4">
          {/* 검색 바 */}
          <div className="flex gap-2">
            <button className="flex h-11 items-center gap-1.5 rounded-lg border border-[#3f3f46] bg-[#232323] px-4 text-sm text-white hover:bg-[#2f3032]">
              <span>전체</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="캐릭터명, 태그로 검색"
                className="h-11 w-full rounded-lg border border-[#3f3f46] bg-[#232323] px-4 text-sm text-white placeholder:text-[#9ca3af] focus:border-[#14b8a6] focus:outline-none"
                readOnly
              />
            </div>
            <button className="h-11 rounded-lg bg-[#14b8a6] px-6 text-sm font-medium text-white hover:bg-[#0d9488]">
              검색
            </button>
          </div>
          {/* 태그 필터 */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {[
              "전체",
              "추천",
              "남성",
              "여성",
              "로맨스",
              "순애",
              "구원",
              "추리",
              "집착",
              "미래",
              "소꿉친구",
              "가족",
              "유명인",
              "판타지",
            ].map((tag, index) => (
              <button
                key={tag}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  index === 0
                    ? "bg-[#14b8a6] text-white"
                    : "bg-[#232323] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
            <button className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#3f3f46] px-4 py-2 text-sm font-medium text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white">
              <span>#</span>
              <span>태그 더보기</span>
            </button>
          </div>
        </section>

        {/* 5. 추천 캐릭터 섹션 */}
        {featuredCharacters.length > 0 && (
          <ScrollSection title="추천 캐릭터" moreLink="/characters?sort=popular">
            {featuredCharacters.map((character) => (
              <VerticalCharacterCard
                key={character.character_id}
                character={character}
                creatorName={character.creator_name}
              />
            ))}
          </ScrollSection>
        )}

        {/* 6. 실시간 인기 섹션 */}
        {popularCharacters.length > 0 && (
          <ScrollSection title="🔥 실시간 인기" moreLink="/characters?sort=popular">
            {popularCharacters.map((character) => (
              <VerticalCharacterCard
                key={character.character_id}
                character={character}
                creatorName={character.creator_name}
              />
            ))}
          </ScrollSection>
        )}

        {/* 7. 크리에이터 신작 섹션 */}
        {newestCharacters.length > 0 && (
          <ScrollSection
            title="크리에이터 신작!"
            moreLink="/characters?sort=newest"
          >
            {newestCharacters.map((character) => (
              <VerticalCharacterCard
                key={character.character_id}
                character={character}
                creatorName={character.creator_name}
              />
            ))}
          </ScrollSection>
        )}
      </div>
    </div>
  );
}
