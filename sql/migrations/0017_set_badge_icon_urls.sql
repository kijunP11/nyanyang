-- 수동 마이그레이션: 뱃지 아이콘 URL 설정
-- Drizzle journal에 등록되지 않음. SQL 에디터 또는 psql로 직접 실행할 것.
-- 날짜: 2026-03-07
--
-- Figma에서 추출한 12개 뱃지 아이콘 (followers, likes, conversations)
-- 각 카테고리별 4단계 (Lv.1, Lv.2, Lv.3, Max)
-- 아이콘 파일은 /public/badges/ 디렉토리에 저장됨

-- 팔로워 카테고리
UPDATE badge_definitions SET icon_url = '/badges/followers-lv1.png' WHERE category = 'followers' AND level = 'Lv.1';
UPDATE badge_definitions SET icon_url = '/badges/followers-lv2.png' WHERE category = 'followers' AND level = 'Lv.2';
UPDATE badge_definitions SET icon_url = '/badges/followers-lv3.png' WHERE category = 'followers' AND level = 'Lv.3';
UPDATE badge_definitions SET icon_url = '/badges/followers-max.png' WHERE category = 'followers' AND level = 'Max';

-- 좋아요 카테고리
UPDATE badge_definitions SET icon_url = '/badges/likes-lv1.png' WHERE category = 'likes' AND level = 'Lv.1';
UPDATE badge_definitions SET icon_url = '/badges/likes-lv2.png' WHERE category = 'likes' AND level = 'Lv.2';
UPDATE badge_definitions SET icon_url = '/badges/likes-lv3.png' WHERE category = 'likes' AND level = 'Lv.3';
UPDATE badge_definitions SET icon_url = '/badges/likes-max.png' WHERE category = 'likes' AND level = 'Max';

-- 대화 카테고리
UPDATE badge_definitions SET icon_url = '/badges/conversations-lv1.png' WHERE category = 'conversations' AND level = 'Lv.1';
UPDATE badge_definitions SET icon_url = '/badges/conversations-lv2.png' WHERE category = 'conversations' AND level = 'Lv.2';
UPDATE badge_definitions SET icon_url = '/badges/conversations-lv3.png' WHERE category = 'conversations' AND level = 'Lv.3';
UPDATE badge_definitions SET icon_url = '/badges/conversations-max.png' WHERE category = 'conversations' AND level = 'Max';
