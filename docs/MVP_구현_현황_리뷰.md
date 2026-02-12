# MVP(3개월) 구현 현황 리뷰

> **작성 목적**: 외주 고객용으로, 코드를 수정하지 않고 코드베이스와 기술 스택을 기준으로 **객관적으로** 어디까지 구현되었는지 정리한 문서입니다.  
> **기준일**: 문서 작성 시점 코드 기준.
>
> **진행 상황 (고객님과 마지막 논의 이후)**: 고객님과 마지막으로 얘기한 시점부터 **0번(헤더/푸터/GNB/사이드바)** 부터 순차 진행했으며, 현재 **F3. 내 컨텐츠**를 거의 마무리 단계까지 진행한 상태입니다.

---

## 1. 기술 스택 요약

| 구분 | 기술 |
|------|------|
| **프론트** | React Router v7 (SSR), Tailwind CSS v4, shadcn/ui |
| **백엔드/인증** | Supabase (Auth, DB 연동) |
| **DB/ORM** | PostgreSQL, Drizzle ORM |
| **다국어** | i18next (en, es, ko) |
| **결제** | Stripe 연동 (카드 결제) |
| **모니터링** | Sentry |
| **테스트** | Playwright E2E |

---

## 2. MVP 항목별 구현 현황

### 2.1 회원/인증

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **이메일 로그인/가입** | ✅ 구현됨 | 이메일·비밀번호 가입, 로그인(/login, /login/email), 이메일 인증(confirm, resend), 비밀번호 찾기(account-recovery, new-password) |
| **소셜 로그인 (구글·애플)** | ✅ 구현됨 | 구글(/auth/social/start/google), 애플(/auth/social/start/apple), 추가로 카카오·네이버 지원 |
| **본인(성인) 인증** | ⚠️ UI만 | 마이페이지 > 계정 > 세이프티 탭에 "본인인증", "성인인증" 버튼·문구 있음. `verified_at` 표시 로직은 있으나, **실제 인증 플로우(휴대폰/API 연동) 미구현**. "인증하기" 동작 없음. |
| **추천인 코드** | ✅ 구현됨 | 가입(join)·완료 프로필(complete-profile)에서 추천인 코드 입력, `/api/users/referral-code/validate` 검증, DB `referrals`·`profiles.referral_code` 스키마 및 검증(본인인증 완료된 추천인만 사용 가능) 반영 |

---

### 2.2 홈/탐색

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **출석체크** | ✅ 구현됨 | `/attendance` 전용 페이지, 일일 체크인 API(`/api/attendance/checkin`), 연속 출석일·스탬프 그리드 UI, `attendance_records` 스키마 |
| **공지/이벤트 배너** | ⚠️ 부분 구현 | **공지 시스템**: Admin 공지 등록·수정·삭제 API, 공지 목록/상세 페이지(`/notices`, `/notices/:slug`) 구현. **홈 배너**: `NoticeBanner` 컴포넌트는 있으나, **홈(loader)에서 공지 데이터를 불러와 배너에 넘기는 연동은 없음**. 링크로 "공지사항" 이동만 존재. |
| **검색/정렬** | ⚠️ 부분 구현 | **캐릭터 목록**: `/characters`에서 탭(전체/일간/월간/신작) 기준 정렬·필터 구현. **API**: `/api/characters/list`에 검색(search)·카테고리·연령등급·정렬·페이지네이션 지원. **단, 캐릭터 목록 화면(character-list)은 탭 기반만 사용하고 검색 파라미터는 미연동.** 홈 검색 UI는 "AI 추천 대화" 문구용이며 실제 검색 기능 없음. |

---

### 2.3 채팅방

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **모델 선택** | ✅ 구현됨 | `ModelSelector` 컴포넌트, GPT-4o·Gemini·Claude·Opus 등 다수 모델, 캐릭터별 `recommended_model` 반영 |
| **대화 저장** | ✅ 구현됨 | 메시지·채팅방 DB 저장, 방별 메시지 히스토리 로드 |
| **커스터마이징/테마** | ✅ 구현됨 | `ChatSettings`: 폰트 크기, 색상, 말풍선 색, **테마(라이트/다크)**, 배경 설정 |
| **롤백·분기** | ✅ 구현됨 | `branch-manager.server`, `/api/chat/branch` (GET/POST/PUT/DELETE), 특정 메시지 기준 분기 생성·전환·삭제 |
| **재생성** | ✅ 구현됨 | 메시지 액션 "재생성", `/api/chat/message` `regenerate` 플래그로 AI 응답 재생성 |
| **요약 메모리(기본)** | ✅ 구현됨 | `room_memories`(summary/fact/entity/event), `memory-manager.server`에서 20메시지 단위 자동 요약 생성, `MemoryDrawer`로 요약 조회·삭제, 컨텍스트 빌더에서 메모리 반영 |
| **채팅방 목록** | ⚠️ 미노출 | `chat/screens/rooms.tsx` 구현되어 있으나 **라우트 미등록**. 대시보드 사이드바 "채팅방 목록"은 `/rooms`로 연결되나 해당 경로 없음. 채팅 진입은 캐릭터 카드/홈에서 `/chat/:roomId`로만 가능. |

