/**
 * Character Wizard Component
 *
 * Main wizard shell that orchestrates 5-step character creation/editing.
 */
import { useCallback } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { useWizard } from "../../lib/wizard-context";
import { WIZARD_STEPS, STEP_LABELS, type WizardStep } from "../../lib/wizard-types";
import { validateCurrentStep, isStepValid } from "../../lib/wizard-validation";
import { WizardProgressBar } from "./wizard-progress-bar";
import { StepProfile } from "./steps/step-profile";
import { StepPersonality } from "./steps/step-personality";
import { StepStartup } from "./steps/step-startup";
import { StepAISettings } from "./steps/step-ai-settings";
import { StepPublishing } from "./steps/step-publishing";

interface CharacterWizardProps {
  onSubmit: () => void;
  onCancel: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
}

export function CharacterWizard({
  onSubmit,
  onCancel,
  onSaveDraft,
  isSubmitting = false,
}: CharacterWizardProps) {
  const { state, dispatch } = useWizard();
  const { currentStep, formData, isEditMode } = state;

  // Navigate to specific step
  const goToStep = useCallback(
    (step: WizardStep) => {
      dispatch({ type: "SET_STEP", payload: step });
    },
    [dispatch]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    const errors = validateCurrentStep(currentStep, formData);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", payload: errors });
      return;
    }
    dispatch({ type: "CLEAR_ERRORS" });
    dispatch({ type: "NEXT_STEP" });
  }, [currentStep, formData, dispatch]);

  // Handle previous step
  const handlePrev = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, [dispatch]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    // Validate all steps before submission
    const allSteps = [
      WIZARD_STEPS.PROFILE,
      WIZARD_STEPS.PERSONALITY,
      WIZARD_STEPS.STARTUP,
      WIZARD_STEPS.AI_SETTINGS,
    ] as const;

    for (const step of allSteps) {
      if (!isStepValid(step, formData)) {
        dispatch({
          type: "SET_ERRORS",
          payload: validateCurrentStep(step, formData),
        });
        dispatch({ type: "SET_STEP", payload: step });
        return;
      }
    }

    dispatch({ type: "CLEAR_ERRORS" });
    onSubmit();
  }, [formData, dispatch, onSubmit]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WIZARD_STEPS.PROFILE:
        return <StepProfile />;
      case WIZARD_STEPS.PERSONALITY:
        return <StepPersonality />;
      case WIZARD_STEPS.STARTUP:
        return <StepStartup />;
      case WIZARD_STEPS.AI_SETTINGS:
        return <StepAISettings />;
      case WIZARD_STEPS.PUBLISHING:
        return <StepPublishing />;
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === WIZARD_STEPS.PROFILE;
  const isLastStep = currentStep === WIZARD_STEPS.PUBLISHING;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Bar */}
      <WizardProgressBar
        currentStep={currentStep}
        formData={formData}
        onStepClick={goToStep}
      />

      {/* Step Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {STEP_LABELS[currentStep]}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#9ca3af]">
          {getStepDescription(currentStep)}
        </p>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-[#3f3f46] dark:bg-[#1a1a1a]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={isFirstStep ? onCancel : handlePrev}
          disabled={isSubmitting}
          className="border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 dark:border-[#3f3f46] dark:text-white dark:hover:bg-[#3f3f46]"
        >
          {isFirstStep ? (
            "취소"
          ) : (
            <>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              이전
            </>
          )}
        </Button>

        <div className="flex items-center gap-3">
          {/* Save Draft Button (only in create mode, not on last step) */}
          {!isEditMode && onSaveDraft && !isLastStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100 dark:border-[#3f3f46] dark:text-[#9ca3af] dark:hover:bg-[#3f3f46] dark:hover:text-white"
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              임시저장
            </Button>
          )}

          <Button
            type="button"
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="bg-[#14b8a6] text-white hover:bg-[#0d9488]"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : isLastStep ? (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                {isEditMode ? "저장하기" : "캐릭터 만들기"}
              </>
            ) : (
              <>
                다음
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get step description for subtitle
 */
function getStepDescription(step: WizardStep): string {
  switch (step) {
    case WIZARD_STEPS.PROFILE:
      return "캐릭터의 기본 정보를 입력해주세요";
    case WIZARD_STEPS.PERSONALITY:
      return "캐릭터의 성격과 말투를 설정해주세요";
    case WIZARD_STEPS.STARTUP:
      return "대화 시작 시 사용할 설정을 입력해주세요";
    case WIZARD_STEPS.AI_SETTINGS:
      return "AI 동작 방식을 설정해주세요";
    case WIZARD_STEPS.PUBLISHING:
      return "캐릭터 공개 및 분류 설정을 해주세요";
    default:
      return "";
  }
}
