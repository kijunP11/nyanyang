/**
 * Database Migration: 0001_great_junta
 * 
 * This migration adds database triggers and functions to handle:
 * 1. Automatic profile creation when a user signs up
 * 2. Automatic updating of timestamp fields
 * 
 * These automated database features ensure data consistency and reduce the need
 * for application code to handle these common operations.
 */

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
 * User Sign-Up Trigger
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


/**
 * Updated Timestamp Handler Function
 * 
 * This utility function automatically updates the 'updated_at' timestamp
 * field of a record whenever it is modified. It's designed to be used with
 * triggers on tables that have an updated_at column to track modification times.
 * 
 * The function sets the updated_at field to the current UTC timestamp,
 * ensuring consistent timezone handling across the application.
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 */
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
    -- Set the updated_at field to the current UTC timestamp
    -- This ensures consistent timezone handling across the application
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
    
    -- Return the modified record to be saved to the database
    RETURN NEW;
END;
$$;

/**
 * Profiles Updated Timestamp Trigger
 * 
 * This trigger automatically updates the updated_at timestamp
 * whenever a profile record is modified.
 * 
 * It runs BEFORE UPDATE to modify the record before it's saved,
 * ensuring that every update operation includes the current timestamp.
 */
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/**
 * Payments Updated Timestamp Trigger
 * 
 * This trigger automatically updates the updated_at timestamp
 * whenever a payment record is modified.
 * 
 * It runs BEFORE UPDATE to modify the record before it's saved,
 * ensuring that every update operation includes the current timestamp.
 * 
 * This is particularly important for payment records to maintain
 * an accurate audit trail of when payment information was last modified.
 */
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


