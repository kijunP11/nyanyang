/**
 * Send Chat Message API
 *
 * Handles sending messages to AI and getting responses
 * Supports multiple AI providers: OpenAI, Google Gemini, Anthropic Claude
 */
import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";
import { z } from "zod";

import { requireUser } from "~/core/lib/guards.server";
import { getCharacterWithDetails } from "~/features/characters/queries";

const sendMessageSchema = z.object({
  character_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  message_type: z.enum(["dialogue", "action"]),
  model: z.enum([
    "gemini-2.5-pro",
    "claude-sonnet",
    "opus",
    "gpt-4",
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
      model: model === "gpt-4" ? "gpt-4" : "gpt-3.5-turbo",
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
  const contents = messages.map((msg) => ({
    role: msg.role === "character" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const modelName =
    model === "gemini-2.5-pro" ? "gemini-2.0-flash-exp" : "gemini-1.5-pro";

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

  // Convert messages to Claude format
  const claudeMessages = messages.map((msg) => ({
    role: msg.role === "character" ? "assistant" : "user",
    content: msg.content,
  }));

  const modelName =
    model === "claude-sonnet"
      ? "claude-3-5-sonnet-20241022"
      : "claude-3-opus-20240229";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelName,
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
function buildSystemPrompt(character: any): string {
  let prompt = `당신은 ${character.name}입니다.\n\n`;

  if (character.description) {
    prompt += `설명: ${character.description}\n\n`;
  }

  if (character.personality_traits && character.personality_traits.length > 0) {
    prompt += `성격: ${character.personality_traits.join(", ")}\n\n`;
  }

  if (character.tone) {
    prompt += `말투: ${character.tone}\n\n`;
  }

  // Add keywords to system prompt
  if (character.keywords && character.keywords.length > 0) {
    prompt += `중요 키워드:\n`;
    character.keywords.forEach((kw: any) => {
      prompt += `- ${kw.keyword}: ${kw.description || ""}\n`;
      if (kw.response_template) {
        prompt += `  응답 템플릿: ${kw.response_template}\n`;
      }
    });
    prompt += "\n";
  }

  // Add safety filter guidelines
  if (character.safetyFilter) {
    const filter = character.safetyFilter;
    prompt += `안전 가이드라인:\n`;
    if (filter.block_nsfw) prompt += `- NSFW 콘텐츠는 생성하지 마세요\n`;
    if (filter.block_violence) prompt += `- 폭력적인 콘텐츠는 생성하지 마세요\n`;
    if (filter.block_hate_speech)
      prompt += `- 혐오 발언은 생성하지 마세요\n`;
    if (filter.block_personal_info)
      prompt += `- 개인정보는 요청하거나 공유하지 마세요\n`;

    if (filter.blocked_words && filter.blocked_words.length > 0) {
      prompt += `- 다음 단어는 사용하지 마세요: ${filter.blocked_words.join(", ")}\n`;
    }
    prompt += "\n";
  }

  prompt += `사용자와 자연스럽고 매력적인 대화를 나누세요. 캐릭터의 성격과 말투를 유지하세요.\n`;
  prompt += `대화 형식:\n`;
  prompt += `- *행동*: 행동이나 지문은 별표로 감쌉니다\n`;
  prompt += `- "대사": 말하는 내용은 따옴표로 감쌉니다\n`;

  return prompt;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.json();
    const validatedData = sendMessageSchema.parse(formData);
    const {
      character_id,
      message,
      message_type,
      model,
      conversation_history = [],
    } = validatedData;

    // Get character details
    const character = await getCharacterWithDetails(character_id);

    if (!character) {
      return data({ error: "캐릭터를 찾을 수 없습니다" }, { status: 404 });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(character);

    // Format user message
    const formattedMessage =
      message_type === "action" ? `*${message}*` : `"${message}"`;

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation_history,
      { role: "user", content: formattedMessage },
    ];

    // Call appropriate AI provider
    let aiResponse: string;

    try {
      if (model === "gemini-2.5-pro") {
        aiResponse = await callGemini(messages, model);
      } else if (model === "claude-sonnet" || model === "opus") {
        aiResponse = await callClaude(messages, model);
      } else if (model === "gpt-4" || model === "custom") {
        aiResponse = await callOpenAI(messages, model);
      } else {
        // Default to Gemini
        aiResponse = await callGemini(messages, "gemini-2.5-pro");
      }
    } catch (aiError: any) {
      console.error("AI API error:", aiError);

      // Return a friendly error message
      return data(
        {
          error: "AI 응답 생성 중 오류가 발생했습니다",
          details: aiError.message,
          fallback: true,
          response: {
            content: "죄송합니다. 지금은 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.",
            character_name: character.name,
          },
        },
        { status: 500 },
      );
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
    if (error instanceof z.ZodError) {
      return data(
        {
          error: "유효성 검사 실패",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Send message error:", error);
    return data(
      {
        error: "메시지 전송 중 오류가 발생했습니다",
      },
      { status: 500 },
    );
  }
}
