# F10-04: Admin 결제/포인트 — Payments 섹션

> 어드민 "결제 / 포인트" 그룹 4개 placeholder → 3개 실제 화면 구현 + 사이드바 메뉴 통합

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/screens/payment-list.tsx` | **신규** — 결제 내역 조회 |
| 2 | `app/features/admin/screens/payment-refunds.tsx` | **신규** — 결제 상세 / 환불 처리 |
| 3 | `app/features/admin/screens/points-management.tsx` | **신규** — 포인트/티켓/추천인 3탭 |
| 4 | `app/features/admin/components/admin-sidebar.tsx` | **수정** — 메뉴 항목 통합 (4→3) |
| 5 | `app/routes.ts` | **수정** — 4개 placeholder → 3개 실제 화면, referrals 삭제 |

## 기존 코드 참조

| 참조 | 파일 |
|------|------|
| requireAdmin | `app/features/admin/lib/guards.server.ts` |
| 상세 뷰 패턴 (카드+라디오+드롭다운+메모) | `app/features/admin/screens/reports.tsx` |
| 사이드바 | `app/features/admin/components/admin-sidebar.tsx` |

## 상태 배지 매핑 (전체 공통)

```typescript
function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; dot: string }> = {
    "처리 완료": { color: "text-green-600", dot: "bg-green-500" },
    "처리 대기": { color: "text-orange-600", dot: "bg-orange-500" },
    "결제 취소": { color: "text-gray-500", dot: "bg-gray-400" },
    "환불 완료": { color: "text-red-600", dot: "bg-red-500" },
  };
  const c = config[status] ?? { color: "text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.color}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
```

---

## 파일 1: `app/features/admin/screens/payment-list.tsx` (신규)

Mock 데이터. 필터 탭 + 결제 테이블.

### 전체 코드

```tsx
/**
 * Admin 결제 내역 조회 — Mock 데이터, 필터 탭 + 테이블
 */
import type { Route } from "./+types/payment-list";

import { Search } from "lucide-react";
import { useState } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

const MOCK_PAYMENTS = [
  { id: 1, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 완료" },
  { id: 2, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 3, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 4, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 5, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 6, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "환불 완료" },
];

const STATUS_FILTERS = ["전체", "처리 대기", "처리 완료", "결제 취소", "환불 완료"];

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; dot: string }> = {
    "처리 완료": { color: "text-green-600", dot: "bg-green-500" },
    "처리 대기": { color: "text-orange-600", dot: "bg-orange-500" },
    "결제 취소": { color: "text-gray-500", dot: "bg-gray-400" },
    "환불 완료": { color: "text-red-600", dot: "bg-red-500" },
  };
  const c = config[status] ?? { color: "text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.color}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function AdminPaymentList() {
  const [currentFilter, setCurrentFilter] = useState("전체");

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">결제 내역 조회</h1>
      <p className="mb-6 text-sm text-[#535862]">
        유저의 결제 내역을 확인하고 결제 상태를 관리할 수 있습니다.
      </p>

      {/* 검색바 */}
      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="유저 · 주문번호 · 결제수단으로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {/* 필터 탭 */}
      <div className="mb-6 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCurrentFilter(f)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              currentFilter === f
                ? "border-[#181D27] bg-white text-[#181D27]"
                : "border-[#D5D7DA] text-[#535862] hover:bg-[#F9FAFB]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 결제 내역 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">결제 내역</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 일시</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">유저</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 수단</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 내역</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{p.datetime}</td>
                <td className="whitespace-pre-line px-4 py-4 text-sm text-[#535862]">{p.user}</td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{p.amount}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{p.method}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{p.detail}</td>
                <td className="px-4 py-4"><PaymentStatusBadge status={p.status} /></td>
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

## 파일 2: `app/features/admin/screens/payment-refunds.tsx` (신규)

결제 상세 + 환불 폼 (2열 레이아웃) + 하단 결제 내역 테이블. Mock 데이터.

### 전체 코드

```tsx
/**
 * Admin 결제 상세 / 환불 처리 — Mock 데이터, 상세 카드 + 환불 폼 + 테이블
 */
import type { Route } from "./+types/payment-refunds";

import { ChevronDown, CreditCard, Clock, FileText, Pencil, Search, User } from "lucide-react";
import { useState } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

const MOCK_PAYMENTS = [
  { id: 1, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 완료" },
  { id: 2, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 3, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 4, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 5, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "처리 대기" },
  { id: 6, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", amount: "9,900원", method: "(결제정보)", detail: "(결제 내역)", status: "환불 완료" },
];

const REFUND_REASON_TEMPLATES = ["단순 변심", "서비스 불만", "중복 결제", "오류 결제", "기타"];

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; dot: string }> = {
    "처리 완료": { color: "text-green-600", dot: "bg-green-500" },
    "처리 대기": { color: "text-orange-600", dot: "bg-orange-500" },
    "결제 취소": { color: "text-gray-500", dot: "bg-gray-400" },
    "환불 완료": { color: "text-red-600", dot: "bg-red-500" },
  };
  const c = config[status] ?? { color: "text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${c.color}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function AdminPaymentRefunds() {
  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMemo, setRefundMemo] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">결제 상세 / 환불 처리</h1>
      <p className="mb-6 text-sm text-[#535862]">
        신고된 콘텐츠와 유저의 이용 상태를 확인하고 필요한 조치를 관리할 수 있습니다.
      </p>

      {/* 검색바 */}
      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="유저 · 주문번호 · 결제수단으로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {/* 상단 2열 레이아웃 */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        {/* 좌측 — 결제 상세 정보 */}
        <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-[#181D27]">결제 상세 정보</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[#535862]"><User className="size-4" /> 결제 번호</span>
              <span className="text-sm text-[#181D27]">p-sdsdsds_001</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[#535862]"><Clock className="size-4" /> 결제 일시</span>
              <span className="text-sm text-[#181D27]">yyyy.mm.dd 10:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[#535862]"><CreditCard className="size-4" /> 결제 수단</span>
              <span className="text-sm text-[#181D27]">카드</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[#535862]"><FileText className="size-4" /> 결제 상태</span>
              <span className="text-sm text-[#181D27]">결제 완료</span>
            </div>
          </div>
        </div>

        {/* 우측 — 환불 사유 선택 */}
        <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-[#181D27]">환불 사유 선택</h3>
          <div className="mb-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="refundType" value="full" checked={refundType === "full"} onChange={() => setRefundType("full")} className="accent-[#181D27]" />
              <span className="text-sm text-[#414651]">전액</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="refundType" value="partial" checked={refundType === "partial"} onChange={() => setRefundType("partial")} className="accent-[#181D27]" />
              <span className="text-sm text-[#414651]">부분 환불</span>
            </label>
          </div>
          <input
            type="text"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="금액"
            className="mb-4 w-full rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm outline-none placeholder:text-[#717680]"
          />
          <h4 className="mb-3 text-sm font-semibold text-[#181D27]">부가 옵션</h4>
          <div className="relative mb-4">
            <button type="button" onClick={() => setShowReasonDropdown(!showReasonDropdown)} className="flex w-full items-center justify-between rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm text-[#535862]">
              {refundReason || "환불 사유 선택"}
              <ChevronDown className="size-4" />
            </button>
            {showReasonDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-[#E9EAEB] bg-white shadow-lg">
                {REFUND_REASON_TEMPLATES.map((r) => (
                  <button key={r} type="button" onClick={() => { setRefundReason(r); setShowReasonDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-[#414651] hover:bg-[#F9FAFB]">
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={refundMemo}
            onChange={(e) => setRefundMemo(e.target.value)}
            placeholder="메모"
            className="h-28 w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680]"
          />
          <div className="mt-4 flex justify-end">
            <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
              <Pencil className="size-4" />
              환불 처리 버튼
            </button>
          </div>
        </div>
      </div>

      {/* 하단 결제 내역 테이블 */}
      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">결제 내역</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E9EAEB]">
              <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 일시</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">유저</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 수단</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">결제 내역</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id} className="border-b border-[#E9EAEB] last:border-0">
                <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{p.datetime}</td>
                <td className="whitespace-pre-line px-4 py-4 text-sm text-[#535862]">{p.user}</td>
                <td className="px-4 py-4 text-sm text-[#181D27]">{p.amount}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{p.method}</td>
                <td className="px-4 py-4 text-sm text-[#535862]">{p.detail}</td>
                <td className="px-4 py-4"><PaymentStatusBadge status={p.status} /></td>
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

## 파일 3: `app/features/admin/screens/points-management.tsx` (신규)

3개 탭 (포인트/티켓/추천인) useState 전환. Mock 데이터.

### 전체 코드

```tsx
/**
 * Admin 포인트 / 티켓 관리 / 추천인 — 3탭 전환, Mock 데이터
 */
import type { Route } from "./+types/points-management";

import { ChevronDown, Pencil, Search, User } from "lucide-react";
import { useState } from "react";
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdmin } from "../lib/guards.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);
  return data({}, { headers });
}

