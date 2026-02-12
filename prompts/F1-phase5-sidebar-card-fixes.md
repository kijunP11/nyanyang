# F1 Phase 5: 사이드바 비로그인 표시 + 카드 배지/좋아요 오버레이

## 전제조건
Phase 1~4 적용 완료 상태

## 목표
- 비로그인 사용자에게도 채팅 사이드바 표시 (md 이상)
- "실시간 인기" 섹션 카드에 개별 HOT 배지 표시
- 좋아요 수를 텍스트 아래 → 이미지 오버레이로 이동

## 수정 파일 (2개)
1. `app/features/home/screens/home.tsx`
2. `app/features/home/components/vertical-character-card.tsx`

---

## 1. `app/features/home/screens/home.tsx`

### 변경 1: 사이드바 조건 변경

비로그인 시에도 사이드바를 표시합니다. `ChatSidebar`는 `user`가 없으면 자동으로 `LoggedOutCTA`(소셜 로그인 버튼)를 렌더합니다.

```tsx
// 현재 (186~191행):
{/* 채팅 사이드바 (로그인 시, md 이상) */}
{isLoggedIn && user && (
  <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
    <ChatSidebar user={user} chats={[]} />
  </div>
)}

// 변경 (항상 표시, md 이상):
{/* 채팅 사이드바 (md 이상, 로그인/비로그인 모두) */}
<div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
  <ChatSidebar user={isLoggedIn ? user : null} chats={[]} />
</div>
```

> `ChatSidebar`는 `user`가 null이면 `LoggedOutCTA`를 렌더합니다 (chat-sidebar.tsx 288행).
> 조건부 렌더링(`{isLoggedIn && user && ...}`)을 제거하고 항상 렌더합니다.

### 변경 2: "실시간 인기" 카드에 badge prop 전달

```tsx
// 현재 (272~278행):
{popularCharacters.map((character) => (
  <VerticalCharacterCard
    key={character.character_id}
    character={character}
    creatorName={character.creator_name}
  />
))}

// 변경:
{popularCharacters.map((character) => (
  <VerticalCharacterCard
    key={character.character_id}
    character={character}
    creatorName={character.creator_name}
    badge="HOT"
  />
))}
```

---

## 2. `app/features/home/components/vertical-character-card.tsx`

### 변경 1: `badge` prop 추가

```tsx
// 현재 (12~22행):
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
}

// 변경:
interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
  badge?: string;
}
```

### 변경 2: 함수 시그니처에 badge 추가

```tsx
// 현재 (24~27행):
export function VerticalCharacterCard({
  character,
  creatorName,
}: VerticalCharacterCardProps) {

// 변경:
export function VerticalCharacterCard({
  character,
  creatorName,
  badge,
}: VerticalCharacterCardProps) {
```

### 변경 3: 좋아요 수를 이미지 오버레이로 이동 + badge 표시

좋아요 수를 텍스트 영역에서 **삭제**하고, 이미지 내부 **좌하단 오버레이**로 이동합니다.
동시에 badge가 있으면 이미지 **좌상단**에 표시합니다.

```tsx
// 현재 이미지 영역 (33~55행):
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
      className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
    >
      NSFW
    </Badge>
  )}
</div>

// 변경:
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
      className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
    >
      NSFW
    </Badge>
  )}
  {/* 섹션 배지 (HOT 등) — 좌상단, NSFW가 없을 때만 */}
  {badge && !character.is_nsfw && (
    <span className="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {badge}
    </span>
  )}
  {/* 좋아요 수 — 좌하단 오버레이 */}
  {character.like_count != null && character.like_count > 0 && (
    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
      <Heart className="h-3 w-3" />
      <span>{character.like_count.toLocaleString()}</span>
    </div>
  )}
</div>
```

### 변경 4: 기존 좋아요 수 영역 삭제

이미지 오버레이로 이동했으므로 텍스트 아래의 좋아요 수를 **삭제**합니다.

```tsx
// 삭제 (77~83행):
{/* 좋아요 수 */}
{character.like_count != null && character.like_count > 0 && (
  <div className="mt-1 flex items-center gap-1 text-xs text-[#A4A7AE]">
    <Heart className="h-3 w-3" />
    <span>{character.like_count.toLocaleString()}</span>
  </div>
)}
```

---

## 검증

```bash
npm run typecheck
```

- [ ] 비로그인 + md 이상: 좌측 사이드바에 "로그인하고..." + 소셜 버튼 표시
- [ ] 비로그인 + 모바일: 사이드바 숨김
- [ ] 로그인 + md 이상: 좌측 사이드바에 채팅 목록 + 사용자 정보
- [ ] "실시간 인기" 카드: 이미지 좌상단에 HOT 배지
- [ ] 전체 카드: 좋아요 수가 이미지 좌하단 오버레이에 표시 (반투명 검정 배경)
- [ ] 기존 텍스트 아래 좋아요 수 영역 없음
- [ ] NSFW 카드: HOT 배지 대신 NSFW 배지만 표시 (충돌 방지)
