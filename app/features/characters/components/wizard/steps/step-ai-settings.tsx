/**
 * Step 4: AI Settings
 *
 * System prompt, auto-generation, memory, gender, age rating.
 */
import { useCallback } from "react";
import { SparklesIcon } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Switch } from "~/core/components/ui/switch";
import { Textarea } from "~/core/components/ui/textarea";
import { useWizard } from "../../../lib/wizard-context";
import {
  AGE_RATING_OPTIONS,
  GENDER_OPTIONS,
  type CharacterFormData,
} from "../../../lib/wizard-types";
import {
  canGeneratePrompt,
  generateSystemPrompt,
} from "../system-prompt-generator";

export function StepAISettings() {
  const { state, dispatch } = useWizard();
  const { formData, errors } = state;

  const updateField = (field: keyof CharacterFormData, value: unknown) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
  };

  // Auto-generate system prompt
  const handleAutoGenerate = useCallback(() => {
    const prompt = generateSystemPrompt(formData);
    dispatch({
      type: "UPDATE_FIELD",
      payload: { field: "system_prompt", value: prompt },
    });
  }, [formData, dispatch]);

  const canGenerate = canGeneratePrompt(formData);

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="system_prompt" className="text-white">
            시스템 프롬프트 <span className="text-red-500">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            disabled={!canGenerate}
            className="border-[#3f3f46] bg-transparent text-[#14b8a6] hover:bg-[#14b8a6]/10 hover:text-[#14b8a6] disabled:text-[#6b7280]"
          >
            <SparklesIcon className="mr-1 h-4 w-4" />
            자동 생성
          </Button>
        </div>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => updateField("system_prompt", e.target.value)}
          placeholder="AI가 이 캐릭터를 연기할 때 따를 지침을 작성해주세요"
          rows={8}
          className={`border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
            errors.system_prompt ? "border-red-500" : ""
          }`}
        />
        {errors.system_prompt && (
          <p className="text-sm text-red-500">{errors.system_prompt}</p>
        )}
        <p className="text-sm text-[#6b7280]">
          캐릭터의 말투, 행동 방식, 배경 설정 등을 상세히 작성해주세요.
          {!canGenerate && " (자동 생성을 사용하려면 먼저 이름과 성격을 입력하세요)"}
        </p>
      </div>

      {/* Enable Memory */}
      <div className="flex items-center justify-between rounded-lg border border-[#3f3f46] bg-[#232323] p-4">
        <div>
          <div className="font-medium text-white">메모리 기능</div>
          <div className="text-sm text-[#9ca3af]">
            AI가 이전 대화 내용을 기억하고 활용합니다
          </div>
        </div>
        <Switch
          checked={formData.enable_memory}
          onCheckedChange={(checked) => updateField("enable_memory", checked)}
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label htmlFor="gender" className="text-white">
          캐릭터 성별
        </Label>
        <Select
          value={formData.gender || undefined}
          onValueChange={(value) => updateField("gender", value)}
        >
          <SelectTrigger
            id="gender"
            className="border-[#3f3f46] bg-[#232323] text-white focus:border-[#14b8a6]"
          >
            <SelectValue placeholder="성별 선택" />
          </SelectTrigger>
          <SelectContent className="border-[#3f3f46] bg-[#232323]">
            {GENDER_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white focus:bg-[#3f3f46] focus:text-white"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Rating */}
      <div className="space-y-3">
        <Label className="text-white">연령 등급</Label>
        <div className="space-y-2">
          {AGE_RATING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                formData.age_rating === option.value
                  ? "border-[#14b8a6] bg-[#14b8a6]/10"
                  : "border-[#3f3f46] bg-[#232323] hover:border-[#6b7280]"
              }`}
            >
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-[#9ca3af]">
                  {option.description}
                </div>
              </div>
              <input
                type="radio"
                name="age_rating"
                value={option.value}
                checked={formData.age_rating === option.value}
                onChange={(e) => updateField("age_rating", e.target.value)}
                className="h-4 w-4 accent-[#14b8a6]"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
