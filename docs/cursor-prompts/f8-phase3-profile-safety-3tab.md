# F8 마이페이지 Phase 3: 프로필 수정 + 세이프티 수정 + 3탭 구조

## 개요
`/account/edit` 페이지를 기존 2탭에서 3탭으로 확장하고, 프로필 수정 탭을 Figma 스펙대로 전면 리디자인한다. 세이프티 수정 탭에 인증 완료 다이얼로그를 추가한다. 키워드북 탭은 빈 상태 placeholder로 남긴다 (Phase 4에서 구현).

**전제조건**: Phase 2 (좋아요/팔로잉 + 캐릭터 모달 + 세이프티 설정) 완료

**스키마 변경**: `profiles.bio` 컬럼 추가 (수동 마이그레이션)

**기존 API 재사용:**
- `POST /api/users/profile` — 프로필 수정 (multipart/form-data)
- `POST /api/users/password` — 비밀번호 변경
- `DELETE /api/users` — 회원 탈퇴

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `sql/migrations/0014_add_profile_bio.sql` | 생성 (수동 마이그레이션) |
| 2 | `users/schema.ts` | 수정 (bio 컬럼 추가) |
| 3 | `users/types.ts` | 수정 (bio 타입 추가) |
| 4 | `users/lib/queries.server.ts` | 수정 (bio select 추가) |
| 5 | `users/api/edit-profile.tsx` | 수정 (bio 검증+저장) |
| 6 | `users/screens/account.tsx` | 전면 리디자인 (3탭) |
| 7 | `users/components/forms/edit-profile-form.tsx` | 전면 리디자인 |
| 8 | `users/components/mypage-sidebar-card.tsx` | 수정 (메뉴 업데이트) |

---

## 1. `sql/migrations/0014_add_profile_bio.sql` (생성)

수동 마이그레이션 파일. Supabase SQL Editor 또는 psql로 직접 실행해야 함.

```sql
-- Manual migration: F8 Phase 3 — 프로필 수정 탭에 자기소개 필드 추가
-- Not tracked by Drizzle journal (_journal.json)
-- Run via Supabase SQL Editor or psql
-- After applying: npm run db:typegen

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bio" text;
```

---

## 2. `users/schema.ts` (수정)

`profiles` 테이블 정의에 `bio` 컬럼 추가. Drizzle 타입 동기화 목적.

**변경:**
- `avatar_url` 다음에 `bio: text()` 추가

```typescript
// 기존
avatar_url: text(),
marketing_consent: boolean("marketing_consent").notNull().default(false),

// 변경 후
avatar_url: text(),
bio: text(),  // 자기소개 (500 chars max, form-level validation)
marketing_consent: boolean("marketing_consent").notNull().default(false),
```

---

## 3. `users/types.ts` (수정)

`DashboardProfile` 인터페이스에 `bio` 필드 추가.

```typescript
export interface DashboardProfile {
  profile_id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;  // 추가
  follower_count: number;
  following_count: number;
  verified_at: Date | null;
}
```

---

## 4. `users/lib/queries.server.ts` (수정)

`getUserProfileWithCounts` 함수의 select에 `bio` 추가.

```typescript
const [profile] = await db
  .select({
    profile_id: profiles.profile_id,
    name: profiles.name,
    avatar_url: profiles.avatar_url,
    bio: profiles.bio,  // 추가
    follower_count: profiles.follower_count,
    following_count: profiles.following_count,
    verified_at: profiles.verified_at,
  })
  .from(profiles)
  .where(eq(profiles.profile_id, userId))
  .limit(1);
```

---

## 5. `users/api/edit-profile.tsx` (수정)

Zod 스키마에 `bio` 추가, `name` 밸리데이션 변경 (min 1 → min 2, max 12), DB update에 `bio` 포함.

**Zod 스키마 변경:**

```typescript
const schema = z.object({
  name: z.string().min(2).max(12),  // 닉네임: 2-12자
  bio: z.string().max(500).optional().default(""),  // 자기소개: 500자
  avatar: z.instanceof(File),
  marketingConsent: z.coerce.boolean(),
});
```

**profiles 테이블 update에 bio 추가:**

```typescript
const { error: updateProfileError } = await client
  .from("profiles")
  .update({
    name: validData.name,
    bio: validData.bio,  // 추가
    marketing_consent: validData.marketingConsent,
    avatar_url: avatarUrl,
  })
  .eq("profile_id", user.id);
```

**auth user metadata에도 bio 추가:**

```typescript
const { error: updateError } = await client.auth.updateUser({
  data: {
    name: validData.name,
    display_name: validData.name,
    bio: validData.bio,  // 추가
    marketing_consent: validData.marketingConsent,
    avatar_url: avatarUrl,
  },
});
```

---

