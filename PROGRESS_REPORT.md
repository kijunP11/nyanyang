# 냐냥 플랫폼 - 3차/4차 마일스톤 진행상황 보고서

**작성일:** 2024년 12월  
**프로젝트:** 냐냥 웹소설/캐릭터 채팅 플랫폼  
**현재 단계:** 3차 마일스톤 완료, 4차 마일스톤 준비

---

## 📊 마일스톤 진행률

- ✅ **3차 마일스톤: 채팅 기본 · 캐릭터 관리** - **100% 완료**
- ⏳ **4차 마일스톤: 대화 이력 · 포인트 시스템** - **0% (준비 중)**

---

## ✅ 3차 마일스톤: 채팅 기본 · 캐릭터 관리 (100% 완료)

### 3.1 캐릭터 관리 시스템 - 100%

#### 데이터베이스 스키마
- ✅ `characters` 테이블 (캐릭터 기본 정보)
- ✅ `character_keywords` 테이블 (키워드북)
- ✅ `character_safety_filters` 테이블 (세이프티 필터)
- ✅ `character_likes` 테이블 (좋아요)
- ✅ Storage bucket `character-media` (미디어 저장)

#### API 엔드포인트
- ✅ `POST /api/characters/create` - 캐릭터 생성
- ✅ `PUT /api/characters/update` - 캐릭터 수정
- ✅ `DELETE /api/characters/delete` - 캐릭터 삭제
- ✅ `POST /api/characters/upload-media` - 미디어 업로드
- ✅ `POST /api/characters/keywords` - 키워드 관리 (추가/수정/삭제)
- ✅ `POST /api/characters/safety-filter` - 세이프티 필터 설정

#### 화면
- ✅ `/characters` - 캐릭터 목록
- ✅ `/characters/create` - 캐릭터 생성
- ✅ `/characters/:characterId/edit` - 캐릭터 편집 (탭 구조: 기본 정보/키워드/세이프티 필터)

#### 주요 기능
- ✅ 캐릭터 프로필 관리 (이름, 설명, 인사말)
- ✅ 미디어 관리 (아바타, 배너, 갤러리)
- ✅ 성격 설정 (성격 특성, 톤, 나이, 성별)
- ✅ 공개/비공개 설정
- ✅ NSFW 태그
- ✅ 상태 관리 (draft/pending_review/approved/rejected/archived)
- ✅ 태그 시스템
- ✅ 통계 (조회수, 좋아요, 채팅 수)

**주요 파일**
- `app/features/characters/schema.ts` - 데이터베이스 스키마 정의
- `app/features/characters/queries.ts` - 데이터베이스 쿼리 함수
- `app/features/characters/api/*.tsx` - API 엔드포인트
- `app/features/characters/screens/*.tsx` - 화면 컴포넌트

---

### 3.2 키워드북 기능 - 100%

#### 기능
- ✅ 키워드 추가/수정/삭제
- ✅ 우선순위 기반 키워드 관리
- ✅ 응답 템플릿 설정
- ✅ 키워드 활성화/비활성화

#### 데이터 구조
```typescript
{
  keyword_id: number (PK)
  character_id: number (FK)
  keyword: string (키워드 텍스트)
  description: string (설명)
  response_template: string (응답 템플릿)
  priority: number (우선순위)
  is_active: boolean (활성화 여부)
}
```

#### API 사용 예시
```typescript
// 키워드 추가
POST /api/characters/keywords
{
  action: "add",
  character_id: 123,
  keyword: "밥",
  description: "밥에 대한 반응",
  response_template: "*냐옹냥~ 배고파!* \"밥 줄래?\"",
  priority: 10
}

// 키워드 수정
POST /api/characters/keywords
{
  action: "update",
  keyword_id: 456,
  keyword: "밥",
  priority: 5
}

// 키워드 삭제
POST /api/characters/keywords
{
  action: "delete",
  keyword_id: 456
}
```

---

### 3.3 세이프티 필터 - 100%

