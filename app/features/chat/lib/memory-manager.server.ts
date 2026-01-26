/**
 * Memory Manager Module
 *
 * Handles automatic conversation summarization and memory creation.
 *
 * Key features:
 * - Automatic summarization every 20 messages
 * - AI-powered conversation summaries using OpenAI
 * - Stores summaries in room_memories table
 * - Manages memory importance scoring
 * - Token usage optimization
 */

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq, and, gte, lte, desc } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";

import { messages, roomMemories } from "../schema";

/**
 * Threshold for triggering automatic summarization
 * When message count reaches this multiple, we create a summary
 */
const SUMMARIZATION_THRESHOLD = 20;

/**
 * Maximum messages to include in a single summary
 */
const MAX_MESSAGES_PER_SUMMARY = 20;

/**
 * Check if a room needs summarization
 *
 * Determines if a conversation has enough new messages to warrant creating
 * a summary. Returns true if:
 * 1. Total messages >= SUMMARIZATION_THRESHOLD (20) and no summary exists, OR
 * 2. Messages since last summary >= SUMMARIZATION_THRESHOLD (20)
 *
 * @param roomId - The chat room ID to check
 * @returns Promise resolving to true if summarization is needed, false otherwise
 * @example
 * ```typescript
 * const needsSummary = await shouldCreateSummary(123);
 * if (needsSummary) {
 *   await createConversationSummary(123, "CharacterName");
 * }
 * ```
 */
export async function shouldCreateSummary(roomId: number): Promise<boolean> {
  const db = drizzle;

  // Get total message count
  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.room_id, roomId));

  const totalMessages = allMessages.length;

  // Check if we have enough messages
  if (totalMessages < SUMMARIZATION_THRESHOLD) {
    return false;
  }

  // Get the last summary
  const [lastSummary] = await db
    .select()
    .from(roomMemories)
    .where(
      and(
        eq(roomMemories.room_id, roomId),
        eq(roomMemories.memory_type, "summary")
      )
    )
    .orderBy(desc(roomMemories.created_at))
    .limit(1);

  // If no summary exists, create one
  if (!lastSummary) {
    return true;
  }

  // Check if we have 20+ new messages since last summary
  const messagesSinceLastSummary = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, roomId),
        gte(messages.message_id, lastSummary.message_range_end || 0)
      )
    );

  return messagesSinceLastSummary.length >= SUMMARIZATION_THRESHOLD;
}

/**
 * Create a summary of recent conversation
 *
 * Uses AI (GPT-3.5-turbo) to generate a concise summary of recent messages
 * that haven't been summarized yet. The summary:
 * - Covers up to MAX_MESSAGES_PER_SUMMARY (20) messages
 * - Focuses on main topics, facts, emotional moments, and decisions
 * - Is stored in room_memories table with importance score
 * - Includes metadata about message count and creation context
 *
 * The function is non-blocking - errors in summarization won't affect chat flow.
 *
 * @param roomId - The chat room ID to summarize
 * @param characterName - The character's display name for context in the summary
 * @returns Promise that resolves when summary is created (void)
 * @throws Does not throw - errors are logged and suppressed to prevent blocking chat
 * @example
 * ```typescript
 * await createConversationSummary(123, "Alice");
 * // Creates AI-generated summary of the last 20 unsummarized messages
 * ```
 */
export async function createConversationSummary(
  roomId: number,
  characterName: string
): Promise<void> {
  const db = drizzle;

  // Get the last summary to know where to start
  const [lastSummary] = await db
    .select()
    .from(roomMemories)
    .where(
      and(
        eq(roomMemories.room_id, roomId),
        eq(roomMemories.memory_type, "summary")
      )
    )
    .orderBy(desc(roomMemories.created_at))
    .limit(1);

  const startMessageId = lastSummary?.message_range_end
    ? lastSummary.message_range_end + 1
    : 0;

  // Get messages to summarize
  const messagesToSummarize = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.room_id, roomId),
        gte(messages.message_id, startMessageId)
      )
    )
    .orderBy(messages.sequence_number)
    .limit(MAX_MESSAGES_PER_SUMMARY);

  if (messagesToSummarize.length === 0) {
    return;
  }

  // Build conversation text for summarization
  const conversationText = messagesToSummarize
    .map((msg) => {
      const speaker = msg.role === "user" ? "User" : characterName;
      return `${speaker}: ${msg.content}`;
    })
    .join("\n");

  // Generate summary using AI
  const summaryPrompt = `You are a conversation summarizer. Your task is to create a concise summary of the following conversation between a user and an AI character named "${characterName}".

Focus on:
- Main topics discussed
- Important facts or information shared
- Key emotional moments or developments
- Character personality insights
- Any decisions or commitments made

Keep the summary concise (3-5 sentences) and factual.

Conversation:
${conversationText}

Summary:`;

  try {
    // Use GPT-3.5-turbo for cost-effective summarization
    const model = openai("gpt-3.5-turbo");

    const { text: summaryText } = await generateText({
      model,
      prompt: summaryPrompt,
      temperature: 0.3, // Lower temperature for more factual summaries
    });

    // Calculate importance based on message count and content
    // More messages = more important summary
    const importance = Math.min(
      10,
      Math.floor(5 + messagesToSummarize.length / 4)
    );

    // Store summary in database
    await db.insert(roomMemories).values({
      room_id: roomId,
      memory_type: "summary",
      content: summaryText.trim(),
      importance,
      message_range_start: messagesToSummarize[0].message_id,
      message_range_end:
        messagesToSummarize[messagesToSummarize.length - 1].message_id,
      metadata: {
        message_count: messagesToSummarize.length,
        character_name: characterName,
        created_by: "auto-summarizer",
      },
    });

    console.log(
      `✅ Created summary for room ${roomId} covering ${messagesToSummarize.length} messages`
    );
  } catch (error) {
    console.error("❌ Error creating conversation summary:", error);
    // Don't throw - summarization failures shouldn't block chat
  }
}