const TABS = [
  { id: "points" as const, label: "포인트 관리" },
  { id: "tickets" as const, label: "티켓 관리" },
  { id: "referrals" as const, label: "추천인 코드 관리" },
];

const MOCK_POINT_HISTORY = [
  { id: 1, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 완료" },
  { id: 2, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 완료" },
  { id: 3, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 대기" },
  { id: 4, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 대기" },
  { id: 5, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 대기" },
  { id: 6, datetime: "2025.03.14 21:30", user: "(닉네임)\n(id:12345)", reason: "(결제정보)", status: "처리 대기" },
];

const MOCK_REFERRALS = [
  { id: 1, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 완료" },
  { id: 2, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 완료" },
  { id: 3, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 대기" },
  { id: 4, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 대기" },
  { id: 5, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 대기" },
  { id: 6, name: "(닉네임)", code: "Nanyang_2025", count: "(n)회", amount: "(누적금액)", status: "처리 대기" },
];

const TICKET_REASON_TEMPLATES = ["이벤트 보상", "버그 보상", "운영 지급", "테스트", "기타"];

function StatusBadge({ status }: { status: string }) {
  const completed = status === "처리 완료";
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${completed ? "text-green-600" : "text-orange-600"}`}>
      <span className={`size-1.5 rounded-full ${completed ? "bg-green-500" : "bg-orange-500"}`} />
      {status}
    </span>
  );
}

export default function AdminPointsManagement() {
  const [activeTab, setActiveTab] = useState<"points" | "tickets" | "referrals">("points");
  const [grantType, setGrantType] = useState("grant");
  const [amount, setAmount] = useState("");
  const [ticketReason, setTicketReason] = useState("");
  const [ticketMemo, setTicketMemo] = useState("");
  const [showTicketReasonDropdown, setShowTicketReasonDropdown] = useState(false);

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">포인트 / 티켓 관리 / 추천인</h1>
      <p className="mb-6 text-sm text-[#535862]">
        이벤트 지급 및 운영 목적에 따라 포인트와 티켓을 부여할 수 있습니다.
      </p>

      {/* 탭 네비게이션 */}
      <div className="mb-6 flex border-b border-[#E9EAEB]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[#2ED3B0] text-[#2ED3B0] font-semibold"
                : "text-[#535862] hover:text-[#181D27]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 포인트 관리 / 티켓 관리 탭 공통 */}
      {(activeTab === "points" || activeTab === "tickets") && (
        <>
          {/* 검색바 */}
          <div className="mb-4 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input type="text" placeholder="유저 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
          </div>

          {/* 선택된 유저 칩 (Mock) */}
          <div className="mb-6 flex gap-2">
            <span className="flex items-center gap-2 rounded-full bg-[#181D27] px-4 py-1.5 text-sm text-white">
              <User className="size-4" /> 나냥이 (nanyang_10029)
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[#181D27] px-4 py-1.5 text-sm text-white">
              <User className="size-4" /> 나냥이 (nanyang_10029)
            </span>
          </div>

          {/* 지급 카드 */}
          <div className="mb-8 rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-[#181D27]">
              {activeTab === "points" ? "포인트 지급" : "티켓 지급"}
            </h3>
            <div className="mb-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="radio" name="grantType" value="grant" checked={grantType === "grant"} onChange={() => setGrantType("grant")} className="accent-[#181D27]" />
                <span className="text-sm text-[#414651]">{activeTab === "points" ? "포인트 지급" : "티켓 지급"}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="radio" name="grantType" value="revoke" checked={grantType === "revoke"} onChange={() => setGrantType("revoke")} className="accent-[#181D27]" />
                <span className="text-sm text-[#414651]">{activeTab === "points" ? "포인트 회수" : "티켓 회수"}</span>
              </label>
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="금액"
              className="mb-4 max-w-[400px] w-full rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm outline-none placeholder:text-[#717680]"
            />

            {/* 티켓 관리 탭 전용: 사유 템플릿 + 메모 */}
            {activeTab === "tickets" && (
              <>
                <div className="relative mb-4">
                  <button type="button" onClick={() => setShowTicketReasonDropdown(!showTicketReasonDropdown)} className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm text-[#535862]">
                    {ticketReason || "사유 템플릿 선택"}
                    <ChevronDown className="size-4" />
                  </button>
                  {showTicketReasonDropdown && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-[#E9EAEB] bg-white shadow-lg">
                      {TICKET_REASON_TEMPLATES.map((r) => (
                        <button key={r} type="button" onClick={() => { setTicketReason(r); setShowTicketReasonDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-[#414651] hover:bg-[#F9FAFB]">
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={ticketMemo}
                  onChange={(e) => setTicketMemo(e.target.value)}
                  placeholder="메모"
                  className="h-28 max-w-[400px] w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680]"
                />
              </>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
                <Pencil className="size-4" />
                {activeTab === "points" ? "포인트 지급" : "티켓 지급"}
              </button>
            </div>
          </div>

          {/* 포인트 지급 내역 테이블 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white">
            <div className="border-b border-[#E9EAEB] px-6 py-4">
              <h2 className="text-base font-semibold text-[#181D27]">포인트 지급 내역</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E9EAEB]">
                  <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">포인트 지급 일시</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">유저</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">지급 사유</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_POINT_HISTORY.map((h) => (
                  <tr key={h.id} className="border-b border-[#E9EAEB] last:border-0">
                    <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                    <td className="px-4 py-4 text-sm text-[#181D27]">{h.datetime}</td>
                    <td className="whitespace-pre-line px-4 py-4 text-sm text-[#535862]">{h.user}</td>
                    <td className="px-4 py-4 text-sm text-[#535862]">{h.reason}</td>
                    <td className="px-4 py-4"><StatusBadge status={h.status} /></td>
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
        </>
      )}

      {/* 추천인 코드 관리 탭 */}
      {activeTab === "referrals" && (
        <div className="rounded-xl border border-[#E9EAEB] bg-white">
          <div className="border-b border-[#E9EAEB] px-6 py-4">
            <h2 className="text-base font-semibold text-[#181D27]">추천인 코드 관리</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E9EAEB]">
                <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-[#D5D7DA]" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">추천인</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">추천인 코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">추천인 등록 횟수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">누적금액</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">상태</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REFERRALS.map((r) => (
                <tr key={r.id} className="border-b border-[#E9EAEB] last:border-0">
                  <td className="px-4 py-4"><input type="checkbox" className="rounded border-[#D5D7DA]" /></td>
                  <td className="px-4 py-4 text-sm text-[#181D27]">{r.name}</td>
                  <td className="px-4 py-4 text-sm text-[#535862]">{r.code}</td>
                  <td className="px-4 py-4 text-sm text-[#535862]">{r.count}</td>
                  <td className="px-4 py-4 text-sm text-[#535862]">{r.amount}</td>
                  <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
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
      )}
    </div>
  );
}
```

---

## 파일 4: `app/features/admin/components/admin-sidebar.tsx` (수정)

### 변경 내용

"결제 / 포인트" 그룹의 `items` 배열에서 4개 → 3개로 통합:

**변경 전:**
```typescript
items: [
  { label: "결제 내역", href: "/admin/payments" },
  { label: "환불 관리", href: "/admin/payments/refunds", badge: 10 },
  { label: "포인트 / 티켓 관리", href: "/admin/points" },
  { label: "추천인 / 정산", href: "/admin/referrals" },
],
```

**변경 후:**
```typescript
items: [
  { label: "결제 내역", href: "/admin/payments" },
  { label: "환불 관리", href: "/admin/payments/refunds", badge: 10 },
  { label: "포인트 / 티켓 / 추천인 관리", href: "/admin/points" },
],
```

---

## 파일 5: `app/routes.ts` (수정)

### 변경 내용

어드민 prefix 블록 내에서 4개 placeholder → 3개 실제 화면으로 교체, referrals 라우트 삭제:

**변경 전:**
```typescript
route("/payments", "features/admin/screens/placeholder.tsx", {
  id: "admin-payments",
}),
route("/payments/refunds", "features/admin/screens/placeholder.tsx", {
  id: "admin-payments-refunds",
}),
route("/points", "features/admin/screens/placeholder.tsx", {
  id: "admin-points",
}),
route("/referrals", "features/admin/screens/placeholder.tsx", {
  id: "admin-referrals",
}),
```

**변경 후:**
```typescript
route("/payments", "features/admin/screens/payment-list.tsx"),
route("/payments/refunds", "features/admin/screens/payment-refunds.tsx"),
route("/points", "features/admin/screens/points-management.tsx"),
```

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/payments` → 필터 탭(5개) + 결제 내역 테이블 (상태 배지 4종: 처리완료/처리대기/결제취소/환불완료)
3. `/admin/payments/refunds` → 결제 상세 카드(좌) + 환불 사유 선택(우) + 하단 테이블
4. `/admin/points` → 3탭 전환 (포인트 지급 → 티켓 지급 → 추천인 코드 관리)
5. 사이드바 "결제 / 포인트" 메뉴 3개 항목으로 변경 확인
6. `/admin/referrals` 라우트 삭제 확인