#### 기능
- ✅ NSFW 콘텐츠 차단
- ✅ 폭력 콘텐츠 차단
- ✅ 혐오 발언 차단
- ✅ 개인정보 차단
- ✅ 커스텀 차단 단어/구문 설정
- ✅ 민감도 레벨 조정 (1-10)

#### 데이터 구조
```typescript
{
  filter_id: number (PK)
  character_id: number (FK, UNIQUE)
  block_nsfw: boolean
  block_violence: boolean
  block_hate_speech: boolean
  block_personal_info: boolean
  blocked_words: string[] (차단 단어 목록)
  blocked_phrases: string[] (차단 구문 목록)
  sensitivity_level: number (1-10)
}
```

#### API 사용 예시
```typescript
POST /api/characters/safety-filter
{
  character_id: 123,
  block_nsfw: true,
  block_violence: true,
  block_hate_speech: true,
  block_personal_info: true,
  blocked_words: ["욕설1", "욕설2"],
  blocked_phrases: ["특정 구문"],
  sensitivity_level: 7
}
```

---

### 3.4 채팅 AI API 연동 - 100%

#### 지원 AI 모델
- ✅ OpenAI GPT-4
- ✅ Google Gemini 2.5 Pro (추천)
- ✅ Anthropic Claude Sonnet/Opus
- ✅ 커스텀 모델 지원

#### API 엔드포인트
- ✅ `POST /api/chat/send-message` - 메시지 전송 및 AI 응답

#### 기능
- ✅ 캐릭터 기반 시스템 프롬프트 자동 생성
- ✅ 키워드북 통합 (키워드 매칭 시 응답 템플릿 사용)
- ✅ 세이프티 필터 통합 (응답 필터링)
- ✅ 대화 이력 관리 (conversation_history)
- ✅ 액션/대사 구분 (`message_type: "action" | "dialogue"`)

#### 시스템 프롬프트 구성
1. **캐릭터 기본 정보**
   - 이름, 설명, 인사말
   - 성격 특성 및 톤
   - 나이, 성별

2. **키워드북 통합**
   - 우선순위 기반 키워드 매칭
   - 매칭된 키워드의 응답 템플릿 사용

3. **세이프티 필터 규칙**
   - 차단 콘텐츠 유형
   - 차단 단어/구문
   - 민감도 레벨

#### API 사용 예시
```typescript
POST /api/chat/send-message
{
  character_id: 123,
  message: "안녕?",
  message_type: "dialogue", // "action" | "dialogue"
  model: "gemini-2.5-pro", // "gpt-4" | "claude-sonnet" | "opus" | "custom"
  conversation_history: [
    { role: "user", content: "안녕" },
    { role: "character", content: "안녕하세요!" }
  ]
}

// 응답
{
  success: true,
  response: {
    content: "안녕하세요! 오늘 하루는 어떠셨나요?",
    character_name: "냐냥이"
  }
}
```

**주요 파일**
- `app/features/chat/api/send-message.tsx` - AI API 연동 로직

---

### 3.5 채팅 UI - 100%

#### 구현 완료
- ✅ 채팅방 헤더 (캐릭터 정보, 설정 버튼)
- ✅ 캐릭터 프로필 표시
- ✅ 메시지 표시 (사용자/캐릭터 구분)
- ✅ 액션 텍스트 표시 (`*액션*` 형식)
- ✅ 메시지 입력 (액션/대사 토글)
- ✅ AI 모델 선택기
- ✅ 채팅 설정 다이얼로그
- ✅ 메시지 액션 (롤백/재생성/분기) - UI만 구현, 기능은 4차 마일스톤
- ✅ 모델 상태 배너

#### 주요 컴포넌트
- `app/features/chat/screens/chat.tsx` - 메인 채팅 화면
- `app/features/chat/components/chat-header.tsx` - 헤더
- `app/features/chat/components/chat-message.tsx` - 메시지 표시
- `app/features/chat/components/chat-input.tsx` - 입력창
- `app/features/chat/components/character-profile.tsx` - 캐릭터 프로필
- `app/features/chat/components/model-selector.tsx` - 모델 선택
- `app/features/chat/components/chat-settings.tsx` - 설정 다이얼로그
- `app/features/chat/components/message-actions.tsx` - 메시지 액션
- `app/features/chat/components/model-status-banner.tsx` - 모델 상태

