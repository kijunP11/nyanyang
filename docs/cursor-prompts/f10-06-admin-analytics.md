# F10-06 Admin Analytics: 사용 지표 대시보드

## 개요

어드민 "통계 / 모니터링" 그룹 4개 placeholder → 1개 통합 대시보드 페이지.
Figma에서 사용 지표 (DAU / MAU) 한 페이지에 KPI, 차트, 결제 전환율, 인기 랭킹 모두 포함.
나머지 3개 placeholder(stats/patterns, stats/revenue, stats/ranking) 삭제.

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/screens/stats-usage.tsx` | **신규** |
| 2 | `app/features/admin/components/admin-sidebar.tsx` | **수정** |
| 3 | `app/routes.ts` | **수정** |

---

## 파일 1: `app/features/admin/screens/stats-usage.tsx` (신규 생성)

아래 코드를 그대로 붙여넣기:

```tsx
/**
 * Admin 사용 지표 (DAU / MAU) — KPI, 차트, 결제 전환율, 인기 랭킹
 */
import type { Route } from "./+types/stats-usage";

import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { data } from "react-router";

import { Avatar, AvatarFallback } from "~/core/components/ui/avatar";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

/* ── Metric Card ── */

function MetricCard({
  heading,
  number,
  change,
  positive,
  showChart = true,
}: {
  heading: string;
  number: string;
  change?: number;
  positive?: boolean;
  showChart?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
      <p className="mb-1 text-sm text-[#535862]">{heading}</p>
      <p className="mb-2 text-3xl font-bold text-[#181D27]">{number}</p>
      {change != null && positive != null && (
        <div className="flex items-center gap-1">
          {positive ? (
            <ArrowUp className="size-4 text-green-600" />
          ) : (
            <ArrowDown className="size-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-500"}`}
          >
            {change}%
          </span>
          <span className="text-xs text-[#717680]">vs 전 달 대비</span>
        </div>
      )}
      {showChart && change != null && (
        <svg className="mt-3 h-8 w-full" viewBox="0 0 100 30" fill="none">
          <polyline
            points={
              positive
                ? "0,25 15,20 30,22 45,15 60,18 75,10 100,5"
                : "0,5 15,10 30,8 45,15 60,12 75,20 100,25"
            }
            stroke={positive ? "#22c55e" : "#ef4444"}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
}

/* ── Section Header ── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-0">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#181D27]">{title}</h3>
        <button type="button" className="text-[#717680] hover:text-[#181D27]">
          <MoreVertical className="size-5" />
        </button>
      </div>
      <div className="mt-3 h-px bg-[#E9EAEB]" />
    </div>
  );
}

/* ── Donut Chart (SVG) ── */

function DonutChart() {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.7;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#E9EAEB"
          strokeWidth="20"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#2ED3B0"
          strokeWidth="20"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-[#181D27]">316</span>
    </div>
  );
}

/* ── Line Chart (SVG Mock) ── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function LineChart() {
  return (
    <div>
      <div className="mb-4 flex justify-end gap-4">
        {[
          { label: "2021", color: "#2ED3B0" },
          { label: "2020", color: "#F4A0A0" },
          { label: "2019", color: "#D5D7DA" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[#535862]">{item.label}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 720 200" className="h-[200px] w-full" fill="none">
        {/* 2019 */}
        <polyline
          points="0,160 60,155 120,150 180,148 240,145 300,140 360,135 420,130 480,128 540,125 600,120 660,115"
          stroke="#D5D7DA"
          strokeWidth="2"
        />
        {/* 2020 */}
        <polyline
          points="0,140 60,130 120,125 180,115 240,110 300,100 360,95 420,90 480,85 540,80 600,75 660,70"
          stroke="#F4A0A0"
          strokeWidth="2"
        />
        {/* 2021 */}
        <polyline
          points="0,120 60,100 120,90 180,75 240,65 300,50 360,40 420,35 480,30 540,25 600,20 660,15"
          stroke="#2ED3B0"
          strokeWidth="2"
        />
      </svg>
      <div className="mt-2 flex justify-between">
        {MONTHS.map((m) => (
          <span key={m} className="text-xs text-[#717680]">{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Ranking Table ── */

const MOCK_CHARACTER_RANKING = [
  { rank: 1, name: "캐릭터명", tags: "#집착 #광공 #로맨스", date: "yyyy.mm.dd" },
  { rank: 2, name: "캐릭터명", tags: "#집착 #광공 #로맨스", date: "yyyy.mm.dd" },
  { rank: 3, name: "캐릭터명", tags: "#집착 #광공 #로맨스", date: "yyyy.mm.dd" },
  { rank: 4, name: "캐릭터명", tags: "#집착 #광공 #로맨스", date: "yyyy.mm.dd" },
  { rank: 5, name: "캐릭터명", tags: "#집착 #광공 #로맨스", date: "yyyy.mm.dd" },
];

const MOCK_CREATOR_RANKING = [
  { rank: 1, name: "Olivia Rhye", email: "olivia@untitledui.com", initials: "OR" },
  { rank: 2, name: "Phoenix Baker", email: "phoenix@untitledui.com", initials: "PB" },
  { rank: 3, name: "Lana Steiner", email: "lana@untitledui.com", initials: "LS" },
  { rank: 4, name: "Demi Wilkinson", email: "demi@untitledui.com", initials: "DW" },
  { rank: 5, name: "Candice Wu", email: "candice@untitledui.com", initials: "CW" },
];

function RankingTable({
  title,
  type,
}: {
  title: string;
  type: "character" | "creator";
}) {
  return (
    <div className="rounded-xl border border-[#E9EAEB] bg-white">
      <div className="flex items-center justify-between border-b border-[#E9EAEB] px-6 py-4">
        <h3 className="text-base font-semibold text-[#181D27]">{title}</h3>
        <button type="button" className="text-[#717680] hover:text-[#181D27]">
          <MoreVertical className="size-5" />
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E9EAEB]">
            <th className="w-[60px] px-4 py-3 text-left text-xs font-medium text-[#717680]">
              순위
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">
              {type === "character" ? "캐릭터명" : "이메일"}
            </th>
            <th className="w-[125px] px-4 py-3 text-left text-xs font-medium text-[#717680]">
              <span className="flex items-center gap-1">
                이용 수
                <svg className="size-3 text-[#717680]" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2l3 4H3zM6 10l3-4H3z" />
                </svg>
              </span>
            </th>
            <th className="w-[116px] px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {type === "character"
            ? MOCK_CHARACTER_RANKING.map((item) => (
                <tr
                  key={item.rank}
                  className="border-b border-[#E9EAEB] last:border-0"
                >
                  <td className="px-4 py-4 text-sm text-[#181D27]">
                    {item.rank}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-[#F5F5F5] text-xs text-[#717680]">
                          {item.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#535862]">{item.tags}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    {item.date}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="text-[#717680] hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            : MOCK_CREATOR_RANKING.map((item) => (
                <tr
                  key={item.rank}
                  className="border-b border-[#E9EAEB] last:border-0"
                >
                  <td className="px-4 py-4 text-sm text-[#181D27]">
                    {item.rank}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarFallback className="bg-[#F5F5F5] text-xs text-[#717680]">
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#181D27]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#535862]">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#535862]">
                    yyyy.mm.dd
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[#717680] hover:text-[#181D27]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="text-[#717680] hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-[#E9EAEB] px-6 py-3">
        <button
          type="button"
          className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm"
        >
          이전
        </button>
        <span className="text-sm text-[#535862]">1 페이지/ 10 페이지</span>
        <button
          type="button"
          className="rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm"
        >
          다음
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function AdminStatsUsage() {
  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">사용 지표</h1>
      <p className="mb-8 text-sm text-[#535862]">
        서비스 이용 현황과 주요 지표를 한눈에 확인할 수 있습니다.
      </p>

      {/* ── 섹션 A: KPI ── */}
      <h2 className="mb-4 text-lg font-semibold text-[#181D27]">KPI</h2>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard
          heading="전체 유저 수"
          number="2,420"
          change={40}
          positive={true}
        />
        <MetricCard
          heading="오늘 활성 유저(DAU)"
          number="1,210"
          change={10}
          positive={false}
        />
        <MetricCard
          heading="시스템 상태"
          number="정상"
          showChart={false}
        />
      </div>

      {/* ── 섹션 B: 차트 ── */}
      <div className="mb-8 flex gap-6">
        <div className="w-[280px] shrink-0">
          <SectionHeader title="모델별 사용 비율" />
          <div className="mt-6 flex justify-center">
            <DonutChart />
          </div>
        </div>
        <div className="flex-1">
          <SectionHeader title="캐릭터 대화 빈도" />
          <div className="mt-6">
            <LineChart />
          </div>
        </div>
      </div>

      {/* ── 섹션 C: 결제 전환율 ── */}
      <h2 className="mb-4 text-lg font-semibold text-[#181D27]">결제 전환율</h2>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard
          heading="결제 전환율"
          number="5.8%"
          change={40}
          positive={true}
        />
        <MetricCard
          heading="ARPU"
          number="12,500원"
          change={10}
          positive={false}
        />
        <MetricCard
          heading="일별 매출"
          number="1,200,000"
          change={40}
          positive={true}
        />
      </div>

      {/* ── 섹션 D: 인기 랭킹 ── */}
      <h2 className="mb-4 text-lg font-semibold text-[#181D27]">인기 랭킹</h2>
      <div className="space-y-8">
        <RankingTable title="캐릭터 랭킹" type="character" />
        <RankingTable title="제작자 랭킹" type="creator" />
      </div>
    </div>
  );
}
```

---

## 파일 2: `app/features/admin/components/admin-sidebar.tsx` (수정)

"통계 / 모니터링" 그룹의 items를 4개 → 1개로 변경:

**찾기:**
```typescript
    { label: "사용 지표 (DAU / MAU)", href: "/admin/stats/usage" },
    { label: "사용 패턴 분석", href: "/admin/stats/patterns", badge: 10 },
    { label: "매출 / 경제 지표", href: "/admin/stats/revenue" },
    { label: "랭킹", href: "/admin/stats/ranking" },
```

**바꾸기:**
```typescript
    { label: "사용 지표 (DAU / MAU)", href: "/admin/stats/usage" },
```

---

## 파일 3: `app/routes.ts` (수정)

admin prefix 내부에서 stats 관련 4개 placeholder를 1개 실제 화면으로 교체:

**찾기:**
```typescript
      route("/stats/usage", "features/admin/screens/placeholder.tsx", {
        id: "admin-stats-usage",
      }),
      route("/stats/patterns", "features/admin/screens/placeholder.tsx", {
        id: "admin-stats-patterns",
      }),
      route("/stats/revenue", "features/admin/screens/placeholder.tsx", {
        id: "admin-stats-revenue",
      }),
      route("/stats/ranking", "features/admin/screens/placeholder.tsx", {
        id: "admin-stats-ranking",
      }),
```

**바꾸기:**
```typescript
      route("/stats/usage", "features/admin/screens/stats-usage.tsx"),
```

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/stats/usage` → KPI 3카드 + 차트 2개 + 결제 전환율 3카드 + 랭킹 테이블 2개
3. 사이드바 "통계 / 모니터링" 메뉴 1개 항목 확인
4. `/admin/stats/patterns`, `/admin/stats/revenue`, `/admin/stats/ranking` 라우트 삭제 확인
