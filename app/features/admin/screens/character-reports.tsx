/**
 * Admin 신고 캐릭터 — Mock 데이터, 9개 사유
 */
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
  "성적·선정적 콘텐츠", "폭력적·혐오 표현", "불법·위험 행위 유도",
  "욕설·비방·괴롭힘", "허위 정보 / 사기성 콘텐츠", "저작권·초상권 침해",
  "스팸·광고성 콘텐츠", "서비스 정책 위반", "기타",
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
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">신고 캐릭터</h1>
      <p className="mb-6 text-sm text-[#535862]">캐릭터에 대한 신고 내역을 조회하고 조치할 수 있습니다.</p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="캐릭터 이름 · 제작자 · 태그로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

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
