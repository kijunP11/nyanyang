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
import { and, eq, desc, sql } from "drizzle-orm";
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
  model: z.enum([
    // OpenAI
    "gpt-4", "gpt-3.5-turbo", "gpt-4o",
    // Anthropic
    "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-sonnet", "opus",
    // Google Gemini
    "gemini-3-flash", "gemini-3-pro",
    "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ]).optional().default("gemini-2.5-flash"),
  regenerate: z.boolean().optional().default(false),
  replace_message_id: z.coerce.number().int().positive().optional(),
});

/**
 * Token cost per model (in points per 1000 tokens)
 */
const TOKEN_COSTS: Record<string, number> = {
  // OpenAI
  "gpt-3.5-turbo": 2,
  "gpt-4": 30,
  "gpt-4o": 20,
  // Anthropic
  "claude-3-haiku-20240307": 2,
  "claude-3-5-sonnet-20241022": 15,
  "claude-sonnet": 15,
  "opus": 75,
  // Google Gemini
  "gemini-3-flash": 2,
  "gemini-3-pro": 10,
  "gemini-2.5-pro": 8,
  "gemini-2.5-flash": 2,
  "gemini-2.5-flash-lite": 1,
  "gemini-2.0-flash": 2,
};

/**
 * Get Google API model name from internal ID
 */
function getGeminiModelName(model: string): string {
  const modelMap: Record<string, string> = {
    "gemini-3-flash": "gemini-3-flash-preview",
    "gemini-3-pro": "gemini-3-pro-preview",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    "gemini-2.0-flash": "gemini-2.0-flash",
  };
  return modelMap[model] || "gemini-2.0-flash";
}

/**
 * Call Google Gemini API directly
 */
async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  // Convert messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const modelName = getGeminiModelName(model);

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2000,
    },
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  // Thinking 모델은 thinkingConfig 필요 (2.5, 3.x 시리즈)
  const isThinkingModel = modelName.includes("2.5") || modelName.includes("3-");
  if (isThinkingModel) {
    (requestBody.generationConfig as Record<string, unknown>).thinkingConfig = {
      thinkingBudget: 256,
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${error.error?.message || response.status}`);
  }

  const result = await response.json();

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error("Gemini API returned no candidates");
  }

  const parts = result.candidates[0]?.content?.parts ?? [];
  const text = parts
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p?.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || "응답을 생성할 수 없습니다.";
}

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

    // Handle regenerate mode
    let userMessage: typeof messages.$inferSelect;
    let aiSequenceNumber: number;

    if (validData.regenerate && validData.replace_message_id) {
      // Soft-delete the existing AI message
      await db
        .update(messages)
        .set({ is_deleted: 1 })
        .where(eq(messages.message_id, validData.replace_message_id));

      // Find the original AI message to get its sequence number
      const [originalAiMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.message_id, validData.replace_message_id))
        .limit(1);

      if (!originalAiMsg) {
        return data({ error: "Original message not found" }, { status: 404, headers });
      }

      aiSequenceNumber = originalAiMsg.sequence_number;

      // Find the user message before the AI message (don't insert new one)
      // Query directly in DB for reliability
      const [existingUserMsg] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.room_id, validData.room_id),
            eq(messages.role, "user"),
            eq(messages.is_deleted, 0),
            sql`${messages.sequence_number} < ${originalAiMsg.sequence_number}`
          )
        )
        .orderBy(desc(messages.sequence_number))
        .limit(1);

      if (!existingUserMsg) {
        return data({ error: "User message not found for regeneration" }, { status: 400, headers });
      }

      userMessage = existingUserMsg;
    } else {
      // Normal message flow - save user message
      aiSequenceNumber = nextSequence + 1;
      [userMessage] = await db
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
    }

    // Get user's display name from profiles table (using Supabase client for RLS)
    const userName = await getUserDisplayName(client, user.id);

    // Build comprehensive character prompt
    const systemPrompt = buildCharacterPrompt(character, userName);

    // Build optimized context with memory system
    const aiMessages = await buildContextWithNewMessage(
      {
        roomId: validData.room_id,
        model: validData.model,
        maxRecentMessages: 10,
        includeMemories: true,
      },
      validData.message
    );

    // Handle Gemini models separately (non-streaming)
    if (validData.model.startsWith("gemini")) {
      const geminiResponse = await callGemini(systemPrompt, aiMessages, validData.model);
      const estimatedTokens = Math.ceil(geminiResponse.length / 4);
      const actualCost = Math.ceil((estimatedTokens / 1000) * costPerThousand);

      // Save assistant message
      await db.insert(messages).values({
        room_id: validData.room_id,
        user_id: user.id,
        role: "assistant",
        content: geminiResponse,
        sequence_number: aiSequenceNumber,
        tokens_used: estimatedTokens,
        cost: actualCost,
        parent_message_id: userMessage.message_id,
        branch_name: branchName,
        is_active_branch: 1,
      });

      // Deduct points
      const newBalance = pointBalance.current_balance - actualCost;
      const newTotalSpent = pointBalance.total_spent + actualCost;

      await db.update(userPoints).set({
        current_balance: newBalance,
        total_spent: newTotalSpent,
      }).where(eq(userPoints.user_id, user.id));

      // Create transaction record
      await db.insert(pointTransactions).values({
        user_id: user.id,
        amount: -actualCost,
        balance_after: newBalance,
        type: "usage",
        reason: `Chat message in room ${validData.room_id}`,
        reference_id: `room_${validData.room_id}`,
      });

      // Update room metadata (regenerate only adds 1 message, normal adds 2)
      const messageCountIncrement = validData.regenerate ? 1 : 2;
      await db.update(chatRooms).set({
        last_message: geminiResponse.substring(0, 100),
        last_message_at: new Date(),
        message_count: room.message_count + messageCountIncrement,
      }).where(eq(chatRooms.room_id, validData.room_id));

      // Return as SSE for consistency with frontend
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: geminiResponse })}\n\n`));
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true, tokens: estimatedTokens, cost: actualCost })}\n\n`));
          controller.close();
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
    }

    // Build AI model for OpenAI/Anthropic (streaming)
    let aiModel;
    if (validData.model.startsWith("gpt")) {
      aiModel = openai(validData.model);
    } else if (validData.model === "claude-sonnet") {
      aiModel = anthropic("claude-3-5-sonnet-20241022");
    } else if (validData.model === "opus") {
      aiModel = anthropic("claude-3-opus-20240229");
    } else {
      aiModel = anthropic(validData.model);
    }

    // Stream AI response
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: aiMessages,
      temperature: 0.6,
      maxOutputTokens: 2000,
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
              sequence_number: aiSequenceNumber,
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

          // Update room metadata (regenerate only adds 1 message, normal adds 2)
          const messageCountIncrement = validData.regenerate ? 1 : 2;
          await db
            .update(chatRooms)
            .set({
              last_message: fullResponse.substring(0, 100),
              last_message_at: new Date(),
              message_count: room.message_count + messageCountIncrement,
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
                character.display_name || character.name
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
