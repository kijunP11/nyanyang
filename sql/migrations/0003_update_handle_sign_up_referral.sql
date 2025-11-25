/**
 * Database Migration: 0003_update_handle_sign_up_referral
 * 
 * This migration updates the handle_sign_up function to automatically generate
 * unique referral codes for new users and adds a helper function for code generation.
 * 
 * Changes:
 * 1. Adds generate_referral_code() function for creating user-friendly referral codes
 * 2. Updates handle_sign_up() to automatically generate and assign referral codes
 * 3. Backfills referral codes for existing users who don't have one
 */

-- 1. 추천인 코드 생성 함수 (중복 체크 및 재시도 로직 포함)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
    attempts INTEGER := 0;
    -- I, L, O, 0, 1 등 혼동되는 문자 제외
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
BEGIN
    LOOP
        -- 8자리 랜덤 코드 생성
        code := '';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- 중복 체크
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
        
        -- 중복이 없으면 반환
        EXIT WHEN NOT exists_check;
        
        -- 최대 10번 시도 후 UUID 폴백 (무한 루프 방지)
        attempts := attempts + 1;
        IF attempts >= 10 THEN
            code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$;

-- 2. handle_sign_up 트리거 함수 수정 (추천인 코드 생성 로직 추가)
CREATE OR REPLACE FUNCTION handle_sign_up()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = '' -- 보안 강화: 명시적 경로 설정 없음
AS $$
DECLARE
    generated_code TEXT;
BEGIN
    -- 추천인 코드 생성
    generated_code := generate_referral_code();
    
    -- 메타데이터 확인 및 프로필 생성
    IF new.raw_app_meta_data IS NOT NULL AND new.raw_app_meta_data ? 'provider' THEN
        
        -- 이메일 또는 전화번호 가입
        IF new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone' THEN
            INSERT INTO public.profiles (profile_id, name, marketing_consent, referral_code)
            VALUES (
                new.id, 
                COALESCE(new.raw_user_meta_data ->> 'name', 'Anonymous'), 
                COALESCE((new.raw_user_meta_data ->> 'marketing_consent')::boolean, TRUE), 
                generated_code
            );
            
        -- 소셜 로그인 (Google, Kakao 등)
        ELSE
            INSERT INTO public.profiles (profile_id, name, avatar_url, marketing_consent, referral_code)
            VALUES (
                new.id, 
                new.raw_user_meta_data ->> 'full_name', 
                new.raw_user_meta_data ->> 'avatar_url', 
                TRUE, 
                generated_code
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. [옵션] 기존 유저 중 referral_code가 없는 사람들에게 코드 일괄 발급
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT profile_id FROM public.profiles WHERE referral_code IS NULL
    LOOP
        UPDATE public.profiles
        SET referral_code = generate_referral_code()
        WHERE profile_id = r.profile_id;
    END LOOP;
END;
$$;

