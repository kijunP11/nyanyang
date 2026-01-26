-- Add missing columns to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS personality TEXT,
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS age_rating TEXT DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS enable_memory BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS example_dialogues JSONB DEFAULT '[]'::jsonb;

