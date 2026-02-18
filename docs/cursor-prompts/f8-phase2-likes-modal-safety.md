# F8 마이페이지 Phase 2: 좋아요/팔로잉 + 캐릭터 모달 + 세이프티 설정

## 개요
좋아요/팔로잉 목록을 5열 그리드로 리디자인하고, Phase 4 캐릭터 모달(`characters/components/character-info-modal.tsx`)을 재사용하여 팔로우 버튼을 추가한다. 세이프티 설정을 2탭 구조로 개선한다. 전체 라이트 테마로 전환한다.

**전제조건**: Phase 1 (내 콘텐츠 + 사이드바 리디자인) 완료

**스키마/API 변경 없음** — 기존 API 라우트를 그대로 재사용:
- `POST/DELETE /api/characters/like` — 좋아요 토글
- `POST/DELETE /api/users/follow` — 팔로우 토글 (`{ user_id }` body)
- `GET /api/characters/:id` — 캐릭터 상세 (Phase 4 모달용)
- `POST /api/chat/create-room` — 대화방 생성

## 수정/삭제 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `users/screens/likes.tsx` | 수정 (전면 리디자인) |
| 2 | `users/components/character-grid-card.tsx` | 수정 (라이트 테마) |
| 3 | `characters/components/character-info-modal.tsx` | 수정 (팔로우 버튼 추가) |
| 4 | `users/screens/account.tsx` | 수정 (2탭 리디자인) |
| 5 | `users/lib/queries.server.ts` | 수정 (페이지네이션 기본값) |
| 6 | `users/components/character-info-modal.tsx` | 삭제 |

---

## 1. `users/screens/likes.tsx` (수정 — 전면 리디자인)

라이트 테마, 5열 그리드, Phase 4 모달(`characters/components/character-info-modal.tsx`) 연동, 번호 페이지네이션.

**핵심 변경:**
- `users/components/character-info-modal.tsx` → `characters/components/character-info-modal.tsx` 교체
- 기존 모달은 `character: CharacterCardData` (정적 데이터)를 받았으나, Phase 4 모달은 `characterId: number | null`을 받아 내부에서 fetcher로 로드
- 카드 클릭 시 `selectedCharacterId` (number | null) 상태를 설정하여 Phase 4 모달에 전달
- 다크 → 라이트 테마 색상
- 이전/다음 → 번호 페이지네이션
- "이전페이지로 돌아가기" 텍스트

```typescript
import type { Route } from "./+types/likes";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import CharacterGridCard from "../components/character-grid-card";
import { CharacterInfoModal } from "../../characters/components/character-info-modal";
import {
  getLikedCharacters,
  getFollowingCharacters,
  paginationSchema,
} from "../lib/queries.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: `좋아요 & 팔로잉 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "likes";
  const paginationParams = paginationSchema.parse(
    Object.fromEntries(url.searchParams)
  );

  const result =
    tab === "following"
      ? await getFollowingCharacters(user.id, paginationParams)
      : await getLikedCharacters(user.id, paginationParams);

  return {
    tab,
    ...result,
    userId: user.id,
  };
}

