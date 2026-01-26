# 냐냥 플랫폼 - 3차 마일스톤 완료 설정 가이드

## 완료된 기능 목록

### ✅ 3차 마일스톤 (채팅 기본 · 캐릭터 관리)

1. **캐릭터 관리 시스템 (100%)**
   - 캐릭터 데이터베이스 스키마 완료
   - 캐릭터 CRUD API 구현
   - 캐릭터 프로필, 설정, 메타데이터 관리
   - 미디어 업로드 (아바타, 배너, 갤러리)

2. **키워드북 기능 (100%)**
   - 키워드 추가/수정/삭제 API
   - 우선순위 기반 키워드 관리
   - 응답 템플릿 설정

3. **세이프티 필터 (100%)**
   - NSFW, 폭력, 혐오 발언, 개인정보 필터링
   - 커스텀 차단 단어/구문 설정
   - 민감도 레벨 조정 (1-10)

4. **채팅 AI API 연동 (100%)**
   - OpenAI (GPT-4) 지원
   - Google Gemini 지원
   - Anthropic Claude 지원
   - 캐릭터 기반 시스템 프롬프트 생성
   - 키워드북 및 세이프티 필터 통합

---

## 필수 설정 단계

### 1. 데이터베이스 마이그레이션 실행

**Supabase Dashboard**에서 SQL Editor를 열고 다음 파일을 실행하세요:

\`\`\`
sql/migrations/0002_characters_schema.sql
\`\`\`

**또는 명령줄에서 실행:**

\`\`\`bash
# psql이 설치되어 있는 경우
psql "postgresql://postgres.mvsrdxkebswndflrgtod:kijunpark0607@aws-1-us-west-1.pooler.supabase.com:6543/postgres" -f sql/migrations/0002_characters_schema.sql
\`\`\`

**마이그레이션 내용:**
- `characters` 테이블 생성
- `character_keywords` 테이블 생성
- `character_safety_filters` 테이블 생성
- `character_likes` 테이블 생성
- Storage bucket `character-media` 생성
- RLS (Row Level Security) 정책 설정
- 인덱스 생성

---

### 2. 환경 변수 설정

`.env` 파일에 다음 환경 변수를 **추가**하세요:

\`\`\`env
# 🔥 AI API Keys (최소 하나 이상 필수) 🔥

# OpenAI API Key (GPT-4 사용)
# https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-..."

# Google Gemini API Key (Gemini 2.5 Pro 사용 - 추천)
# https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY="AIza..."

# Anthropic Claude API Key (Claude Sonnet/Opus 사용)
# https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-..."
\`\`\`

**API 키 발급 방법:**

1. **Google Gemini (무료, 추천)**
   - https://aistudio.google.com/app/apikey 접속
   - Google 계정으로 로그인
   - "Create API Key" 클릭
   - API 키 복사하여 `.env`에 추가

2. **OpenAI GPT-4**
   - https://platform.openai.com/api-keys 접속
   - "Create new secret key" 클릭
   - API 키 복사하여 `.env`에 추가

3. **Anthropic Claude**
   - https://console.anthropic.com/ 접속
   - "API Keys" → "Create Key" 클릭
   - API 키 복사하여 `.env`에 추가

---

### 3. Supabase Storage 버킷 확인

Supabase Dashboard → Storage에서 `character-media` 버킷이 생성되었는지 확인하세요.

**수동 생성이 필요한 경우:**
1. Storage → "New bucket" 클릭
2. Name: `character-media`
3. Public bucket: ✅ 체크
4. File size limit: `5MB`
5. Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

---

## API 엔드포인트 목록

### 캐릭터 관리 API

\`\`\`
POST   /api/characters/create          - 캐릭터 생성
PUT    /api/characters/update          - 캐릭터 업데이트
DELETE /api/characters/delete          - 캐릭터 삭제
POST   /api/characters/upload-media    - 미디어 업로드 (아바타/배너/갤러리)
\`\`\`

### 키워드북 API

\`\`\`
POST /api/characters/keywords
Body: { action: "add", character_id, keyword, description, response_template, priority }
Body: { action: "update", keyword_id, ... }
Body: { action: "delete", keyword_id }
\`\`\`

### 세이프티 필터 API

\`\`\`
POST /api/characters/safety-filter
Body: {
  character_id,
  block_nsfw,
  block_violence,
  block_hate_speech,
  block_personal_info,
  blocked_words: [],
  blocked_phrases: [],
  sensitivity_level: 5
}
\`\`\`

### 채팅 API

\`\`\`
POST /api/chat/send-message
Body: {
  character_id,
  message,
  message_type: "dialogue" | "action",
  model: "gemini-2.5-pro" | "claude-sonnet" | "opus" | "gpt-4" | "custom",
  conversation_history: [...]
}
\`\`\`

---

## 데이터베이스 스키마

### characters 테이블

\`\`\`sql
- character_id (BIGINT, PK)
- name (TEXT, NOT NULL)
- display_name (TEXT)
- description (TEXT)
- greeting_message (TEXT)
- avatar_url (TEXT)
- banner_url (TEXT)
- gallery_urls (JSONB)
- personality_traits (TEXT[])
- tone (TEXT)
- age (INTEGER)
- gender (TEXT)
- is_public (BOOLEAN)
- is_nsfw (BOOLEAN)
- status (ENUM: draft, pending_review, approved, rejected, archived)
- tags (TEXT[])
- view_count, like_count, chat_count (INTEGER)
- creator_id (UUID, FK → auth.users)
- created_at, updated_at (TIMESTAMP)
\`\`\`

### character_keywords 테이블

\`\`\`sql
- keyword_id (BIGINT, PK)
- character_id (BIGINT, FK → characters)
- keyword (TEXT, NOT NULL)
- description (TEXT)
- response_template (TEXT)
- priority (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
\`\`\`

### character_safety_filters 테이블

\`\`\`sql
- filter_id (BIGINT, PK)
- character_id (BIGINT, FK → characters, UNIQUE)
- block_nsfw, block_violence, block_hate_speech, block_personal_info (BOOLEAN)
- blocked_words, blocked_phrases (TEXT[])
- sensitivity_level (INTEGER, 1-10)
- created_at, updated_at (TIMESTAMP)
\`\`\`

---

## 사용 예시

### 1. 캐릭터 생성

\`\`\`javascript
const response = await fetch('/api/characters/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '냐냥이',
    description: '귀여운 고양이 캐릭터',
    greeting_message: '냐~! 반가워!',
    personality_traits: ['귀여움', '친근함', '장난기'],
    tone: 'cute',
    is_public: true,
    tags: ['고양이', '귀여움']
  })
});

const { character } = await response.json();
console.log('캐릭터 생성 완료:', character.character_id);
\`\`\`

### 2. 키워드 추가

\`\`\`javascript
await fetch('/api/characters/keywords', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    character_id: '123',
    keyword: '밥',
    description: '밥에 대한 반응',
    response_template: '*냐옹냥~ 배고파!* "밥 줄래?"',
    priority: 10
  })
});
\`\`\`

### 3. 세이프티 필터 설정

\`\`\`javascript
await fetch('/api/characters/safety-filter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    character_id: '123',
    block_nsfw: true,
    block_violence: true,
    block_hate_speech: true,
    block_personal_info: true,
    blocked_words: ['욕설1', '욕설2'],
    sensitivity_level: 7
  })
});
\`\`\`

### 4. 채팅 메시지 전송

\`\`\`javascript
const response = await fetch('/api/chat/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    character_id: '123',
    message: '안녕?',
    message_type: 'dialogue',
    model: 'gemini-2.5-pro',
    conversation_history: []
  })
});

const { response: aiResponse } = await response.json();
console.log('AI 응답:', aiResponse.content);
\`\`\`

---

## 다음 단계 (4차 마일스톤)

3차 마일스톤 완료 후, 4차 마일스톤을 위해 다음 기능들을 구현해야 합니다:

1. **대화 이력 저장 시스템**
   - \`conversations\` 테이블
   - \`conversation_messages\` 테이블

2. **롤백/분기 기능**
   - \`conversation_branches\` 테이블
   - 분기 생성 및 관리 API

3. **재생성 기능**
   - 마지막 메시지 재생성 API

4. **요약 메모리**
   - \`conversation_summaries\` 테이블
   - 자동/수동 요약 생성

5. **포인트 시스템**
   - \`user_points\` 테이블
   - \`point_transactions\` 테이블
   - 포인트 적립/차감 API

---

## 문제 해결

### 1. AI API 응답 없음

**증상:** 채팅에서 "응답을 생성할 수 없습니다" 메시지가 표시됨

**해결 방법:**
1. `.env` 파일에 최소 하나 이상의 AI API 키가 설정되어 있는지 확인
2. 서버 로그를 확인하여 API 오류 메시지 확인
3. API 키가 유효한지 확인 (만료되지 않았는지)
4. API 사용량 한도를 초과하지 않았는지 확인

### 2. 미디어 업로드 실패

**증상:** 이미지 업로드 시 403 또는 500 오류

**해결 방법:**
1. Supabase Storage에 `character-media` 버킷이 생성되어 있는지 확인
2. 버킷이 Public으로 설정되어 있는지 확인
3. Storage 정책이 올바르게 설정되어 있는지 확인 (마이그레이션 파일 실행)
4. 파일 크기가 5MB 이하인지 확인

### 3. RLS 정책 오류

**증상:** "permission denied" 또는 "row level security policy" 오류

**해결 방법:**
1. 마이그레이션 파일 `0002_characters_schema.sql`이 완전히 실행되었는지 확인
2. Supabase Dashboard → Authentication에서 사용자가 로그인되어 있는지 확인
3. RLS가 활성화되어 있는지 확인 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)

---

## 테스트 방법

### 1. 기본 테스트 시나리오

\`\`\`bash
# 1. 서버 시작
npm run dev

# 2. 브라우저에서 접속
# http://localhost:5173

# 3. 로그인

# 4. 캐릭터 생성 테스트
# - /dashboard 또는 캐릭터 생성 페이지에서 새 캐릭터 생성
# - 이미지 업로드 테스트
# - 키워드 추가 테스트
# - 세이프티 필터 설정 테스트

# 5. 채팅 테스트
# - /chat/[character_id] 접속
# - 메시지 전송 테스트
# - AI 응답 확인
\`\`\`

### 2. API 테스트 (curl)

\`\`\`bash
# 캐릭터 생성
curl -X POST http://localhost:5173/api/characters/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 캐릭터",
    "description": "테스트용",
    "is_public": false
  }'

# 채팅 메시지 전송
curl -X POST http://localhost:5173/api/chat/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "character_id": "1",
    "message": "안녕",
    "message_type": "dialogue",
    "model": "gemini-2.5-pro"
  }'
\`\`\`

---

## 완료 체크리스트

- [x] 캐릭터 데이터베이스 스키마 생성
- [x] 캐릭터 CRUD API 구현
- [x] 키워드북 API 구현
- [x] 세이프티 필터 API 구현
- [x] 미디어 업로드 기능 구현
- [x] 채팅 AI API 백엔드 연동
- [x] 라우팅 설정 업데이트
- [ ] 데이터베이스 마이그레이션 실행 (수동 실행 필요)
- [ ] 환경 변수 설정 (AI API 키 추가 필요)
- [ ] 테스트 및 검증

---

## 연락처

문제가 발생하거나 질문이 있으시면 연락 주세요.

**개발자:** 박기준
**의뢰인:** 김보현
