# F10 Section 01: Admin 유저관리 3개 페이지

## 개요

어드민 유저관리 그룹의 서브페이지 3개를 Figma 기반으로 리디자인/신규 구현.
- **유저 목록 / 검색** — 기존 화면 리디자인
- **신고 내역 / 제재 관리** — 신규 (placeholder 대체)
- **권한 관리** — 신규 (placeholder 대체)

사이드바 메뉴도 수정: "신고 내역" + "제재 관리" → "신고 내역 / 제재 관리" 합침.

---

## 수정/생성 파일 (6개)

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/screens/users.tsx` | 수정 — Figma 리디자인 |
| 2 | `app/features/admin/api/users.tsx` | 수정 — verified_at 추가 |
| 3 | `app/features/admin/screens/reports.tsx` | **신규** — 신고 내역 / 제재 관리 |
| 4 | `app/features/admin/screens/permissions.tsx` | **신규** — 권한 관리 |
| 5 | `app/features/admin/components/admin-sidebar.tsx` | 수정 — 메뉴 합침 |
| 6 | `app/routes.ts` | 수정 — 라우트 변경 |

---

## 파일 1: `app/features/admin/screens/users.tsx` (리디자인)

기존 파일을 **전체 리라이트**. Figma 디자인 기반.

```tsx
import type { Route } from "./+types/users";

import { Search } from "lucide-react";
import { useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { requireAdmin } from "../lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Loader: /api/admin/users 에서 유저 목록 가져오기
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "20";

  const usersResponse = await fetch(
    new URL(
      `/api/admin/users?search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!usersResponse.ok) {
    throw new Response("Failed to load users", { status: 500 });
  }

  const usersData = await usersResponse.json();
  return { users: usersData.users, pagination: usersData.pagination, headers };
}

/* ── 상태 필터 탭 ── */
const STATUS_FILTERS = [
  { label: "전체", value: "" },
  { label: "이용중", value: "active", dotColor: "bg-green-500" },
  { label: "이용 제한", value: "restricted", dotColor: "bg-orange-500" },
  { label: "영구 정지", value: "banned", dotColor: "bg-red-500" },
] as const;

/* ── 상태 배지 컴포넌트 ── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    active: { dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700", label: "이용중" },
    restricted: { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", label: "이용 제한" },
    banned: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "이용 정지" },
  };
  const c = config[status] ?? config.active;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ── 본인인증 배지 ── */
function VerificationBadge({ verifiedAt }: { verifiedAt: string | null }) {
  const verified = !!verifiedAt;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${verified ? "text-green-600" : "text-gray-400"}`}>
      <span className={`size-1.5 rounded-full ${verified ? "bg-green-500" : "bg-gray-300"}`} />
      {verified ? "인증완료" : "인증안함"}
    </span>
  );
}

