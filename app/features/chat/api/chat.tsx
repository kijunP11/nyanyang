/**
 * AI Chat API Endpoint
 *
 * This file implements an API endpoint for AI-powered chat interactions.
 *
 * Key features:
 * - Streaming responses using Vercel AI SDK
 * - OpenAI and Anthropic integration
 * - Character personality as system prompt
 * - Message history management
 * - Token counting and point deduction
 * - Automatic message and memory storage
 */

import type { Route } from "./+types/chat";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { eq, desc } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { userPoints, pointTransactions } from "../../points/schema";
import { chatRooms, messages } from "../schema";
import {
  shouldCreateSummary,
  createConversationSummary,
} from "../lib/memory-manager.server";
import { buildContextWithNewMessage } from "../lib/context-builder.server";
import { getActiveBranchMessages } from "../lib/branch-manager.server";
import {
  buildCharacterPrompt,
  getUserDisplayName,
} from "../lib/prompt-builder.server";

/**
 * Request body validation schema
 */
const bodySchema = z.object({
  room_id: z.coerce.number().int().positive(),
  message: z.string().min(1).max(2000),
  model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]).optional().default("gpt-3.5-turbo"),
});

/**
 * Token cost per model (in points per 1000 tokens)
 */
const TOKEN_COSTS: Record<string, number> = {
  "gpt-3.5-turbo": 2,
  "gpt-4": 30,
  "claude-3-haiku-20240307": 2,
  "claude-3-5-sonnet-20241022": 15,
};

/**
 * Action handler for AI chat
 *
 * This function handles:
 * - POST: Send message and get AI streaming response
 *
 * Flow:
 * 1. Validate authentication and request body
 * 2. Verify room access and ownership
 * 3. Check user's point balance (creates point record if needed)
 * 4. Load character details for system prompt
 * 5. Save user message to database
 * 6. Build conversation context using memory system
 * 7. Stream AI response using selected model (OpenAI/Anthropic)
 * 8. Save assistant message and update point balance
 * 9. Create transaction record and update room metadata
 * 10. Trigger conversation summarization if needed (async)
 *
 * The response is streamed using Server-Sent Events (SSE) format with:
 * - `data: {content: "..."}` for each chunk
 * - `data: {done: true, tokens: N, cost: N}` on completion
 *
 * @param request - The incoming HTTP request containing room_id, message, and model
 * @param request.body - JSON body with room_id, message, and optional model
 * @returns Streaming response (text/event-stream) for successful chat, or JSON error response
 * @throws Returns 401 if not authenticated
 * @throws Returns 400 if request is invalid or insufficient points
 * @throws Returns 403 if user doesn't own the room
 * @throws Returns 404 if room or character not found
 * @throws Returns 405 if method is not POST
 * @throws Returns 500 if chat processing fails
 * @example
 * ```typescript
 * // Client-side usage
 * const response = await fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     room_id: 123,
 *     message: "Hello, how are you?",
 *     model: "gpt-4"
 *   })
 * });
 *
 * const reader = response.body.getReader();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   const text = new TextDecoder().decode(value);
 *   console.log(text); // "data: {content: '...'}\n\n"
 * }
 * ```
 */