## 6. `users/screens/account.tsx` (전면 리디자인)

기존 2탭을 3탭으로 확장. 로더에 `hasPassword` 추가. 전체 라이트 테마.

### 로더 변경

```typescript
import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await, Link, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { data } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Switch } from "~/core/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/core/components/ui/alert-dialog";
import makeServerClient from "~/core/lib/supa-client.server";

import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  const profile = getUserProfile(client, { userId: user!.id });

  // 비밀번호 기반 인증 여부 확인
  const { data: identitiesData } = await client.auth.getUserIdentities();
  const hasPassword = identitiesData?.identities?.some(
    (i) => i.provider === "email"
  ) ?? false;

  return data({ user, profile, hasPassword }, { headers });
}
```

### 컴포넌트 구조

```tsx
export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, profile, hasPassword } = loaderData;
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const adultVerified = !!user?.user_metadata?.adult_verified;
  const identityVerified = !!user?.user_metadata?.verified_at;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 bg-[#F5F5F5] min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#181D27]">마이페이지</h1>
        <Button variant="ghost" asChild className="text-[#535862] hover:text-[#181D27]">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Link>
        </Button>
      </div>
      <p className="text-sm text-[#535862] mb-6">정보를 수정할 수 있습니다.</p>

      {/* 3탭 */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-white border border-[#D5D7DA] mb-6">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            프로필 수정
          </TabsTrigger>
          <TabsTrigger
            value="keywords"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            내 키워드북
          </TabsTrigger>
          <TabsTrigger
            value="safety"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            세이프티 수정
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 프로필 수정 */}
        <TabsContent value="profile">
          <Suspense
            fallback={
              <div className="bg-white animate-pulse h-60 w-full rounded-xl border border-[#D5D7DA]" />
            }
          >
            <Await resolve={profile}>
              {(profileData) => {
                if (!profileData) return null;
                return (
                  <EditProfileForm
                    name={profileData.name}
                    bio={profileData.bio}
                    avatarUrl={profileData.avatar_url}
                    marketingConsent={profileData.marketing_consent}
                    hasPassword={hasPassword}
                  />
                );
              }}
            </Await>
          </Suspense>
        </TabsContent>

        {/* Tab 2: 내 키워드북 (Phase 4에서 구현) */}
        <TabsContent value="keywords">
          <div className="bg-white rounded-xl border border-[#D5D7DA] p-12 text-center">
            <p className="text-lg font-medium text-[#181D27] mb-2">준비 중입니다</p>
            <p className="text-sm text-[#535862]">곧 키워드북 기능이 추가됩니다.</p>
          </div>
        </TabsContent>

        {/* Tab 3: 세이프티 수정 */}
        <TabsContent value="safety">
          {/* 아래 세이프티 수정 섹션 참조 */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Tab 3 — 세이프티 수정 상세

3개 카드로 구성. 각 인증 카드에 상태 라벨과 인증 완료 다이얼로그 추가.

```tsx
{/* 본인인증 카드 */}
<div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
  <h3 className="text-lg font-semibold text-[#181D27] mb-1">본인인증</h3>
  <p className="text-sm text-[#535862] mb-4">본인인증하고 1,000젤리 받아가세요!</p>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        identityVerified
          ? "bg-[#E0F7F5] text-[#00897B]"
          : "bg-red-50 text-red-500"
      }`}>
        {identityVerified ? "인증완료" : "미인증"}
      </span>
    </div>
    {/* 인증 완료 다이얼로그 포함 버튼 */}
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          disabled={identityVerified}
          className="bg-[#00c4af] hover:bg-[#00b39e] text-white disabled:opacity-50"
        >
          인증하기
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>본인인증이 완료되었습니다.</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-[#00c4af] hover:bg-[#00b39e] text-white">
            완료
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</div>

{/* 성인인증 카드 — 동일 패턴, adultVerified 사용 */}
{/* 성인인증 완료 다이얼로그: "성인인증이 완료되었습니다." */}

{/* 세이프티 카드 */}
<div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
  <h3 className="text-lg font-semibold text-[#181D27] mb-1">세이프티</h3>
  {!adultVerified && (
    <p className="text-sm text-[#535862] mb-4">
      성인 인증 후 세이프티를 끌 수 있어요!
    </p>
  )}
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-[#181D27]">
      {/* Switch 상태에 따라 ON/OFF */}
    </span>
    <Switch disabled={!adultVerified} />
  </div>
</div>
```

---

## 7. `users/components/forms/edit-profile-form.tsx` (전면 리디자인)

기존 Card 기반 영어 폼 → Figma 스펙 한국어 폼으로 전면 교체.

### Props 변경

```typescript
interface EditProfileFormProps {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  marketingConsent: boolean;
  hasPassword: boolean;
}
```

### 전체 구조

