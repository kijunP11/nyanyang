/**
 * Database Trigger Function: set_updated_at
 * 
 * This utility function automatically updates the 'updated_at' timestamp
 * field of a record whenever it is modified. It's designed to be used with
 * a trigger on tables that have an updated_at column to track modification times.
 * 
 * The function sets the updated_at field to the current UTC timestamp,
 * ensuring consistent timezone handling across the application.
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 * 
 * Usage:
 * Create a trigger on your table that calls this function BEFORE UPDATE:
 * CREATE TRIGGER set_updated_at
 * BEFORE UPDATE ON your_table
 * FOR EACH ROW
 * EXECUTE FUNCTION public.set_updated_at();
 * 
 * @returns TRIGGER - Returns the modified NEW record with updated timestamp
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