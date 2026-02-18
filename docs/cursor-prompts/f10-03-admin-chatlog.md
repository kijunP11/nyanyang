# F10-03: Admin 채팅/콘텐츠 — ChatLog 섹션

> 어드민 "채팅 / 콘텐츠" 그룹 2개 서브페이지 신규 구현 (placeholder 대체)

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/screens/chat-reports.tsx` | **신규** — 채팅/콘텐츠 로그 |
| 2 | `app/features/admin/screens/banned-words.tsx` | **신규** — 금칙어/자동 감지 관리 |
| 3 | `app/routes.ts` | **수정** — 2개 placeholder → 실제 화면 연결 |

## 기존 코드 참조

| 참조 | 파일 |
|------|------|
| reports 패턴 (리스트↔상세, 필터, 제재) | `app/features/admin/screens/reports.tsx` |
| requireAdmin | `app/features/admin/lib/guards.server.ts` |
| 사이드바 메뉴 | `app/features/admin/components/admin-sidebar.tsx` (chat 그룹) |

---

## 파일 1: `app/features/admin/screens/chat-reports.tsx` (신규)

`reports.tsx` 패턴 클론. Mock 데이터. 리스트 ↔ 상세 뷰 전환.

### reports.tsx 대비 차이점
1. 헤더: "채팅 / 콘텐츠 로그" + "신고가 접수된 채팅 및 콘텐츠 로그를 확인하고 조치할 수 있습니다."
2. 검색 placeholder: "유저 · 캐릭터 · 키워드로 검색"
3. TYPE_OPTIONS: `["자동감지"]` (1개만)
4. 리스트 뷰 테이블에 **"일시" 컬럼 추가** (yyyy.mm.dd 00:00)
5. 상세 뷰에서도 하단에 "신고 리스트" 테이블 항상 유지 (reports.tsx는 "제재 이력"으로 표시)
6. 상세 뷰 하단 테이블 조치 컬럼에 🗑️ + ✏️ 아이콘 추가

### Mock 데이터

```typescript
const MOCK_REPORTS = [
  { id: 1, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 2, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 3, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 4, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "기타", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 5, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "스팸/도배", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 6, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "유해한 콘텐츠", status: "처리완료", datetime: "yyyy.mm.dd 00:00" },
];
```

### 필터 옵션

```typescript
const STATUS_OPTIONS = ["전체", "처리 대기", "처리 완료"];
const TYPE_OPTIONS = ["자동감지"];
const REASON_OPTIONS = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];
const PERIOD_OPTIONS = ["오늘", "7일", "30일", "직접 선택"];
const SANCTION_TEMPLATES = ["욕설/비하", "성적 콘텐츠", "스팸/도배", "유해한 콘텐츠", "광고", "기타"];
```

### 리스트 뷰 테이블 컬럼

| 컬럼 | 내용 |
|------|------|
| 체크박스 | |
| 신고 유형 | "자동감지" |
| 신고대상 | "(닉네임)\n(id:12345)" (whitespace-pre-line) |
| 신고 사유 | 텍스트 |
| 상태 | 처리대기(빨강 dot) / 처리완료(초록 dot) |
| 일시 | yyyy.mm.dd 00:00 |
| 조치 | [상세 보기] 버튼 |

### 상세 뷰 (selectedReport 선택 시)

필터 패널 숨기고, 상세 카드 2개 표시 + 하단 테이블 유지.

**신고 요약 카드** (reports.tsx와 동일):
- 태그 배지: "채팅 신고" + 선택된 report의 reason
- 👤 신고자 정보 + 🕐 접수 일시 : yyyy.mm.dd 10:00
- 채팅 로그 섹션 + "해당 채팅으로 이동 ↗" 링크
- 부적절한 채팅 로그 (bg-[#FFF0E0], text-[#B54708])

**제재 선택 카드** (reports.tsx와 동일):
- 라디오: 경고 / 이용 제한 (기간 선택) / 이용 정지 (영구) / 조치 없음
- 부가 옵션: 사유 템플릿 선택 드롭다운
- 메모 textarea
- [✏️ 조치 완료] 버튼

**하단 테이블** (상세 뷰에서): 헤더 "신고 리스트", 조치 컬럼에 [상세 보기] + 🗑️ + ✏️

### 전체 코드

```tsx
/**
 * Admin 채팅 / 콘텐츠 로그 — Mock 데이터, 리스트 ↔ 상세 뷰 전환
 */
import type { Route } from "./+types/chat-reports";

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
  { id: 1, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 2, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 3, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "욕설/비하", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 4, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "기타", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 5, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "스팸/도배", status: "처리대기", datetime: "yyyy.mm.dd 00:00" },
  { id: 6, type: "자동감지", target: "(닉네임)\n(id:12345)", reason: "유해한 콘텐츠", status: "처리완료", datetime: "yyyy.mm.dd 00:00" },
];

const STATUS_OPTIONS = ["전체", "처리 대기", "처리 완료"];
const TYPE_OPTIONS = ["자동감지"];
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

