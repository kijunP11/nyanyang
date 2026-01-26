/**
 * Prompt Builder Module
 *
 * Builds comprehensive system prompts for AI characters by combining:
 * - Base system prompt
 * - Personality traits
 * - Example dialogues
 * - User name replacement
 * - Anti-impersonation rules
 */

import { characters } from "../../characters/schema";

/**
 * Build comprehensive character prompt
 *
 * Combines system_prompt, personality, and example_dialogues into a single
 * well-structured prompt that ensures consistent character behavior.
 *
 * @param character - Character data from database
 * @param userName - User's display name (from profiles table)
 * @returns Complete system prompt string
 */
export function buildCharacterPrompt(
  character: typeof characters.$inferSelect,
  userName: string
): string {
  let prompt = "";

  // Base system prompt (required)
  if (character.system_prompt) {
    prompt = character.system_prompt.trim();
  } else {
    // Fallback if system_prompt is missing
    prompt = `You are ${character.display_name}. ${character.description}`;
  }

  // Replace {{user}} placeholder with actual user name
  prompt = prompt.replace(/\{\{user\}\}/gi, userName);

  // Add personality section if available
  if (character.personality && character.personality.trim()) {
    prompt += `\n\n[성격 및 특성]\n${character.personality.trim()}`;
  }

  // Add example dialogues if available
  if (character.example_dialogues) {
    try {
      // Type guard for example_dialogues format
      const dialogues = character.example_dialogues as unknown;
      
      if (
        Array.isArray(dialogues) &&
        dialogues.length > 0 &&
        dialogues.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            "user" in item &&
            "assistant" in item &&
            typeof item.user === "string" &&
            typeof item.assistant === "string"
        )
      ) {
        const typedDialogues = dialogues as Array<{
          user: string;
          assistant: string;
        }>;

        prompt += `\n\n[말투 및 대화 예시]\n다음 예시를 참고하여 ${character.display_name}의 말투와 문체를 유지하세요:\n\n`;

        // Add up to 3 example dialogues to avoid token bloat
        const examplesToInclude = typedDialogues.slice(0, 3);
        for (const example of examplesToInclude) {
          const exampleUser = example.user?.trim() || userName;
          const exampleAssistant = example.assistant?.trim() || "";
          if (exampleAssistant) {
            prompt += `${userName}: ${exampleUser}\n${character.display_name}: ${exampleAssistant}\n\n`;
          }
        }
      } else {
        console.warn(
          `Invalid example_dialogues format for character ${character.character_id}. Expected Array<{user: string, assistant: string}>`
        );
      }
    } catch (error) {
      console.error("Error parsing example_dialogues:", error);
      // Continue without examples if parsing fails
    }
  }

  // Add critical anti-impersonation rules
  prompt += `\n\n[중요 규칙 - 반드시 준수하세요]\n`;
  prompt += `- 절대로 ${userName}(사용자)의 역할을 하지 마세요.\n`;
  prompt += `- ${userName}의 대사나 행동을 대신 작성하지 마세요.\n`;
  prompt += `- ${userName}의 입장에서 말하지 마세요.\n`;
  prompt += `- 오직 ${character.display_name}(당신)의 역할만 수행하세요.\n`;
  prompt += `- 모든 응답은 반드시 ${character.display_name}의 말과 행동만 포함해야 합니다.\n`;
  prompt += `- ${userName}가 무언가를 말하거나 행동하는 것처럼 묘사하지 마세요.\n`;

  return prompt;
}

/**
 * Get user's display name from profiles table using Supabase client
 *
 * Uses Supabase client to respect RLS policies. This ensures that users
 * can only access their own profile data.
 *
 * @param client - Supabase client with user session
 * @param userId - User's UUID
 * @returns User's display name, or fallback to "사용자"
 */
export async function getUserDisplayName(
  client: any, // SupabaseClient type
  userId: string
): Promise<string> {
  try {
    const { data: profile, error } = await client
      .from("profiles")
      .select("name")
      .eq("profile_id", userId)
      .single();

    if (error || !profile) {
      console.warn(`Profile not found for user ${userId}, using fallback`);
      return "사용자";
    }

    return profile.name || "사용자";
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return "사용자";
  }
}

