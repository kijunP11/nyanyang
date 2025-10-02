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
CREATE OR REPLACE FUNCTION handle_sign_up()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    -- Check if the user record has provider information in the metadata
    IF new.raw_app_meta_data IS NOT NULL AND new.raw_app_meta_data ? 'provider' THEN
        -- Handle email or phone authentication
        IF new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone' THEN
            -- If user provided a name during registration, use it
            IF new.raw_user_meta_data ? 'name' THEN
                INSERT INTO public.profiles (profile_id, name, marketing_consent)
                VALUES (new.id, new.raw_user_meta_data ->> 'name', (new.raw_user_meta_data ->> 'marketing_consent')::boolean);
            ELSE
                -- Otherwise, set a default name and opt-in to marketing
                INSERT INTO public.profiles (profile_id, name, marketing_consent)
                VALUES (new.id, 'Anonymous', TRUE);
            END IF;
        ELSE
            -- Handle OAuth providers (Google, GitHub, etc.)
            -- Use the profile data provided by the OAuth provider
            INSERT INTO public.profiles (profile_id, name, avatar_url, marketing_consent)
            VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', TRUE);
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


