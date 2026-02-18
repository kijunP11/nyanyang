-- 수동 마이그레이션: 뱃지 시스템 테이블 생성 + 시드 데이터
-- Drizzle journal에 등록되지 않음. SQL 에디터 또는 psql로 직접 실행할 것.
-- 날짜: 2026-02-16

-- 1. badge_definitions 테이블
CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  level text,
  description text NOT NULL,
  metric_type text NOT NULL,
  threshold integer,
  icon_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT badge_definitions_category_name_key UNIQUE (category, name)
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-badge-defs-authenticated" ON badge_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "select-badge-defs-anon" ON badge_definitions
  FOR SELECT TO anon USING (true);

-- 2. user_badges 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  user_badge_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id integer NOT NULL REFERENCES badge_definitions(badge_id) ON DELETE CASCADE,
  claimed_at timestamp NOT NULL DEFAULT now(),
  is_representative boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select-own-badges" ON user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. 시드 데이터: 26개 뱃지

-- 팔로워 카테고리 (sort_order 1xx)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('followers', '동네 골목대장', 'Lv.1', '팔로워 10명을 달성하면 획득할 수 있어요.', 'follower_count', 10, 101, false),
  ('followers', '팬클럽 회장님', 'Lv.2', '팔로워 100명을 달성하면 획득할 수 있어요.', 'follower_count', 100, 102, false),
  ('followers', '월드 스타 냥', 'Lv.3', '팔로워 1,000명을 달성하면 획득할 수 있어요.', 'follower_count', 1000, 103, false),
  ('followers', '지구 정복자', 'Max', '팔로워 10,000명을 달성하면 획득할 수 있어요.', 'follower_count', 10000, 104, false)
ON CONFLICT (category, name) DO NOTHING;

-- 좋아요 카테고리 (sort_order 2xx)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('likes', '간식 맛 좀 볼까?', 'Lv.1', '좋아요 50개를 달성하면 획득할 수 있어요.', 'total_likes_received', 50, 201, false),
  ('likes', '츄르 트럭 사장', 'Lv.2', '좋아요 500개를 달성하면 획득할 수 있어요.', 'total_likes_received', 500, 202, false),
  ('likes', '참치캔 공장장', 'Lv.3', '좋아요 5,000개를 달성하면 획득할 수 있어요.', 'total_likes_received', 5000, 203, false),
  ('likes', '사랑의 신(Eros)', 'Max', '좋아요 50,000개를 달성하면 획득할 수 있어요.', 'total_likes_received', 50000, 204, false)
ON CONFLICT (category, name) DO NOTHING;

-- 대화 카테고리 (sort_order 3xx)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('conversations', '옹알이 탈출', 'Lv.1', '총 대화 30회를 달성하면 획득할 수 있어요.', 'total_conversations', 30, 301, false),
  ('conversations', '수다쟁이 생쥐냥', 'Lv.2', '총 대화 300회를 달성하면 획득할 수 있어요.', 'total_conversations', 300, 302, false),
  ('conversations', '언어의 마술사', 'Lv.3', '총 대화 3,000회를 달성하면 획득할 수 있어요.', 'total_conversations', 3000, 303, false),
  ('conversations', 'TMT (투머치토커)', 'Max', '총 대화 30,000회를 달성하면 획득할 수 있어요.', 'total_conversations', 30000, 304, false)
ON CONFLICT (category, name) DO NOTHING;

-- 입문 카테고리 (sort_order 4xx)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('onboarding', '알 깨고 나왔냥', NULL, '첫 로그인을 완료하면 획득할 수 있어요.', 'first_login', NULL, 401, false),
  ('onboarding', '이름이 뭐냥?', NULL, '프로필을 설정하면 획득할 수 있어요.', 'profile_setup', NULL, 402, false),
  ('onboarding', '첫 냥줍', NULL, '캐릭터를 처음 생성하면 획득할 수 있어요.', 'first_character', NULL, 403, false),
  ('onboarding', '발도장 꾹!', NULL, '7일 출석을 달성하면 획득할 수 있어요.', 'attendance_7days', 7, 404, false),
  ('onboarding', '야옹! (첫 마디)', NULL, '대화 10턴을 달성하면 획득할 수 있어요.', 'conversation_10turns', 10, 405, false)
ON CONFLICT (category, name) DO NOTHING;

-- 몰입 카테고리 (sort_order 5xx)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('engagement', '단짝 냥이', NULL, '한 캐릭터와 100번 대화하면 획득할 수 있어요.', 'single_character_100', 100, 501, false),
  ('engagement', '해바라기', NULL, '3일 연속 대화하면 획득할 수 있어요.', 'consecutive_3days', 3, 502, false),
  ('engagement', '수다 본능', NULL, '하루에 50문장을 보내면 획득할 수 있어요.', 'daily_50messages', 50, 503, false),
  ('engagement', '심쿵 주의', NULL, '좋아요를 10회 누르면 획득할 수 있어요.', 'likes_given_10', 10, 504, false),
  ('engagement', '기억의 생선가시', NULL, '기억을 10개 저장하면 획득할 수 있어요.', 'memories_10', 10, 505, false)
ON CONFLICT (category, name) DO NOTHING;

-- 히든 카테고리 (sort_order 6xx, is_hidden=true)
INSERT INTO badge_definitions (category, name, level, description, metric_type, threshold, sort_order, is_hidden) VALUES
  ('hidden', '새벽의 우다다', NULL, '비밀 조건을 달성하면 획득할 수 있어요.', 'dawn_access', NULL, 601, true),
  ('hidden', '냥펀치 타자왕', NULL, '비밀 조건을 달성하면 획득할 수 있어요.', 'long_message', 500, 602, true),
  ('hidden', '개박하 탐정', NULL, '비밀 조건을 달성하면 획득할 수 있어요.', 'search_used', NULL, 603, true),
  ('hidden', '묘르신 (猫어르신)', NULL, '비밀 조건을 달성하면 획득할 수 있어요.', 'anniversary_1year', NULL, 604, true)
ON CONFLICT (category, name) DO NOTHING;
