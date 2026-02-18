/**
 * Home Page Component
 *
 * 메인 홈 페이지 - Figma V2 디자인 (세로형 카드 + 가로 스크롤)
 */
import type { Route } from "./+types/home";

import { useState } from "react";
import { Search } from "lucide-react";
import { data, Link } from "react-router";

import { ChatSidebar, type ChatSidebarUser } from "~/core/components/chat-sidebar";
import i18next from "~/core/lib/i18next.server";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "database.types";

import { HeroCarousel, type HeroSlide } from "../components/hero-carousel";
import { ScrollSection } from "../components/scroll-section";
import { VerticalCharacterCard } from "../components/vertical-character-card";
import { CharacterInfoModal } from "~/features/characters/components/character-info-modal";

type Character = Database["public"]["Tables"]["characters"]["Row"];

type CharacterWithCreator = Character & {
  creator_name: string | null;
  creator_badge_type: string | null;
};

interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
  isLoggedIn: boolean;
  user: ChatSidebarUser | null;
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
    isLoggedIn: false,
    user: null,
  };

  try {
    // 로그인 유저 확인
    const {
      data: { user },
    } = await client.auth.getUser();

    // 병렬 쿼리 실행
    const [featuredResult, popularResult, newestResult] = await Promise.all([
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
          .select("profile_id, name, badge_type")
          .in("profile_id", creatorIds)
      : { data: [] };

    // creator_id → { name, badge_type } 매핑
    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.profile_id,
        { name: p.name, badge_type: p.badge_type },
      ])
    );

    // creator_name, creator_badge_type 추가
    const addCreatorName = (chars: Character[]): CharacterWithCreator[] =>
      chars.map((c) => {
        const profile = profileMap.get(c.creator_id);
        return {
          ...c,
          creator_name: profile?.name || null,
          creator_badge_type: profile?.badge_type || null,
        };
      });

    return data(
      {
        ...defaultData,
        featuredCharacters: addCreatorName(featuredResult.data || []),
        popularCharacters: addCreatorName(popularResult.data || []),
        newestCharacters: addCreatorName(newestResult.data || []),
        isLoggedIn: !!user,
        user: user
          ? {
              name:
                user.user_metadata?.nickname ||
                user.user_metadata?.name ||
                "Anonymous",
              email: user.email,
              avatarUrl: user.user_metadata?.avatar_url || null,
            }
          : null,
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
    isLoggedIn,
    user,
  } = loaderData;

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

  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null
  );

  const quickTags = [
    "전체",
    "추천",
    "남성",
    "여성",
    "로맨스",
    "순애",
    "구원",
    "추리",
    "집착",
    "소꿉친구",
    "유명인",
    "판타지",
    "일상",
  ];

  const allTags = [
    "전체",
    "추천",
    "남성",
    "여성",
    "로맨스",
    "순애",
    "구원",
    "후회",
    "집착",
    "피폐",
    "소꿉친구",
    "가족",
    "유명인",
    "츤데레",
    "얀데레",
    "판타지",
    "천사",
    "요정",
    "악마",
    "엘프",
    "빌런",
    "현대판타지",
    "동양판타지",
    "대체역사",
    "무협",
    "TS물",
    "BL",
    "페티쉬",
    "BDSM",
    "퍼리",
    "근육",
    "버튜버",
    "애니메이션",
    "뱀파이어",
    "밀리터리",
    "아포칼립스",
    "무인도",
    "SF",
    "로봇",
    "오피스",
    "자캐",
    "신화",
    "영화드라마",
    "괴물",
    "동물",
    "수인",
    "동화",
    "책",
    "메이드&집사",
    "수녀",
    "외계인",
    "이세계",
    "마법",
    "공포",
    "게임 캐릭터",
    "히어로",
    "히로인",
    "도미넌트",
    "서큐버스",
    "NTR",
    "NTL",
    "고어",
    "하렘",
    "조난",
    "재난",
    "일상",
    "청춘",
    "드라마",
    "학생",
    "힐링",
    "개그",
    "새드엔딩",
    "교육",
    "생산성",
    "게임",
    "스포츠",
    "시뮬",
    "추리",
    "던전",
    "감옥",
    "방탈출",
  ];

  const displayTags = tagsExpanded ? allTags : quickTags;

  return (
    <div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white dark:bg-[#181D27] md:-my-32">
      {/* 채팅 사이드바 (md 이상, 로그인/비로그인 모두) */}
      <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
        <ChatSidebar user={isLoggedIn ? user : null} chats={[]} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          {/* 1. 히어로 캐러셀 */}
          <HeroCarousel slides={heroSlides} />

          {/* 2. AI 추천 검색 */}
          <section>
            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-[#E9EAEB] bg-[#F5F5F5] px-4 dark:border-[#333741] dark:bg-[#1F242F]">
              <span className="flex-shrink-0 rounded-md bg-[#41C7BD] px-2 py-0.5 text-xs font-bold text-white">
                AI 추천 대화
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-[#535862] dark:text-[#94969C]">
                올해의 &apos;달콤살벌 매력&apos;에 빠져볼까? 지금 바로 시작하세요
              </p>
              <Search className="h-5 w-5 flex-shrink-0 text-[#A4A7AE] dark:text-[#717680]" />
            </div>
          </section>

          {/* 3. 태그 필터 */}
          <section>
            <div
              className={
                tagsExpanded
                  ? "flex flex-wrap gap-2"
                  : "scrollbar-hide flex gap-2 overflow-x-auto"
              }
            >
              {displayTags.map((tag, index) => (
                <button
                  key={`${tag}-${index}`}
                  type="button"
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    index === 0
                      ? "bg-[#41C7BD] text-white"
                      : "bg-[#F5F5F5] text-[#535862] hover:bg-[#E9EAEB] dark:bg-[#1F242F] dark:text-[#94969C] dark:hover:bg-[#333741]"
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#E9EAEB] px-4 py-2 text-sm font-medium text-[#A4A7AE] hover:bg-[#F5F5F5] dark:border-[#333741] dark:text-[#717680] dark:hover:bg-[#1F242F]"
              >
                <span>#</span>
                <span>{tagsExpanded ? "접기" : "태그 더보기"}</span>
              </button>
            </div>
          </section>

          {/* 4. 떠오르는 신예 창작자들 */}
          {featuredCharacters.length > 0 && (
            <ScrollSection
              title="떠오르는 신예 창작자들"
              moreLink="/characters?sort=featured"
            >
              {featuredCharacters.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                  creatorBadgeType={character.creator_badge_type}
                  onClick={() => setSelectedCharacterId(character.character_id)}
                />
              ))}
            </ScrollSection>
          )}

          {/* 5. 실시간 인기 섹션 */}
          {popularCharacters.length > 0 && (
            <ScrollSection
              title="실시간 인기"
              badge="HOT"
              moreLink="/characters?sort=popular"
            >
            {popularCharacters.map((character) => (
              <VerticalCharacterCard
                key={character.character_id}
                character={character}
                creatorName={character.creator_name}
                creatorBadgeType={character.creator_badge_type}
                badge="HOT"
                onClick={() => setSelectedCharacterId(character.character_id)}
              />
            ))}
            </ScrollSection>
          )}

          {/* 6. 크리에이터 신작 섹션 */}
          {newestCharacters.length > 0 && (
            <ScrollSection
              title="크리에이터 신작"
              badge="NEW"
              moreLink="/characters?sort=newest"
            >
              {newestCharacters.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                  creatorBadgeType={character.creator_badge_type}
                  onClick={() => setSelectedCharacterId(character.character_id)}
                />
              ))}
            </ScrollSection>
          )}

          {/* 7. 프로모션 배너 — 다크 배경 + 캐릭터 이미지 */}
          <section>
            <Link
              to="/notices"
              className="group block overflow-hidden rounded-2xl transition-transform hover:scale-[1.01]"
            >
              <div className="relative flex h-[140px] items-center bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
                <div className="relative z-10 flex-1 px-8">
                  <p className="text-lg font-bold text-white">나냥 기획전</p>
                  <p className="mt-1 text-sm text-white/70">
                    특별한 캐릭터를 만나보세요
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    매력적인 캐릭터와 이벤트가 기다립니다
                  </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-[200px] overflow-hidden">
                  <img
                    src="/nft.jpg"
                    alt="프로모션"
                    className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-transparent" />
                </div>
              </div>
            </Link>
          </section>
        </div>
      </div>

      <CharacterInfoModal
        characterId={selectedCharacterId}
        onClose={() => setSelectedCharacterId(null)}
      />
    </div>
  );
}
