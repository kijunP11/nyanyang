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

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="유저 · 주문번호 · 결제수단으로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

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