export async function action({ request }: Route.ActionArgs) {
  // Create Supabase client and require authentication
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  // Validate request method (POST only)
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const { success, data: validData, error } = bodySchema.safeParse(body);

    if (!success) {
      return data(
        { error: "Invalid request", details: error.flatten().fieldErrors },
        { status: 400, headers }
      );
    }

    const db = drizzle;

    // Verify room exists and user owns it
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.room_id, validData.room_id))
      .limit(1);

    if (!room) {
      return data({ error: "Room not found" }, { status: 404, headers });
    }

    if (room.user_id !== user.id) {
      return data({ error: "Forbidden: Not your room" }, { status: 403, headers });
    }

    // Get character details
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.character_id, room.character_id))
      .limit(1);

    if (!character) {
      return data({ error: "Character not found" }, { status: 404, headers });
    }

    // Check user's point balance
    let [pointBalance] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1);

    // If user doesn't have a point record yet, create one
    if (!pointBalance) {
      [pointBalance] = await db
        .insert(userPoints)
        .values({
          user_id: user.id,
          current_balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .returning();
    }

    // Estimate token cost (rough estimate: ~100 tokens for a short message)
    const estimatedTokens = 150;
    const costPerThousand = TOKEN_COSTS[validData.model] || 2;
    const estimatedCost = Math.ceil((estimatedTokens / 1000) * costPerThousand);

    if (pointBalance.current_balance < estimatedCost) {
      return data(
        {
          error: "Insufficient points",
          current_balance: pointBalance.current_balance,
          estimated_cost: estimatedCost,
        },
        { status: 400, headers }
      );
    }

    // Get active branch messages to find the last message
    const activeBranchMsgs = await getActiveBranchMessages(validData.room_id);

    const lastActiveMessage = activeBranchMsgs.length > 0
      ? activeBranchMsgs[activeBranchMsgs.length - 1]
      : null;

    // Get next sequence number from all messages (not just active branch)
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.room_id, validData.room_id));

    const nextSequence = allMessages.length > 0
      ? Math.max(...allMessages.map(m => m.sequence_number)) + 1
      : 1;

    // Determine branch name (inherit from last active message or default to "main")
    const branchName = lastActiveMessage?.branch_name || "main";

    // Save user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        room_id: validData.room_id,
        user_id: user.id,
        role: "user",
        content: validData.message,
        sequence_number: nextSequence,
        tokens_used: 0,
        cost: 0,
        parent_message_id: lastActiveMessage?.message_id || null,
        branch_name: branchName,
        is_active_branch: 1,
      })
      .returning();

    // Build AI model
    let aiModel;
    if (validData.model.startsWith("gpt")) {
      aiModel = openai(validData.model);
    } else {
      aiModel = anthropic(validData.model);
    }

    // Get user's display name from profiles table (using Supabase client for RLS)
    const userName = await getUserDisplayName(client, user.id);

    // Build comprehensive character prompt
    const systemPrompt = buildCharacterPrompt(character, userName);

    // Build optimized context with memory system
    // This intelligently combines:
    // - Recent messages (last 10)
    // - Important conversation summaries
    // - Token budget management
    const aiMessages = await buildContextWithNewMessage(
      {
        roomId: validData.room_id,
        model: validData.model,
        maxRecentMessages: 10,
        includeMemories: true,
      },
      validData.message
    );

    // Stream AI response
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: aiMessages,
      temperature: 0.6, // Lower temperature for more consistent tone
      maxTokens: 2000, // Prevent text truncation
    });

    // Collect full response for database storage
    let fullResponse = "";
    let totalTokens = 0;

    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }

          // Get token usage
          const usage = await result.usage;
          totalTokens = (usage?.totalTokens || 0);
          const actualCost = Math.ceil((totalTokens / 1000) * costPerThousand);

          // Save assistant message
          await db
            .insert(messages)
            .values({
              room_id: validData.room_id,
              user_id: user.id,
              role: "assistant",
              content: fullResponse,
              sequence_number: nextSequence + 1,
              tokens_used: totalTokens,
              cost: actualCost,
              parent_message_id: userMessage.message_id,
              branch_name: branchName,
              is_active_branch: 1,
            });

          // Deduct points
          const newBalance = pointBalance.current_balance - actualCost;
          const newTotalSpent = pointBalance.total_spent + actualCost;

          await db
            .update(userPoints)
            .set({
              current_balance: newBalance,
              total_spent: newTotalSpent,
            })
            .where(eq(userPoints.user_id, user.id));

          // Create transaction record
          await db
            .insert(pointTransactions)
            .values({
              user_id: user.id,
              amount: -actualCost,
              balance_after: newBalance,
              type: "usage",
              reason: `Chat message in room ${validData.room_id}`,
              reference_id: `room_${validData.room_id}`,
            });

          // Update room metadata
          await db
            .update(chatRooms)
            .set({
              last_message: fullResponse.substring(0, 100),
              last_message_at: new Date(),
              message_count: room.message_count + 2,
            })
            .where(eq(chatRooms.room_id, validData.room_id));

          // Check if we should create a conversation summary
          // This runs asynchronously and doesn't block the response
          shouldCreateSummary(validData.room_id).then((shouldSummarize) => {
            if (shouldSummarize) {
              console.log(
                `📝 Creating summary for room ${validData.room_id}...`
              );
              createConversationSummary(
                validData.room_id,
                character.display_name
              ).catch((err) => {
                console.error("Failed to create summary:", err);
              });
            }
          });

          // Send completion event
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ done: true, tokens: totalTokens, cost: actualCost })}\n\n`
            )
          );

          controller.close();
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...Object.fromEntries(headers.entries()),
      },
    });
  } catch (err) {
    console.error("Error in chat:", err);
    return data({ error: "Failed to process chat" }, { status: 500, headers });
  }
}