export default function AdminUsers() {
  const { users, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const currentStatus = searchParams.get("status") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/users?search=${encodeURIComponent(searchInput)}&status=${currentStatus}`);
  };

  const handleStatusFilter = (value: string) => {
    navigate(`/admin/users?search=${searchInput}&status=${value}`);
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="p-8 max-w-[1200px]">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-[#181D27] mb-1">유저 목록 / 검색</h1>
      <p className="text-sm text-[#535862] mb-6">
        닉네임, 이메일, ID로 유저를 검색하고 이용 상태를 관리할 수 있습니다.
      </p>

      {/* 검색 + 필터 */}
      <div className="flex items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-[520px]">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="닉네임 • 이메일 • 아이디 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
            />
          </div>
        </form>

        <div className="flex gap-2 ml-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleStatusFilter(f.value)}
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentStatus === f.value
                  ? "border-[#181D27] bg-white text-[#181D27]"
                  : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}
            >
              {"dotColor" in f && <span className={`size-2 rounded-full ${f.dotColor}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white mb-4">
        <div className="px-6 py-4 border-b border-[#E9EAEB]">
          <h2 className="text-base font-semibold text-[#181D27]">목록</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="rounded border-[#D5D7DA]" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">닉네임</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">이메일</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">아이디</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">상태</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">본인인증(성인) 상태</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.user_id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4">
                  <input type="checkbox" className="rounded border-[#D5D7DA]" />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-[#181D27]">
                    {user.display_name}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {user.display_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-[#181D27]">{user.display_name}</p>
                      <p className="text-xs text-[#535862]">{user.email ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[#535862]">
                  {`{${user.user_id.slice(0, 8)}}`}
                </td>
                <td className="px-4 py-4">
                  {/* 1차: 모든 유저 "이용중". 추후 status 컬럼 추가 시 교체 */}
                  <StatusBadge status="active" />
                </td>
                <td className="px-4 py-4">
                  <VerificationBadge verifiedAt={user.verified_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">{currentPage}/{totalPages} 페이지</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users?search=${searchInput}&status=${currentStatus}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
                )
              }
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/users?search=${searchInput}&status=${currentStatus}&offset=${pagination.offset + pagination.limit}`
                )
              }
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 2: `app/features/admin/api/users.tsx` (수정)

기존 코드에서 **select에 `verified_at` 추가**만 하면 됨.

변경 부분 (loader 함수 내 select):

```diff
  let query = db
    .select({
      user_id: profiles.profile_id,
      display_name: profiles.name,
      avatar_url: profiles.avatar_url,
+     verified_at: profiles.verified_at,
      created_at: profiles.created_at,
      updated_at: profiles.updated_at,
      points: {
        current_balance: userPoints.current_balance,
        total_earned: userPoints.total_earned,
        total_spent: userPoints.total_spent,
      },
    })
```

나머지 코드(action 포함)는 그대로 유지.

---

## 파일 3: `app/features/admin/screens/reports.tsx` (신규)

신고 내역 + 제재 관리 통합 페이지. Mock 데이터 사용 (DB 테이블 미존재).
`useState`로 리스트 뷰 / 상세 뷰 전환.

```tsx
import type { Route } from "./+types/reports";

import { ChevronDown, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

/* ── Loader ── */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

/* ── Mock 데이터 ── */
const MOCK_REPORTS = [
  { id: 1, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 2, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 3, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 4, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "기타", status: "처리대기" },
  { id: 5, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "스팸/도배", status: "처리대기" },
  { id: 6, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "유해한 콘텐츠", status: "처리완료" },
];

/* ── 필터 상수 ── */
const STATUS_OPTIONS = ["전체", "처리 대기", "처리 완료"];
const TYPE_OPTIONS = ["유저 신고", "캐릭터 신고", "채팅 신고"];
const REASON_OPTIONS = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];
const PERIOD_OPTIONS = ["오늘", "7일", "30일", "직접 선택"];
const SANCTION_TEMPLATES = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];

/* ── 필터 칩 ── */
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? "border-[#181D27] bg-white text-[#181D27] font-medium"
          : "border-[#D5D7DA] text-[#535862] hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

/* ── 상태 배지 ── */
function ReportStatusBadge({ status }: { status: string }) {
  const pending = status === "처리대기";
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${pending ? "text-red-600" : "text-green-600"}`}>
      <span className={`size-1.5 rounded-full ${pending ? "bg-red-500" : "bg-green-500"}`} />
      {status}
    </span>
  );
}

export default function AdminReports() {
  // 뷰 전환: null = 리스트, number = 상세
  const [selectedReport, setSelectedReport] = useState<typeof MOCK_REPORTS[number] | null>(null);

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState("오늘");

  // 제재 상태 (상세 뷰)
  const [sanctionType, setSanctionType] = useState("warning");
  const [sanctionTemplate, setSanctionTemplate] = useState("");
  const [sanctionMemo, setSanctionMemo] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const toggleArrayFilter = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  return (
    <div className="p-8 max-w-[1200px]">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-[#181D27] mb-1">신고 내역 / 제재 관리</h1>
      <p className="text-sm text-[#535862] mb-6">
        신고된 콘텐츠와 유저의 이용 상태를 확인하고 필요한 조치를 관리할 수 있습니다.
      </p>

      {/* 검색 */}
      <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 mb-6 max-w-[520px]">
        <Search className="size-5 text-[#717680]" />
        <input
          type="text"
          placeholder="닉네임 • 이메일 • 아이디 검색"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
        />
      </div>

      {/* ───── 상세 뷰 (selectedReport 있을 때) ───── */}
      {selectedReport && (
        <div className="space-y-6 mb-8">
          {/* 신고 요약 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="text-base font-semibold text-[#181D27] mb-3">신고 요약</h3>
            <div className="flex gap-2 mb-3">
              <span className="rounded-lg border border-[#D5D7DA] bg-[#F9FAFB] px-3 py-1 text-sm">
                {selectedReport.type}
              </span>
              <span className="rounded-lg border border-[#D5D7DA] bg-[#F9FAFB] px-3 py-1 text-sm">
                {selectedReport.reason}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#535862] mb-4">
              <span>👤 신고자 정보</span>
              <span>🕐 접수 일시 : yyyy.mm.dd 10:00</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[#181D27]">채팅 로그</h4>
              <a href="#" className="text-sm text-[#535862] hover:underline">
                해당 채팅으로 이동 ↗
              </a>
            </div>
            <div className="rounded-lg bg-[#FFF0E0] p-4">
              <p className="text-sm text-[#B54708]">🔴 부적절한 채팅 로그</p>
            </div>
          </div>

          {/* 제재 선택 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="text-base font-semibold text-[#181D27] mb-4">제재 선택</h3>
            <div className="space-y-3 mb-6">
              {[
                { value: "warning", label: "경고" },
                { value: "restricted", label: "이용 제한 (기간 선택)" },
                { value: "banned", label: "이용 정지 (영구)" },
                { value: "none", label: "조치 없음" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sanction"
                    value={opt.value}
                    checked={sanctionType === opt.value}
                    onChange={() => setSanctionType(opt.value)}
                    className="accent-[#181D27]"
                  />
                  <span className="text-sm text-[#414651]">{opt.label}</span>
                </label>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-[#181D27] mb-3">부가 옵션</h4>

            {/* 사유 템플릿 드롭다운 */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm text-[#535862]"
              >
                {sanctionTemplate || "사유 템플릿 선택"}
                <ChevronDown className="size-4" />
              </button>
              {showTemplateDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-[#E9EAEB] bg-white shadow-lg z-10">
                  {SANCTION_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSanctionTemplate(t);
                        setShowTemplateDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#414651] hover:bg-[#F9FAFB]"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 메모 */}
            <textarea
              value={sanctionMemo}
              onChange={(e) => setSanctionMemo(e.target.value)}
              placeholder="메모"
              className="w-full max-w-[400px] rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680] resize-none h-28"
            />

            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]"
              >
                <Pencil className="size-4" />
                조치 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── 필터 패널 (리스트 뷰에서만 or 항상) ───── */}
      {!selectedReport && (
        <div className="rounded-xl border border-orange-200 bg-[#FFF8F0] p-6 mb-6">
          <div className="grid grid-cols-3 gap-6 mb-4">
            {/* 상태 */}
            <div>
              <p className="text-sm font-semibold text-orange-600 mb-2">상태</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <FilterChip
                    key={s}
                    label={s}
                    selected={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                  />
                ))}
              </div>
            </div>

            {/* 유형 */}
            <div>
              <p className="text-sm font-semibold text-orange-600 mb-2">유형</p>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    selected={typeFilter.includes(t)}
                    onClick={() => toggleArrayFilter(typeFilter, t, setTypeFilter)}
                  />
                ))}
              </div>
            </div>

            {/* 사유 */}
            <div>
              <p className="text-sm font-semibold text-orange-600 mb-2">사유</p>
              <div className="flex flex-wrap gap-2">
                {REASON_OPTIONS.map((r) => (
                  <FilterChip
                    key={r}
                    label={r}
                    selected={reasonFilter.includes(r)}
                    onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 기간 + 검색 버튼 */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600 mb-2">기간</p>
              <div className="flex gap-2">
                {PERIOD_OPTIONS.map((p) => (
                  <FilterChip
                    key={p}
                    label={p}
                    selected={periodFilter === p}
                    onClick={() => setPeriodFilter(p)}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]"
            >
              <Search className="size-4" />
              검색
            </button>
          </div>
        </div>
      )}

      {/* ───── 신고 리스트 테이블 ───── */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="px-6 py-4 border-b border-[#E9EAEB]">
          <h2 className="text-base font-semibold text-[#181D27]">
            {selectedReport ? "제재 이력" : "신고 리스트"}
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="rounded border-[#D5D7DA]" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">신고 유형</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">신고대상</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">신고 사유</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">상태</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">조치</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_REPORTS.map((report) => (
              <tr key={report.id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4">
                  <input type="checkbox" className="rounded border-[#D5D7DA]" />
                </td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{report.type}</td>
                <td className="px-4 py-4 text-sm text-[#535862] whitespace-pre-line">{report.target}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{report.reason}</td>
                <td className="px-4 py-4">
                  <ReportStatusBadge status={report.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="rounded-lg border border-[#D5D7DA] px-3 py-1.5 text-xs text-[#535862] hover:bg-[#F9FAFB]"
                    >
                      상세 보기
                    </button>
                    <button type="button" className="text-[#717680] hover:text-[#181D27]">
                      <Trash2 className="size-4" />
                    </button>
                    <button type="button" className="text-[#717680] hover:text-[#181D27]">
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
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

## 파일 4: `app/features/admin/screens/permissions.tsx` (신규)

권한 관리 페이지. `/api/admin/users` API 재사용. 역할은 1차 하드코딩.

```tsx
import type { Route } from "./+types/permissions";

import { Search } from "lucide-react";
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

  const usersResponse = await fetch(
    new URL(
      `/api/admin/users?search=${encodeURIComponent(search)}&offset=${offset}&limit=${limit}`,
      request.url
    ).toString(),
    { headers: Object.fromEntries(request.headers.entries()) }
  );

  if (!usersResponse.ok) throw new Response("Failed to load users", { status: 500 });

  const usersData = await usersResponse.json();
  return data({ users: usersData.users, pagination: usersData.pagination }, { headers });
}

const ROLE_FILTERS = [
  { label: "전체", value: "" },
  { label: "일반 유저", value: "user", dotColor: "bg-gray-400" },
  { label: "공식 크리에이터", value: "creator", dotColor: "bg-green-500" },
] as const;

function RoleBadge({ role }: { role: string }) {
  const isCreator = role === "creator";
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${isCreator ? "text-green-600" : "text-gray-500"}`}>
      <span className={`size-1.5 rounded-full ${isCreator ? "bg-green-500" : "bg-gray-400"}`} />
      {isCreator ? "공식 크리에이터" : "일반 유저"}
    </span>
  );
}

export default function AdminPermissions() {
  const { users, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const currentRole = searchParams.get("role") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/admin/permissions?search=${encodeURIComponent(searchInput)}&role=${currentRole}`);
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="p-8 max-w-[1200px]">
      <h1 className="text-xl font-bold text-[#181D27] mb-1">권한 관리</h1>
      <p className="text-sm text-[#535862] mb-6">
        닉네임, 이메일, ID로 유저를 검색하고 이용 상태를 관리할 수 있습니다.
      </p>

      {/* 검색 + 필터 */}
      <div className="flex items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-[520px]">
          <div className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="닉네임 • 이메일 • 아이디 검색"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
            />
          </div>
        </form>

        <div className="flex gap-2 ml-auto">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() =>
                navigate(`/admin/permissions?search=${searchInput}&role=${f.value}`)
              }
              className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                currentRole === f.value
                  ? "border-[#181D27] bg-white text-[#181D27]"
                  : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
              }`}
            >
              {"dotColor" in f && f.dotColor && (
                <span className={`size-2 rounded-full ${f.dotColor}`} />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="px-6 py-4 border-b border-[#E9EAEB]">
          <h2 className="text-base font-semibold text-[#181D27]">목록</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3">
                <input type="checkbox" className="rounded border-[#D5D7DA]" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">닉네임</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">이메일</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">아이디</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#717680]">일반 유저 / 공식 크리에이터</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.user_id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4">
                  <input type="checkbox" className="rounded border-[#D5D7DA]" />
                </td>
                <td className="px-4 py-4 text-sm font-medium text-[#181D27]">
                  {user.display_name}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {user.display_name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-[#181D27]">{user.display_name}</p>
                      <p className="text-xs text-[#535862]">{user.email ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-[#535862]">
                  {`{${user.user_id.slice(0, 8)}}`}
                </td>
                <td className="px-4 py-4">
                  {/* 1차: 모든 유저 "일반 유저". 추후 역할 컬럼 추가 시 교체 */}
                  <RoleBadge role="user" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
          <span className="text-sm text-[#535862]">{currentPage}/{totalPages} 페이지</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/permissions?search=${searchInput}&role=${currentRole}&offset=${Math.max(0, pagination.offset - pagination.limit)}`
                )
              }
              disabled={pagination.offset === 0}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/permissions?search=${searchInput}&role=${currentRole}&offset=${pagination.offset + pagination.limit}`
                )
              }
              disabled={!pagination.hasMore}
              className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 파일 5: `app/features/admin/components/admin-sidebar.tsx` (수정)

유저관리 그룹의 `items` 배열만 수정:

```diff
  {
    id: "users",
    label: "유저관리",
    icon: Users,
    items: [
      { label: "유저 목록 / 검색", href: "/admin/users" },
-     { label: "신고 내역", href: "/admin/reports/users", badge: 10 },
-     { label: "제재 관리", href: "/admin/sanctions" },
+     { label: "신고 내역 / 제재 관리", href: "/admin/reports/users", badge: 10 },
      { label: "권한 관리", href: "/admin/permissions" },
    ],
  },
```

---

## 파일 6: `app/routes.ts` (수정)

어드민 라우트 블록 내에서:

```diff
- route("/reports/users", "features/admin/screens/placeholder.tsx", { id: "admin-reports-users" }),
- route("/sanctions", "features/admin/screens/placeholder.tsx", { id: "admin-sanctions" }),
- route("/permissions", "features/admin/screens/placeholder.tsx", { id: "admin-permissions" }),
+ route("/reports/users", "features/admin/screens/reports.tsx"),
+ route("/permissions", "features/admin/screens/permissions.tsx"),
```

나머지 admin 라우트는 그대로 유지.

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/users` → Figma 디자인 테이블 (체크박스/닉네임/이메일/아이디/상태/본인인증)
3. `/admin/reports/users` → 필터 패널 + 신고 리스트 (mock) + "상세 보기" 클릭 시 제재 뷰 전환
4. `/admin/permissions` → 역할 필터 + 유저 테이블
5. 사이드바 "유저관리" 하위: 3개 메뉴 ("유저 목록 / 검색", "신고 내역 / 제재 관리", "권한 관리")
6. `/admin/sanctions` 라우트 없음 (404)