export default function LikesScreen() {
  const { tab, characters, pagination, userId } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null
  );

  const limit = pagination.limit || 10;
  const currentPage = Math.floor(pagination.offset / limit) + 1;
  const totalPages = Math.ceil(pagination.total / limit);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String((page - 1) * limit));
    setSearchParams(params);
  };

  // 번호 페이지네이션: 최대 5페이지 노출
  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#181D27] dark:text-white">
            {tab === "likes" ? "좋아요 목록" : "팔로잉 목록"}
          </h1>
          <p className="mt-1 text-sm text-[#535862] dark:text-[#94969C]">
            {tab === "likes"
              ? "좋아요한 캐릭터를 확인하세요."
              : "팔로잉한 크리에이터의 캐릭터를 확인하세요."}
          </p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="text-[#535862] hover:text-[#181D27] dark:text-[#94969C] dark:hover:text-white"
        >
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전페이지로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="border border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#1F242F]">
          <TabsTrigger
            value="likes"
            className="data-[state=active]:bg-[#00C4AF] data-[state=active]:text-white"
          >
            좋아요 목록
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="data-[state=active]:bg-[#00C4AF] data-[state=active]:text-white"
          >
            팔로잉 채널
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 카드 그리드 */}
      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-2 text-lg font-medium text-[#181D27] dark:text-white">
            {tab === "likes"
              ? "좋아요한 캐릭터가 없습니다"
              : "팔로잉한 크리에이터의 캐릭터가 없습니다"}
          </p>
          <p className="mb-6 text-[#535862] dark:text-[#94969C]">
            캐릭터를 탐색해보세요!
          </p>
          <Button
            asChild
            className="bg-[#00C4AF] text-white hover:bg-[#00b39e]"
          >
            <Link to="/characters">캐릭터 탐색</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {characters.map((character) => (
              <CharacterGridCard
                key={character.character_id}
                character={character}
                onClick={() => setSelectedCharacterId(character.character_id)}
              />
            ))}
          </div>

          {/* 번호 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA] dark:text-[#94969C] dark:hover:text-white dark:disabled:text-[#414651]"
              >
                이전
              </Button>
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant="ghost"
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={
                    page === currentPage
                      ? "bg-[#00C4AF] text-white hover:bg-[#00b39e] hover:text-white"
                      : "text-[#535862] hover:bg-[#F5F5F5] hover:text-[#181D27] dark:text-[#94969C] dark:hover:bg-[#333741] dark:hover:text-white"
                  }
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA] dark:text-[#94969C] dark:hover:text-white dark:disabled:text-[#414651]"
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* Phase 4 캐릭터 정보 모달 */}
      <CharacterInfoModal
        characterId={selectedCharacterId}
        onClose={() => setSelectedCharacterId(null)}
      />
    </div>
  );
}
```

**중요한 변경 사항:**
- `import CharacterInfoModal from "../components/character-info-modal"` → `import { CharacterInfoModal } from "../../characters/components/character-info-modal"`
- `selectedCharacter: CharacterCardData | null` + `modalOpen: boolean` → `selectedCharacterId: number | null`
- 모달 props: `character={selectedCharacter} open={modalOpen} onOpenChange={setModalOpen}` → `characterId={selectedCharacterId} onClose={() => setSelectedCharacterId(null)}`
- `CharacterGridCard`의 `onClick`이 `character` 객체 대신 `character_id`만 전달하도록 변경 (아래 참조)

---

## 2. `users/components/character-grid-card.tsx` (수정 — 라이트 테마)

라이트 테마 카드. onClick이 `character_id`만 전달하도록 인터페이스 변경.

```typescript
/**
 * Character Grid Card
 *
 * 좋아요/팔로잉 목록의 세로형 캐릭터 카드.
 */

import { User } from "lucide-react";

import type { CharacterCardData } from "../types";

interface CharacterGridCardProps {
  character: CharacterCardData;
  onClick: () => void;
}

