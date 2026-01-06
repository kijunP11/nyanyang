import type { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings.server";
import type { MemorySearchResult } from "../types/memory";

/**
 * Save memory with deduplication
 */
export async function saveMemory(
  client: SupabaseClient,
  roomId: number,
  content: string,
  importance: number = 5
) {
  try {
    // 1. Generate embedding
    const embedding = await generateEmbedding(content);

    // 2. Check for duplicates (Similarity > 0.95)
    // We use the same search function but with a very high threshold
    const { data: duplicates, error: searchError } = await client.rpc(
      "match_room_memories",
      {
        p_room_id: roomId,
        query_embedding: embedding,
        match_threshold: 0.95, // High threshold for deduplication
        match_count: 1,
      }
    );

    if (searchError) {
      console.error("Error checking duplicates:", searchError);
      // Proceed to save anyway if check fails, to avoid data loss
    } else if (duplicates && duplicates.length > 0) {
      console.log(`Duplicate memory detected (sim: ${duplicates[0].similarity.toFixed(4)}). Skipping: "${content}"`);
      return; // Skip saving
    }

    // 3. Save to DB
    const { error: insertError } = await client.from("room_memories").insert({
      room_id: roomId,
      content,
      embedding, // pgvector expects array, Supabase client handles it
      importance,
    });

    if (insertError) {
      throw insertError;
    }
    
    // console.log(`Memory saved: "${content}"`);
  } catch (error) {
    console.error("Failed to save memory:", error);
    // Non-blocking error
  }
}

/**
 * Search relevant memories
 */
export async function searchMemories(
  client: SupabaseClient,
  roomId: number,
  query: string,
  limit: number = 5
): Promise<MemorySearchResult[]> {
  try {
    const embedding = await generateEmbedding(query);

    const { data, error } = await client.rpc("match_room_memories", {
      p_room_id: roomId,
      query_embedding: embedding,
      match_threshold: 0.7, // Lower threshold for retrieval (0.7 is a good starting point)
      match_count: limit,
    });

    if (error) {
      throw error;
    }

    return data as MemorySearchResult[];
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

/**
 * Extract important facts from conversation using AI
 */
export async function extractImportantFacts(
  userMessage: string,
  aiResponse: string
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const prompt = `
Analyze the following conversation and extract important facts about the user (User) that should be remembered for future conversations.
Focus on: Name, preferences, hobbies, job, relationships, personal details.
Ignore: Small talk, greetings, transient feelings, questions.

Conversation:
User: ${userMessage}
AI: ${aiResponse}

Return a JSON object with a key "facts" containing an array of strings. Each string should be a concise fact.
If no important facts are found, return { "facts": [] }.

Example output:
{ "facts": ["User likes cats", "User's name is Cheolsu"] }
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use cheaper model for extraction
        messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent extraction
      }),
    });

    if (!response.ok) return [];

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) return [];

    const parsed = JSON.parse(content);
    return Array.isArray(parsed.facts) ? parsed.facts : [];
  } catch (error) {
    console.error("Fact extraction failed:", error);
    return [];
  }
}

