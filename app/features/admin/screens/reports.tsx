/**
 * Admin 신고 내역 / 제재 관리 — Mock 데이터, 리스트 ↔ 상세 뷰 전환
 */
import type { Route } from "./+types/reports";

import { ChevronDown, ChevronLeft, Pencil, Search, Trash2 } from "lucide-react";
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
  { id: 1, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 2, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 3, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기" },
  { id: 4, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "기타", status: "처리대기" },
  { id: 5, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "스팸/도배", status: "처리대기" },
  { id: 6, type: "채팅 신고", target: "(닉네임)\n(id:12345)", reason: "유해한 콘텐츠", status: "처리완료" },
];

const STATUS_OPTIONS = ["전체", "처리 대기", "처리 완료"];
const TYPE_OPTIONS = ["유저 신고", "캐릭터 신고", "채팅 신고"];
const REASON_OPTIONS = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];
const PERIOD_OPTIONS = ["오늘", "7일", "30일", "직접 선택"];
const SANCTION_TEMPLATES = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];

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

type ReportItem = (typeof MOCK_REPORTS)[number];

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState("오늘");
  const [sanctionType, setSanctionType] = useState("warning");
  const [sanctionTemplate, setSanctionTemplate] = useState("");
  const [sanctionMemo, setSanctionMemo] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const toggleArrayFilter = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">신고 내역 / 제재 관리</h1>
      <p className="mb-6 text-sm text-[#535862]">
        신고된 콘텐츠와 유저의 이용 상태를 확인하고 필요한 조치를 관리할 수 있습니다.
      </p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="닉네임 • 이메일 • 아이디 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {selectedReport && (
        <div className="mb-8 space-y-6">
          <button type="button" onClick={() => setSelectedReport(null)} className="mb-4 flex items-center gap-2 text-sm text-[#535862] hover:text-[#181D27]">
            <ChevronLeft className="size-4" />
            목록으로
          </button>
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="mb-3 text-base font-semibold text-[#181D27]">신고 요약</h3>
            <div className="mb-3 flex gap-2">
              <span className="rounded-lg border border-[#D5D7DA] bg-[#F9FAFB] px-3 py-1 text-sm">{selectedReport.type}</span>
              <span className="rounded-lg border border-[#D5D7DA] bg-[#F9FAFB] px-3 py-1 text-sm">{selectedReport.reason}</span>
            </div>
            <div className="mb-4 flex items-center gap-4 text-sm text-[#535862]">
              <span>👤 신고자 정보</span>
              <span>🕐 접수 일시 : yyyy.mm.dd 10:00</span>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#181D27]">채팅 로그</h4>
              <a href="#" className="text-sm text-[#535862] hover:underline">해당 채팅으로 이동 ↗</a>
            </div>
            <div className="rounded-lg bg-[#FFF0E0] p-4">
              <p className="text-sm text-[#B54708]">🔴 부적절한 채팅 로그</p>
            </div>
          </div>
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-[#181D27]">제재 선택</h3>
            <div className="mb-6 space-y-3">
              {[
                { value: "warning", label: "경고" },
                { value: "restricted", label: "이용 제한 (기간 선택)" },
                { value: "banned", label: "이용 정지 (영구)" },
                { value: "none", label: "조치 없음" },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                  <input type="radio" name="sanction" value={opt.value} checked={sanctionType === opt.value} onChange={() => setSanctionType(opt.value)} className="accent-[#181D27]" />
                  <span className="text-sm text-[#414651]">{opt.label}</span>
                </label>
              ))}
            </div>
            <h4 className="mb-3 text-sm font-semibold text-[#181D27]">부가 옵션</h4>
            <div className="relative mb-4">
              <button type="button" onClick={() => setShowTemplateDropdown(!showTemplateDropdown)} className="flex items-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2 text-sm text-[#535862]">
                {sanctionTemplate || "사유 템플릿 선택"}
                <ChevronDown className="size-4" />
              </button>
              {showTemplateDropdown && (
                <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-[#E9EAEB] bg-white shadow-lg">
                  {SANCTION_TEMPLATES.map((t) => (
                    <button key={t} type="button" onClick={() => { setSanctionTemplate(t); setShowTemplateDropdown(false); }} className="w-full px-4 py-2 text-left text-sm text-[#414651] hover:bg-[#F9FAFB]">
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea value={sanctionMemo} onChange={(e) => setSanctionMemo(e.target.value)} placeholder="메모" className="h-28 max-w-[400px] w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680]" />
            <div className="mt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 rounded-lg bg-[#181D27] px-4 py-2 text-sm font-medium text-white hover:bg-[#414651]">
                <Pencil className="size-4" />
                조치 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedReport && (
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
              <Search className="size-4" />
              검색
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E9EAEB] bg-white">
        <div className="border-b border-[#E9EAEB] px-6 py-4">
          <h2 className="text-base font-semibold text-[#181D27]">{selectedReport ? "제재 이력" : "신고 리스트"}</h2>
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
                    <button type="button" onClick={() => setSelectedReport(report)} className="rounded-lg border border-[#D5D7DA] px-3 py-1.5 text-xs text-[#535862] hover:bg-[#F9FAFB]">상세 보기</button>
                    <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                    <button type="button" className="text-[#717680] hover:text-[#181D27]"><Pencil className="size-4" /></button>
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
