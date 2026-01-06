export interface Memory {
  memory_id: number;
  room_id: number;
  content: string;
  embedding: number[];
  importance: number;
  created_at: string;
}

export interface MemorySearchResult {
  memory_id: number;
  content: string;
  created_at: string;
  similarity: number;
}

