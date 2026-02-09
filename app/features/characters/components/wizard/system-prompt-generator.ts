/**
 * System Prompt Generator
 *
 * Pure function to auto-generate system prompts from character data.
 * No API calls - generates locally.
 */
import { ROLE_OPTIONS, type CharacterFormData } from "../../lib/wizard-types";

/**
 * Get role label in Korean
 */
function getRoleLabel(roleValue: string): string | null {
  const role = ROLE_OPTIONS.find((r) => r.value === roleValue);
  return role ? role.label : null;
}

/**
 * Generate System Prompt from Character Data
 *
 * Builds a structured prompt based on available character information.
 */
export function generateSystemPrompt(
  data: Partial<CharacterFormData>
): string {
  const lines: string[] = [];

  // Character name
  if (data.name) {
    lines.push(`당신은 "${data.name}"입니다.`);
    lines.push("");
  }

  // Role
  if (data.role) {
    const roleLabel = getRoleLabel(data.role);
    if (roleLabel) {
      lines.push("## 역할");
      lines.push(`${roleLabel} 역할을 합니다.`);
      lines.push("");
    }
  }

  // Appearance
  if (data.appearance?.trim()) {
    lines.push("## 외모");
    lines.push(data.appearance.trim());
    lines.push("");
  }

  // Personality (required)
  if (data.personality?.trim()) {
    lines.push("## 성격");
    lines.push(data.personality.trim());
    lines.push("");
  }

  // Speech style
  if (data.speech_style?.trim()) {
    lines.push("## 말투");
    lines.push(`${data.speech_style.trim()} 스타일로 대화합니다.`);
    lines.push("");
  }

  // Relationship
  if (data.relationship?.trim()) {
    lines.push("## 관계");
    lines.push(`사용자와의 관계: ${data.relationship.trim()}`);
    lines.push("");
  }

  // World setting
  if (data.world_setting?.trim()) {
    lines.push("## 세계관");
    lines.push(data.world_setting.trim());
    lines.push("");
  }

  // Guidelines
  lines.push("## 지침");
  lines.push("- 항상 캐릭터에 맞는 말투와 성격을 유지하세요.");
  lines.push("- 사용자와 자연스럽게 대화하세요.");
  lines.push("- 설정에 벗어나는 행동은 하지 마세요.");

  return lines.join("\n");
}

/**
 * Check if auto-generation has enough data
 *
 * Returns true if there's enough data to generate a meaningful prompt.
 */
export function canGeneratePrompt(data: Partial<CharacterFormData>): boolean {
  return !!(data.name?.trim() && data.personality?.trim());
}
