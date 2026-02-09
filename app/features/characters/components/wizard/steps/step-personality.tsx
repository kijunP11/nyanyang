/**
 * Step 2: Personality
 *
 * Character role, appearance, personality, speech style, example dialogues.
 */
import { useCallback } from "react";

import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import { useWizard } from "../../../lib/wizard-context";
import {
  ROLE_OPTIONS,
  type CharacterFormData,
  type ExampleDialogue,
} from "../../../lib/wizard-types";
import { ExampleDialogueEditor } from "../example-dialogue-editor";

export function StepPersonality() {
  const { state, dispatch } = useWizard();
  const { formData, errors } = state;

  const updateField = (field: keyof CharacterFormData, value: unknown) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
  };

  const addExampleDialogue = useCallback(() => {
    const newDialogue: ExampleDialogue = {
      id: crypto.randomUUID(),
      user: "",
      character: "",
    };
    dispatch({ type: "ADD_EXAMPLE_DIALOGUE", payload: newDialogue });
  }, [dispatch]);

  const updateExampleDialogue = useCallback(
    (id: string, data: Partial<ExampleDialogue>) => {
      dispatch({ type: "UPDATE_EXAMPLE_DIALOGUE", payload: { id, data } });
    },
    [dispatch]
  );

  const removeExampleDialogue = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_EXAMPLE_DIALOGUE", payload: id });
    },
    [dispatch]
  );

  return (
    <div className="space-y-6">
      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role" className="text-white">
          역할
        </Label>
        <Select
          value={formData.role || undefined}
          onValueChange={(value) => updateField("role", value)}
        >
          <SelectTrigger
            id="role"
            className="border-[#3f3f46] bg-[#232323] text-white focus:border-[#14b8a6]"
          >
            <SelectValue placeholder="역할을 선택하세요" />
          </SelectTrigger>
          <SelectContent className="border-[#3f3f46] bg-[#232323]">
            {ROLE_OPTIONS.map((option) => (
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

      {/* Appearance */}
      <div className="space-y-2">
        <Label htmlFor="appearance" className="text-white">
          외모 (선택)
        </Label>
        <Textarea
          id="appearance"
          value={formData.appearance}
          onChange={(e) => updateField("appearance", e.target.value)}
          placeholder="예: 짧은 머리, 안경, 캐주얼한 복장"
          rows={2}
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
      </div>

      {/* Personality */}
      <div className="space-y-2">
        <Label htmlFor="personality" className="text-white">
          성격 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="personality"
          value={formData.personality}
          onChange={(e) => updateField("personality", e.target.value)}
          placeholder="캐릭터의 성격을 자세히 설명해주세요"
          rows={3}
          className={`border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
            errors.personality ? "border-red-500" : ""
          }`}
        />
        {errors.personality && (
          <p className="text-sm text-red-500">{errors.personality}</p>
        )}
      </div>

      {/* Speech Style */}
      <div className="space-y-2">
        <Label htmlFor="speech_style" className="text-white">
          말투 (선택)
        </Label>
        <Input
          id="speech_style"
          value={formData.speech_style}
          onChange={(e) => updateField("speech_style", e.target.value)}
          placeholder="예: 반말, 친근한 톤"
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
      </div>

      {/* Example Dialogues */}
      <ExampleDialogueEditor
        dialogues={formData.example_dialogues}
        onAdd={addExampleDialogue}
        onUpdate={updateExampleDialogue}
        onRemove={removeExampleDialogue}
      />
    </div>
  );
}