하나의 컴포넌트 내에 3개의 독립 섹션 (각각 별도 fetcher 사용):

```
<div className="space-y-8">
  {/* 섹션 1: 프로필 수정 (fetcher → POST /api/users/profile) */}
  <프로필 이미지 + 닉네임 + 자기소개 + 저장 버튼>

  {/* 섹션 2: 비밀번호 수정 (fetcher → POST /api/users/password) */}
  <새 비밀번호 + 비밀번호 확인 + 변경 버튼>

  {/* 섹션 3: 회원 탈퇴 (fetcher → DELETE /api/users) */}
  <회원 탈퇴 버튼 + AlertDialog>
</div>
```

### 섹션 1: 프로필 수정

```tsx
import type { Route as EditProfileRoute } from "@rr/app/features/users/api/+types/edit-profile";

// 3개 fetcher
const profileFetcher = useFetcher<EditProfileRoute.ComponentProps["actionData"]>();
const passwordFetcher = useFetcher();
const deleteFetcher = useFetcher();

// 상태
const [avatar, setAvatar] = useState<string | null>(avatarUrl);
const [nameValue, setNameValue] = useState(name || "");
const [bioValue, setBioValue] = useState(bio || "");
const fileInputRef = useRef<HTMLInputElement>(null);

// 이미지 선택
const onChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setAvatar(URL.createObjectURL(file));
  }
};
```

**이미지 업로드 영역 (3:4 비율):**

```tsx
<profileFetcher.Form
  method="post"
  encType="multipart/form-data"
  action="/api/users/profile"
  className="bg-white rounded-xl border border-[#D5D7DA] p-6"
>
  <h3 className="text-lg font-semibold text-[#181D27] mb-4">프로필 수정</h3>

  {/* 이미지 업로드 (3:4) */}
  <div className="mb-6">
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#D5D7DA] hover:opacity-80 transition-opacity"
    >
      {avatar ? (
        <img src={avatar} alt="프로필" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-[#717680]">
          <UserIcon className="h-10 w-10" />
          <span className="text-xs mt-1">이미지 선택</span>
        </div>
      )}
    </button>
    <input
      ref={fileInputRef}
      type="file"
      name="avatar"
      accept="image/png,image/jpeg,image/gif"
      onChange={onChangeAvatar}
      className="hidden"
    />
    <p className="text-xs text-[#717680] mt-2">PNG, JPG, GIF / 최대 1MB</p>
  </div>

  {/* 닉네임 (2-12자) */}
  <div className="mb-4">
    <Label htmlFor="name" className="text-sm font-medium text-[#181D27]">
      닉네임
    </Label>
    <div className="relative mt-1">
      <Input
        id="name"
        name="name"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value.slice(0, 12))}
        minLength={2}
        maxLength={12}
        required
        placeholder="닉네임을 입력하세요"
        className="border-[#D5D7DA]"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#717680]">
        {nameValue.length}/12
      </span>
    </div>
    {/* 필드 에러 표시 */}
  </div>

  {/* 자기소개 (500자) */}
  <div className="mb-6">
    <Label htmlFor="bio" className="text-sm font-medium text-[#181D27]">
      자기소개
    </Label>
    <div className="relative mt-1">
      <Textarea
        id="bio"
        name="bio"
        value={bioValue}
        onChange={(e) => setBioValue(e.target.value.slice(0, 500))}
        maxLength={500}
        rows={4}
        placeholder="자기소개를 입력하세요"
        className="border-[#D5D7DA] resize-none"
      />
      <span className="text-xs text-[#717680] absolute right-3 bottom-3">
        {bioValue.length}/500
      </span>
    </div>
  </div>

  {/* 마케팅 동의 (hidden or checkbox) */}
  <input type="hidden" name="marketingConsent" value={marketingConsent ? "true" : "false"} />

  {/* 저장 */}
  <Button
    type="submit"
    disabled={profileFetcher.state === "submitting"}
    className="w-full bg-[#00c4af] hover:bg-[#00b39e] text-white"
  >
    {profileFetcher.state === "submitting" ? "저장 중..." : "프로필 수정하기"}
  </Button>
  {/* 성공/에러 메시지 */}
</profileFetcher.Form>
```

**import 필요:**
- `Textarea` from `~/core/components/ui/textarea`
- `Input` from `~/core/components/ui/input`
- `Label` from `~/core/components/ui/label`
- `Button` from `~/core/components/ui/button`
- `UserIcon` from `lucide-react`

### 섹션 2: 비밀번호 수정

