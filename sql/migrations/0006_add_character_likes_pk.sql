-- Add composite PRIMARY KEY to character_likes table
-- This prevents duplicate likes from the same user for the same character

-- First, check if there are any duplicate entries and remove them if needed
-- (This is safe because duplicates shouldn't exist, but we check just in case)
DO $$
BEGIN
  -- Remove duplicates if any exist (keep the first one)
  DELETE FROM character_likes a
  USING character_likes b
  WHERE a.user_id = b.user_id
    AND a.character_id = b.character_id
    AND a.created_at > b.created_at;
END $$;

-- Add composite PRIMARY KEY
ALTER TABLE "character_likes" 
ADD CONSTRAINT "character_likes_pkey" PRIMARY KEY ("user_id", "character_id");
