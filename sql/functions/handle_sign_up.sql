/**
 * Database Trigger Function: handle_sign_up
 * 
 * This function is triggered after a new user is inserted into the auth.users table.
 * It automatically creates a corresponding profile record in the public.profiles table
 * with appropriate default values based on the authentication provider used.
 * 
 * The function handles different authentication scenarios:
 * 1. Email/phone authentication: Uses provided name or defaults to 'Anonymous'
 * 2. OAuth providers (Google, GitHub, etc.): Uses profile data from the provider
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 * 
 * @returns TRIGGER - Returns the NEW record that triggered the function
 */

/**
 * Generate unique referral code
 * 
 * Creates a unique 8-character referral code using uppercase letters and numbers.
 * Excludes confusing characters (I, L, O, 0, 1) for better user experience.
 * Retries up to 10 times if a duplicate is found, then falls back to UUID-based code.
 * 
 * @returns TEXT - 8-character referral code
 */
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

/**
 * User Sign-Up Handler Function
 * 
 * This function automatically creates a profile record when a new user signs up.
 * It handles different authentication providers and extracts relevant user information
 * from the metadata provided during sign-up.
 * 
 * The function differentiates between:
 * - Email/phone authentication: Uses provided name or defaults to 'Anonymous'
 * - OAuth providers: Uses profile data from the provider (name, avatar URL)
 * 
 * New: Automatically generates a unique referral code for each new user.
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 */
CREATE OR REPLACE FUNCTION handle_sign_up()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    generated_code TEXT;
BEGIN
    -- 추천인 코드 생성
    generated_code := generate_referral_code();
    
    -- Check if the user record has provider information in the metadata
    IF new.raw_app_meta_data IS NOT NULL AND new.raw_app_meta_data ? 'provider' THEN
        -- Handle email or phone authentication
        IF new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone' THEN
            -- Use COALESCE for cleaner code handling
            INSERT INTO public.profiles (profile_id, name, marketing_consent, referral_code)
            VALUES (
                new.id, 
                COALESCE(new.raw_user_meta_data ->> 'name', 'Anonymous'), 
                COALESCE((new.raw_user_meta_data ->> 'marketing_consent')::boolean, TRUE), 
                generated_code
            );
        ELSE
            -- Handle OAuth providers (Google, GitHub, etc.)
            -- Use the profile data provided by the OAuth provider
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
    RETURN NEW; -- Return the user record that triggered this function
END;
$$;

/**
 * Database Trigger: handle_sign_up
 * 
 * This trigger executes the handle_sign_up function automatically
 * after a new user is inserted into the auth.users table.
 * 
 * The trigger runs once for each row inserted (FOR EACH ROW)
 * and only activates on INSERT operations, not on UPDATE or DELETE.
 */
CREATE TRIGGER handle_sign_up
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_sign_up();
