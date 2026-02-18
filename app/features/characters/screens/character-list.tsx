/**
 * Character List Screen
 *
 * 캐릭터 탐색 페이지 — Figma F2 디자인
 * 히어로 배너 + 분류 탭 (전체/일간/월간/신작) + 5열 그리드
 */
import type { Route } from "./+types/character-list";

import { useState } from "react";
import { data, Link, useSearchParams } from "react-router";

import {
  ChatSidebar,
  type ChatSidebarUser,
} from "~/core/components/chat-sidebar";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "database.types";

import {
  HeroCarousel,
  type HeroSlide,
} from "../../home/components/hero-carousel";
import { CharacterGridCard } from "../components/character-grid-card";
import { CharacterInfoModal } from "../components/character-info-modal";

type Character = Database["public"]["Tables"]["characters"]["Row"];

type CharacterWithCreator = Character & {
  creator_name: string | null;
  creator_badge_type: string | null;
};

interface LoaderData {
  characters: CharacterWithCreator[];
  heroSlides: HeroSlide[];
  tab: string;
  isLoggedIn: boolean;
  user: ChatSidebarUser | null;
}

export const meta: Route.MetaFunction = () => {
  return [
    { title: `캐릭터 랭킹 | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "다양한 캐릭터를 탐색하세요" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "all";

  const defaultData: LoaderData = {
    characters: [],
    heroSlides: [],
    tab,
    isLoggedIn: false,
    user: null,
  };

  try {
    const {
      data: { user },
    } = await client.auth.getUser();

    let query = client
      .from("characters")
      .select("*")
      .eq("is_public", true)
      .eq("status", "approved");

    switch (tab) {
      case "daily":
        query = query.order("like_count", { ascending: false });
        break;
      case "monthly": {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("like_count", { ascending: false });
        break;
      }
      case "new":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("like_count", { ascending: false });
        break;
    }

    const { data: characters } = await query.limit(20);
    const charList = characters || [];

    const creatorIds = [...new Set(charList.map((c) => c.creator_id))];
    const { data: profiles } =
      creatorIds.length > 0
        ? await client
            .from("profiles")
            .select("profile_id, name, badge_type")
            .in("profile_id", creatorIds)
        : { data: [] };

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.profile_id,
        { name: p.name, badge_type: p.badge_type },
      ])
    );

    const charactersWithCreator: CharacterWithCreator[] = charList.map((c) => {
      const profile = profileMap.get(c.creator_id);
      return {
        ...c,
        creator_name: profile?.name || null,
        creator_badge_type: profile?.badge_type || null,
      };
    });

    const heroSlides: HeroSlide[] = charList.slice(0, 5).map((c) => ({
      image: c.avatar_url || "/nft.jpg",
      title: c.name,
      description: c.tagline || c.description || "",
      link: `/chat/${c.character_id}`,
    }));

    return data(
      {
        characters: charactersWithCreator,
        heroSlides,
        tab,
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
    console.error("Character list loader error:", error);
    return data(defaultData, { headers });
  }
}

const TABS = [
  { key: "all", label: "전체" },
  { key: "daily", label: "일간" },
  { key: "monthly", label: "월간" },
  { key: "new", label: "신작" },
] as const;

export default function CharacterList({ loaderData }: Route.ComponentProps) {
  const { characters, heroSlides, tab, isLoggedIn, user } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null
  );

  const handleTabChange = (tabKey: string) => {
    const params = new URLSearchParams(searchParams);
    if (tabKey === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tabKey);
    }
    setSearchParams(params);
  };

  return (
    <div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white md:-my-32">
      {/* 채팅 사이드바 (md 이상) */}
      <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
        <ChatSidebar user={isLoggedIn ? user : null} chats={[]} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

          <section>
            <h2 className="mb-4 text-xl font-bold text-[#181D27]">
              캐릭터 랭킹
            </h2>
            <div className="flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabChange(t.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "bg-[#41C7BD] text-white"
                      : "bg-[#F5F5F5] text-[#535862] hover:bg-[#E9EAEB]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {characters.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-[#535862]">캐릭터가 없습니다</p>
              <Link
                to="/characters/create"
                className="mt-4 inline-block rounded-lg bg-[#41C7BD] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#41C7BD]/90"
              >
                첫 캐릭터 만들기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {characters.map((character) => (
                <CharacterGridCard
                  key={character.character_id}
                  character={character}
                  creatorName={character.creator_name}
                  creatorBadgeType={character.creator_badge_type}
                  onClick={() => setSelectedCharacterId(character.character_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CharacterInfoModal
        characterId={selectedCharacterId}
        onClose={() => setSelectedCharacterId(null)}
      />
    </div>
  );
}
