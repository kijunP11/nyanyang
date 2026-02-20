/**
 * Step 3: Startup Settings
 *
 * First greeting message, relationship, world setting.
 */
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import { useWizard } from "../../../lib/wizard-context";
import type { CharacterFormData } from "../../../lib/wizard-types";

export function StepStartup() {
  const { state, dispatch } = useWizard();
  const { formData, errors } = state;

  const updateField = (field: keyof CharacterFormData, value: unknown) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
  };

  return (
    <div className="space-y-6">
      {/* Greeting Message */}
      <div className="space-y-2">
        <Label htmlFor="greeting_message" className="text-gray-900 dark:text-white">
          첫 인사말 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="greeting_message"
          value={formData.greeting_message}
          onChange={(e) => updateField("greeting_message", e.target.value)}
          placeholder="예: 안녕! 만나서 반가워! 오늘 하루는 어땠어?"
          rows={3}
          className={`border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280] ${
            errors.greeting_message ? "border-red-500" : ""
          }`}
        />
        {errors.greeting_message && (
          <p className="text-sm text-red-500">{errors.greeting_message}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-[#6b7280]">
          사용자와 첫 대화를 시작할 때 캐릭터가 보내는 메시지입니다
        </p>
      </div>

      {/* Relationship */}
      <div className="space-y-2">
        <Label htmlFor="relationship" className="text-gray-900 dark:text-white">
          나와의 관계 (선택)
        </Label>
        <Input
          id="relationship"
          value={formData.relationship}
          onChange={(e) => updateField("relationship", e.target.value)}
          placeholder="예: 10년지기 친구, 처음 만난 선배, 직장 동료"
          className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280]"
        />
        <p className="text-sm text-gray-500 dark:text-[#6b7280]">
          사용자와 캐릭터 간의 관계를 설정합니다
        </p>
      </div>

      {/* World Setting */}
      <div className="space-y-2">
        <Label htmlFor="world_setting" className="text-gray-900 dark:text-white">
          세계관 (선택)
        </Label>
        <Textarea
          id="world_setting"
          value={formData.world_setting}
          onChange={(e) => updateField("world_setting", e.target.value)}
          placeholder="예: 현대 도시, 대학 캠퍼스, 판타지 왕국"
          rows={3}
          className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280]"
        />
        <p className="text-sm text-gray-500 dark:text-[#6b7280]">
          대화가 이루어지는 배경이나 세계관을 설명합니다
        </p>
      </div>

      {/* Preview Hint */}
      <div className="rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-[#3f3f46] dark:bg-[#2a2a2a]">
        <h4 className="font-medium text-gray-900 dark:text-white">💡 팁</h4>
        <p className="mt-2 text-sm text-gray-600 dark:text-[#9ca3af]">
          관계와 세계관을 설정하면 AI가 더 일관된 캐릭터를 연기할 수 있습니다.
          이 정보는 시스템 프롬프트에 자동으로 포함됩니다.
        </p>
      </div>
    </div>
  );
}
