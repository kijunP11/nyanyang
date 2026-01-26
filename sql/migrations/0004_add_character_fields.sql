/**
 * Database Migration: 0004_add_character_fields
 *
 * Adds new fields to characters table for enhanced character creation:
 * - tagline: One-line character description
 * - role: Character role (friend, teacher, lover, etc.)
 * - appearance: Character appearance description
 * - speech_style: Character speech style/tone
 * - relationship: Relationship with the user
 * - world_setting: World/setting context
 */

-- Add new columns to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS appearance TEXT,
ADD COLUMN IF NOT EXISTS speech_style TEXT,
ADD COLUMN IF NOT EXISTS relationship TEXT,
ADD COLUMN IF NOT EXISTS world_setting TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.characters.tagline IS 'One-line character description (max 50 characters)';
COMMENT ON COLUMN public.characters.role IS 'Character role (friend, teacher, lover, mentor, companion, etc.)';
COMMENT ON COLUMN public.characters.appearance IS 'Character appearance description';
COMMENT ON COLUMN public.characters.speech_style IS 'Character speech style/tone (e.g., casual, formal, friendly)';
COMMENT ON COLUMN public.characters.relationship IS 'Relationship with the user (e.g., 10-year friend, new senior)';
COMMENT ON COLUMN public.characters.world_setting IS 'World/setting context (e.g., modern city, university campus)';

