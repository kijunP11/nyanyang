/**
 * Context Builder Module
 *
 * Builds optimized conversation context for AI chat by combining:
 * - Recent messages (last N messages)
 * - Relevant conversation summaries (from memory system)
 * - Token budget management
 *
 * This ensures the AI has enough context while staying within token limits.
 */

import { eq, desc, and, gte } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";

import { messages, roomMemories } from "../schema";

/**
 * Token budget limits for different models
 */
const TOKEN_BUDGETS: Record<string, number> = {
  "gpt-3.5-turbo": 3000, // Out of 4k context
  "gpt-4": 6000, // Out of 8k context
  "claude-3-haiku-20240307": 150000, // Out of 200k context (very generous)
  "claude-3-5-sonnet-20241022": 150000, // Out of 200k context
};

/**
 * Rough estimation: 1 token ≈ 4 characters for English
 * For safety, we use 3 characters per token
 */
const CHARS_PER_TOKEN = 3;

/**
 * Message format for AI SDK
 */
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Context building options
 */
export interface ContextOptions {
  roomId: number;
  model: string;
  maxRecentMessages?: number; // Default: 10
  includeMemories?: boolean; // Default: true
  tokenBudget?: number; // Optional override
}

/**
 * Estimate token count from text
 *
 * Uses a rough heuristic of 1 token ≈ 3 characters for safety.
 * This is a conservative estimate to prevent context overflow.
 *
 * @param text - Text to estimate token count for
 * @returns Estimated token count
 * @example
 * ```typescript
 * const tokens = estimateTokens("Hello, world!");
 * // Returns approximately 5 tokens
 * ```
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Build conversation context for AI
 *
 * This function intelligently combines:
 * 1. Conversation summaries (for long-term context)
 * 2. Recent messages (for immediate context)
 *
 * It respects token budgets to prevent context overflow by:
 * - Allocating up to 30% of budget for memories
 * - Allocating up to 80% of budget for recent messages
 * - Dynamically reducing message count if needed
 *
 * @param options - Context building options
 * @param options.roomId - The chat room ID to build context for
 * @param options.model - The AI model being used (affects token budget)
 * @param options.maxRecentMessages - Maximum recent messages to include (default: 10)
 * @param options.includeMemories - Whether to include conversation summaries (default: true)
 * @param options.tokenBudget - Optional token budget override
 * @returns Array of messages formatted for AI SDK, ordered chronologically
 * @example
 * ```typescript
 * const context = await buildConversationContext({
 *   roomId: 123,
 *   model: "gpt-4",
 *   maxRecentMessages: 10,
 *   includeMemories: true
 * });
 * // Returns [{ role: "system", content: "..." }, { role: "user", content: "..." }, ...]
 * ```
 */
export async function buildConversationContext(
  options: ContextOptions
): Promise<AIMessage[]> {
  const {
    roomId,
    model,
    maxRecentMessages = 10,
    includeMemories = true,
    tokenBudget,
  } = options;

  const db = drizzle;
  const budget = tokenBudget || TOKEN_BUDGETS[model] || 3000;
  let usedTokens = 0;

  const context: AIMessage[] = [];

  // Step 1: Load conversation summaries if enabled
  if (includeMemories) {
    const memories = await db
      .select()
      .from(roomMemories)
      .where(eq(roomMemories.room_id, roomId))
      .orderBy(desc(roomMemories.importance), desc(roomMemories.created_at))
      .limit(3); // Top 3 most important memories

    if (memories.length > 0) {
      // Build memory context as a system message
      const memoryContent = memories
        .map((mem, idx) => {
          const label =
            mem.memory_type === "summary" ? "Previous conversation" : "Memory";
          return `[${label} ${idx + 1}]: ${mem.content}`;
        })
        .join("\n\n");

      const memoryTokens = estimateTokens(memoryContent);

      // Only add if within budget
      if (usedTokens + memoryTokens < budget * 0.3) {
        // Use max 30% budget for memories
        context.push({
          role: "system",
          content: `Context from previous conversations:\n\n${memoryContent}`,
        });
        usedTokens += memoryTokens;
      }
    }
  }

  // Step 2: Load recent messages
  // Start with maxRecentMessages and reduce if needed to fit budget
  let messagesToLoad = maxRecentMessages;
  let recentMessages: typeof messages.$inferSelect[] = [];

  while (messagesToLoad > 0) {
    recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.room_id, roomId))
      .orderBy(desc(messages.sequence_number))
      .limit(messagesToLoad);

    // Reverse to chronological order
    recentMessages.reverse();

    // Estimate tokens for these messages
    const messagesText = recentMessages.map((m) => m.content).join("\n");
    const messagesTokens = estimateTokens(messagesText);

    // Check if it fits in remaining budget (leave 20% buffer)
    if (usedTokens + messagesTokens < budget * 0.8) {
      break;
    }

    // Too many tokens, reduce by 2 messages
    messagesToLoad -= 2;
  }

  // Add recent messages to context
  for (const msg of recentMessages) {
    context.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
    usedTokens += estimateTokens(msg.content);
  }

  return context;
}

/**
 * Build context with a new user message
 *
 * This is a convenience function that builds context and appends
 * the new user message at the end. Useful for preparing context
 * before sending to the AI model.
 *
 * @param options - Context building options
 * @param options.roomId - The chat room ID to build context for
 * @param options.model - The AI model being used (affects token budget)
 * @param options.maxRecentMessages - Maximum recent messages to include (default: 10)
 * @param options.includeMemories - Whether to include conversation summaries (default: true)
 * @param options.tokenBudget - Optional token budget override
 * @param userMessage - The new user message to append to the context
 * @returns Array of messages formatted for AI SDK, with user message at the end
 * @example
 * ```typescript
 * const context = await buildContextWithNewMessage(
 *   { roomId: 123, model: "gpt-4" },
 *   "What's the weather like?"
 * );
 * // Returns context array with new user message appended
 * ```
 */
