/**
 * Wizard Progress Bar Component
 *
 * Visual 5-step progress indicator for the wizard.
 */
import { CheckIcon } from "lucide-react";

import {
  WIZARD_STEPS,
  STEP_LABELS,
  type CharacterFormData,
  type WizardStep,
} from "../../lib/wizard-types";
import { isStepValid } from "../../lib/wizard-validation";

interface WizardProgressBarProps {
  currentStep: WizardStep;
  formData: CharacterFormData;
  onStepClick: (step: WizardStep) => void;
}

export function WizardProgressBar({
  currentStep,
  formData,
  onStepClick,
}: WizardProgressBarProps) {
  const steps = [
    WIZARD_STEPS.PROFILE,
    WIZARD_STEPS.PERSONALITY,
    WIZARD_STEPS.STARTUP,
    WIZARD_STEPS.AI_SETTINGS,
    WIZARD_STEPS.PUBLISHING,
  ] as const;

  return (
    <div className="mb-8">
      {/* Desktop Progress Bar */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep && isStepValid(step, formData);
          const isPast = step < currentStep;

          return (
            <div key={step} className="flex items-center">
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => onStepClick(step)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-[#14b8a6] bg-[#14b8a6] text-white"
                    : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : isPast
                        ? "border-gray-300 bg-gray-300 text-gray-600 dark:border-[#3f3f46] dark:bg-[#3f3f46] dark:text-[#9ca3af]"
                        : "border-gray-300 bg-transparent text-gray-500 dark:border-[#3f3f46] dark:text-[#9ca3af]"
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </button>

              {/* Step Label */}
              <span
                className={`ml-2 hidden md:block text-sm font-medium ${
                  isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-[#9ca3af]"
                }`}
              >
                {STEP_LABELS[step]}
              </span>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-6 md:w-10 ${
                    step < currentStep ? "bg-[#14b8a6]" : "bg-gray-300 dark:bg-[#3f3f46]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Progress Bar */}
      <div className="flex sm:hidden items-center justify-between">
        <div className="flex items-center gap-2">
          {steps.map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep && isStepValid(step, formData);
            const isPast = step < currentStep;

            return (
              <button
                key={step}
                type="button"
                onClick={() => onStepClick(step)}
                className={`h-2.5 rounded-full transition-all ${
                  isActive
                    ? "w-8 bg-[#14b8a6]"
                    : isCompleted
                      ? "w-2.5 bg-green-500"
                      : isPast
                        ? "w-2.5 bg-gray-400 dark:bg-[#6b7280]"
                        : "w-2.5 bg-gray-300 dark:bg-[#3f3f46]"
                }`}
                aria-label={STEP_LABELS[step]}
              />
            );
          })}
        </div>
        <span className="text-sm text-gray-500 dark:text-[#9ca3af]">
          {currentStep}/5: {STEP_LABELS[currentStep]}
        </span>
      </div>
    </div>
  );
}
