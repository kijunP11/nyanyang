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

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input type="text" placeholder="금칙어 검색" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]" />
      </div>

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
