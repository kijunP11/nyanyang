-- 0016: badge_definitions에 reward_points 컬럼 추가
-- 수동 마이그레이션: Supabase SQL Editor 또는 psql로 실행

ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS reward_points integer NOT NULL DEFAULT 0;

-- 카테고리별 기본 보상값 설정
-- onboarding 뱃지: 낮은 보상
UPDATE badge_definitions SET reward_points = 100 WHERE category = 'onboarding';
-- followers 뱃지: 레벨별 차등
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'followers' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'followers' AND threshold > 10 AND threshold <= 50;
UPDATE badge_definitions SET reward_points = 1000 WHERE category = 'followers' AND threshold > 50;
-- likes 뱃지: 레벨별 차등
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'likes' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'likes' AND threshold > 10 AND threshold <= 50;
UPDATE badge_definitions SET reward_points = 1000 WHERE category = 'likes' AND threshold > 50;
-- conversations 뱃지
UPDATE badge_definitions SET reward_points = 200 WHERE category = 'conversations' AND (threshold IS NULL OR threshold <= 10);
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'conversations' AND threshold > 10;
-- engagement 뱃지
UPDATE badge_definitions SET reward_points = 300 WHERE category = 'engagement';
-- hidden 뱃지: 높은 보상
UPDATE badge_definitions SET reward_points = 500 WHERE category = 'hidden';
