# F2-1. 사이드바 Empty 상태 CTA 카드 추가

## 목표
로그인 + 채팅 0개 상태에서 안내 메시지 카드 + "탐색하기" CTA 버튼 표시

## 수정 파일: `app/core/components/chat-sidebar.tsx` (1개만)

---

### 변경: 로그인 + 채팅 없음 상태에 CTA 카드 추가

```tsx
// 현재 (290~303행):
) : !hasChats ? (
  /* Logged in, no chats */
  <div className="flex flex-1 flex-col">
    <Collapsible defaultOpen>
      <SectionHeader
        label="오늘"
        count={0}
        open={true}
        onToggle={() => {}}
      />
    </Collapsible>
    <div className="flex-1" />
    <UserFooter user={user} />
  </div>

// 변경:
) : !hasChats ? (
  /* Logged in, no chats */
  <div className="flex flex-1 flex-col">
    <Collapsible defaultOpen>
      <SectionHeader
        label="오늘"
        count={0}
        open={true}
        onToggle={() => {}}
      />
    </Collapsible>
    <div className="flex-1" />
    {/* Empty CTA 카드 */}
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
        <p className="mb-3 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
          아직 첫 대화를 시작하지 않으셨네요! 마음에 드는 캐릭터와 첫 대화를
          시작해보세요 :)
        </p>
        <Link
          to="/characters"
          viewTransition
          className="flex w-full items-center justify-center rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-medium text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
        >
          탐색하기
        </Link>
      </div>
    </div>
    <UserFooter user={user} />
  </div>
```

> CTA 카드 스타일은 기존 `LoggedOutCTA`의 카드 스타일과 동일하게 맞춤 (rounded-xl, border, p-4).
> "탐색하기" 버튼은 `LoggedOutCTA`의 "이메일로 시작하기" 버튼과 동일 스타일.
> `Link`는 이미 파일 상단에 import 되어 있음.

---

## 검증

```bash
npm run typecheck
```

- [ ] 로그인 + 채팅 0개: "오늘 0개" + CTA 카드("아직 첫 대화를...") + "탐색하기" 버튼 + 유저 푸터
- [ ] "탐색하기" 클릭 → `/characters` 이동
- [ ] 로그인 + 채팅 1개 이상: CTA 카드 안 보임 (기존과 동일)
- [ ] 비로그인: 기존 LoggedOutCTA 그대로 (변경 없음)
- [ ] 다크모드: 카드 border/텍스트 색상 정상
