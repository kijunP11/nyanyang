/**
 * Database Migration: 0002_characters_schema
 *
 * This migration adds the complete character management system including:
 * 1. Characters table with profile and settings
 * 2. Character keywords (keyword book) for custom responses
 * 3. Character safety filters for content moderation
 * 4. Character likes for tracking popularity
 * 5. Storage bucket for character media (avatars, banners, gallery)
 * 6. Row Level Security (RLS) policies for data access control
 */

-- Create character status enum
CREATE TYPE character_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived');

-- Create characters table
CREATE TABLE IF NOT EXISTS public.characters (
    character_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- Basic Info
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    greeting_message TEXT,

    -- Media
    avatar_url TEXT,
    banner_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,

    -- Character Details
    personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[],
    tone TEXT,
    age INTEGER,
    gender TEXT,

    -- Settings
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_nsfw BOOLEAN NOT NULL DEFAULT FALSE,
    status character_status NOT NULL DEFAULT 'draft',

    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    chat_count INTEGER NOT NULL DEFAULT 0,

    -- Ownership
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create character keywords table
CREATE TABLE IF NOT EXISTS public.character_keywords (
    keyword_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT NOT NULL REFERENCES public.characters(character_id) ON DELETE CASCADE,

    -- Keyword details
    keyword TEXT NOT NULL,
    description TEXT,
    response_template TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create character safety filters table
CREATE TABLE IF NOT EXISTS public.character_safety_filters (
    filter_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    character_id BIGINT NOT NULL REFERENCES public.characters(character_id) ON DELETE CASCADE,

    -- Filter settings
    block_nsfw BOOLEAN NOT NULL DEFAULT TRUE,
    block_violence BOOLEAN NOT NULL DEFAULT TRUE,
    block_hate_speech BOOLEAN NOT NULL DEFAULT TRUE,
    block_personal_info BOOLEAN NOT NULL DEFAULT TRUE,

    -- Custom filters
    blocked_words TEXT[] DEFAULT ARRAY[]::TEXT[],
    blocked_phrases TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Filter sensitivity (1-10, 10 = most strict)
    sensitivity_level INTEGER NOT NULL DEFAULT 5,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Ensure one filter per character
    UNIQUE(character_id)
);

-- Create character likes table
CREATE TABLE IF NOT EXISTS public.character_likes (
    like_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id BIGINT NOT NULL REFERENCES public.characters(character_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Ensure one like per user per character
    UNIQUE(character_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_characters_creator_id ON public.characters(creator_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON public.characters(status);
CREATE INDEX IF NOT EXISTS idx_characters_is_public ON public.characters(is_public);
CREATE INDEX IF NOT EXISTS idx_characters_tags ON public.characters USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_character_keywords_character_id ON public.character_keywords(character_id);
CREATE INDEX IF NOT EXISTS idx_character_keywords_priority ON public.character_keywords(priority DESC);
CREATE INDEX IF NOT EXISTS idx_character_likes_character_id ON public.character_likes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_likes_user_id ON public.character_likes(user_id);

-- Create updated_at triggers for all tables
CREATE TRIGGER set_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_character_keywords_updated_at
BEFORE UPDATE ON public.character_keywords
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_character_safety_filters_updated_at
BEFORE UPDATE ON public.character_safety_filters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_character_likes_updated_at
BEFORE UPDATE ON public.character_likes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_safety_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characters table

-- Anyone can view public approved characters
CREATE POLICY "select_public_characters_policy" ON public.characters
FOR SELECT
TO public
USING (is_public = TRUE AND status = 'approved');

-- Authenticated users can view their own characters
CREATE POLICY "select_own_characters_policy" ON public.characters
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- Users can insert their own characters
CREATE POLICY "insert_characters_policy" ON public.characters
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Users can update their own characters
CREATE POLICY "update_characters_policy" ON public.characters
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Users can delete their own characters
CREATE POLICY "delete_characters_policy" ON public.characters
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- RLS Policies for character_keywords table

-- Users can manage keywords for their own characters
CREATE POLICY "manage_own_character_keywords_policy" ON public.character_keywords
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.characters
        WHERE characters.character_id = character_keywords.character_id
        AND characters.creator_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.characters
        WHERE characters.character_id = character_keywords.character_id
        AND characters.creator_id = auth.uid()
    )
);

-- RLS Policies for character_safety_filters table

-- Users can manage filters for their own characters
CREATE POLICY "manage_own_character_filters_policy" ON public.character_safety_filters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.characters
        WHERE characters.character_id = character_safety_filters.character_id
        AND characters.creator_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.characters
        WHERE characters.character_id = character_safety_filters.character_id
        AND characters.creator_id = auth.uid()
    )
);

-- RLS Policies for character_likes table

-- Users can manage their own likes
CREATE POLICY "manage_own_likes_policy" ON public.character_likes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create Supabase Storage bucket for character media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'character-media',
    'character-media',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload to their own character folders
CREATE POLICY "Users can upload character media" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'character-media' AND
    (storage.foldername(name))[1] IN (
        SELECT character_id::TEXT FROM public.characters WHERE creator_id = auth.uid()
    )
);

-- Storage policy: Allow authenticated users to update their own character media
CREATE POLICY "Users can update own character media" ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'character-media' AND
    (storage.foldername(name))[1] IN (
        SELECT character_id::TEXT FROM public.characters WHERE creator_id = auth.uid()
    )
);

-- Storage policy: Allow authenticated users to delete their own character media
CREATE POLICY "Users can delete own character media" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'character-media' AND
    (storage.foldername(name))[1] IN (
        SELECT character_id::TEXT FROM public.characters WHERE creator_id = auth.uid()
    )
);

-- Storage policy: Allow public to view character media
CREATE POLICY "Public can view character media" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'character-media');