```tsx
<div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
  <h3 className="text-lg font-semibold text-[#181D27] mb-4">비밀번호 수정</h3>
  <passwordFetcher.Form method="post" action="/api/users/password" className="space-y-4">
    <div>
      <Label htmlFor="password" className="text-sm font-medium text-[#181D27]">
        새 비밀번호
      </Label>
      <Input
        id="password"
        name="password"
        type="password"
        required
        placeholder="8자 이상 입력하세요"
        className="mt-1 border-[#D5D7DA]"
      />
    </div>
    <div>
      <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#181D27]">
        비밀번호 확인
      </Label>
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        required
        placeholder="비밀번호를 다시 입력하세요"
        className="mt-1 border-[#D5D7DA]"
      />
    </div>
    <Button
      type="submit"
      disabled={passwordFetcher.state === "submitting"}
      className="w-full bg-[#00c4af] hover:bg-[#00b39e] text-white"
    >
      {passwordFetcher.state === "submitting" ? "변경 중..." : "비밀번호 변경"}
    </Button>
    {/* 성공/에러 메시지 */}
  </passwordFetcher.Form>
</div>
```

### 섹션 3: 회원 탈퇴

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/core/components/ui/alert-dialog";

<div className="bg-white rounded-xl border border-[#D5D7DA] p-6">
  <h3 className="text-lg font-semibold text-[#181D27] mb-4">회원 탈퇴</h3>
  <p className="text-sm text-[#535862] mb-4">
    탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
  </p>
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" className="w-full">
        회원 탈퇴
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>탈퇴하시겠습니까?</AlertDialogTitle>
        <AlertDialogDescription>
          탈퇴 시 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="border-[#D5D7DA]">돌아가기</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            deleteFetcher.submit(null, {
              method: "DELETE",
              action: "/api/users",
            });
          }}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          탈퇴하기
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
```

---

## 8. `users/components/mypage-sidebar-card.tsx` (수정)

사이드바 `ACTIVITY_MENU`에 "내 키워드북" 추가, "세이프티 설정" → "세이프티 수정" 이름 변경.

**변경 전:**
```typescript
const ACTIVITY_MENU = [
  { label: "팔로잉 목록", href: "/dashboard/likes?tab=following" },
  { label: "좋아요 목록", href: "/dashboard/likes?tab=likes" },
  { label: "세이프티 설정", href: "/account/edit?tab=safety" },
  { label: "이미지/캐릭터 생성", href: "/characters/create" },
];
```

**변경 후:**
```typescript
const ACTIVITY_MENU = [
  { label: "팔로잉 목록", href: "/dashboard/likes?tab=following" },
  { label: "좋아요 목록", href: "/dashboard/likes?tab=likes" },
  { label: "내 키워드북", href: "/account/edit?tab=keywords" },
  { label: "세이프티 수정", href: "/account/edit?tab=safety" },
  { label: "이미지/캐릭터 생성", href: "/characters/create" },
];
```

---

## 라이트 테마 컬러 시스템 (참고)

| 용도 | 컬러 |
|------|------|
| 배경 | `bg-[#F5F5F5]` |
| 카드 bg | `bg-white border border-[#D5D7DA]` |
| 제목 텍스트 | `text-[#181D27]` |
| 보조 텍스트 | `text-[#535862]` |
| 연한 텍스트 | `text-[#717680]` |
| 액센트 (CTA) | `bg-[#00c4af] hover:bg-[#00b39e] text-white` |
| 탭 활성 | `data-[state=active]:bg-[#00c4af] data-[state=active]:text-white` |
| 인증완료 배지 | `bg-[#E0F7F5] text-[#00897B]` |
| 미인증 배지 | `bg-red-50 text-red-500` |

## 검증

1. `sql/migrations/0014_add_profile_bio.sql` → SQL Editor에서 실행
2. `npm run db:typegen` → database.types.ts 재생성
3. `npm run typecheck` 통과
4. `/account/edit` → 3탭 렌더링 확인 (프로필 수정 / 내 키워드북 / 세이프티 수정)
5. Tab 1: 이미지 3:4 비율 영역, 클릭 시 파일 선택, 프리뷰 즉시 업데이트
6. Tab 1: 닉네임 카운터 (2-12자 실시간), 자기소개 카운터 (0-500)
7. Tab 1: [프로필 수정하기] → 성공 메시지
8. Tab 1: 비밀번호 변경 → 성공/에러 처리
9. Tab 1: [회원 탈퇴] → AlertDialog "탈퇴하시겠습니까?" → [돌아가기] 동작 확인
10. Tab 2: "준비 중입니다" placeholder
11. Tab 3: 본인인증/성인인증 — 미인증/인증완료 상태 라벨 표시
12. Tab 3: 인증 완료 다이얼로그 ("본인인증이 완료되었습니다." / "성인인증이 완료되었습니다.")
13. Tab 3: 세이프티 토글 — 성인인증 미완료 시 disabled
14. 사이드바 메뉴: "내 키워드북" 항목 추가, "세이프티 수정" 이름 변경
