/**
 * Character Wizard Validation
 *
 * Zod-based validation for each wizard step.
 */
import { z } from "zod";

import {
  WIZARD_STEPS,
  type CharacterFormData,
  type ValidationErrors,
  type WizardStep,
} from "./wizard-types";

/**
 * Step 1: Profile Validation Schema
 */
export const step1Schema = z.object({
  name: z
    .string()
    .min(1, "캐릭터 이름은 필수입니다")
    .max(50, "캐릭터 이름은 50자 이하여야 합니다"),
  description: z.string().min(1, "설명은 필수입니다"),
});

/**
 * Step 2: Personality Validation Schema
 */
export const step2Schema = z.object({
  personality: z.string().min(1, "성격 설명은 필수입니다"),
});

/**
 * Step 3: Startup Validation Schema
 */
export const step3Schema = z.object({
  greeting_message: z.string().min(1, "첫 인사말은 필수입니다"),
});

/**
 * Step 4: AI Settings Validation Schema
 */
export const step4Schema = z.object({
  system_prompt: z.string().min(1, "시스템 프롬프트는 필수입니다"),
});

/**
 * Step 5: Publishing Validation Schema
 * No required fields
 */
export const step5Schema = z.object({});

/**
 * Full Character Validation Schema (for final submission)
 */
export const characterSchema = z.object({
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(50),
  display_name: z.string().max(50).optional().nullable(),
  tagline: z.string().max(50).optional().nullable(),
  description: z.string().min(1, "설명은 필수입니다"),
  avatar_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().min(1, "성격 설명은 필수입니다"),
  speech_style: z.string().optional().nullable(),
  example_dialogues: z.any().optional().nullable(),
  greeting_message: z.string().min(1, "첫 인사말은 필수입니다"),
  relationship: z.string().optional().nullable(),
  world_setting: z.string().optional().nullable(),
  system_prompt: z.string().min(1, "시스템 프롬프트는 필수입니다"),
  enable_memory: z.boolean().default(true),
  gender: z.string().optional().nullable(),
  age_rating: z.string().default("everyone"),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
});

/**
 * Validate Step 1: Profile
 */
export function validateStep1(data: CharacterFormData): ValidationErrors {
  const result = step1Schema.safeParse(data);
  if (result.success) return {};

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CharacterFormData;
    errors[field] = issue.message;
  }
  return errors;
}

/**
 * Validate Step 2: Personality
 */
export function validateStep2(data: CharacterFormData): ValidationErrors {
  const result = step2Schema.safeParse(data);
  if (result.success) return {};

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CharacterFormData;
    errors[field] = issue.message;
  }
  return errors;
}

/**
 * Validate Step 3: Startup
 */
export function validateStep3(data: CharacterFormData): ValidationErrors {
  const result = step3Schema.safeParse(data);
  if (result.success) return {};

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CharacterFormData;
    errors[field] = issue.message;
  }
  return errors;
}

/**
 * Validate Step 4: AI Settings
 */
export function validateStep4(data: CharacterFormData): ValidationErrors {
  const result = step4Schema.safeParse(data);
  if (result.success) return {};

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CharacterFormData;
    errors[field] = issue.message;
  }
  return errors;
}

/**
 * Validate Step 5: Publishing
 * No required fields, always valid
 */
export function validateStep5(_data: CharacterFormData): ValidationErrors {
  return {};
}

/**
 * Validate current step
 */
export function validateCurrentStep(
  step: WizardStep,
  data: CharacterFormData
): ValidationErrors {
  switch (step) {
    case WIZARD_STEPS.PROFILE:
      return validateStep1(data);
    case WIZARD_STEPS.PERSONALITY:
      return validateStep2(data);
    case WIZARD_STEPS.STARTUP:
      return validateStep3(data);
    case WIZARD_STEPS.AI_SETTINGS:
      return validateStep4(data);
    case WIZARD_STEPS.PUBLISHING:
      return validateStep5(data);
    default:
      return {};
  }
}

/**
 * Check if step is valid
 */
export function isStepValid(step: WizardStep, data: CharacterFormData): boolean {
  const errors = validateCurrentStep(step, data);
  return Object.keys(errors).length === 0;
}

/**
 * Find first invalid step
 */
export function findFirstInvalidStep(
  data: CharacterFormData
): WizardStep | null {
  const steps = [
    WIZARD_STEPS.PROFILE,
    WIZARD_STEPS.PERSONALITY,
    WIZARD_STEPS.STARTUP,
    WIZARD_STEPS.AI_SETTINGS,
    WIZARD_STEPS.PUBLISHING,
  ] as const;

  for (const step of steps) {
    if (!isStepValid(step, data)) {
      return step;
    }
  }
  return null;
}

/**
 * Validate full form for submission
 */
export function validateFullForm(data: CharacterFormData): {
  success: boolean;
  errors: ValidationErrors;
  firstInvalidStep: WizardStep | null;
} {
  const firstInvalidStep = findFirstInvalidStep(data);

  if (firstInvalidStep) {
    return {
      success: false,
      errors: validateCurrentStep(firstInvalidStep, data),
      firstInvalidStep,
    };
  }

  return {
    success: true,
    errors: {},
    firstInvalidStep: null,
  };
}