export default function CharacterGridCard({
  character,
  onClick,
}: CharacterGridCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* 이미지 (3:4 비율) */}
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#F5F5F5] dark:bg-[#333741]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.display_name || character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE] dark:text-[#717680]" />
          </div>
        )}
      </div>

      {/* 캐릭터명 */}
      <h3 className="mt-2 truncate text-sm font-semibold text-[#181D27] dark:text-white">
        {character.display_name || character.name}
      </h3>

      {/* 메타 정보 */}
      <p className="text-xs text-[#535862] dark:text-[#94969C]">
        ❤️ {character.like_count}
        {character.creator_name && (
          <span className="ml-2">by {character.creator_name}</span>
        )}
      </p>

      {/* 설명 (1줄) */}
      <p className="mt-1 line-clamp-1 text-xs text-[#535862] dark:text-[#94969C]">
        {character.description || "설명 없음"}
      </p>

      {/* 해시태그 칩 (최대 3개) */}
      <div className="mt-2 flex flex-wrap gap-1">
        {(character.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#E0F7F5] px-2 py-0.5 text-xs text-[#00897B] dark:bg-[#00C4AF]/10 dark:text-[#00C4AF]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

**핵심 변경:**
- `onClick: (character: CharacterCardData) => void` → `onClick: () => void` (부모에서 `() => setSelectedCharacterId(character.character_id)` 전달)
- 다크 하드코딩 → 라이트/다크 반응형
- 태그 칩 색상: `bg-[#14b8a6]/10` → `bg-[#E0F7F5] text-[#00897B]`
- 이미지 없을 때 fallback bg: `bg-[#2f3032]` → `bg-[#F5F5F5]`
- creator_name 표시 추가

---

## 3. `characters/components/character-info-modal.tsx` (수정 — 팔로우 버튼 추가)

기존 Phase 4 모달에 팔로우/언팔로우 버튼을 추가한다. `showFollowButton` prop으로 조건부 렌더링.

**기존 interface:**
```typescript
interface CharacterInfoModalProps {
  characterId: number | null;
  onClose: () => void;
}
```

**변경 후 interface:**
```typescript
interface CharacterInfoModalProps {
  characterId: number | null;
  onClose: () => void;
  showFollowButton?: boolean;
}
```

**추가할 코드 — 컴포넌트 내부:**

1. props에 `showFollowButton = true` 추가 (기본값 true):
```typescript
export function CharacterInfoModal({
  characterId,
  onClose,
  showFollowButton = true,
}: CharacterInfoModalProps) {
```

2. 팔로우 상태 + fetcher 추가 (기존 `likeFetcher` 아래):
```typescript
  const followFetcher = useFetcher();
  const [isFollowing, setIsFollowing] = useState(false);
```

3. character 데이터 로드 후 팔로우 상태 초기화 (기존 `useEffect(() => { if (character) { ... } }, [character])` 안에 추가):
```typescript
  useEffect(() => {
    if (character) {
      setIsLiked(character.isLiked ?? false);
      setLikeCount(character.like_count ?? 0);
      setIsFollowing(character.isFollowing ?? false);  // ← 추가
    }
  }, [character]);
```

4. 팔로우 핸들러 (기존 `handleLike` 아래에 추가):
```typescript
  const handleFollow = () => {
    if (!character) return;
    const newState = !isFollowing;
    setIsFollowing(newState);
    followFetcher.submit(
      { user_id: character.creator_id },
      {
        method: newState ? "POST" : "DELETE",
        action: "/api/users/follow",
        encType: "application/json",
      }
    );
  };
```

5. JSX — 캐릭터 이름 + 좋아요 버튼 사이에 팔로우 버튼 삽입.
현재 코드의 `<div className="flex items-start justify-between">` 안에 있는 좋아요 하트 영역을 확장:

**기존 JSX (이름 + 하트):**
```tsx
<div className="flex items-start justify-between">
  <div>
    <h2 ...>{character.display_name || character.name}</h2>
    {character.tagline && <p ...>{character.tagline}</p>}
  </div>
  <button onClick={handleLike} ...>
    <Heart ... />
    <span ...>{likeCount}</span>
  </button>
</div>
```

**변경 후 JSX (이름 + 팔로우 + 하트):**
```tsx
<div className="flex items-start justify-between">
  <div>
    <h2 className="text-xl font-bold text-[#181D27] dark:text-white">
      {character.display_name || character.name}
    </h2>
    {character.tagline && (
      <p className="mt-0.5 text-sm text-[#535862] dark:text-[#94969C]">
        {character.tagline}
      </p>
    )}
  </div>
  <div className="flex items-center gap-2">
    {showFollowButton && !character.isCreator && (
      <button
        type="button"
        onClick={handleFollow}
        disabled={followFetcher.state !== "idle"}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          isFollowing
            ? "bg-[#F5F5F5] text-[#414651] hover:bg-[#E9EAEB] dark:bg-[#333741] dark:text-[#D5D7DA] dark:hover:bg-[#414651]"
            : "bg-[#00C4AF] text-white hover:bg-[#00b39e]"
        }`}
      >
        {followFetcher.state !== "idle"
          ? "..."
          : isFollowing
            ? "팔로잉"
            : "팔로우"}
      </button>
    )}
    <button
      type="button"
      onClick={handleLike}
      className="flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]"
    >
      <Heart
        className={`h-5 w-5 ${
          isLiked
            ? "fill-red-500 text-red-500"
            : "text-[#A4A7AE] dark:text-[#717680]"
        }`}
      />
      <span className="text-xs text-[#535862] dark:text-[#94969C]">
        {likeCount}
      </span>
    </button>
  </div>
</div>
```

**주의: `/api/characters/:id` API에서 `isFollowing` 필드를 이미 반환하는지 확인 필요.** 반환하지 않으면 모달에서는 팔로우 상태를 알 수 없다. 이 경우 `showFollowButton` 기본값을 `false`로 두고, likes.tsx에서만 명시적으로 `true`를 전달한다.

실제 API 응답에 `isFollowing` 필드가 있는지 확인하고:
- **있으면**: `showFollowButton` 기본값 `true` 유지
- **없으면**: `showFollowButton` 기본값 `false`로 변경, likes.tsx에서 `showFollowButton` 전달

---

## 4. `users/screens/account.tsx` (수정 — 2탭 리디자인)

3탭에서 2탭으로 축소: "프로필 이미지 수정" / "세이프티 설정". 계정 설정 탭(이메일/비밀번호 변경, 탈퇴)은 제거한다. 라이트 테마 전환.

```typescript
import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await, Link, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Switch } from "~/core/components/ui/switch";
import makeServerClient from "~/core/lib/supa-client.server";

