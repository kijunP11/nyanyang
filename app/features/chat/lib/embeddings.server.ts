/**
 * Embedding Utility
 * 
 * Handles generating vector embeddings from text using OpenAI API.
 * Uses 'text-embedding-3-small' model (1536 dimensions).
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. Embeddings will fail.");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Pre-process text: remove newlines which can affect performance
  const cleanText = text.replace(/\n/g, " ");

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: cleanText,
        dimensions: 1536,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Embedding API error: ${error.error?.message || response.statusText}`
      );
    }

    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw error;
  }
}

