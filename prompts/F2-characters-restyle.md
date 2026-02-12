# F2. 캐릭터 페이지 리스타일

## 목표
`/characters` 페이지를 Figma F2 디자인에 맞게 전면 리스타일한다.
히어로 배너 + 분류 탭 + 5열 그리드 카드 + 좌측 사이드바 레이아웃 적용.

## 현재 → 변경 요약
| 항목 | 현재 | 변경 |
|------|------|------|
| 레이아웃 | container 단일 영역 | 사이드바 + 메인 콘텐츠 (홈과 동일) |
| 헤더 | 제목 + 캐릭터 만들기 버튼 | 히어로 배너 캐러셀 |
| 필터 | 검색 + 정렬 드롭다운 | 분류 탭 (전체/일간/월간/신작) |
| 그리드 | 4열 정사각형 카드 | 5열 3:4 비율 카드 + 설명 + 크리에이터 뱃지 |
| 카드 | CharacterCard (이모지 통계) | CharacterGridCard (이미지 오버레이 + 설명) |
| 사이드바 | 없음 | ChatSidebar |
| 푸터 | 레이아웃에서 자동 제공 | 그대로 유지 |

---

## 수정 파일 (2개)

### 1. NEW: `app/features/characters/components/character-grid-card.tsx`

5열 그리드용 캐릭터 카드. Figma 기준: 3:4 이미지 + 좋아요 오버레이 + 이름 + 설명(2줄) + @크리에이터 + 뱃지.

```tsx
/**
 * Character Grid Card
 *
 * 캐릭터 목록 5열 그리드용 카드
 * 3:4 비율 이미지 + 이름 + 설명 + 크리에이터 뱃지
 */

import { Heart, User } from "lucide-react";
import { Link } from "react-router";

import { CreatorBadge } from "~/core/components/creator-badge";
import { Badge } from "~/core/components/ui/badge";

interface CharacterGridCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    description: string | null;
    is_nsfw?: boolean;
    like_count?: number;
  };
  creatorName?: string | null;
  creatorBadgeType?: string | null;
}

export function CharacterGridCard({
  character,
  creatorName,
  creatorBadgeType,
}: CharacterGridCardProps) {
  return (
    <Link
      to={`/chat/${character.character_id}`}
      className="group"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F5F5F5]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE]" />
          </div>
        )}
        {/* NSFW 배지 */}
        {character.is_nsfw && (
          <Badge
            variant="destructive"
            className="absolute left-1.5 top-1.5 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
        )}
        {/* 좋아요 수 — 좌하단 오버레이 */}
        {character.like_count != null && character.like_count > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
            <Heart className="h-3 w-3" />
            <span>{character.like_count.toLocaleString()}</span>
          </div>
        )}
      </div>
      {/* 이름 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] group-hover:text-[#41C7BD]">
        {character.name}
      </h3>
      {/* 설명 (2줄) */}
      {character.description && (
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#535862]">
          {character.description}
        </p>
      )}
      {/* 크리에이터 */}
      {creatorName && (
        <div className="mt-1 flex items-center gap-1">
          <p className="truncate text-xs text-[#535862]">@{creatorName}</p>
          <CreatorBadge
            badgeType={
              creatorBadgeType as "none" | "popular" | "official" | undefined
            }
          />
        </div>
      )}
    </Link>
  );
}
```

> 홈 `VerticalCharacterCard`와 차이점: description 표시, 크리에이터에 `@` 접두사, 태그 미표시, 고정 width 없음 (그리드 셀에 맞춤).

---

### 2. 수정: `app/features/characters/screens/character-list.tsx` — 전면 리스타일

전체 파일을 아래 내용으로 교체:

```tsx
/**
 * Character List Screen
 *
 * 캐릭터 탐색 페이지 — Figma F2 디자인
 * 히어로 배너 + 분류 탭 (전체/일간/월간/신작) + 5열 그리드
 */
import type { Route } from "./+types/character-list";

import { data, Link, useSearchParams } from "react-router";

import {
  ChatSidebar,
  type ChatSidebarUser,
} from "~/core/components/chat-sidebar";
import makeServerClient from "~/core/lib/supa-client.server";
import type { Database } from "database.types";

import { HeroCarousel, type HeroSlide } from "../../home/components/hero-carousel";
import { CharacterGridCard } from "../components/character-grid-card";

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
    // 로그인 유저 확인
    const {
      data: { user },
    } = await client.auth.getUser();

    // 캐릭터 쿼리 (탭별 분기)
    let query = client
      .from("characters")
      .select("*")
      .eq("is_public", true)
      .eq("status", "approved");

    switch (tab) {
      case "daily":
        // 일간: 좋아요 순 (전체와 동일, 추후 일간 집계 추가 가능)
        query = query.order("like_count", { ascending: false });
        break;
      case "monthly": {
        // 월간: 최근 30일 내 생성된 캐릭터, 좋아요 순
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("like_count", { ascending: false });
        break;
      }
      case "new":
        // 신작: 최신순
        query = query.order("created_at", { ascending: false });
        break;
      default:
        // 전체: 좋아요 순
        query = query.order("like_count", { ascending: false });
        break;
    }

    const { data: characters } = await query.limit(20);
    const charList = characters || [];

    // 크리에이터 프로필 일괄 조회
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

    // 히어로 슬라이드: 상위 5개 캐릭터
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
          {/* 1. 히어로 배너 캐러셀 */}
          {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

          {/* 2. 캐릭터 랭킹 제목 + 탭 */}
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

          {/* 3. 캐릭터 그리드 (5열) */}
          {characters.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-[#535862]">
                캐릭터가 없습니다
              </p>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 변경 포인트 요약

### 레이아웃
- 홈과 동일한 패턴: `-mx-5 -my-16 md:-my-32` 로 레이아웃 패딩 탈출
- `ChatSidebar` 좌측 sticky
- `max-w-screen-2xl` 메인 콘텐츠 영역

### 히어로 배너
- 홈의 `HeroCarousel` 컴포넌트 재사용 (cross-feature import)
- 슬라이드 데이터: 상위 5개 캐릭터의 `avatar_url` + `name` + `tagline`
- 캐릭터가 없으면 히어로 미표시

### 분류 탭
- URL search param `?tab=all|daily|monthly|new`
- `setSearchParams`로 클라이언트 네비게이션 (loader 재실행)
- 활성 탭: 민트 pill (`bg-[#41C7BD] text-white`)
- 비활성 탭: `bg-[#F5F5F5] text-[#535862]`

### 탭별 쿼리 로직
| 탭 | 쿼리 |
|----|-------|
| 전체 (all) | `like_count` DESC |
| 일간 (daily) | `like_count` DESC (전체와 동일, 추후 일간 집계 가능) |
| 월간 (monthly) | `created_at >= 30일 전` + `like_count` DESC |
| 신작 (new) | `created_at` DESC |

> 일간 랭킹은 현재 별도 일간 집계 컬럼이 없으므로 전체 랭킹과 동일하게 동작한다. 추후 `daily_like_count` 같은 컬럼 추가 시 분리 가능.

### 그리드
- 반응형: 2열(모바일) → 3열(sm) → 4열(md) → 5열(lg)
- `CharacterGridCard`: 3:4 이미지, 좋아요 오버레이, 이름, 설명(2줄), @크리에이터 + 뱃지

### 삭제되는 요소
- 검색 input + 정렬 Select 드롭다운 + "캐릭터 만들기" 헤더 버튼
- `CharacterCard` import (기존 정사각형 카드 — 다른 곳에서 쓸 수 있으므로 파일 자체는 유지)

---

## 검증

```bash
npm run typecheck
```

- [ ] `/characters` 접속: 히어로 배너 + "캐릭터 랭킹" + 전체 탭 활성 + 5열 그리드
- [ ] 탭 클릭: URL `?tab=daily` 등으로 변경, 리스트 갱신
- [ ] 전체 탭: 좋아요 순 정렬
- [ ] 월간 탭: 최근 30일 캐릭터만 표시
- [ ] 신작 탭: 최신순 정렬
- [ ] 캐릭터 카드: 3:4 이미지 + 좋아요 오버레이 + 이름 + 설명 + @크리에이터 + 뱃지
- [ ] 좌측 ChatSidebar 표시 (md 이상)
- [ ] 캐릭터 0개: "캐릭터가 없습니다" + CTA 표시
- [ ] 카드 클릭 → `/chat/{character_id}` 이동
- [ ] 모바일: 2열, 사이드바 숨김