#### 현재 상태
- ✅ UI 구현 완료 (Figma 디자인 기준)
- ✅ AI 응답 기능 작동
- ✅ 로컬 상태 관리 (메시지 히스토리)
- ⚠️ 데이터베이스 저장 미구현 (4차 마일스톤)
- ⚠️ 롤백/재생성/분기 기능 미구현 (4차 마일스톤)

---

## ⚠️ 현재 이슈

### 1. tabs.tsx Import 경로 오류

**문제**
- `app/core/components/ui/tabs.tsx` 파일이 `~/lib/utils`를 import하려고 시도
- 실제 경로는 `~/core/lib/utils`
- shadcn/ui가 생성한 파일이 `components.json`의 alias 설정을 반영하지 못함

**오류 메시지**
```
Error: Cannot find module '~/lib/utils' imported from '/Users/.../app/core/components/ui/tabs.tsx'
```

**해결 방법**
- `tabs.tsx` 4번째 줄 수정 필요:
  ```typescript
  // 변경 전
  import { cn } from "~/lib/utils"
  
  // 변경 후
  import { cn } from "~/core/lib/utils"
  ```

**영향 범위**
- `character-edit.tsx` 화면 렌더링 불가
- 캐릭터 편집 기능 사용 불가

**우선순위:** 🔴 높음 (즉시 수정 필요)

---

## 📋 4차 마일스톤: 대화 이력 · 포인트 시스템 (준비 중)

### 1. 대화 이력 저장 시스템

#### 필요 작업
- [ ] `conversations` 테이블 생성
  ```sql
  CREATE TABLE conversations (
    conversation_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT NOT NULL REFERENCES characters(character_id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] `conversation_messages` 테이블 생성
  ```sql
  CREATE TABLE conversation_messages (
    message_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id),
    role TEXT NOT NULL CHECK (role IN ('user', 'character')),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('dialogue', 'action')),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] API 구현
  - [ ] `POST /api/conversations/create` - 새 대화 생성
  - [ ] `GET /api/conversations` - 대화 목록 조회
  - [ ] `GET /api/conversations/:conversationId` - 대화 상세 조회
  - [ ] `POST /api/conversations/:conversationId/messages` - 메시지 저장
  - [ ] `PUT /api/conversations/:conversationId/title` - 대화 제목 수정
  - [ ] `DELETE /api/conversations/:conversationId` - 대화 삭제

- [ ] UI 구현
  - [ ] 대화 목록 화면
  - [ ] 대화 제목 편집
  - [ ] 대화 삭제 기능
  - [ ] 채팅 화면에서 자동 저장

#### 예상 데이터 구조
```typescript
// conversations 테이블
{
  conversation_id: number
  character_id: number
  user_id: string (UUID)
  title: string | null
  created_at: Date
  updated_at: Date
}

// conversation_messages 테이블
{
  message_id: number
  conversation_id: number
  role: "user" | "character"
  content: string
  message_type: "dialogue" | "action"
  timestamp: Date
  created_at: Date
}
```

---

### 2. 롤백/분기 기능

