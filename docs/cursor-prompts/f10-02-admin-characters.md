# F10 Character 섹션: Admin 캐릭터 관리 4개 페이지

## 개요

어드민 캐릭터 관리 그룹 4개 서브페이지 리디자인/신규 구현.
- **캐릭터 목록** — 기존 카드 UI → Figma 테이블 리디자인
- **신고 캐릭터** — 신규 (placeholder 대체)
- **승인 / 숨김 관리** — 신규 (placeholder 대체)
- **태그 / 세이프티 설정** — 신규 (placeholder 대체)

---

## 수정/생성 파일 (6개)

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/api/characters.tsx` | 수정 — API 확장 |
| 2 | `app/features/admin/screens/characters.tsx` | 수정 — 테이블 리디자인 |
| 3 | `app/features/admin/screens/character-reports.tsx` | **신규** — 신고 캐릭터 |
| 4 | `app/features/admin/screens/character-moderation.tsx` | **신규** — 승인 / 숨김 관리 |
| 5 | `app/features/admin/screens/character-settings.tsx` | **신규** — 태그 / 세이프티 설정 |
| 6 | `app/routes.ts` | 수정 — 새 화면 연결 |

---

## 스키마 ↔ Figma 매핑 (중요!)

### 캐릭터 상태
| DB 값 | Figma 표시 |
|--------|-----------|
| `approved` + `is_public: true` | 공개 (초록) |
| `approved` + `is_public: false` | 비공개 |
| `archived` | 숨김 (주황) |
| `rejected` | 블라인드 (빨강) |
| `draft` / `pending_review` | 비공개 |

### 세이프티 설정
| DB 값 | Figma 표시 |
|--------|-----------|
| `age_rating: "everyone"` | 전체 이용가 (초록) |
| `age_rating` != "everyone" 또는 `is_nsfw: true` | 청소년 이용불가 (빨강) |

### "작품명" = `tagline` 필드. 없으면 "—" 표시.

---

## 파일 1: `app/features/admin/api/characters.tsx` (수정)

기존 API의 loader에 2가지 변경 필요:

### 변경 1: `status=all` 지원

기존: `status` 파라미터가 항상 `where(eq(characters.status, status))` 적용.
변경: `status === "all"`이면 where 절 생략 (전체 조회).

```diff
- const status = (url.searchParams.get("status") || "pending_review") as ...;
+ const status = url.searchParams.get("status") || "all";

  // ...

- .where(eq(characters.status, status))
+ // status가 "all"이면 where 생략
```

구체적으로:
```ts
const baseQuery = db
  .select()
  .from(characters)
  .innerJoin(profiles, eq(characters.creator_id, profiles.profile_id))
  .orderBy(desc(characters.created_at))
  .limit(limit)
  .offset(offset);

const allCharacters = status === "all"
  ? await baseQuery
  : await baseQuery.where(eq(characters.status, status as any));
```

count 쿼리도 동일하게:
```ts
const countQuery = status === "all"
  ? db.select({ count: sql<number>`count(*)::int` }).from(characters)
  : db.select({ count: sql<number>`count(*)::int` }).from(characters).where(eq(characters.status, status as any));
const [countResult] = await countQuery;
```

### 변경 2: 응답에 `tags`, `tagline`, `age_rating`, `is_nsfw` 추가

```diff
  const charactersList = allCharacters.map((row) => ({
    character_id: (row.characters as any).character_id,
    name: row.characters.name,
    display_name: row.characters.display_name,
    description: row.characters.description,
    avatar_url: row.characters.avatar_url,
+   tagline: row.characters.tagline,
+   tags: row.characters.tags,
+   age_rating: row.characters.age_rating,
    category: row.characters.category,
    is_public: row.characters.is_public,
    is_nsfw: row.characters.is_nsfw,
    status: row.characters.status,
    // ... 나머지 동일
  }));
```

나머지 action 코드(approve/reject/delete)는 그대로 유지.

---

## 파일 2: `app/features/admin/screens/characters.tsx` (리디자인)

기존 카드 그리드 → **전체 리라이트**.

```tsx
import type { Route } from "./+types/characters";

import { Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  // status=all로 전체 캐릭터 가져옴
  const res = await fetch(
    new URL(
      `/api/admin/characters?status=all&search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!res.ok) throw new Response("Failed to load characters", { status: 500 });
  const result = await res.json();
  return data(
    { characters: result.characters, pagination: result.pagination },
    { headers }
  );
}

/* ── 필터 탭 ── */
const STATUS_FILTERS = [
  { label: "전체", value: "" },
  { label: "공개", value: "public", dotColor: "bg-green-500" },
  { label: "비공개", value: "private", dotColor: "bg-gray-400" },
  { label: "숨김", value: "hidden", dotColor: "bg-orange-500" },
  { label: "블라인드", value: "blind", dotColor: "bg-red-500" },
] as const;

/* ── 상태 매핑 헬퍼 ── */
function getDisplayStatus(char: any): { label: string; color: string; dot: string } {
  if (char.status === "rejected") return { label: "블라인드", color: "text-red-600", dot: "bg-red-500" };
  if (char.status === "archived") return { label: "숨김", color: "text-orange-600", dot: "bg-orange-500" };
  if (char.status === "approved" && char.is_public) return { label: "공개", color: "text-green-600", dot: "bg-green-500" };
  // draft, pending_review, approved+not_public
  return { label: "비공개", color: "text-gray-500", dot: "bg-gray-400" };
}

export default function AdminCharacters() {
  const { characters: chars, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const currentFilter = searchParams.get("filter") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/characters?search=${encodeURIComponent(searchInput)}&filter=${currentFilter}`);
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">캐릭터 목록 / 검색</h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터를 조회하고 공개 상태 및 제재 여부를 관리할 수 있습니다.
      </p>

      {/* 검색 + 필터 */}
      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="max-w-[520px] flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 · 제작자 · 태그로 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
            />
          </div>
        </form>
        <div className="ml-auto flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => navigate(`/admin/characters?search=${searchInput}&filter=${f.value}`)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentFilter === f.value
                  ? "border-[#181D27] bg-white text-[#181D27]"
                  : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}
            >
              {"dotColor" in f && f.dotColor && <span className={`size-2 rounded-full ${f.dotColor}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">목록</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">캐릭터 이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">제작자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">태그</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">신고 여부</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chars.map((char: any) => {
              const ds = getDisplayStatus(char);
              return (
                <tr key={char.character_id} className="border-b border-[#E9EAEB] last:border-0">
                  <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                  <td className="px-4 py-4 text-sm font-medium text-[#181D27]">{char.display_name}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={char.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{char.creator?.display_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">{char.creator?.display_name}</p>
                        <p className="text-xs text-[#535862]">{char.creator?.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.tags?.length ? char.tags.map((t: string) => `#${t}`).join("") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ds.color}`}>
                      <span className={`size-1.5 rounded-full ${ds.dot}`} />
                      {ds.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">없음</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Pencil className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">{currentPage}/{totalPages} 페이지</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/characters?search=${searchInput}&filter=${currentFilter}&offset=${Math.max(0, pagination.offset - pagination.limit)}`)}
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >이전</button>
            <button
              type="button"
              onClick={() => navigate(`/admin/characters?search=${searchInput}&filter=${currentFilter}&offset=${pagination.offset + pagination.limit}`)}
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 3: `app/features/admin/screens/character-reports.tsx` (신규)

`reports.tsx` 패턴 재사용. Mock 데이터. 캐릭터 전용 사유 9개.

```tsx
import type { Route } from "./+types/character-reports";

import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

const MOCK_REPORTS = [
  { id: 1, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "성적·선정적 콘텐츠", status: "처리대기" },
  { id: 2, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "욕설·비방·괴롭힘", status: "처리대기" },
  { id: 3, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "저작권·초상권 침해", status: "처리대기" },
  { id: 4, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "서비스 정책 위반", status: "처리대기" },
  { id: 5, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "저작권·초상권 침해", status: "처리대기" },
  { id: 6, type: "캐릭터 신고", target: "(닉네임)\n(id:12345)", reason: "허위 정보 / 사기성 콘텐츠", status: "처리완료" },
];

const STATUS_OPTIONS = ["전체", "처리 대기", "처리 완료"];
const TYPE_OPTIONS = ["캐릭터 신고"];
const REASON_OPTIONS = [
  "성적·선정적 콘텐츠",
  "폭력적·혐오 표현",
  "불법·위험 행위 유도",
  "욕설·비방·괴롭힘",
  "허위 정보 / 사기성 콘텐츠",
  "저작권·초상권 침해",
  "스팸·광고성 콘텐츠",
  "서비스 정책 위반",
  "기타",
];
const PERIOD_OPTIONS = ["오늘", "7일", "30일", "직접 선택"];

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        selected ? "border-[#181D27] bg-white font-medium text-[#181D27]" : "border-[#D5D7DA] text-[#535862] hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const pending = status === "처리대기";
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${pending ? "text-red-600" : "text-green-600"}`}>
      <span className={`size-1.5 rounded-full ${pending ? "bg-red-500" : "bg-green-500"}`} />
      {status}
    </span>
  );
}

export default function AdminCharacterReports() {
  const [statusFilter, setStatusFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState("오늘");

  const toggleArrayFilter = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">캐릭터 목록 / 검색</h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터를 조회하고 공개 상태 및 제재 여부를 관리할 수 있습니다.
      </p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="캐릭터 이름 · 제작자 · 태그로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {/* 필터 패널 */}
      <div className="mb-6 rounded-xl border border-orange-200 bg-[#FFF8F0] p-6">
        <div className="mb-4 grid grid-cols-3 gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-orange-600">상태</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <FilterChip key={s} label={s} selected={statusFilter === s} onClick={() => setStatusFilter(s)} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-orange-600">유형</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => (
                <FilterChip key={t} label={t} selected={typeFilter.includes(t)} onClick={() => toggleArrayFilter(typeFilter, t, setTypeFilter)} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-orange-600">사유</p>
            <div className="flex flex-wrap gap-2">
              {REASON_OPTIONS.map((r) => (
                <FilterChip key={r} label={r} selected={reasonFilter.includes(r)} onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-orange-600">기간</p>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map((p) => (
                <FilterChip key={p} label={p} selected={periodFilter === p} onClick={() => setPeriodFilter(p)} />
              ))}
            </div>
          </div>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
            <Search className="size-4" /> 검색
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">신고 리스트</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">신고 유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">신고대상</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">신고 사유</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">조치</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_REPORTS.map((report) => (
              <tr key={report.id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{report.type}</td>
                <td className="whitespace-pre-line px-4 py-4 text-sm text-[#535862]">{report.target}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{report.reason}</td>
                <td className="px-4 py-4"><ReportStatusBadge status={report.status} /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <button type="button" className="rounded-lg border border-[#D5D7DA] px-3 py-1.5 text-xs text-[#535862] hover:bg-[#F9FAFB]">상세 보기</button>
                    <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">1/10 페이지</span>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm">이전</button>
            <button type="button" className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 4: `app/features/admin/screens/character-moderation.tsx` (신규)

승인 / 숨김 관리. API에서 실제 캐릭터 데이터 사용.

```tsx
import type { Route } from "./+types/character-moderation";

import { MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  const res = await fetch(
    new URL(
      `/api/admin/characters?status=all&search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!res.ok) throw new Response("Failed to load characters", { status: 500 });
  const result = await res.json();
  return data({ characters: result.characters, pagination: result.pagination }, { headers });
}

const STATUS_FILTERS = [
  { label: "전체", value: "" },
  { label: "이용중", value: "active", dotColor: "bg-green-500" },
  { label: "숨김", value: "hidden", dotColor: "bg-orange-500" },
  { label: "블라인드", value: "blind", dotColor: "bg-red-500" },
] as const;

function getModStatus(char: any): { label: string; color: string; dot: string } {
  if (char.status === "rejected") return { label: "블라인드", color: "text-red-600", dot: "bg-red-500" };
  if (char.status === "archived") return { label: "숨김", color: "text-orange-600", dot: "bg-orange-500" };
  return { label: "공개", color: "text-green-600", dot: "bg-green-500" };
}

export default function AdminCharacterModeration() {
  const { characters: chars, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const currentFilter = searchParams.get("filter") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/characters/moderation?search=${encodeURIComponent(searchInput)}&filter=${currentFilter}`);
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">승인 / 숨김 관리</h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터를 조회하고 공개 상태 및 제재 여부를 관리할 수 있습니다.
      </p>

      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="max-w-[520px] flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 · 제작자 · 태그로 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
          </div>
        </form>
        <div className="ml-auto flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} type="button"
              onClick={() => navigate(`/admin/characters/moderation?search=${searchInput}&filter=${f.value}`)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentFilter === f.value ? "border-[#181D27] bg-white text-[#181D27]" : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}>
              {"dotColor" in f && f.dotColor && <span className={`size-2 rounded-full ${f.dotColor}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="flex items-center justify-between border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">리스트</h2>
          <button type="button" className="text-[#717680] hover:text-[#181D27]"><MoreVertical className="size-5" /></button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">캐릭터명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">작품명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">만든 일자 ↓</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chars.map((char: any) => {
              const ms = getModStatus(char);
              return (
                <tr key={char.character_id} className="border-b border-[#E9EAEB] last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={char.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{char.display_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">{char.display_name}</p>
                        <p className="text-xs text-[#535862]">
                          {char.tags?.length ? char.tags.map((t: string) => `#${t}`).join(" ") : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">{char.tagline || "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ms.color}`}>
                      <span className={`size-1.5 rounded-full ${ms.dot}`} /> {ms.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.created_at ? new Date(char.created_at).toLocaleDateString("ko-KR") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Pencil className="size-4" /></button>
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => navigate(`/admin/characters/moderation?search=${searchInput}&filter=${currentFilter}&offset=${Math.max(0, pagination.offset - pagination.limit)}`)}
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40">이전</button>
            <button type="button"
              onClick={() => navigate(`/admin/characters/moderation?search=${searchInput}&filter=${currentFilter}&offset=${pagination.offset + pagination.limit}`)}
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 5: `app/features/admin/screens/character-settings.tsx` (신규)

태그 / 세이프티 설정. API에서 실제 캐릭터 데이터 + age_rating/is_nsfw 사용.

```tsx
import type { Route } from "./+types/character-settings";

import { MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { data, useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  const res = await fetch(
    new URL(
      `/api/admin/characters?status=all&search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!res.ok) throw new Response("Failed to load characters", { status: 500 });
  const result = await res.json();
  return data({ characters: result.characters, pagination: result.pagination }, { headers });
}

const SAFETY_FILTERS = [
  { label: "전체", value: "" },
  { label: "전체 이용가", value: "everyone", dotColor: "bg-green-500" },
  { label: "청소년 이용불가", value: "mature", dotColor: "bg-red-500" },
] as const;

function getSafety(char: any): { label: string; color: string; dot: string } {
  if (char.is_nsfw || (char.age_rating && char.age_rating !== "everyone")) {
    return { label: "청소년 이용불가", color: "text-red-600", dot: "bg-red-500" };
  }
  return { label: "전체 이용가", color: "text-green-600", dot: "bg-green-500" };
}

export default function AdminCharacterSettings() {
  const { characters: chars, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const currentFilter = searchParams.get("filter") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/characters/settings?search=${encodeURIComponent(searchInput)}&filter=${currentFilter}`);
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">태그 / 세이프티 설정</h1>
      <p className="mb-6 text-sm text-[#535862]">
        등록된 캐릭터를 조회하고 공개 상태 및 제재 여부를 관리할 수 있습니다.
      </p>

      <div className="mb-6 flex items-center gap-4">
        <form onSubmit={handleSearch} className="max-w-[520px] flex-1">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 · 제작자 · 태그로 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
          </div>
        </form>
        <div className="ml-auto flex gap-2">
          {SAFETY_FILTERS.map((f) => (
            <button key={f.value} type="button"
              onClick={() => navigate(`/admin/characters/settings?search=${searchInput}&filter=${f.value}`)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentFilter === f.value ? "border-[#181D27] bg-white text-[#181D27]" : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}>
              {"dotColor" in f && f.dotColor && <span className={`size-2 rounded-full ${f.dotColor}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="flex items-center justify-between border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">리스트</h2>
          <button type="button" className="text-[#717680] hover:text-[#181D27]"><MoreVertical className="size-5" /></button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">캐릭터명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">작품명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">태그 수정</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">세이프티 설정</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">만든 일자 ↓</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {chars.map((char: any) => {
              const sf = getSafety(char);
              return (
                <tr key={char.character_id} className="border-b border-[#E9EAEB] last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={char.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{char.display_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-[#181D27]">{char.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">{char.tagline || "—"}</td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.tags?.length ? char.tags.map((t: string) => `#${t}`).join(" ") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${sf.color}`}>
                      <span className={`size-1.5 rounded-full ${sf.dot}`} /> {sf.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {char.created_at ? new Date(char.created_at).toLocaleDateString("ko-KR") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Pencil className="size-4" /></button>
                      <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => navigate(`/admin/characters/settings?search=${searchInput}&filter=${currentFilter}&offset=${Math.max(0, pagination.offset - pagination.limit)}`)}
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40">이전</button>
            <button type="button"
              onClick={() => navigate(`/admin/characters/settings?search=${searchInput}&filter=${currentFilter}&offset=${pagination.offset + pagination.limit}`)}
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 6: `app/routes.ts` (수정)

어드민 라우트 블록 내에서:

```diff
- route("/reports/characters", "features/admin/screens/placeholder.tsx", { id: "admin-reports-characters" }),
- route("/characters/moderation", "features/admin/screens/placeholder.tsx", { id: "admin-characters-moderation" }),
- route("/characters/settings", "features/admin/screens/placeholder.tsx", { id: "admin-characters-settings" }),
+ route("/reports/characters", "features/admin/screens/character-reports.tsx"),
+ route("/characters/moderation", "features/admin/screens/character-moderation.tsx"),
+ route("/characters/settings", "features/admin/screens/character-settings.tsx"),
```

나머지 admin 라우트는 그대로 유지.

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/characters` → Figma 테이블 (캐릭터이름/제작자/태그/상태/신고여부) + 필터 탭
3. `/admin/reports/characters` → 필터 패널(9개 캐릭터 사유) + 신고 리스트 (mock)
4. `/admin/characters/moderation` → 필터 탭(이용중/숨김/블라인드) + 리스트(캐릭터명/작품명/Status/만든일자)
5. `/admin/characters/settings` → 세이프티 필터(전체이용가/청소년이용불가) + 리스트(캐릭터명/작품명/태그/세이프티/만든일자)
6. 3개 placeholder 라우트 실제 화면으로 교체 확인