export async function buildContextWithNewMessage(
  options: ContextOptions,
  userMessage: string
): Promise<AIMessage[]> {
  const context = await buildConversationContext(options);

  // Add the new user message
  context.push({
    role: "user",
    content: userMessage,
  });

  return context;
}

/**
 * Get context statistics for debugging
 *
 * Analyzes a context array and returns detailed statistics about
 * message counts, character counts, and estimated token usage.
 *
 * @param context - Array of AI messages to analyze
 * @returns Statistics object containing:
 * - totalMessages: Total number of messages
 * - systemMessages: Count of system messages
 * - userMessages: Count of user messages
 * - assistantMessages: Count of assistant messages
 * - totalChars: Total character count across all messages
 * - estimatedTokens: Estimated token count for the entire context
 * @example
 * ```typescript
 * const stats = getContextStats(context);
 * console.log(`Total messages: ${stats.totalMessages}, Estimated tokens: ${stats.estimatedTokens}`);
 * ```
 */
export function getContextStats(context: AIMessage[]) {
  const totalMessages = context.length;
  const systemMessages = context.filter((m) => m.role === "system").length;
  const userMessages = context.filter((m) => m.role === "user").length;
  const assistantMessages = context.filter((m) => m.role === "assistant")
    .length;

  const totalChars = context.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedTokens = estimateTokens(
    context.map((m) => m.content).join("\n")
  );

  return {
    totalMessages,
    systemMessages,
    userMessages,
    assistantMessages,
    totalChars,
    estimatedTokens,
  };
}

/**
 * Smart context builder that prioritizes important information
 *
 * This is an advanced version that uses a three-priority system:
 * 1. Priority 1: Always includes the most recent N messages (minimum 5)
 * 2. Priority 2: Adds high-importance memories (importance >= 7) if space allows
 * 3. Priority 3: Adds additional recent messages if token budget permits
 *
 * The function dynamically adjusts based on token budget:
 * - Up to 50% for initial messages before adding memories
 * - Up to 60% for memories
 * - Up to 80% total to leave buffer for new messages
 *
 * @param options - Context building options
 * @param options.roomId - The chat room ID to build context for
 * @param options.model - The AI model being used (affects token budget)
 * @param options.maxRecentMessages - Maximum recent messages to include (default: 10)
 * @param options.includeMemories - Whether to include conversation summaries (default: true)
 * @param options.tokenBudget - Optional token budget override
 * @returns Array of messages formatted for AI SDK, with memories first and messages chronologically ordered
 * @example
 * ```typescript
 * const context = await buildSmartContext({
 *   roomId: 123,
 *   model: "claude-3-5-sonnet-20241022",
 *   maxRecentMessages: 15,
 *   includeMemories: true
 * });
 * // Returns optimized context array with high-importance memories and recent messages
 * ```
 */
export async function buildSmartContext(
  options: ContextOptions
): Promise<AIMessage[]> {
  const {
    roomId,
    model,
    maxRecentMessages = 10,
    includeMemories = true,
    tokenBudget,
  } = options;

  const db = drizzle;
  const budget = tokenBudget || TOKEN_BUDGETS[model] || 3000;
  let usedTokens = 0;

  const context: AIMessage[] = [];

  // Priority 1: Always include at least 5 most recent messages
  const minRecentMessages = Math.min(5, maxRecentMessages);
  const recentMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.room_id, roomId))
    .orderBy(desc(messages.sequence_number))
    .limit(minRecentMessages);

  recentMessages.reverse();

  // Add to context and count tokens
  for (const msg of recentMessages) {
    const msgTokens = estimateTokens(msg.content);
    context.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
    usedTokens += msgTokens;
  }

  // Priority 2: Add important memories if space allows
  if (includeMemories && usedTokens < budget * 0.5) {
    const memories = await db
      .select()
      .from(roomMemories)
      .where(
        and(
          eq(roomMemories.room_id, roomId),
          gte(roomMemories.importance, 7) // Only high-importance memories
        )
      )
      .orderBy(desc(roomMemories.importance), desc(roomMemories.created_at))
      .limit(2);

    if (memories.length > 0) {
      const memoryContent = memories
        .map((mem) => `[Previous conversation]: ${mem.content}`)
        .join("\n\n");

      const memoryTokens = estimateTokens(memoryContent);

      if (usedTokens + memoryTokens < budget * 0.6) {
        // Insert at beginning (before messages)
        context.unshift({
          role: "system",
          content: memoryContent,
        });
        usedTokens += memoryTokens;
      }
    }
  }

  // Priority 3: Add more recent messages if space allows
  const additionalCount = maxRecentMessages - minRecentMessages;
  if (additionalCount > 0 && usedTokens < budget * 0.7) {
    const additionalMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.room_id, roomId))
      .orderBy(desc(messages.sequence_number))
      .limit(maxRecentMessages);

    additionalMessages.reverse();

    // Skip messages we already added
    const newMessages = additionalMessages.slice(0, -minRecentMessages);

    for (const msg of newMessages) {
      const msgTokens = estimateTokens(msg.content);

      // Check if we can fit this message
      if (usedTokens + msgTokens < budget * 0.8) {
        // Find insertion point (after system messages, before recent messages)
        const insertIndex = context.findIndex(
          (m) => m.role !== "system"
        );
        context.splice(insertIndex, 0, {
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
        usedTokens += msgTokens;
      } else {
        break;
      }
    }
  }

  return context;
}
