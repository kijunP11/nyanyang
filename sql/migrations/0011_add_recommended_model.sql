-- Add recommended_model column to characters table
-- This allows character creators to specify a recommended AI model

ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "recommended_model" text;

COMMENT ON COLUMN "characters"."recommended_model" IS 'Recommended AI model for this character (e.g., gemini-2.5-flash, claude-sonnet)';