export default function AdminChatReports() {
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
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">채팅 / 콘텐츠 로그</h1>
      <p className="mb-6 text-sm text-[#535862]">
        신고가 접수된 채팅 및 콘텐츠 로그를 확인하고 조치할 수 있습니다.
      </p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="유저 · 캐릭터 · 키워드로 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {/* 상세 뷰 */}
      {selectedReport && (
        <div className="mb-8 space-y-6">
          <button type="button" onClick={() => setSelectedReport(null)} className="mb-4 flex items-center gap-2 text-sm text-[#535862] hover:text-[#181D27]">
            <ChevronLeft className="size-4" />
            목록으로
          </button>
          {/* 신고 요약 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <h3 className="mb-3 text-base font-semibold text-[#181D27]">신고 요약</h3>
            <div className="mb-3 flex gap-2">
              <span className="rounded-lg border border-[#D5D7DA] bg-[#F9FAFB] px-3 py-1 text-sm">채팅 신고</span>
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
          {/* 제재 선택 */}
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

      {/* 필터 패널 (리스트 뷰에서만) */}
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

      {/* 신고 리스트 테이블 (항상 표시) */}
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
              {!selectedReport && (
                <th className="px-4 py-3 text-left text-xs font-medium text-[#717680]">일시</th>
              )}
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
                {!selectedReport && (
                  <td className="px-4 py-4 text-sm text-[#535862]">{report.datetime}</td>
                )}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSelectedReport(report)} className="rounded-lg border border-[#D5D7DA] px-3 py-1.5 text-xs text-[#535862] hover:bg-[#F9FAFB]">상세 보기</button>
                    {selectedReport && (
                      <>
                        <button type="button" className="text-[#717680] hover:text-[#181D27]"><Trash2 className="size-4" /></button>
                        <button type="button" className="text-[#717680] hover:text-[#181D27]"><Pencil className="size-4" /></button>
                      </>
                    )}
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

## 파일 2: `app/features/admin/screens/banned-words.tsx` (신규)

카드형 리스트 + 등록 폼. Mock 데이터. 새로운 패턴.

### Mock 데이터

```typescript
const MOCK_BANNED_WORDS = [
  { id: 1, keyword: "{특정 욕설}", action: "자동 블라인드", rating: "R-18" },
  { id: 2, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 3, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 4, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 5, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 6, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 7, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
];
```

### 등록 폼

- 키워드: text input (placeholder "특정 욕설")
- 조치: select 드롭다운 (경고 / 자동 블라인드)
- 등급: select 드롭다운 (R-18 / 전체)
- [추가하기] 버튼: 민트색 `bg-[#2ED3B0] hover:bg-[#26B99A] text-white`

### 금칙어 카드

- 태그 라벨: `text-[#2ED3B0] text-sm font-medium` — "금칙어 / {action} / {rating}"
- 키워드 텍스트: `text-base font-semibold text-[#181D27]` — "{특정 욕설}"
- [삭제] 버튼: 우하단, `rounded-lg border border-[#D5D7DA] px-4 py-1.5 text-sm text-[#535862]`

### 전체 코드

```tsx
/**
 * Admin 금칙어 / 자동 감지 관리 — Mock 데이터, 카드형 리스트 + 등록 폼
 */
import type { Route } from "./+types/banned-words";

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

const MOCK_BANNED_WORDS = [
  { id: 1, keyword: "{특정 욕설}", action: "자동 블라인드", rating: "R-18" },
  { id: 2, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 3, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 4, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 5, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 6, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
  { id: 7, keyword: "{특정 욕설}", action: "경고", rating: "R-18" },
];

export default function AdminBannedWords() {
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState("경고");
  const [rating, setRating] = useState("R-18");

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">금칙어 / 자동 감지 관리</h1>
      <p className="mb-6 text-sm text-[#535862]">
        특정 단어 및 패턴을 감지하여 자동 경고 또는 블라인드 처리합니다.
      </p>

      {/* 검색바 */}
      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="금칙어 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

      {/* 등록 폼 */}
      <div className="mb-6 rounded-xl border border-[#E9EAEB] bg-white p-6">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-[#414651]">키워드</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="특정 욕설"
            className="w-full rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm outline-none placeholder:text-[#717680] focus:border-[#181D27]"
          />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651]">조치</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 text-sm text-[#181D27] outline-none focus:border-[#181D27]"
            >
              <option value="경고">경고</option>
              <option value="자동 블라인드">자동 블라인드</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#414651]">등급</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 text-sm text-[#181D27] outline-none focus:border-[#181D27]"
            >
              <option value="R-18">R-18</option>
              <option value="전체">전체</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-[#2ED3B0] px-5 py-2 text-sm font-medium text-white hover:bg-[#26B99A]"
          >
            추가하기
          </button>
        </div>
      </div>

      {/* 금칙어 카드 리스트 */}
      <div className="space-y-4">
        {MOCK_BANNED_WORDS.map((word) => (
          <div key={word.id} className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <p className="mb-1 text-sm font-medium text-[#2ED3B0]">
              금칙어 / {word.action} / {word.rating}
            </p>
            <p className="text-base font-semibold text-[#181D27]">{word.keyword}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-lg border border-[#D5D7DA] px-4 py-1.5 text-sm text-[#535862] hover:bg-[#F9FAFB]"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 파일 3: `app/routes.ts` (수정)

### 변경 내용

`/admin` prefix 블록 내에서 2개 placeholder 라우트를 실제 화면으로 교체:

```diff
- route("/reports/chats", "features/admin/screens/placeholder.tsx", {
-   id: "admin-reports-chats",
- }),
- route("/chat/banned-words", "features/admin/screens/placeholder.tsx", {
-   id: "admin-chat-banned-words",
- }),
+ route("/reports/chats", "features/admin/screens/chat-reports.tsx"),
+ route("/chat/banned-words", "features/admin/screens/banned-words.tsx"),
```

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/reports/chats` → 필터 패널 (자동감지 유형, 6개 사유, 기간) + 신고 리스트 (일시 컬럼 포함) + 상세 뷰 (제재 선택)
3. `/admin/chat/banned-words` → 등록 폼 (키워드/조치/등급) + 금칙어 카드 리스트 (민트색 태그) + [삭제] 버튼
4. 2개 placeholder 라우트가 실제 화면으로 교체 확인
