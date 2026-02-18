/**
 * Admin 공지사항 관리 — Mock 데이터, 카드형 리스트 + 등록 폼
 */
import type { Route } from "./+types/notices-management";

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

const NOTICE_CATEGORIES = ["모델 상태 공지", "공지사항", "이벤트"];

const MOCK_NOTICES = [
  { id: 1, category: "공지 사항", content: "{모델 상태 공지}" },
  { id: 2, category: "공지사항", content: "{공지 내용}" },
];

export default function AdminNoticesManagement() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("모델 상태 공지");

  return (
    <div className="max-w-[1200px] p-8">
      <h1 className="mb-1 text-xl font-bold text-[#181D27]">공지사항 관리</h1>
      <p className="mb-6 text-sm text-[#535862]">
        공지사항 내용을 수정하거나 삭제할 수 있습니다.
      </p>

      <div className="mb-6 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5">
        <Search className="size-5 text-[#717680]" />
        <input
          type="text"
          placeholder="공지내용 검색"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#717680]"
        />
      </div>

      <div className="mb-6 rounded-xl border border-[#E9EAEB] bg-white p-6">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-[#414651]">
            공지 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지 내용"
            className="h-28 w-full resize-none rounded-lg border border-[#D5D7DA] p-3 text-sm outline-none placeholder:text-[#717680] focus:border-[#181D27]"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-[#414651]">
            분류
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 text-sm text-[#181D27] outline-none focus:border-[#181D27]"
          >
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
        {MOCK_NOTICES.map((notice) => (
          <div
            key={notice.id}
            className="rounded-xl border border-[#E9EAEB] bg-white p-6"
          >
            <p className="mb-1 text-sm font-medium text-[#2ED3B0]">
              {notice.category}
            </p>
            <p className="text-base font-semibold text-[#181D27]">
              {notice.content}
            </p>
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