#### 필요 작업
- [ ] `conversation_branches` 테이블 생성
  ```sql
  CREATE TABLE conversation_branches (
    branch_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id),
    parent_message_id BIGINT NOT NULL REFERENCES conversation_messages(message_id),
    branch_point BIGINT NOT NULL, -- 분기 지점 메시지 ID
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] API 구현
  - [ ] `POST /api/conversations/:conversationId/branches` - 분기 생성
  - [ ] `GET /api/conversations/:conversationId/branches` - 분기 목록 조회
  - [ ] `POST /api/conversations/:conversationId/switch-branch` - 분기 전환
  - [ ] `DELETE /api/conversations/:conversationId/branches/:branchId` - 분기 삭제

- [ ] UI 구현
  - [ ] 메시지 액션에서 분기 생성 버튼
  - [ ] 분기 목록 표시
  - [ ] 분기 전환 기능
  - [ ] 분기 시각화 (트리 구조)

#### 기능 설명
- 사용자가 특정 메시지에서 분기를 생성하면, 그 지점부터 새로운 대화 흐름 시작
- 여러 분기를 생성하여 다양한 대화 경로 탐색 가능
- 분기 전환 시 해당 분기 지점 이후의 메시지만 변경

---

### 3. 재생성 기능

#### 필요 작업
- [ ] `message_regenerations` 테이블 생성 (선택사항 - 이력 관리용)
  ```sql
  CREATE TABLE message_regenerations (
    regeneration_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    original_message_id BIGINT NOT NULL REFERENCES conversation_messages(message_id),
    regenerated_message_id BIGINT NOT NULL REFERENCES conversation_messages(message_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] API 구현
  - [ ] `POST /api/conversations/:conversationId/messages/:messageId/regenerate` - 메시지 재생성
  - [ ] `GET /api/conversations/:conversationId/messages/:messageId/regenerations` - 재생성 이력 조회

- [ ] UI 구현
  - [ ] 메시지 액션에서 재생성 버튼
  - [ ] 재생성 중 로딩 상태
  - [ ] 재생성된 메시지 표시

#### 기능 설명
- 마지막 AI 응답 메시지를 재생성하여 다른 응답 받기
- 재생성 시 기존 메시지는 유지하고 새로운 메시지 추가
- 재생성 이력을 관리하여 여러 버전 비교 가능

---

### 4. 요약 메모리

#### 필요 작업
- [ ] `conversation_summaries` 테이블 생성
  ```sql
  CREATE TABLE conversation_summaries (
    summary_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(conversation_id),
    summary_text TEXT NOT NULL,
    message_count INTEGER NOT NULL, -- 요약된 메시지 수
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] API 구현
  - [ ] `POST /api/conversations/:conversationId/summarize` - 요약 생성 (자동/수동)
  - [ ] `GET /api/conversations/:conversationId/summaries` - 요약 목록 조회
  - [ ] `DELETE /api/conversations/:conversationId/summaries/:summaryId` - 요약 삭제

- [ ] AI 통합
  - [ ] 자동 요약 생성 (일정 메시지 수 이상일 때)
  - [ ] 요약을 시스템 프롬프트에 통합
  - [ ] 요약 기반 컨텍스트 관리

- [ ] UI 구현
  - [ ] 요약 표시
  - [ ] 수동 요약 생성 버튼
  - [ ] 요약 편집

#### 기능 설명
- 긴 대화의 경우 메시지가 많아지면 컨텍스트가 길어짐
- 주기적으로 대화를 요약하여 메모리로 저장
- 이후 대화에서는 전체 메시지 대신 요약을 사용하여 컨텍스트 길이 관리
- AI API의 토큰 제한을 효율적으로 활용

---

### 5. 포인트 시스템

#### 필요 작업
- [ ] `user_points` 테이블 생성
  ```sql
  CREATE TABLE user_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    total_points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] `point_transactions` 테이블 생성
  ```sql
  CREATE TABLE point_transactions (
    transaction_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    points INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'refund')),
    description TEXT NOT NULL,
    related_id BIGINT, -- 관련 ID (conversation_id, character_id 등)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  ```

- [ ] API 구현
  - [ ] `GET /api/points` - 현재 포인트 조회
  - [ ] `GET /api/points/transactions` - 포인트 내역 조회
  - [ ] `POST /api/points/earn` - 포인트 적립 (내부 API)
  - [ ] `POST /api/points/spend` - 포인트 차감 (내부 API)
  - [ ] `POST /api/points/refund` - 포인트 환불 (내부 API)

- [ ] 포인트 적립 규칙
  - [ ] 채팅 메시지 전송 시 포인트 적립 (예: 메시지당 1포인트)
  - [ ] 일일 출석체크 포인트 적립 (이미 UI 구현됨)
  - [ ] 누적 출석 보상 포인트 적립
  - [ ] 캐릭터 좋아요 포인트 적립