/**
 * Extract key facts from recent messages
 *
 * This is a placeholder for future implementation.
 * It would use AI to extract specific facts, entities, and events from conversation:
 * - Names, dates, locations (entities)
 * - Important statements or commitments (facts)
 * - Significant events or milestones
 * - User preferences or dislikes
 *
 * Currently logs a message indicating the feature is not yet implemented.
 *
 * @param roomId - The chat room ID to extract facts from
 * @param messageIds - Specific message IDs to extract facts from
 * @returns Promise that resolves when fact extraction is complete (currently does nothing)
 * @example
 * ```typescript
 * await extractKeyFacts(123, [456, 457, 458]);
 * // Future: Would extract and store key facts from messages 456-458
 * ```
 */
export async function extractKeyFacts(
  roomId: number,
  messageIds: number[]
): Promise<void> {
  // TODO: Implement fact extraction
  // This would use AI to identify:
  // - Names, dates, locations (entities)
  // - Important statements or commitments (facts)
  // - Significant events or milestones
  // - User preferences or dislikes

  // For now, we'll focus on summaries
  console.log(`📝 Fact extraction not yet implemented for room ${roomId}`);
}

/**
 * Clean up old memories to save database space
 *
 * Removes least important memories when a room has more than the specified
 * keepCount. Memories are ranked by importance score and recency, with
 * only the top-ranked memories being retained.
 *
 * This helps prevent unbounded database growth while preserving the most
 * valuable conversation context.
 *
 * @param roomId - The chat room ID to clean up
 * @param keepCount - Number of recent memories to keep (default: 10)
 * @returns Promise that resolves when cleanup is complete
 * @example
 * ```typescript
 * await cleanupOldMemories(123, 5);
 * // Keeps only the 5 most important/recent memories for room 123
 * ```
 */
export async function cleanupOldMemories(
  roomId: number,
  keepCount: number = 10
): Promise<void> {
  const db = drizzle;

  // Get all memories for this room, ordered by importance and recency
  const allMemories = await db
    .select()
    .from(roomMemories)
    .where(eq(roomMemories.room_id, roomId))
    .orderBy(desc(roomMemories.importance), desc(roomMemories.created_at));

  // If we have more than keepCount memories, delete the least important ones
  if (allMemories.length > keepCount) {
    const memoriesToDelete = allMemories.slice(keepCount);
    const idsToDelete = memoriesToDelete.map((m) => m.memory_id);

    if (idsToDelete.length > 0) {
      // Delete old memories
      for (const memoryId of idsToDelete) {
        await db
          .delete(roomMemories)
          .where(eq(roomMemories.memory_id, memoryId));
      }

      console.log(
        `🗑️  Cleaned up ${idsToDelete.length} old memories from room ${roomId}`
      );
    }
  }
}

/**
 * Get all active memories for a room
 *
 * Retrieves all conversation summaries and memories for a room,
 * ordered by importance score (descending) and creation date (descending).
 * This ensures the most important and recent memories appear first.
 *
 * @param roomId - The chat room ID to get memories for
 * @returns Promise resolving to array of memory records from the database
 * @example
 * ```typescript
 * const memories = await getRoomMemories(123);
 * memories.forEach(mem => {
 *   console.log(`[${mem.memory_type}] Importance: ${mem.importance}`);
 *   console.log(mem.content);
 * });
 * ```
 */
export async function getRoomMemories(roomId: number) {
  const db = drizzle;

  return await db
    .select()
    .from(roomMemories)
    .where(eq(roomMemories.room_id, roomId))
    .orderBy(desc(roomMemories.importance), desc(roomMemories.created_at));
}
