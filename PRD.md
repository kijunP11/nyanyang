# 냐냥(Nyanyang) 플랫폼 PRD (Product Requirements Document)

**프로젝트명**: 냐냥 플랫폼 개발
**개발자**: 박기준
**의뢰인**: 김보현
**작성일**: 2025-11-20
**버전**: 1.0 (MVP 3차 마일스톤)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [범위 및 일정](#2-범위-및-일정)
3. [기술 스택](#3-기술-스택)
4. [기능 요구사항](#4-기능-요구사항)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [API 명세](#6-api-명세)
7. [UI/UX 가이드라인](#7-uiux-가이드라인)
8. [보안 및 정책](#8-보안-및-정책)
9. [배포 및 인프라](#9-배포-및-인프라)
10. [검수 기준](#10-검수-기준)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목적

냐냥(Nyanyang)은 사용자가 AI 기반 캐릭터와 대화하고, 직접 캐릭터를 제작·공유할 수 있는 **AI 캐릭터 채팅 플랫폼**입니다. 본 PRD는 **MVP 3차 마일스톤(8주차)까지의 개발 범위**를 정의합니다.

### 1.2 타겟 유저

- **주 사용자**: AI 캐릭터 채팅을 즐기는 10~30대
- **크리에이터**: 자체 캐릭터를 제작하고 공유하려는 사용자
- **성인 유저**: 본인인증을 통해 민감/성인 캐릭터에 접근 가능

### 1.3 핵심 가치 제안

1. **다양한 AI 모델 선택**: Gemini 2.5 Pro, Claude Sonnet/Opus, GPT-4 등
2. **손쉬운 캐릭터 제작**: 프로필, 설정, 키워드북, 세이프티 필터 제공
3. **사용자 중심 설계**: 검색/정렬, 장르 필터, 출석체크 보상
4. **안전한 플랫폼**: 성인 인증, 세이프티 필터, 신고 시스템

### 1.4 경쟁 서비스 벤치마킹

**주요 레퍼런스**:
- [케이브덕](https://caveduck.io/), [젠잇](https://genit.ai/ko), [로판](https://rofan.ai/)
- [루나톡](https://lunatalk.chat/), [제타](https://zeta-ai.io/ko), [팅글](https://tingle.chat/chat)
- [MYMI](https://www.mymi.live/ko), [피즈챗](https://www.fizzchat.com/ko), [멜팅챗](https://melting.chat/ko)
- [캐럿](https://carat.im/characters), [크러쉬온](https://crushon.ai/ko), [바베챗](https://babechat.ai/ko)
- [크랙](https://crack.wrtn.ai/), [하이AI](https://www.gohiai.com/ko-kr/), [츄챗](https://chuu.ai/)
- [플레이툰](https://www.plaitoon.com/), [어비스](https://abyss.ing/), [케라](https://chara-ai.app/)
- [폴리버즈](https://www.polybuzz.ai/ko), [잉크챗](https://inkchat.ai/), [루모](https://lumo.gg/)
- [블룸](https://bloom-ai.me/contents), [모치스](https://mochis.ai/), [RPLAY](https://rplay.live/p/rplaychat)
- [티카](https://tica.so/), [이브챗](https://www.eve-chat.com/)

**시장 조사 결과**:
- **캐릭터 선택 시 중요 요소**: 1위 장르 → 2위 에셋(이미지) → 3위 프로필

---

## 2. 범위 및 일정

### 2.1 MVP 개발 범위 (3개월, 8주차까지)

본 PRD는 **계약서 제2조(작업 범위) 중 MVP 단계**만 포함합니다.

| 마일스톤 | 기간 | 범위 | 대금 |
|---------|------|------|------|
| **착수금** | 계약 체결 직후 | - | ₩1,410,000 (30%) |
| **1차** | 2주차 완료 | 기본 세팅·DB·이메일 로그인 | ₩705,000 (15%) |
| **2차** | 4주차 완료 | 소셜 로그인·본인인증·홈/탐색 | ₩705,000 (15%) |
| **3차** | 8주차 완료 | 채팅 기본·캐릭터 관리 | ₩705,000 (15%) |

**MVP 총 개발비**: ₩4,700,000 (착수금 포함 총 3차까지)

### 2.2 MVP 범위 (3차 마일스톤까지)

#### ✅ 포함 기능

1. **회원/인증**
   - 이메일/비밀번호 로그인
   - 소셜 로그인: 카카오, 네이버, 구글, 애플
   - 본인인증 (성인 인증)
   - 추천인 코드 입력 (가입 시)

2. **홈/탐색**
   - 출석체크 (일일 보상)
   - 공지/이벤트 배너
   - 검색/정렬: 장르, 인기순, 최신순, 태그별

3. **채팅방**
   - AI 모델 선택 (Gemini 2.5 Pro, Claude Sonnet/Opus, GPT-4)
   - 기본 대화 기능
   - 대화 저장 (DB)
   - 기본 커스터마이징 (테마: 라이트/다크)

4. **캐릭터 제작/관리**
   - 프로필: 이미지 업로드, 이름, 소개
   - 설정: 역할, 외모, 성격, 말투, 예시 대화
   - 시작 설정: 첫 인사말
   - 미디어 업로드: 상황별 이미지
   - 키워드북: 키워드 기반 추가 정보
   - 세이프티 필터: 청소년 차단, 성인 인증 연동
   - 공개/비공개/링크 공개 설정

5. **마이페이지**
   - 내 정보: 닉네임, 프로필, 소개글
   - 포인트 관리: 무료/유료 포인트, 사용 내역

6. **결제**
   - Toss Payments 기본 카드 결제 연동

7. **Admin 기본**
   - 유저 관리: 계정 검색/조회
   - 캐릭터 승인/삭제
   - 결제 내역 조회
   - 공지사항 등록
   - 신고 처리

#### ⏸️ 제외 기능 (확장 단계로 이관)

다음 기능들은 **4차~5차 마일스톤(확장 단계, 11주차~24주차)**에서 개발 예정입니다:

- 롤백/분기 기능
- 메시지 재생성 (가이드 입력 지원, 이전 버전 비교)
- 요약 메모리 (장기 기억, 수동 요약/편집)
- 대화 공유/갤러리
- 크리에이터 모드 (제작자 인증·정산·활동 관리)
- 국내 PG 추가 (카카오페이, 네이버페이, 토스)
- Admin 고도화 (통계·모니터링·자동 리포트·권한 분리)
- 보안 강화 (운영자 2FA, 내부 접근 제한)

---

## 3. 기술 스택

### 3.1 프론트엔드

| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 19.0.0 |
| 라우팅 | React Router | 7.5.1+ |
| 스타일링 | Tailwind CSS | 4.0.17 |
| UI 컴포넌트 | Radix UI | v1-2 |
| 아이콘 | Lucide React | 0.482.0 |
| 폼 검증 | Zod | 3.24.2 |
| 테마 | next-themes | 0.4.6 |
| 토스트 | Sonner | 2.0.1 |
| 프로그레스 | NProgress | 0.2.0 |

### 3.2 백엔드

| 항목 | 기술 | 버전 |
|------|------|------|
| 런타임 | React Router Node | 7.5.1 |
| 데이터베이스 | PostgreSQL (Supabase) | 13.0.5 |
| ORM | Drizzle ORM | 0.40.1 |
| 마이그레이션 | Drizzle Kit | 0.30.5 |
| 인증 | Supabase Auth | 2.49.1 |
| AI 통합 | Vercel AI SDK | 5.0.89 |
| 이메일 | Resend | 4.2.0 |
| 모니터링 | Sentry | 9.10.1+ |

### 3.3 결제 및 외부 서비스

| 항목 | 기술/서비스 |
|------|------------|
| 결제 게이트웨이 | Toss Payments SDK 2.3.4 |
| 이메일 서비스 | Resend |
| 미디어 저장소 | Supabase Storage |
| 에러 트래킹 | Sentry |
| 분석 | Google Analytics (Tag Manager) |

### 3.4 개발 도구

| 항목 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript | 5.7.2 |
| 빌드 도구 | Vite | 5.4.11 |
| 테스트 | Playwright | - |
| 포매터 | Prettier | 3.5.3 |

### 3.5 배포 및 인프라

| 항목 | 서비스 |
|------|---------|
| 호스팅 | Vercel |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| 스토리지 | Supabase Storage |
| 도메인 | 의뢰인 제공 |

---

## 4. 기능 요구사항

### 4.1 회원/인증 시스템

#### 4.1.1 이메일 회원가입

**기능 설명**:
- 이메일 + 비밀번호로 회원가입
- 이메일 인증 필수 (Supabase Auth)

**필수 입력 항목**:
- 이메일 (유효성 검증)
- 비밀번호 (최소 8자, 영문+숫자 조합)
- 닉네임 (2~20자, 중복 불가)
- 마케팅 수신 동의 (선택)
- 추천인 코드 (선택)

**프로세스**:
1. 사용자가 회원가입 폼 작성
2. 서버에서 이메일 중복 체크
3. Supabase Auth로 계정 생성
4. 인증 이메일 발송 (Resend)
5. 사용자가 이메일 링크 클릭 → 인증 완료
6. 프로필 완성 화면으로 리디렉션

**화면**:
- `/join` - 회원가입 폼
- `/auth/confirm` - 이메일 인증 대기
- `/auth/email-verified` - 인증 완료
- `/auth/complete-profile` - 프로필 완성

**API**:
- `POST /api/auth/signup` (Supabase Auth 래퍼)
- `POST /api/auth/resend` - 인증 이메일 재전송

---

#### 4.1.2 이메일 로그인

**기능 설명**:
- 이메일 + 비밀번호로 로그인
- 세션 쿠키 기반 인증 (Supabase)

**필수 입력 항목**:
- 이메일
- 비밀번호

**프로세스**:
1. 사용자가 로그인 폼 작성
2. Supabase Auth로 인증
3. 세션 쿠키 설정
4. 홈 화면(`/`)으로 리디렉션

**화면**:
- `/login` - 로그인 폼

**API**:
- `POST /api/auth/login` (Supabase Auth 래퍼)

---

#### 4.1.3 소셜 로그인

**기능 설명**:
- OAuth 2.0 기반 소셜 로그인
- 지원 제공자: 카카오, 네이버, 구글, 애플

**프로세스**:
1. 사용자가 소셜 로그인 버튼 클릭
2. OAuth 제공자로 리디렉션
3. 사용자 동의 후 콜백 URL로 복귀
4. 서버에서 토큰 교환 및 프로필 조회
5. 신규 유저: 프로필 완성 화면
6. 기존 유저: 홈 화면으로 리디렉션

**화면**:
- `/login` - 소셜 로그인 버튼
- `/auth/social/:provider` - OAuth 리디렉션
- `/auth/naver/callback` - 네이버 콜백

**API**:
- `GET /api/auth/naver` - 네이버 OAuth 시작
- `GET /api/auth/naver/callback` - 네이버 콜백

**구현 상태**:
- ✅ 네이버 로그인 완료
- ⏳ 구글/애플 준비 중 (Supabase 설정 필요)

---

#### 4.1.4 본인인증 (성인 인증)

**기능 설명**:
- 본인인증을 통해 성인 인증 완료
- 인증 완료 시 민감/성인 캐릭터 접근 가능
- 추천인 코드 등록 및 출석체크 참여 조건

**프로세스**:
1. 사용자가 본인인증 시작 버튼 클릭
2. OTP 인증 서비스로 리디렉션
3. 인증 완료 후 콜백
4. 서버에서 프로필에 인증 상태 저장

**화면**:
- `/auth/otp/start` - 본인인증 시작
- `/auth/otp/complete` - 인증 완료

**데이터베이스**:
```sql
-- profiles 테이블에 추가
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP;
```

**정책**:
- 본인인증 완료 계정만 다음 기능 사용 가능:
  - 추천인 코드 등록/보상 수령
  - 출석체크 이벤트 참여
  - 성인 캐릭터 접근
  - 향후 한정 이벤트 참여

---

#### 4.1.5 추천인 코드

**기능 설명**:
- 회원가입 시 추천인 코드 입력
- 추천인·피추천인 모두 보상 지급 (포인트)

**프로세스**:
1. 신규 유저가 회원가입 시 추천인 코드 입력
2. 서버에서 코드 유효성 검증
3. 본인인증 완료 후 보상 지급
4. 추천인·피추천인 모두 포인트 적립

**데이터베이스**:
```sql
-- referrals 테이블
CREATE TABLE referrals (
  referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id), -- 추천인
  referee_id UUID NOT NULL REFERENCES auth.users(id),  -- 피추천인
  referral_code TEXT NOT NULL,
  reward_status TEXT DEFAULT 'pending', -- pending/paid
  created_at TIMESTAMP DEFAULT NOW()
);

-- users에 추천인 코드 추가
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
```

**어뷰징 방지 로직**:
- 본인인증 완료 계정만 보상 수령 가능
- 동일 IP/디바이스에서 여러 계정 생성 시 추가 검증
- 의심 계정 자동 플래그 (Admin 승인 필요)

**보상 정책**:
- 추천인: 500 포인트
- 피추천인: 300 포인트
- 보상은 피추천인의 본인인증 완료 후 지급

---

#### 4.1.6 비밀번호 찾기/재설정

**기능 설명**:
- 매직링크 방식으로 비밀번호 재설정

**프로세스**:
1. 사용자가 이메일 입력
2. 재설정 링크 발송 (Resend)
3. 사용자가 링크 클릭
4. 새 비밀번호 입력 화면
5. 비밀번호 업데이트

**화면**:
- `/auth/forgot-password` - 이메일 입력
- `/auth/forgot-password/reset` - 링크 대기
- `/auth/forgot-password/create` - 새 비밀번호 입력

---

#### 4.1.7 로그아웃

**기능 설명**:
- 세션 종료 및 쿠키 삭제

**프로세스**:
1. 사용자가 로그아웃 버튼 클릭
2. Supabase Auth 세션 종료
3. 로그인 화면으로 리디렉션

**화면**:
- `/logout` - 로그아웃 처리

---

### 4.2 홈/탐색

#### 4.2.1 메인 홈

**기능 설명**:
- 플랫폼의 첫 화면
- 출석체크, 공지/이벤트 배너, 인기 캐릭터 목록

**주요 섹션**:
1. **출석체크 버튼**
   - 원클릭으로 일일 보상 수령
   - 출석 일수 표시 (연속/누적)
   - 보상 내역: 포인트 지급

2. **공지/이벤트 배너**
   - 슬라이더 형태
   - 클릭 시 상세 페이지로 이동

3. **인기 캐릭터**
   - 조회수/좋아요 기준 정렬
   - 카드 형태로 표시

4. **최신 캐릭터**
   - 최근 등록된 캐릭터
   - 승인된 공개 캐릭터만 표시

**화면**:
- `/` - 메인 홈

**컴포넌트**:
- `attendance-check.tsx` - 출석체크
- `notice-banner.tsx` - 배너
- `story-grid.tsx` - 캐릭터 그리드

---

#### 4.2.2 검색/정렬

**기능 설명**:
- 캐릭터 검색 및 필터링
- 장르, 태그, 정렬 옵션 제공

**검색 옵션**:
- 키워드 검색 (캐릭터 이름, 설명)
- 장르 필터 (로맨스, 판타지, SF, 일상 등)
- 태그 필터 (복수 선택 가능)

**정렬 옵션**:
- 인기순 (조회수 + 좋아요 가중치)
- 최신순 (등록일)
- 좋아요순
- 채팅수순

**화면**:
- `/` - 메인 홈 (검색바)
- `search-filter.tsx` - 검색/필터 컴포넌트

**API**:
- `GET /api/characters?q=keyword&genre=romance&sort=popular`

---

#### 4.2.3 출석체크

**기능 설명**:
- 일일 1회 출석체크로 포인트 지급
- 연속 출석 시 추가 보상

**프로세스**:
1. 사용자가 출석체크 버튼 클릭
2. 서버에서 오늘 출석 여부 확인
3. 미출석 시 포인트 지급 + 출석 기록
4. 연속 출석 일수 계산 및 보너스 지급

**데이터베이스**:
```sql
CREATE TABLE attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  check_date DATE NOT NULL,
  consecutive_days INTEGER DEFAULT 1,
  reward_points INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);
```

**보상 정책**:
- 기본: 10 포인트/일
- 연속 3일: +5 포인트
- 연속 7일: +20 포인트
- 연속 30일: +100 포인트

**조건**:
- 본인인증 완료 계정만 참여 가능

---

### 4.3 채팅 시스템

#### 4.3.1 AI 모델 선택

**기능 설명**:
- 사용자가 대화에 사용할 AI 모델 선택
- 캐릭터 제작자가 권장 모델 지정 가능

**지원 모델**:
1. **Gemini 2.5 Pro** (기본 권장)
2. **Claude Sonnet 4.5**
3. **Claude Opus 4**
4. **GPT-4 Turbo**
5. **GPT-3.5 Turbo**

**프로세스**:
1. 채팅방 진입 시 모델 선택 UI 표시
2. 사용자가 모델 선택 (기본값: 권장 모델)
3. 선택된 모델로 대화 시작
4. 대화 중 모델 변경 가능

**화면**:
- `/chat/:characterId` - 채팅방
- `model-selector.tsx` - 모델 선택 드롭다운

**API**:
- `POST /api/chat/send-message` - 모델 파라미터 포함

**권장 모델 표시**:
- 캐릭터 프로필에 `recommended_model` 필드 추가
- 채팅방 상단에 "이 캐릭터는 Gemini 2.5 Pro에 최적화되어 있습니다" 배지 표시

---

#### 4.3.2 기본 대화 기능

**기능 설명**:
- 사용자와 AI 캐릭터 간 실시간 대화
- 대화 히스토리 자동 저장

**프로세스**:
1. 사용자가 메시지 입력
2. 서버로 메시지 전송
3. AI 모델에 컨텍스트 + 캐릭터 프롬프트 전달
4. AI 응답 수신
5. 응답을 화면에 표시
6. 대화 히스토리 DB 저장

**화면**:
- `/chat/:characterId` - 채팅방
- `chat-input.tsx` - 입력창
- `chat-message.tsx` - 메시지 컴포넌트

**API**:
- `POST /api/chat/send-message`

**요청 예시**:
```json
{
  "character_id": "uuid",
  "message": "안녕하세요",
  "model": "gemini-2.5-pro",
  "conversation_history": [
    { "role": "user", "content": "이전 메시지" },
    { "role": "assistant", "content": "이전 응답" }
  ]
}
```

**응답 예시**:
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "안녕하세요! 반가워요~"
  }
}
```

---

#### 4.3.3 대화 저장

**기능 설명**:
- 모든 대화 히스토리 DB 저장
- 사용자가 나중에 대화 이어가기 가능

**데이터베이스**:
```sql
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  character_id UUID NOT NULL REFERENCES characters(character_id),
  title TEXT, -- 자동 생성 또는 사용자 지정
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**프로세스**:
1. 사용자가 캐릭터와 첫 대화 시작 → 새 conversation 생성
2. 각 메시지는 messages 테이블에 저장
3. 대화 목록에서 이전 대화 선택 → 히스토리 로드

---

#### 4.3.4 기본 커스터마이징

**기능 설명**:
- 테마 설정 (라이트/다크 모드)
- 향후 확장: 글꼴 크기, 색상, 배경 이미지 (4차 이후)

**현재 구현**:
- ✅ 라이트/다크 모드 (next-themes)
- ✅ 시스템 테마 자동 감지

**향후 확장** (제외):
- 글꼴 크기 조절
- 말풍선 색상 변경
- 대화 배경 이미지 설정

**화면**:
- `chat-settings.tsx` - 설정 모달

---

### 4.4 캐릭터 제작/관리

#### 4.4.1 캐릭터 생성

**기능 설명**:
- 사용자가 자체 AI 캐릭터 생성
- 프로필, 설정, 시작 설정, 미디어, 키워드북, 세이프티 필터 설정

**필수 입력 항목**:
1. **프로필**
   - 이름 (2~50자)
   - 표시 이름 (선택)
   - 한 줄 소개 (최대 100자)
   - 프로필 이미지 (권장: 512x512px)

2. **설정**
   - 역할/직업 (예: 고양이 메이드, 전사)
   - 외모 (자유 텍스트)
   - 성격 (복수 선택: 명랑한, 차가운, 장난기 많은 등)
   - 말투 (예: 존댓말, 반말, 사투리)
   - 예시 대화 (선택, 최대 3개)

3. **시작 설정**
   - 첫 인사말 (필수)
   - 관계 설정 (예: 친구, 연인, 선생님)
   - 세계관 설정 (선택)

4. **미디어 업로드**
   - 배너 이미지 (권장: 1920x400px)
   - 갤러리 이미지 (최대 5개)

5. **키워드북**
   - 키워드: 특정 단어
   - 설명: 키워드 의미
   - 응답 템플릿: 키워드 사용 시 AI 응답 가이드
   - 우선순위: 1~10

6. **세이프티 필터**
   - NSFW 차단 여부
   - 폭력 차단 여부
   - 혐오 발언 차단 여부
   - 개인정보 차단 여부
   - 금지 단어 목록 (선택)
   - 민감도 레벨: 1~10

7. **공개 설정**
   - 공개: 모든 사용자에게 표시
   - 비공개: 본인만 사용
   - 링크 공개: URL 아는 사람만 접근

8. **NSFW 태그**
   - 성인 콘텐츠 포함 여부
   - 태그 시 본인인증 완료 유저만 접근 가능

**프로세스**:
1. 사용자가 캐릭터 생성 버튼 클릭
2. 다단계 폼 작성
3. 미디어는 Supabase Storage에 업로드
4. 서버에서 유효성 검증
5. 캐릭터 DB 저장 (상태: `draft`)
6. 사용자가 공개 신청 → 상태 변경 (`pending`)
7. Admin 승인 → 상태 변경 (`approved`)

**화면**:
- `/characters/create` - 생성 폼

**API**:
- `POST /api/characters/create` - 캐릭터 생성
- `POST /api/characters/upload-media` - 미디어 업로드
- `POST /api/characters/keywords` - 키워드북 저장
- `POST /api/characters/safety-filter` - 필터 저장

**데이터베이스**:
```sql
CREATE TYPE character_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');

CREATE TABLE characters (
  character_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  greeting_message TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,

  -- 설정
  personality_traits TEXT[] DEFAULT '{}',
  tone TEXT,
  age INTEGER,
  gender TEXT,
  role TEXT,
  appearance TEXT,
  example_dialogues JSONB DEFAULT '[]'::jsonb,

  -- 시작 설정
  relationship TEXT,
  world_setting TEXT,

  -- 공개 설정
  is_public BOOLEAN DEFAULT FALSE,
  is_nsfw BOOLEAN DEFAULT FALSE,
  status character_status DEFAULT 'draft',

  -- 권장 모델
  recommended_model TEXT,

  -- 통계
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,

  -- 메타
  tags TEXT[] DEFAULT '{}',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE character_keywords (
  keyword_id BIGSERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  description TEXT,
  response_template TEXT,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE character_safety_filters (
  filter_id BIGSERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  block_nsfw BOOLEAN DEFAULT TRUE,
  block_violence BOOLEAN DEFAULT TRUE,
  block_hate_speech BOOLEAN DEFAULT TRUE,
  block_personal_info BOOLEAN DEFAULT TRUE,
  blocked_words TEXT[] DEFAULT '{}',
  blocked_phrases TEXT[] DEFAULT '{}',
  sensitivity_level INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 4.4.2 캐릭터 수정/삭제

**기능 설명**:
- 캐릭터 소유자만 수정/삭제 가능
- 승인된 캐릭터 수정 시 재승인 필요

**프로세스**:
1. 사용자가 내 캐릭터 목록에서 수정 버튼 클릭
2. 기존 데이터 로드
3. 수정 후 저장
4. 승인된 캐릭터일 경우 상태 → `pending`
5. Admin 재승인 필요

**화면**:
- `/characters/:characterId/edit` - 수정 폼

**API**:
- `PUT /api/characters/update` - 캐릭터 수정
- `DELETE /api/characters/delete` - 캐릭터 삭제

**권한**:
- 본인 캐릭터만 수정/삭제 가능 (RLS)

---

#### 4.4.3 캐릭터 목록/상세

**기능 설명**:
- 승인된 공개 캐릭터 목록 표시
- 캐릭터 상세 페이지에서 정보 확인 후 채팅 시작

**목록 화면**:
- `/characters` - 전체 캐릭터 목록
- 카드 형태로 표시 (이미지, 이름, 소개, 태그)

**상세 화면**:
- `/characters/:characterId` - 캐릭터 상세
- 프로필 이미지, 배너, 설명, 통계, 갤러리
- "채팅 시작" 버튼 → `/chat/:characterId`

**API**:
- `GET /api/characters?status=approved&is_public=true`
- `GET /api/characters/:characterId`

---

### 4.5 마이페이지

#### 4.5.1 내 정보

**기능 설명**:
- 프로필 조회 및 수정
- 닉네임, 아바타, 소개글

**화면**:
- `/account/edit` - 계정 설정

**API**:
- `GET /api/users/profile`
- `POST /api/users/profile` - 프로필 수정

---

#### 4.5.2 포인트 관리

**기능 설명**:
- 무료/유료 포인트 조회
- 사용 내역 확인

**데이터베이스**:
```sql
CREATE TABLE points (
  point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
  type TEXT NOT NULL, -- 'free' or 'paid'
  reason TEXT NOT NULL, -- 'attendance', 'purchase', 'chat', 'referral' 등
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**화면**:
- `/points` - 포인트 내역

**API**:
- `GET /api/points?user_id=uuid`

---

### 4.6 결제 시스템

#### 4.6.1 Toss Payments 연동

**기능 설명**:
- Toss Payments를 통한 카드 결제
- 포인트 구매 패키지

**결제 패키지**:
| 패키지 | 포인트 | 가격 |
|--------|--------|------|
| 기본 | 1,000 | ₩1,000 |
| 스탠다드 | 5,000 | ₩4,500 (10% 할인) |
| 프리미엄 | 10,000 | ₩8,000 (20% 할인) |
| 울트라 | 50,000 | ₩35,000 (30% 할인) |

**프로세스**:
1. 사용자가 결제 페이지 진입
2. 패키지 선택
3. Toss Payments 위젯 렌더링
4. 사용자가 결제 정보 입력
5. 결제 승인 후 콜백
6. 서버에서 결제 검증
7. 포인트 지급 + DB 저장

**화면**:
- `/payments/checkout` - 결제 페이지
- `/payments/success` - 결제 성공
- `/payments/failure` - 결제 실패
- `/dashboard/payments` - 결제 이력

**API**:
- `POST /api/payments/create` - 결제 생성
- `POST /api/payments/verify` - 결제 검증

**데이터베이스**:
```sql
CREATE TABLE payments (
  payment_id BIGSERIAL PRIMARY KEY,
  payment_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  order_name TEXT NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  metadata JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'failed', 'pending'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at TIMESTAMP NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4.7 Admin 시스템

#### 4.7.1 유저 관리

**기능 설명**:
- 계정 검색/조회
- 본인인증 상태 확인

**화면**:
- `/admin/users` - 유저 목록
- `/admin/users/:userId` - 유저 상세

**기능**:
- 이메일/닉네임/ID로 검색
- 가입일, 본인인증 여부, 포인트 조회
- 추천인 코드 확인

---

#### 4.7.2 캐릭터 관리

**기능 설명**:
- 캐릭터 승인/삭제
- 신고된 캐릭터 처리

**화면**:
- `/admin/characters` - 캐릭터 목록
- `/admin/characters/:characterId` - 상세

**기능**:
- 상태별 필터 (pending, approved, rejected)
- 승인: `status` → `approved`
- 거부: `status` → `rejected` (사유 입력)
- 삭제: 완전 삭제

**API**:
- `POST /api/admin/characters/approve`
- `POST /api/admin/characters/reject`
- `DELETE /api/admin/characters/delete`

---

#### 4.7.3 결제 내역 조회

**기능 설명**:
- 전체 결제 내역 조회
- 사용자별 필터링

**화면**:
- `/admin/payments` - 결제 목록

**기능**:
- 날짜별, 사용자별 필터
- 결제 상태별 정렬
- 영수증 URL 조회

---

#### 4.7.4 공지사항 등록

**기능 설명**:
- 공지사항 작성/수정/삭제
- 메인 배너에 표시

**데이터베이스**:
```sql
CREATE TABLE notices (
  notice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- 높을수록 먼저 표시
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**화면**:
- `/admin/notices` - 공지 목록
- `/admin/notices/create` - 공지 작성

---

#### 4.7.5 신고 처리

**기능 설명**:
- 사용자 신고 접수 및 처리
- 캐릭터/대화 신고

**데이터베이스**:
```sql
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  reported_character_id UUID REFERENCES characters(character_id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
  created_at TIMESTAMP DEFAULT NOW()
);
```

**화면**:
- `/admin/reports` - 신고 목록

**프로세스**:
1. 사용자가 신고 버튼 클릭
2. 신고 사유 선택 + 설명 입력
3. 서버에 저장
4. Admin이 신고 확인 및 조치

---

## 5. 데이터베이스 설계

### 5.1 ERD (Entity Relationship Diagram)

```
auth.users (Supabase)
    ↓ 1:1
profiles
    ↓ 1:N
├── characters
│   ↓ 1:N
│   ├── character_keywords
│   ├── character_safety_filters
│   └── character_likes
│
├── conversations
│   ↓ 1:N
│   └── messages
│
├── points
├── payments
├── attendance
├── referrals
└── reports
```

### 5.2 테이블 정의

#### 5.2.1 profiles

```sql
CREATE TABLE profiles (
  profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  marketing_consent BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP, -- 본인인증 시간
  referral_code TEXT UNIQUE, -- 내 추천인 코드
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.2 characters

```sql
CREATE TYPE character_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived');

CREATE TABLE characters (
  character_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  greeting_message TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,

  personality_traits TEXT[] DEFAULT '{}',
  tone TEXT,
  age INTEGER,
  gender TEXT,
  role TEXT,
  appearance TEXT,
  example_dialogues JSONB DEFAULT '[]'::jsonb,

  relationship TEXT,
  world_setting TEXT,

  is_public BOOLEAN DEFAULT FALSE,
  is_nsfw BOOLEAN DEFAULT FALSE,
  status character_status DEFAULT 'draft',

  recommended_model TEXT,

  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,

  tags TEXT[] DEFAULT '{}',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.3 character_keywords

```sql
CREATE TABLE character_keywords (
  keyword_id BIGSERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  description TEXT,
  response_template TEXT,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.4 character_safety_filters

```sql
CREATE TABLE character_safety_filters (
  filter_id BIGSERIAL PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  block_nsfw BOOLEAN DEFAULT TRUE,
  block_violence BOOLEAN DEFAULT TRUE,
  block_hate_speech BOOLEAN DEFAULT TRUE,
  block_personal_info BOOLEAN DEFAULT TRUE,
  blocked_words TEXT[] DEFAULT '{}',
  blocked_phrases TEXT[] DEFAULT '{}',
  sensitivity_level INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.5 character_likes

```sql
CREATE TABLE character_likes (
  like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, user_id)
);
```

#### 5.2.6 conversations

```sql
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.7 messages

```sql
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.8 points

```sql
CREATE TABLE points (
  point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'free' or 'paid'
  reason TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.9 payments

```sql
CREATE TABLE payments (
  payment_id BIGSERIAL PRIMARY KEY,
  payment_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  order_name TEXT NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  metadata JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at TIMESTAMP NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.10 attendance

```sql
CREATE TABLE attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  consecutive_days INTEGER DEFAULT 1,
  reward_points INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);
```

#### 5.2.11 referrals

```sql
CREATE TABLE referrals (
  referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id), -- 추천인
  referee_id UUID NOT NULL REFERENCES auth.users(id),  -- 피추천인
  referral_code TEXT NOT NULL,
  reward_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.12 notices

```sql
CREATE TABLE notices (
  notice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2.13 reports

```sql
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_user_id UUID REFERENCES auth.users(id),
  reported_character_id UUID REFERENCES characters(character_id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 5.3 Row Level Security (RLS)

모든 테이블에 RLS 정책 적용:

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = profile_id);

-- characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public approved characters" ON characters FOR SELECT USING (
  status = 'approved' AND is_public = TRUE OR creator_id = auth.uid()
);
CREATE POLICY "Users can manage own characters" ON characters FOR ALL USING (creator_id = auth.uid());

-- conversations/messages
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversations WHERE user_id = auth.uid())
);

-- points/payments
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON points FOR SELECT USING (user_id = auth.uid());

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = auth.uid());
```

---

## 6. API 명세

### 6.1 인증 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| POST | `/api/auth/signup` | 회원가입 | Public |
| POST | `/api/auth/login` | 로그인 | Public |
| POST | `/api/auth/logout` | 로그아웃 | Auth |
| POST | `/api/auth/resend` | 이메일 재전송 | Public |
| GET | `/api/auth/naver` | 네이버 OAuth 시작 | Public |
| GET | `/api/auth/naver/callback` | 네이버 콜백 | Public |

---

### 6.2 캐릭터 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/api/characters` | 캐릭터 목록 조회 | Public |
| GET | `/api/characters/:id` | 캐릭터 상세 조회 | Public |
| POST | `/api/characters/create` | 캐릭터 생성 | Auth |
| PUT | `/api/characters/update` | 캐릭터 수정 | Owner |
| DELETE | `/api/characters/delete` | 캐릭터 삭제 | Owner |
| POST | `/api/characters/upload-media` | 미디어 업로드 | Auth |
| POST | `/api/characters/keywords` | 키워드북 저장 | Owner |
| POST | `/api/characters/safety-filter` | 필터 저장 | Owner |

---

### 6.3 채팅 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| POST | `/api/chat/send-message` | 메시지 전송 | Auth |
| GET | `/api/chat/conversations` | 대화 목록 조회 | Auth |
| GET | `/api/chat/conversations/:id` | 대화 상세 조회 | Auth |

---

### 6.4 사용자 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/api/users/profile` | 프로필 조회 | Auth |
| POST | `/api/users/profile` | 프로필 수정 | Auth |
| POST | `/api/users/password` | 비밀번호 변경 | Auth |
| POST | `/api/users/email` | 이메일 변경 | Auth |
| DELETE | `/api/users/` | 계정 삭제 | Auth |

---

### 6.5 포인트/결제 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/api/points` | 포인트 내역 조회 | Auth |
| POST | `/api/payments/create` | 결제 생성 | Auth |
| POST | `/api/payments/verify` | 결제 검증 | Auth |

---

### 6.6 Admin API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/api/admin/users` | 유저 목록 | Admin |
| GET | `/api/admin/characters` | 캐릭터 목록 | Admin |
| POST | `/api/admin/characters/approve` | 캐릭터 승인 | Admin |
| POST | `/api/admin/characters/reject` | 캐릭터 거부 | Admin |
| GET | `/api/admin/payments` | 결제 내역 | Admin |
| POST | `/api/admin/notices/create` | 공지 작성 | Admin |

---

## 7. UI/UX 가이드라인

### 7.1 디자인 원칙

1. **직관성**: 사용자가 학습 없이 사용 가능한 인터페이스
2. **일관성**: 모든 화면에서 동일한 패턴 유지
3. **접근성**: WCAG 2.1 AA 수준 준수
4. **반응성**: 모바일/태블릿/데스크톱 대응

### 7.2 컬러 팔레트

- **Primary**: 브랜드 컬러 (예: #6366F1)
- **Secondary**: 보조 컬러
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Dark Mode**: 자동 지원 (next-themes)

### 7.3 타이포그래피

- **폰트**: 시스템 폰트 스택 (Pretendard, Apple SD Gothic Neo, 맑은 고딕)
- **기본 크기**: 16px
- **제목**: 24px ~ 48px (scale: 1.25)

### 7.4 레이아웃

- **최대 너비**: 1280px
- **여백**: Tailwind 기본 스페이싱 (4px 단위)
- **그리드**: 12 컬럼 시스템

### 7.5 주요 화면 와이어프레임

#### 홈 화면

```
┌─────────────────────────────────────┐
│ 헤더 (로고, 검색바, 프로필)           │
├─────────────────────────────────────┤
│ 출석체크 버튼 (원클릭)                │
├─────────────────────────────────────┤
│ 공지/이벤트 배너 (슬라이더)           │
├─────────────────────────────────────┤
│ 검색/정렬/필터                        │
├─────────────────────────────────────┤
│ [인기 캐릭터]                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │            │
│ └───┘ └───┘ └───┘ └───┘            │
├─────────────────────────────────────┤
│ [최신 캐릭터]                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│ │ 5 │ │ 6 │ │ 7 │ │ 8 │            │
│ └───┘ └───┘ └───┘ └───┘            │
└─────────────────────────────────────┘
```

#### 채팅 화면

```
┌─────────────────────────────────────┐
│ [캐릭터 프로필] [모델 선택] [설정]   │
├─────────────────────────────────────┤
│                                     │
│ 캐릭터: 안녕하세요!                  │
│                                     │
│              사용자: 안녕!           │
│                                     │
│ 캐릭터: 반가워요~                    │
│                                     │
├─────────────────────────────────────┤
│ [입력창]                      [전송] │
└─────────────────────────────────────┘
```

#### 캐릭터 생성 화면

```
┌─────────────────────────────────────┐
│ 캐릭터 생성                           │
├─────────────────────────────────────┤
│ Step 1: 프로필                        │
│ - 이름: [           ]                │
│ - 소개: [           ]                │
│ - 이미지: [업로드]                    │
├─────────────────────────────────────┤
│ Step 2: 설정                          │
│ - 역할: [           ]                │
│ - 성격: [복수 선택]                   │
│ - 말투: [           ]                │
├─────────────────────────────────────┤
│ Step 3: 시작 설정                     │
│ - 첫 인사말: [      ]                │
├─────────────────────────────────────┤
│ [이전]                         [다음] │
└─────────────────────────────────────┘
```

---

## 8. 보안 및 정책

### 8.1 인증 보안

- **세션 관리**: Supabase Auth 쿠키 기반
- **비밀번호**: bcrypt 해싱 (Supabase 기본)
- **이메일 검증**: 필수
- **본인인증**: 성인 콘텐츠 접근 제한

### 8.2 데이터 보안

- **RLS (Row Level Security)**: 모든 테이블 적용
- **API 권한**: 사용자별 접근 제어
- **HTTPS**: 전 구간 암호화 (Vercel 기본)

### 8.3 콘텐츠 정책

- **NSFW 콘텐츠**: 본인인증 완료 계정만 접근
- **세이프티 필터**: 캐릭터별 설정 가능
- **신고 시스템**: 부적절한 콘텐츠 신고 및 처리

### 8.4 개인정보 보호

- **최소 수집**: 필수 정보만 수집
- **동의 관리**: 마케팅 수신 동의 별도
- **삭제 권리**: 계정 삭제 시 즉시 삭제

---

## 9. 배포 및 인프라

### 9.1 배포 환경

- **프로덕션**: Vercel
- **데이터베이스**: Supabase (PostgreSQL)
- **스토리지**: Supabase Storage
- **도메인**: 의뢰인 제공

### 9.2 환경 변수

```env
# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI API Keys
OPENAI_API_KEY=sk-proj-...
GOOGLE_GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# 결제
TOSS_PAYMENTS_CLIENT_KEY=...
TOSS_PAYMENTS_SECRET_KEY=...

# 이메일
RESEND_API_KEY=...

# 모니터링
SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...

# 분석
VITE_GOOGLE_TAG_ID=...

# 앱 정보
VITE_APP_NAME=냐냥
```

### 9.3 CI/CD

- **자동 배포**: Vercel (main 브랜치 푸시 시)
- **미리보기**: PR별 자동 배포
- **타입 체크**: 빌드 전 자동 실행

### 9.4 모니터링

- **에러 트래킹**: Sentry
- **분석**: Google Analytics
- **로그**: Vercel 로그

---

## 10. 검수 기준

### 10.1 1차 마일스톤 (2주차)

**검수 항목**:
- [ ] 프로젝트 초기 세팅 완료 (React Router, Tailwind, Supabase)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 이메일 회원가입/로그인 기능 동작
- [ ] 이메일 인증 프로세스 동작
- [ ] 세션 관리 정상 작동

**납품물**:
- 소스코드 (GitHub 저장소)
- 환경 변수 설정 가이드
- 데이터베이스 스키마 문서

---

### 10.2 2차 마일스톤 (4주차)

**검수 항목**:
- [ ] 소셜 로그인 동작 (네이버, 구글, 애플)
- [ ] 본인인증 프로세스 동작
- [ ] 추천인 코드 시스템 동작
- [ ] 홈 화면 UI 완성
- [ ] 출석체크 기능 동작
- [ ] 공지/이벤트 배너 표시
- [ ] 검색/정렬/필터 동작

**납품물**:
- 소스코드 업데이트
- 소셜 로그인 설정 가이드
- 본인인증 연동 문서

---

### 10.3 3차 마일스톤 (8주차)

**검수 항목**:

#### 채팅 기능
- [ ] AI 모델 선택 UI 동작
- [ ] 메시지 전송 및 수신 정상 작동
- [ ] 대화 히스토리 DB 저장 확인
- [ ] 라이트/다크 모드 전환 동작

#### 캐릭터 관리
- [ ] 캐릭터 생성 폼 동작
- [ ] 프로필 이미지 업로드 동작
- [ ] 키워드북 저장 동작
- [ ] 세이프티 필터 저장 동작
- [ ] 공개/비공개 설정 동작
- [ ] 캐릭터 수정/삭제 동작
- [ ] 캐릭터 목록/상세 페이지 표시

#### 마이페이지
- [ ] 내 정보 조회/수정 동작
- [ ] 포인트 내역 조회 동작

#### 결제
- [ ] Toss Payments 위젯 렌더링
- [ ] 결제 프로세스 정상 작동
- [ ] 결제 성공 시 포인트 지급 확인
- [ ] 결제 이력 조회 동작

#### Admin
- [ ] 유저 목록 조회 동작
- [ ] 캐릭터 승인/거부 동작
- [ ] 결제 내역 조회 동작
- [ ] 공지사항 등록 동작
- [ ] 신고 처리 기능 동작

**납품물**:
- 최종 소스코드
- 데이터베이스 마이그레이션 스크립트
- 배포 가이드
- 사용자 매뉴얼 (선택)

---

### 10.4 공통 검수 기준

**기능성**:
- 모든 핵심 기능이 명세대로 동작
- 치명적 버그 없음
- 에러 핸들링 적절

**성능**:
- 페이지 로드 시간 3초 이내
- API 응답 시간 1초 이내

**보안**:
- RLS 정책 적용
- 인증/권한 체크 정상 동작
- HTTPS 적용

**호환성**:
- Chrome, Safari, Firefox 최신 버전
- 모바일 반응형 대응

**코드 품질**:
- TypeScript 타입 에러 없음
- 주요 함수 주석 포함
- 일관된 코드 스타일

---

## 11. 향후 확장 계획 (제외 범위)

본 PRD에는 포함되지 않으나, **4차~5차 마일스톤(11주차~24주차)**에서 개발 예정인 기능들입니다:

### 11.1 채팅 고도화

- 롤백/분기: 특정 메시지로 되돌리기 & 새 대화 생성
- 메시지 재생성: 가이드 입력 지원, 이전 버전 비교
- 요약 메모리: 장기 기억, 수동 요약/편집
- 대화 공유/갤러리: 내 프로필에 저장, 일부 공유 기능
- 모델 상태 알림: 서버 불안정 시 자동/수동 공지

### 11.2 크리에이터 모드

- 제작자 인증 (성인 인증 포함)
- 인센티브/수익 정산
- 활동 관리: 조회수, 좋아요, 수익 통계

### 11.3 결제 고도화

- 국내 PG 연동: 카카오페이, 네이버페이, 토스
- 구독 모델 (선택)

### 11.4 Admin 고도화

- 통계/모니터링: DAU/MAU, 모델별 사용 비율
- 자동 리포트: 일간/주간 요약 메일
- 권한 분리: Super Admin / Operator / CS
- 보안 강화: 운영자 2FA, IP 제한

---

## 12. 참고 자료

### 12.1 기술 문서

- [React Router v7 문서](https://reactrouter.com/)
- [Supabase 문서](https://supabase.com/docs)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Toss Payments 문서](https://docs.tosspayments.com/)
- [Vercel AI SDK 문서](https://sdk.vercel.ai/docs)

### 12.2 계약서

- 프로젝트명: 냐냥 플랫폼 개발
- 개발자: 박기준
- 의뢰인: 김보현
- 계약 기간: MVP 3개월 (3차 마일스톤까지)
- 총 개발비: ₩4,700,000

---

## 부록 A: 용어 정의

- **MVP**: Minimum Viable Product (최소 기능 제품)
- **RLS**: Row Level Security (행 수준 보안)
- **NSFW**: Not Safe For Work (성인 콘텐츠)
- **OAuth**: Open Authorization (개방형 인증)
- **OTP**: One-Time Password (일회용 비밀번호)
- **PG**: Payment Gateway (결제 게이트웨이)

---

## 부록 B: 버전 히스토리

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-11-20 | 박기준 | 초안 작성 (MVP 3차 마일스톤) |

---

**문서 끝**
