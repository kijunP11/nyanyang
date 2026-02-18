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

      {(activeTab === "points" || activeTab === "tickets") && (
        <>
          <div className="mb-4 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
            <Search className="size-5 text-[#717680]" />
            <input type="text" placeholder="유저 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
          </div>

          <div className="mb-6 flex gap-2">
            <span className="flex items-center gap-2 rounded-full bg-[#181D27] px-4 py-1.5 text-sm text-white">
              <User className="size-4" /> 나냥이 (nanyang_10029)
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[#181D27] px-4 py-1.5 text-sm text-white">
              <User className="size-4" /> 나냥이 (nanyang_10029)
            </span>
          </div>

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
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="금액" className="mb-4 max-w-[400px] w-full rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm outline-none placeholder:text-[#717680]" />

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
                <textarea value={ticketMemo} onChange={(e) => setTicketMemo(e.target.value)} placeholder="메모" className="h-28 max-w-[400px] w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680]" />
              </>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
                <Pencil className="size-4" />
                {activeTab === "points" ? "포인트 지급" : "티켓 지급"}
              </button>
            </div>
          </div>

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
