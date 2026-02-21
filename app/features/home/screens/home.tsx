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

/** 한국어 마지막 글자에 받침이 있는지 확인 */
function hasBatchim(str: string): boolean {
  const code = str.charCodeAt(str.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

type Character = Database["public"]["Tables"]["characters"]["Row"];

type CharacterWithCreator = Character & {
  creator_name: string | null;
  creator_badge_type: string | null;
};

interface AiPickCharacter {
  name: string;
  tags: string[];
}

interface LoaderData {
  title: string;
  subtitle: string;
  featuredCharacters: CharacterWithCreator[];
  popularCharacters: CharacterWithCreator[];
  newestCharacters: CharacterWithCreator[];
  aiPick: AiPickCharacter | null;
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
    aiPick: null,
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

    const addCreatorInfo = (chars: Character[]): CharacterWithCreator[] =>
      chars.map((c) => {
        const profile = profileMap.get(c.creator_id);
        return {
          ...c,
          creator_name: profile?.name || null,
          creator_badge_type: profile?.badge_type || null,
        };
      });

    // AI 추천 대화: 랜덤 캐릭터 선택
    const candidates = allCharacters.filter((c) => c.tags && c.tags.length > 0);
    const picked = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : allCharacters[0] || null;
    const aiPick: AiPickCharacter | null = picked
      ? { name: picked.name, tags: (picked.tags || []).slice(0, 3) }
      : null;

    return data(
      {
        ...defaultData,
        featuredCharacters: addCreatorInfo(featuredResult.data || []),
        popularCharacters: addCreatorInfo(popularResult.data || []),
        newestCharacters: addCreatorInfo(newestResult.data || []),
        aiPick,
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
    aiPick,
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
  const [selectedTag, setSelectedTag] = useState("전체");
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

  // 태그 필터링
  const filterByTag = (chars: CharacterWithCreator[]) => {
    if (selectedTag === "전체" || selectedTag === "추천") return chars;
    return chars.filter((c) => c.tags?.includes(selectedTag));
  };
  const filteredFeatured = filterByTag(featuredCharacters);
  const filteredPopular = filterByTag(popularCharacters);
  const filteredNewest = filterByTag(newestCharacters);

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
            {/* 외부: pink→teal 그라데이션 테두리 */}
            <div className="rounded-[24px] bg-gradient-to-r from-[rgba(255,77,213,0.3)] to-[rgba(0,196,175,0.3)] p-[2px]">
              {/* 내부: 핑크 보더 + 연핑크 배경 + 핑크 글로우 + 6px 흰색 인셋 */}
              <div
                className="relative rounded-[20px] border border-[#FF4DD5] shadow-[0px_0px_16px_0px_#F389DC] dark:border-[#FF4DD5]/60 dark:shadow-[0px_0px_16px_0px_#F389DC]/40"
                style={{ backgroundImage: "linear-gradient(to left, #ffffff, #FFE9FA)" }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_0px_0px_6px_white] dark:shadow-[inset_0px_0px_0px_6px_#181D27]" />
                <div className="relative flex h-12 items-center gap-3 px-4">
                  <img
                    src="/nft.jpg"
                    alt=""
                    className="h-[30px] w-[30px] flex-shrink-0 rounded-full object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-[16px] leading-[24px] text-[#535862] dark:text-[#94969C]">
                    <span className="font-bold">[AI 추천 대화]</span>
                    {aiPick
                      ? ` 오늘은 '${aiPick.name}'${hasBatchim(aiPick.name) ? "이랑" : "랑"} 얘기 어때요? `
                      : " 오늘의 추천 캐릭터를 만나보세요 "}
                    {aiPick && aiPick.tags.length > 0 && (
                      <span className="text-[#A4A7AE] dark:text-[#717680]">
                        {aiPick.tags.map((t) => `#${t}`).join(" ")}
                      </span>
                    )}
                  </p>
                  <Search className="h-5 w-5 flex-shrink-0 text-[#A4A7AE] dark:text-[#717680]" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. 태그 필터 */}
          <section className="relative">
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
                  onClick={() => setSelectedTag(tag)}
                  className={`flex-shrink-0 rounded-full px-[14px] py-2 text-sm shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors ${
                    selectedTag === tag
                      ? "border border-[#36C4B3] bg-[#36C4B3] font-semibold text-white"
                      : "border border-[#D5D7DA] bg-white text-[#717680] hover:bg-[#F5F5F5] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#94969C] dark:hover:bg-[#333741]"
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[#D5D7DA] bg-white px-[14px] py-2 text-sm text-[#717680] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] hover:bg-[#F5F5F5] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#94969C] dark:hover:bg-[#333741]"
              >
                <span>#</span>
                <span>{tagsExpanded ? "접기" : "태그 더보기"}</span>
              </button>
            </div>
            {/* 우측 페이드 그라데이션 */}
            {!tagsExpanded && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-[62px] bg-gradient-to-r from-transparent to-white dark:to-[#181D27]" />
            )}
          </section>

          {/* 4. 떠오르는 신예 창작자들 */}
          {filteredFeatured.length > 0 && (
            <ScrollSection
              title="떠오르는 신예 창작자들"
              moreLink="/characters?sort=featured"
            >
              {filteredFeatured.map((character) => (
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
          {filteredPopular.length > 0 && (
            <ScrollSection
              title="실시간 인기"
              moreLink="/characters?sort=popular"
            >
              {filteredPopular.map((character) => (
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
          {filteredNewest.length > 0 && (
            <ScrollSection
              title="크리에이터 신작"
              titleIcon={
                <svg width="15" height="18" viewBox="0 0 15 18" fill="none" aria-hidden="true">
                  <path d="M7.5 0L13.5 3.5V10.5L7.5 18L1.5 10.5V3.5L7.5 0Z" fill="#36C4B3" />
                  <path d="M7.5 6L8.4 8.1L10.5 8.5L9 10L9.3 12.1L7.5 11.1L5.7 12.1L6 10L4.5 8.5L6.6 8.1L7.5 6Z" fill="white" />
                </svg>
              }
              moreLink="/characters?sort=newest"
            >
              {filteredNewest.map((character) => (
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

          {/* 7. 프로모션 배너 */}
          <section>
            <Link
              to="/notices"
              className="group block overflow-hidden rounded-2xl transition-transform hover:scale-[1.01]"
            >
              <div className="relative flex h-[140px] items-center bg-[#060809]">
                <div className="relative z-10 flex-1 px-8">
                  <p className="text-[20px] font-bold text-white">나냥 기획전</p>
                  <p className="mt-1 text-sm text-[#D5D7DA]">
                    특별한 캐릭터를 만나보세요
                  </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-[200px] overflow-hidden">
                  <img
                    src="/nft.jpg"
                    alt="프로모션"
                    className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#060809] to-transparent" />
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