- [ ] 포인트 차감 규칙
  - [ ] 프리미엄 AI 모델 사용 시 포인트 차감
  - [ ] 특정 기능 사용 시 포인트 차감

- [ ] UI 구현
  - [ ] 네비게이션 바에 포인트 표시
  - [ ] 포인트 내역 페이지 (`/points`)
  - [ ] 포인트 적립/차감 알림
  - [ ] 포인트 부족 시 경고

#### 예상 데이터 구조
```typescript
// user_points 테이블
{
  user_id: string (UUID)
  total_points: number
  updated_at: Date
}

// point_transactions 테이블
{
  transaction_id: number
  user_id: string (UUID)
  points: number // 양수: 적립, 음수: 차감
  transaction_type: "earn" | "spend" | "refund"
  description: string
  related_id: number | null // conversation_id, character_id 등
  created_at: Date
}
```

---

## 🗄️ 데이터베이스 상태

### 완료된 마이그레이션
- ✅ `0000_worried_vision.sql` - 기본 인증 스키마
- ✅ `0001_great_junta.sql` - 추가 인증 기능
- ⚠️ `0002_characters_schema.sql` - 캐릭터 스키마 (생성 완료, 실행 필요)

### 실행 필요
**`sql/migrations/0002_characters_schema.sql`** 파일을 Supabase Dashboard에서 실행해야 합니다.

**마이그레이션 내용:**
- `characters` 테이블
- `character_keywords` 테이블
- `character_safety_filters` 테이블
- `character_likes` 테이블
- Storage bucket `character-media`
- RLS 정책 설정
- 인덱스 생성

### 4차 마일스톤 마이그레이션 (예정)
- [ ] `0003_conversations_schema.sql` - 대화 이력 스키마
- [ ] `0004_points_schema.sql` - 포인트 시스템 스키마

---

## 🔧 환경 설정 상태

### 필수 환경 변수

**이미 설정됨**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL`

**추가 필요**
- ⚠️ `OPENAI_API_KEY` (선택)
- ⚠️ `GOOGLE_GEMINI_API_KEY` (권장)
- ⚠️ `ANTHROPIC_API_KEY` (선택)

**설정 방법**
`.env` 파일에 추가:
```env
# AI API Keys (최소 하나 이상 필수)
OPENAI_API_KEY="sk-proj-..."
GOOGLE_GEMINI_API_KEY="AIza..."
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 🎯 4차 마일스톤 완료 기준

### 필수 완료 항목
1. ✅ 대화 이력이 데이터베이스에 저장됨
2. ✅ 대화 목록에서 이전 대화 조회 가능
3. ✅ 메시지 롤백 기능 작동
4. ✅ 메시지 재생성 기능 작동
5. ✅ 분기 생성 및 전환 기능 작동
6. ✅ 요약 메모리 생성 및 활용
7. ✅ 포인트 적립/차감 시스템 작동
8. ✅ 포인트 내역 조회 가능

### 선택 완료 항목
- [ ] 대화 검색 기능
- [ ] 대화 태그 기능
- [ ] 대화 즐겨찾기 기능
- [ ] 포인트 선물 기능
- [ ] 포인트 구매 기능

---

## 📝 참고 문서

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 설정 가이드
- [sql/migrations/0002_characters_schema.sql](./sql/migrations/0002_characters_schema.sql) - 데이터베이스 스키마
- [components.json](./components.json) - shadcn/ui 설정

---

## 🔄 최근 변경 사항

### 2024년 12월
- ✅ 3차 마일스톤 완료
  - 캐릭터 관리 시스템 구현 완료
  - 키워드북 기능 구현 완료
  - 세이프티 필터 구현 완료
  - 채팅 AI API 연동 완료
  - 채팅 UI 구현 완료
- ⚠️ tabs.tsx import 경로 오류 발견
- 📋 4차 마일스톤 계획 수립

---

## 📞 문의

**개발자:** 박기준  
**의뢰인:** 김보현

문제 발생 시 이슈를 등록하거나 연락 주세요.

---

**마지막 업데이트:** 2024년 12월
