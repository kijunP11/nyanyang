/**
 * Home Page Component
 *
 * 메인 홈 페이지 - Figma V2 디자인 (세로형 카드 + 가로 스크롤)
 */
import type { Route } from "./+types/home";

import { useState } from "react";
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
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-[40px] px-4 pt-[40px] pb-6 sm:px-6 lg:px-8">
          {/* 1. 히어로 캐러셀 */}
          <HeroCarousel slides={heroSlides} />

          {/* 2. AI 추천 검색 */}
          <section>
            {/* 외부: pink→teal 그라데이션 테두리 */}
            <div className="rounded-[24px] border border-white bg-gradient-to-r from-[rgba(255,77,213,0.3)] to-[rgba(0,196,175,0.3)] p-[2px] shadow-[0px_0px_16px_0px_#E8CBE8] dark:border-[#333741] dark:shadow-[0px_0px_16px_0px_rgba(232,203,232,0.4)]">
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
                  <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 19L14.65 14.65M17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9Z" stroke="#181D27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
                  className={`flex-shrink-0 rounded-full px-[16px] py-2 text-sm shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors ${
                    selectedTag === tag
                      ? "border border-[#00C4AF] bg-[#00C4AF] text-white"
                      : "border border-[rgba(153,163,183,0.3)] bg-[#F5F5F5] text-[#99A3B7] hover:bg-[#E9EAEB] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#94969C] dark:hover:bg-[#333741]"
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-[rgba(153,163,183,0.3)] bg-[#F5F5F5] px-[16px] py-2 text-sm text-[#99A3B7] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] hover:bg-[#E9EAEB] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#94969C] dark:hover:bg-[#333741]"
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
                <svg width="15" height="18" viewBox="0 0 14.89 18" fill="none" aria-hidden="true">
                  <path d="M14.7352 5.70082C14.6433 5.49336 14.512 5.30404 14.35 5.14315L8.35477 1.6127C8.34509 1.60665 8.33541 1.6012 8.32332 1.59697C7.76565 1.2879 7.08883 1.29395 6.53541 1.6127L0.90978 4.85949C0.346673 5.18429 0 5.7867 0 6.4363V12.9323C0 13.3938 0.176109 13.8323 0.479134 14.1644L0.909176 14.5085L4.09971 16.349L6.5348 17.7559C6.70476 17.8539 6.88682 17.924 7.07492 17.9615C7.50497 18.0517 7.96102 17.9833 8.35416 17.7559L13.9798 14.5091C14.5429 14.1843 14.8895 13.5819 14.8895 12.9323V6.4363C14.8895 6.17804 14.8344 5.92764 14.7352 5.70082Z" fill="url(#gem_lg_g0)" />
                  <path d="M14.2323 3.8512C14.1246 3.74354 14.0037 3.64918 13.8688 3.57237L8.33933 0.380622C8.32965 0.374573 8.31998 0.36913 8.30848 0.365501C7.7605 0.0618704 7.09517 0.067314 6.55142 0.380622L1.02197 3.57237C0.467932 3.89172 0.128012 4.48386 0.128012 5.12197V11.5073C0.128012 11.9609 0.300996 12.3916 0.599182 12.7188L1.02197 13.0569L4.15807 14.866L6.55203 16.2486C6.71957 16.3448 6.898 16.4137 7.08247 16.4506C7.50526 16.5389 7.95344 16.4718 8.33994 16.2486L13.8694 13.0569C14.4234 12.7375 14.7633 12.1454 14.7633 11.5073V5.12197C14.7633 4.86794 14.7095 4.62237 14.6115 4.39919C14.5214 4.19536 14.3926 4.00906 14.2329 3.8512Z" fill="url(#gem_lg_g1)" />
                  <path d="M13.9803 3.49012L8.35463 0.243332C8.34496 0.237284 8.33528 0.231847 8.32318 0.227613L0 5.63973V11.5623C0 12.0238 0.176579 12.4623 0.479604 12.7944L14.3498 3.77319C14.2403 3.66371 14.117 3.56754 13.9803 3.48952ZM14.7351 4.33146L1.05844 13.2256L4.10018 14.9803L14.8893 7.96413V5.06754C14.8893 4.80928 14.8343 4.55888 14.7351 4.33206ZM5.87237 16.0049L6.53527 16.3865C6.70523 16.4845 6.88729 16.5547 7.07539 16.5922L14.8899 11.5103V10.141L5.87297 16.0049Z" fill="url(#gem_lg_g2)" />
                  <path d="M1.2822 11.6644V4.96394C1.2822 4.83511 1.35116 4.71595 1.46245 4.65184L7.26529 1.30162C7.37658 1.23751 7.51448 1.23751 7.62578 1.30162L13.428 4.65184C13.5393 4.71656 13.6083 4.83511 13.6083 4.96394V11.6644C13.6083 11.7932 13.5393 11.9124 13.428 11.9765L7.62517 15.3267C7.51388 15.3914 7.37598 15.3914 7.26468 15.3267L1.46245 11.9765C1.35116 11.9118 1.2822 11.7932 1.2822 11.6644Z" fill="#015047" />
                  <path d="M2.29546 11.0795V5.54882C2.29546 5.41999 2.36441 5.30084 2.4757 5.23672L7.26543 2.47139C7.37673 2.40728 7.51463 2.40728 7.62592 2.47139L12.4151 5.23672C12.5263 5.30084 12.5953 5.41999 12.5953 5.54882V11.0795C12.5953 11.2083 12.5263 11.3275 12.4151 11.3916L7.62531 14.1569C7.51402 14.2216 7.37612 14.2216 7.26483 14.1569L2.4757 11.3916C2.36441 11.3269 2.29546 11.2083 2.29546 11.0795Z" fill="#076E63" />
                  <path d="M14.7351 4.33149C14.6432 4.12403 14.5119 3.93472 14.3499 3.77383L8.35467 0.243365C8.34499 0.237316 8.33531 0.231879 8.32322 0.227645C7.76555 -0.0814282 7.08874 -0.0753866 6.53531 0.243365L0.909681 3.49015C0.346574 3.81495 0 4.41737 0 5.06697V11.563C0 12.0245 0.176009 12.463 0.479034 12.795L0.909076 13.1392L4.09961 14.9797L6.5347 16.3866C6.70466 16.4846 6.88672 16.5547 7.07482 16.5922C7.50487 16.6823 7.96092 16.614 8.35406 16.3866L13.9797 13.1398C14.5428 12.815 14.8894 12.2126 14.8894 11.563V5.06697C14.8894 4.8087 14.8343 4.5583 14.7351 4.33149ZM14.763 11.5073C14.763 12.1454 14.4224 12.7376 13.869 13.0569L8.33955 16.2487C7.95305 16.4719 7.50487 16.539 7.08208 16.4507C6.89761 16.4144 6.71857 16.3448 6.55164 16.2487L5.89962 15.8737L4.15768 14.866L1.16795 13.1416L1.02158 13.0569C0.861899 12.9644 0.719761 12.8513 0.598793 12.7188C0.300606 12.3922 0.127621 11.9616 0.127621 11.5073V5.12201C0.127621 4.48391 0.468147 3.89177 1.02158 3.57241L6.55103 0.380665C7.09539 0.0673571 7.76011 0.0613086 8.3081 0.365544L8.33894 0.380665L13.8684 3.57241C14.0033 3.64923 14.1242 3.74358 14.2319 3.85124C14.3916 4.00911 14.5204 4.1954 14.6105 4.39923C14.7085 4.62242 14.7624 4.86858 14.7624 5.12201V11.5073Z" fill="url(#gem_lg_g3)" />
                  <defs>
                    <linearGradient id="gem_lg_g0" x1="0" y1="9.68" x2="14.89" y2="9.68" gradientUnits="userSpaceOnUse"><stop stopColor="#00C4AF" /><stop offset="1" stopColor="#05433D" /></linearGradient>
                    <linearGradient id="gem_lg_g1" x1="1.69" y1="12.19" x2="13.83" y2="4.02" gradientUnits="userSpaceOnUse"><stop stopColor="#57CFC4" /><stop offset="1" stopColor="#5BD9CE" /></linearGradient>
                    <linearGradient id="gem_lg_g2" x1="0.6" y1="13.03" x2="14.51" y2="3.98" gradientUnits="userSpaceOnUse"><stop stopColor="#66EDE1" /><stop offset="1" stopColor="#B1FFF8" /></linearGradient>
                    <radialGradient id="gem_lg_g3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(7.45 8.31) scale(7.89)"><stop stopColor="#6CEEE3" /><stop offset="1" stopColor="#01A795" /></radialGradient>
                  </defs>
                </svg>
              }
              moreLink="/characters?sort=newest"
            >
              {filteredNewest.map((character) => (
                <VerticalCharacterCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                  onClick={() => setSelectedCharacterId(character.character_id)}
                />
              ))}
            </ScrollSection>
          )}

          {/* 7. 프로모션 배너 */}
          <section>
            <Link
              to="/notices"
              className="group block overflow-hidden rounded-[8px] border border-[rgba(0,0,0,0.3)] transition-transform hover:scale-[1.01]"
            >
              <div className="relative flex h-[136px] items-center bg-[#060809]">
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