---

### 2.4 캐릭터 제작/관리

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **프로필·설정** | ✅ 구현됨 | 위저드(시작·프로필·성격·AI설정·퍼블리싱)·일반 편집 화면, name·display_name·description·greeting·personality·system_prompt·example_dialogues·recommended_model 등 |
| **미디어 업로드** | ✅ 구현됨 | `avatar_url`, `banner_url`, `gallery_urls`, `/api/characters/upload-media` |
| **키워드북** | ✅ 구현됨 | `character_keywords` 테이블, 편집 화면 탭 "키워드북"에서 키워드 추가/삭제 |
| **세이프티 필터** | ✅ 구현됨 | `character_safety_filters` 테이블, 편집 화면 "안전 필터" 탭: block_nsfw·block_violence·block_hate_speech·block_personal_info·blocked_words·sensitivity_level, 생성 시 기본 필터 생성 |

---

### 2.5 마이페이지

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **내 정보** | ✅ 구현됨 | `/account/edit`, `/dashboard` (개요·내 캐릭터·포인트 요약), 이메일/비밀번호 변경·프로필 수정·소셜 연동/해제·계정 삭제 |
| **포인트 관리** | ✅ 구현됨 | `/points` (잔액·패키지·거래 내역), `/dashboard/payments` 결제 내역, `user_points`·`point_transactions` 스키마, API: balance/history/usage |

---

### 2.6 결제

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **Stripe(기본) 카드 결제** | ✅ 구현됨 | `/api/payments/stripe/checkout`(세션 생성), `/api/payments/stripe/webhook`(웹훅), `/payments/checkout`·success·failure 화면, 포인트 패키지(스타터~메가) 정의·결제 후 포인트 적립 플로우 |

---

### 2.7 Admin 기본

| 요구 항목 | 상태 | 비고 |
|-----------|------|------|
| **유저 관리** | ✅ 구현됨 | `/admin/users` 화면, `/api/admin/users` (목록·검색·정지 등) |
| **캐릭터 승인/삭제** | ✅ 구현됨 | `/admin/characters`, `/api/admin/characters` (pending_review 등 상태 필터, 승인/거부/삭제), `requireAdmin`·감사 로그 |
| **결제 조회** | ❌ 미구현 | 대시보드에 "결제 조회" 카드만 있고 **"거래 내역 및 통계 (구현 예정)"** 문구로 미구현 표시 |
| **공지 등록** | ✅ 구현됨 | `/api/admin/notices` (CRUD), 공지/이벤트 타입·slug·발행 상태·작성자 |
| **신고 처리** | ❌ 미구현 | 코드베이스 내 신고(report) 관련 API·화면·스키마 없음 |

---

## 3. 요약 표

| 영역 | 완료 | 부분 | 미구현 |
|------|------|------|--------|
| 회원/인증 | 이메일·소셜·추천인 | 본인/성인 인증(UI만) | - |
| 홈/탐색 | 출석체크 | 공지 배너(홈 연동 없음), 검색(목록 화면 미연동) | - |
| 채팅방 | 모델·저장·테마·롤백·분기·재생성·요약메모리 | - | 채팅방 목록 라우트 |
| 캐릭터 | 프로필·설정·미디어·키워드북·세이프티필터 | - | - |
| 마이페이지 | 내 정보·포인트 | - | - |
| 결제 | Stripe 카드 결제 | - | - |
| Admin | 유저·캐릭터·공지 | - | 결제 조회, 신고 처리 |

---

## 4. 추가 참고 사항

- **채팅 진입**: 캐릭터 상세/목록/홈에서 "채팅하기" 시 `/chat/:roomId`로 이동. 기존 방이 있으면 해당 방으로, 없으면 방 생성 후 리다이렉트되는 플로우가 캐릭터 상세 등에 구현되어 있음.
- **공지 배너**: 홈에 배너를 띄우려면 홈 loader에서 published 공지를 조회해 `NoticeBanner`에 전달하는 작업만 추가하면 됨.
- **채팅방 목록**: `rooms.tsx`가 있으므로 라우트만 추가(예: `/dashboard/rooms` 또는 `/chat` index)하면 노출 가능.
- **캐릭터 검색**: `/api/characters/list`의 search·filter를 character-list(또는 탐색) 화면에서 쿼리 파라미터로 연동하면 검색/정렬 완성 가능.

---

*이 문서는 코드 수정 없이 코드베이스 탐색만으로 작성되었습니다.*
