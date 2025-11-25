/**
 * Send Chat Message API
 *
 * Handles sending messages to AI and getting responses
 * Supports multiple AI providers: OpenAI, Google Gemini, Anthropic Claude
 */
import type { Route } from "./+types/send-message";

import { data } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

const sendMessageSchema = z.object({
  character_id: z.number(),
  message: z.string().min(1).max(2000),
  message_type: z.enum(["dialogue", "action"]),
  model: z.enum([
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "claude-sonnet",
    "opus",
    "gpt-4o",
    "custom",
  ]),
  conversation_history: z
    .array(
      z.object({
        role: z.enum(["user", "character"]),
        content: z.string(),
      }),
    )
    .optional(),
});

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY가 설정되지 않았습니다. .env 파일에 추가해주세요.",
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
      messages,
      temperature: 0.9,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || "응답을 생성할 수 없습니다.";
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  messages: Array<{ role: string; content: string }>,
  model: string,
) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 추가해주세요.",
    );
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "character" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  const modelName =
    model === "gemini-2.5-pro" ? "gemini-2.0-flash-exp" : "gemini-1.5-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 500,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Gemini API error: ${error.error?.message || "Unknown error"}`,
    );
  }

  const result = await response.json();
  return (
    result.candidates?.[0]?.content?.parts?.[0]?.text ||
    "응답을 생성할 수 없습니다."
  );
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(
  messages: Array<{ role: string; content: string }>,
  model: string,
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일에 추가해주세요.",
    );
  }

  // Extract system message
  const systemMessage = messages.find((m) => m.role === "system");

  // Convert messages to Claude format (excluding system)
  const claudeMessages = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "character" ? "assistant" : "user",
      content: msg.content,
    }));

  const modelName =
    model === "claude-sonnet"
      ? "claude-sonnet-4-20250514"
      : "claude-sonnet-4-20250514";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelName,
      system: systemMessage?.content,
      messages: claudeMessages,
      max_tokens: 500,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Claude API error: ${error.error?.message || "Unknown error"}`,
    );
  }

  const result = await response.json();
  return result.content?.[0]?.text || "응답을 생성할 수 없습니다.";
}

/**
 * Build system prompt from character data
 */
function buildSystemPrompt(character: {
  name: string;
  description: string;
  personality: string;
  system_prompt: string;
  greeting_message: string;
}): string {
  let prompt = `당신은 ${character.name}입니다.\n\n`;

  if (character.description) {
    prompt += `설명: ${character.description}\n\n`;
  }

  if (character.personality) {
    prompt += `성격: ${character.personality}\n\n`;
  }

  if (character.system_prompt) {
    prompt += `${character.system_prompt}\n\n`;
  }

  prompt += `사용자와 자연스럽고 매력적인 대화를 나누세요. 캐릭터의 성격과 말투를 유지하세요.\n`;
  prompt += `대화 형식:\n`;
  prompt += `- *행동*: 행동이나 지문은 별표로 감쌉니다\n`;

  return prompt;
}

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  // 인증 확인
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.json();
    const result = sendMessageSchema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      character_id,
      message,
      message_type,
      model,
      conversation_history = [],
    } = result.data;

    // 캐릭터 정보 조회
    const { data: character } = await client
      .from("characters")
      .select("*")
      .eq("character_id", character_id)
      .single();

    if (!character) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    // 채팅방 확인/생성
    let { data: room } = await client
      .from("chat_rooms")
      .select("*")
      .eq("character_id", character_id)
      .eq("user_id", user.id)
      .single();

    if (!room) {
      const { data: newRoom } = await client
        .from("chat_rooms")
        .insert({
          character_id,
          user_id: user.id,
          title: `${character.name}과의 대화`,
        })
        .select()
        .single();
      room = newRoom;
    }

    // 다음 시퀀스 번호 가져오기
    const { data: lastMessage } = await client
      .from("messages")
      .select("sequence_number")
      .eq("room_id", room!.room_id)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .single();

    const nextSeq = (lastMessage?.sequence_number || 0) + 1;

    // Build system prompt
    const systemPrompt = buildSystemPrompt(character);

    // Format user message
    const formattedMessage =
      message_type === "action" ? `*${message}*` : message;

    // 사용자 메시지 저장
    await client.from("messages").insert({
      room_id: room!.room_id,
      user_id: user.id,
      role: "user",
      content: formattedMessage,
      sequence_number: nextSeq,
    });

    // Build messages array for AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation_history.map((h) => ({
        role: h.role === "character" ? "assistant" : "user",
        content: h.content,
      })),
      { role: "user", content: formattedMessage },
    ];

    // Call appropriate AI provider
    let aiResponse: string;

    try {
      if (model === "gemini-2.5-pro" || model === "gemini-2.5-flash") {
        aiResponse = await callGemini(messages, model);
      } else if (model === "claude-sonnet" || model === "opus") {
        aiResponse = await callClaude(messages, model);
      } else if (model === "gpt-4o" || model === "custom") {
        aiResponse = await callOpenAI(messages, model);
      } else {
        // Default to OpenAI
        aiResponse = await callOpenAI(messages, "gpt-4o");
      }
    } catch (aiError: unknown) {
      console.error("AI API error:", aiError);

      const errorMessage =
        aiError instanceof Error ? aiError.message : "Unknown error";

      // Return a friendly error message
      return data({
        success: false,
        error: "AI 응답 생성 중 오류가 발생했습니다",
        details: errorMessage,
        response: {
          content:
            "죄송합니다. 지금은 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
          character_name: character.name,
        },
      });
    }

    // AI 응답 저장
    await client.from("messages").insert({
      room_id: room!.room_id,
      user_id: user.id,
      role: "assistant",
      content: aiResponse,
      sequence_number: nextSeq + 1,
    });

    // 채팅방 업데이트 (마지막 메시지, 메시지 수)
    await client
      .from("chat_rooms")
      .update({
        last_message: aiResponse.substring(0, 100),
        last_message_at: new Date().toISOString(),
        message_count: (room!.message_count || 0) + 2,
      })
      .eq("room_id", room!.room_id);

    return data({
      success: true,
      response: {
        content: aiResponse,
        character_name: character.name,
        model_used: model,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return data(
      {
        error: "메시지 전송 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
