# F10-07 Admin Notice: 공지사항 관리

## 개요

어드민 "공지 / 운영" 그룹 4개 placeholder → 1개 공지사항 관리 페이지.
Figma에서 "공지사항 관리" 1개만 표시. 나머지 3개 placeholder 삭제.
패턴: `banned-words.tsx`와 동일 — textarea 폼 + 카드형 리스트.

## 수정/생성 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `app/features/admin/screens/notices-management.tsx` | **신규** |
| 2 | `app/features/admin/components/admin-sidebar.tsx` | **수정** |
| 3 | `app/routes.ts` | **수정** |

---

## 파일 1: `app/features/admin/screens/notices-management.tsx` (신규 생성)

아래 코드를 그대로 붙여넣기:

```tsx
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
```

---

## 파일 2: `app/features/admin/components/admin-sidebar.tsx` (수정)

"공지 / 운영" 그룹의 items를 4개 → 1개로 변경:

**찾기:**
```typescript
      { label: "공지사항 관리", href: "/admin/notices" },
      { label: "운영 메시지", href: "/admin/messages", badge: 10 },
      { label: "팝업 공지", href: "/admin/popups" },
      { label: "모델 상태 공지", href: "/admin/model-status" },
```

**바꾸기:**
```typescript
      { label: "공지사항 관리", href: "/admin/notices" },
```

---

## 파일 3: `app/routes.ts` (수정)

admin prefix 내부에서 notices 관련 4개 placeholder를 1개 실제 화면으로 교체:

**찾기:**
```typescript
      route("/notices", "features/admin/screens/placeholder.tsx", {
        id: "admin-notices",
      }),
      route("/messages", "features/admin/screens/placeholder.tsx", {
        id: "admin-messages",
      }),
      route("/popups", "features/admin/screens/placeholder.tsx", {
        id: "admin-popups",
      }),
      route("/model-status", "features/admin/screens/placeholder.tsx", {
        id: "admin-model-status",
      }),
```

**바꾸기:**
```typescript
      route("/notices", "features/admin/screens/notices-management.tsx"),
```

---

## 검증

1. `npm run typecheck` 통과
2. `/admin/notices` → 검색바 + 작성 폼(textarea + 분류 드롭다운 + 추가하기) + 공지 카드 2건
3. 사이드바 "공지 / 운영" 메뉴 1개 항목 확인
4. `/admin/messages`, `/admin/popups`, `/admin/model-status` 라우트 삭제 확인
