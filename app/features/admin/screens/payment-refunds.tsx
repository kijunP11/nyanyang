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
        결제 상세를 확인하고 환불을 처리할 수 있습니다.
      </p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="유저 · 주문번호 · 결제수단으로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6">
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
          <input type="text" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="금액" className="mb-4 w-full rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm outline-none placeholder:text-[#717680]" />
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
          <textarea value={refundMemo} onChange={(e) => setRefundMemo(e.target.value)} placeholder="메모" className="h-28 w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680]" />
          <div className="mt-4 flex justify-end">
            <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
              <Pencil className="size-4" />
              환불 처리 버튼
            </button>
          </div>
        </div>
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