import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  const profile = getUserProfile(client, { userId: user!.id });
  return { user, profile };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, profile } = loaderData;
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#181D27] dark:text-white">
            마이페이지
          </h1>
          <p className="mt-1 text-sm text-[#535862] dark:text-[#94969C]">
            정보를 수정할 수 있습니다.
          </p>
        </div>
        <Button
          variant="ghost"
          asChild
          className="text-[#535862] hover:text-[#181D27] dark:text-[#94969C] dark:hover:text-white"
        >
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Link>
        </Button>
      </div>

      {/* 2탭 */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6 border border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#1F242F]">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[#00C4AF] data-[state=active]:text-white"
          >
            프로필 이미지 수정
          </TabsTrigger>
          <TabsTrigger
            value="safety"
            className="data-[state=active]:bg-[#00C4AF] data-[state=active]:text-white"
          >
            세이프티 설정
          </TabsTrigger>
        </TabsList>

        {/* 프로필 탭 */}
        <TabsContent value="profile">
          <Suspense
            fallback={
              <div className="h-60 w-full animate-pulse rounded-xl border border-[#E9EAEB] bg-[#F9FAFB] dark:border-[#333741] dark:bg-[#1F242F]" />
            }
          >
            <Await resolve={profile}>
              {(profileData) => {
                if (!profileData) return null;
                return (
                  <div className="rounded-xl border border-[#E9EAEB] bg-white p-6 dark:border-[#333741] dark:bg-[#1F242F]">
                    <EditProfileForm
                      name={profileData.name}
                      marketingConsent={profileData.marketing_consent}
                      avatarUrl={profileData.avatar_url}
                    />
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </TabsContent>

        {/* 세이프티 탭 */}
        <TabsContent value="safety">
          <div className="space-y-6">
            {/* 본인인증 */}
            <div className="rounded-xl border border-[#E9EAEB] bg-white p-6 dark:border-[#333741] dark:bg-[#1F242F]">
              <h3 className="text-lg font-semibold text-[#181D27] dark:text-white">
                본인인증
              </h3>
              <p className="mt-1 text-sm text-[#535862] dark:text-[#94969C]">
                본인인증하고 1,000젤리 받아가세요!
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#181D27] dark:text-white">
                    본인 인증
                  </p>
                  <p className="text-xs text-[#535862] dark:text-[#94969C]">
                    실명 확인 및 본인 인증
                  </p>
                </div>
                {user?.user_metadata?.verified_at ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">인증완료</span>
                  </div>
                ) : (
                  <Button className="bg-[#00C4AF] text-white hover:bg-[#00b39e]">
                    인증하기
                  </Button>
                )}
              </div>
            </div>

            {/* 성인인증 */}
            <div className="rounded-xl border border-[#E9EAEB] bg-white p-6 dark:border-[#333741] dark:bg-[#1F242F]">
              <h3 className="text-lg font-semibold text-[#181D27] dark:text-white">
                성인인증
              </h3>
              <p className="mt-1 text-sm text-[#535862] dark:text-[#94969C]">
                성인인증하고 성인 콘텐츠를 이용하세요!
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#181D27] dark:text-white">
                    성인 인증
                  </p>
                  <p className="text-xs text-[#535862] dark:text-[#94969C]">
                    만 19세 이상 확인
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-[#D5D7DA] text-[#414651] dark:border-[#414651] dark:text-[#D5D7DA]"
                >
                  인증하기
                </Button>
              </div>
            </div>

            {/* 세이프티 토글 */}
            <div className="rounded-xl border border-[#E9EAEB] bg-white p-6 dark:border-[#333741] dark:bg-[#1F242F]">
              <h3 className="text-lg font-semibold text-[#181D27] dark:text-white">
                세이프티
              </h3>
              <p className="mt-1 text-sm text-[#535862] dark:text-[#94969C]">
                성인 인증 후 세이프티를 끌 수 있어요!
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#181D27] dark:text-white">
                    세이프티 모드
                  </p>
                  <p className="text-xs text-[#535862] dark:text-[#94969C]">
                    성인 콘텐츠 표시 여부를 설정합니다
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#535862] dark:text-[#94969C]">
                    OFF
                  </span>
                  <Switch disabled={!user?.user_metadata?.adult_verified} />
                  <span className="text-xs text-[#535862] dark:text-[#94969C]">
                    ON
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**핵심 변경:**
- 3탭 → 2탭 ("프로필 이미지 수정" / "세이프티 설정")
- 계정 설정 탭(ChangeEmailForm, ChangePasswordForm, DeleteAccountForm) 제거 → import도 제거
- 다크 → 라이트 테마
- 본인인증: "본인인증하고 1,000젤리 받아가세요!" 안내 문구 추가
- 성인인증: "성인인증하고 성인 콘텐츠를 이용하세요!" 안내 문구 추가
- 세이프티 토글: "성인 인증 후 세이프티를 끌 수 있어요!" 안내 + OFF/ON 라벨 + Switch disabled 조건
- 세이프티 Switch는 `user?.user_metadata?.adult_verified`가 없으면 disabled

---

## 5. `users/lib/queries.server.ts` (수정 — 페이지네이션 기본값)

페이지당 10개(5열×2행)로 변경.

**기존:**
```typescript
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});
```

**변경 후:**
```typescript
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  offset: z.coerce.number().min(0).optional().default(0),
});
```

변경: `default(20)` → `default(10)`

---

## 6. `users/components/character-info-modal.tsx` (삭제)

이 파일을 **삭제**한다. Phase 4 모달(`characters/components/character-info-modal.tsx`)로 완전히 대체된다.

삭제 전 확인: 이 파일을 import하는 곳이 `likes.tsx`뿐인지 확인한다.

```bash
# 삭제 전 확인
grep -r "character-info-modal" app/features/users/ --include="*.tsx" --include="*.ts"
```

`likes.tsx`에서만 import하고 있다면 안전하게 삭제한다.

---

## 참고 파일 (읽기 전용 — 수정하지 않음)

| 파일 | 용도 |
|------|------|
| `characters/components/character-info-modal.tsx` | Phase 4 모달 (팔로우 버튼 추가 대상) |
| `characters/components/image-carousel.tsx` | CSS scroll-snap 캐러셀 (Phase 4) |
| `users/api/follow.tsx` | `POST/DELETE /api/users/follow` (`{ user_id }`) |
| `characters/api/like.tsx` | `POST/DELETE /api/characters/like` (`{ character_id }`) |
| `users/queries.ts` | `getUserProfile()` — Supabase client 기반 |
| `users/components/forms/edit-profile-form.tsx` | 프로필 수정 폼 (그대로 사용) |
| `core/components/ui/tabs.tsx` | shadcn Tabs |
| `core/components/ui/switch.tsx` | shadcn Switch |
| `core/components/ui/dialog.tsx` | shadcn Dialog |

## 라이트 테마 컬러 레퍼런스 (Phase 1과 동일)

| 용도 | 라이트 | 다크 |
|------|--------|------|
| 배경 | `bg-white` | `dark:bg-[#181D27]` |
| 카드 bg | `bg-white border-[#E9EAEB]` | `dark:bg-[#1F242F] dark:border-[#333741]` |
| 제목 텍스트 | `text-[#181D27]` | `dark:text-white` |
| 보조 텍스트 | `text-[#535862]` | `dark:text-[#94969C]` |
| 액센트 (CTA) | `bg-[#00C4AF] text-white` | 동일 |
| 태그 칩 | `bg-[#E0F7F5] text-[#00897B]` | `dark:bg-[#00C4AF]/10 dark:text-[#00C4AF]` |

## 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] `/dashboard/likes` → 라이트 테마, 탭 전환 (좋아요/팔로잉)
- [ ] "이전페이지로 돌아가기" → `/dashboard` 이동
- [ ] 5열 그리드 (lg), 반응형 (2→3→4→5열)
- [ ] 카드 라이트 테마: 밝은 bg, 라이트 텍스트 색상, 태그 칩 `bg-[#E0F7F5]`
- [ ] 카드 클릭 → Phase 4 캐릭터 모달 오픈 (fetcher 기반 로드)
- [ ] 모달 내 이미지 캐러셀 동작
- [ ] 모달 내 좋아요 하트 토글 동작
- [ ] 모달 내 팔로우/팔로잉 버튼 토글 동작
- [ ] "대화 시작하기" / "이어서 대화하기" → 채팅방 이동
- [ ] 번호 페이지네이션 동작 (최대 5페이지, 현재 페이지 강조)
- [ ] 페이지당 10카드 (5×2행)
- [ ] `/account/edit` → 2탭 레이아웃 (프로필 이미지 수정 / 세이프티 설정)
- [ ] 세이프티 탭: 본인인증/성인인증 상태 표시
- [ ] 세이프티 Switch: 성인인증 미완료 시 disabled
- [ ] `users/components/character-info-modal.tsx` 삭제 후 빌드 통과
- [ ] 빈 상태 → "캐릭터 탐색" 버튼 동작
