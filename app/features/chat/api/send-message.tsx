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
import {
  extractImportantFacts,
  saveMemory,
  searchMemories,
} from "../lib/memory.server";

const sendMessageSchema = z.object({
  character_id: z.number(),
  message: z.string().min(1).max(2000),
  message_type: z.enum(["dialogue", "action"]),
  model: z.enum([
    "gemini-3-flash",
    "gemini-3-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "claude-sonnet",
    "opus",
    "gpt-4o",
    "novelai-kayra",
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
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI API error: ${error.error?.message || "Unknown error"}`,
    );
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || "응답을 생성할 수 없습니다.";
}

/**
 * Get accurate Google API model name from internal ID
 */
function getGeminiModelName(model: string): string {
  // 2026.1 기준 사용 가능한 최신 모델로 매핑
  // 3.0 및 2.5 라인업은 아직 API 미공개 상태일 수 있으므로 2.0 Experimental로 안전하게 폴백
  const modelMap: Record<string, string> = {
    // Gemini 3 (API 미공개 -> 2.0 Flash Exp로 매핑)
    "gemini-3-flash": "gemini-2.0-flash-exp",
    "gemini-3-pro": "gemini-2.0-flash-exp",

    // Gemini 2.5 (API 미공개 -> 2.0 Flash Exp로 매핑)
    "gemini-2.5-flash": "gemini-2.0-flash-exp",
    "gemini-2.5-flash-lite": "gemini-2.0-flash-exp",

    // Gemini 2.0 (실제 모델 존재)
    "gemini-2.0-flash": "gemini-2.0-flash-exp",

    // Gemini 1.5 (안정 버전)
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
  };

  return modelMap[model] || "gemini-2.0-flash-exp";
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

  // Extract system message for Gemini's systemInstruction parameter
  const systemMessage = messages.find((m) => m.role === "system");

  // Convert messages to Gemini format (exclude system message)
  const contents = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "character" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  const modelName = getGeminiModelName(model);

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1500,
    },
  };

  // Add systemInstruction if system message exists
  // This is critical for character persona to work!
  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
 * Call NovelAI API
 */
async function callNovelAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
) {
  const apiKey = process.env.NOVELAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NOVELAI_API_KEY가 설정되지 않았습니다. .env 파일에 추가해주세요.",
    );
  }

  // 메시지를 NovelAI 형식으로 변환
  const prompt = messages
    .map((m) => {
      if (m.role === "system") return m.content + "\n\n";
      if (m.role === "user") return `User: ${m.content}\n`;
      return `Assistant: ${m.content}\n`;
    })
    .join("");

  const response = await fetch("https://api.novelai.net/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kayra-v1",
      input: prompt + "Assistant:",
      parameters: {
        temperature: 0.9,
        max_length: 1500,
        min_length: 1,
        use_string: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("NovelAI API Error Response:", errorText);
    let errorMessage = "Unknown error";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch (e) {
      errorMessage = errorText;
    }
    throw new Error(`NovelAI API error: ${errorMessage}`);
  }

  const result = await response.json();
  return result.output || "응답을 생성할 수 없습니다.";
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
      max_tokens: 1500,
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
function buildSystemPrompt(character: any): string {
  let prompt = `당신은 ${character.name}입니다.\n\n`;

  // 기본 정보
  if (character.appearance) prompt += `[외모]\n${character.appearance}\n\n`;
  if (character.description) prompt += `[설명]\n${character.description}\n\n`;
  if (character.personality) prompt += `[성격]\n${character.personality}\n\n`;
  if (character.role) prompt += `[역할]\n${character.role}\n\n`;
  if (character.world_setting) prompt += `[세계관]\n${character.world_setting}\n\n`;
  if (character.relationship) prompt += `[관계]\n${character.relationship}\n\n`;

  // 말투 및 톤 (핵심)
  if (character.speech_style) prompt += `[말투]\n${character.speech_style}\n\n`;
  if (character.tone) prompt += `[톤]\n${character.tone}\n\n`;

  // 추가 시스템 프롬프트
  if (character.system_prompt) {
    prompt += `[추가 설정]\n${character.system_prompt}\n\n`;
  }

  // 예시 대화 (Few-shot)
  if (
    character.example_dialogues &&
    Array.isArray(character.example_dialogues) &&
    character.example_dialogues.length > 0
  ) {
    prompt += `[대화 예시]\n`;
    character.example_dialogues.forEach((dialogue: any) => {
      if (dialogue.user && dialogue.character) {
        prompt += `User: ${dialogue.user}\n`;
        prompt += `Character: ${dialogue.character}\n`;
      }
    });
    prompt += `\n`;
  }

  // 행동 지침 (Instruction)
  prompt += `[행동 지침]\n`;
  prompt += `1. 당신은 AI가 아니라 ${character.name} 그 자체입니다. AI라는 것을 절대 드러내지 마세요.\n`;
  prompt += `2. 설정된 말투(${character.speech_style || "캐릭터 고유 말투"})와 톤(${character.tone || "캐릭터 고유 톤"})을 반드시 유지하세요.\n`;
  prompt += `3. 상황 묘사나 행동 지문은 *별표*로 감싸서 표현하세요. (예: *살며시 웃으며*, *고개를 끄덕이며*)\n`;
  prompt += `4. "무엇을 도와드릴까요?" 같은 전형적인 챗봇 멘트는 절대 사용하지 마세요.\n`;
  prompt += `5. 사용자의 말을 단순히 받아주기만 하지 말고, 먼저 질문하거나 새로운 주제를 꺼내며 대화를 주도하세요.\n`;
  prompt += `6. 답변의 길이는 상황에 맞게 조절하되, 너무 짧게 끝내지 말고 풍부하게 묘사하세요.\n`;
  prompt += `7. ${character.world_setting ? `현재 세계관(${character.world_setting})의 설정과 규칙을 철저히 따르세요.` : "현실적인 상황에 맞게 반응하세요."}\n`;

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

    // [DEBUG] Character Data Check
    console.log("=== [DEBUG] Character Data ===");
    console.log(`ID: ${character.character_id}, Name: ${character.name}`);
    console.log("Speech Style:", character.speech_style ? "Exists" : "NULL");
    console.log("Tone:", character.tone ? "Exists" : "NULL");
    console.log("Personality:", character.personality ? "Exists" : "NULL");
    console.log("===============================");

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
    let systemPrompt = buildSystemPrompt(character);

    // [Memory] Retrieve relevant memories
    if (character.enable_memory) {
      try {
        const memories = await searchMemories(client, room!.room_id, message);
        if (memories.length > 0) {
          systemPrompt += `\n[사용자에 대한 기억 (참고용)]\n다음은 사용자와의 과거 대화에서 기억한 내용입니다. 필요하다면 자연스럽게 언급하거나 참고하세요:\n${memories
            .map((m) => `- ${m.content}`)
            .join("\n")}\n`;
        }
      } catch (e) {
        console.error("Failed to search memories:", e);
        // Continue without memory on error
      }
    }

    // [Reinforce] Add instruction reinforcement at the end (Sandwich structure)
    // This counters Recency Bias where AI focuses too much on memory and forgets persona
    systemPrompt += `\n━━━━━━━━━━━━━━━━━━\n`;
    systemPrompt += `[절대 잊지 말 것 - 최우선 원칙]\n`;
    systemPrompt += `1. 당신은 ${character.name}입니다. AI 어시스턴트가 아닙니다.\n`;
    systemPrompt += `2. 반드시 설정된 말투로만 말하세요: ${character.speech_style || "캐릭터 고유 말투"}\n`;
    systemPrompt += `3. 위의 기억 정보는 대화의 맥락을 위해 참고만 하고, 캐릭터의 정체성과 말투를 절대 잃지 마세요.\n`;
    systemPrompt += `━━━━━━━━━━━━━━━━━━\n`;

    // [DEBUG] System Prompt Check
    console.log("=== [DEBUG] System Prompt ===");
    console.log(systemPrompt);
    console.log("=============================");

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
      if (model.startsWith("gemini")) {
        aiResponse = await callGemini(messages, model);
      } else if (model === "claude-sonnet" || model === "opus") {
        aiResponse = await callClaude(messages, model);
      } else if (model === "novelai-kayra") {
        aiResponse = await callNovelAI(messages, model);
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

    // [Memory] Extract and save important facts (Async, Fire-and-forget)
    if (character.enable_memory) {
      Promise.resolve()
        .then(async () => {
          try {
            const facts = await extractImportantFacts(message, aiResponse);
            for (const fact of facts) {
              await saveMemory(client, room!.room_id, fact);
            }
          } catch (e) {
            console.error("Background memory processing failed:", e);
          }
        })
        .catch((e) => {
          console.error("Unhandled promise rejection in memory processing:", e);
        });
    }

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
