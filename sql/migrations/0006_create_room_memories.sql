-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create room_memories table
CREATE TABLE IF NOT EXISTS room_memories (
  memory_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  room_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT room_memories_room_id_fk FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE
);

-- Index for faster filtering by room_id
CREATE INDEX IF NOT EXISTS idx_room_memories_room_id ON room_memories(room_id);

-- Note: ivfflat index is skipped intentionally for Cold Start (needs >1000 rows to be effective)
-- When data grows, run:
-- CREATE INDEX idx_room_memories_embedding ON room_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE room_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view memories for their own chat rooms
CREATE POLICY "Users can view own room memories" ON room_memories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.room_id = room_memories.room_id
      AND chat_rooms.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert memories for their own chat rooms
CREATE POLICY "Users can insert own room memories" ON room_memories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.room_id = room_memories.room_id
      AND chat_rooms.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete memories for their own chat rooms
CREATE POLICY "Users can delete own room memories" ON room_memories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.room_id = room_memories.room_id
      AND chat_rooms.user_id = auth.uid()
    )
  );

-- Vector Search Function (RPC)
-- This function allows searching for similar memories within a specific room
CREATE OR REPLACE FUNCTION match_room_memories (
  p_room_id BIGINT,
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  memory_id BIGINT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.memory_id,
    rm.content,
    rm.created_at,
    1 - (rm.embedding <=> query_embedding) AS similarity
  FROM room_memories rm
  WHERE rm.room_id = p_room_id
  AND 1 - (rm.embedding <=> query_embedding) > match_threshold
  ORDER BY 
    rm.importance DESC, 
    rm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
