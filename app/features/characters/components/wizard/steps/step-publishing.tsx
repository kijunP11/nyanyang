/**
 * Step 5: Publishing Options
 *
 * Tags, category, visibility settings, and preview.
 */
import { useCallback } from "react";

import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Switch } from "~/core/components/ui/switch";
import { useWizard } from "../../../lib/wizard-context";
import { CATEGORY_OPTIONS, type CharacterFormData } from "../../../lib/wizard-types";
import { CharacterPreviewCard } from "../character-preview-card";
import { TagInput } from "../tag-input";

export function StepPublishing() {
  const { state, dispatch } = useWizard();
  const { formData } = state;

  const updateField = (field: keyof CharacterFormData, value: unknown) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
  };

  const handleAddTag = useCallback(
    (tag: string) => {
      const newTags = [...formData.tags, tag];
      dispatch({ type: "UPDATE_FIELD", payload: { field: "tags", value: newTags } });
    },
    [formData.tags, dispatch]
  );

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const newTags = formData.tags.filter((t) => t !== tag);
      dispatch({ type: "UPDATE_FIELD", payload: { field: "tags", value: newTags } });
    },
    [formData.tags, dispatch]
  );

  return (
    <div className="space-y-6">
      {/* Tags */}
      <TagInput
        tags={formData.tags}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
        maxTags={10}
      />

      {/* Category (Genre) */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-gray-900 dark:text-white">
          카테고리 (장르)
        </Label>
        <Select
          value={formData.category || undefined}
          onValueChange={(value) => updateField("category", value)}
        >
          <SelectTrigger
            id="category"
            className="border-gray-200 bg-white text-gray-900 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white"
          >
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent className="border-gray-200 bg-white dark:border-[#3f3f46] dark:bg-[#232323]">
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-gray-900 focus:bg-gray-100 dark:text-white dark:focus:bg-[#3f3f46] dark:focus:text-white"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-[#3f3f46]" />

      {/* Visibility Settings */}
      <div className="space-y-4">
        <Label className="text-gray-900 dark:text-white">공개 설정</Label>

        {/* Is Public */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">공개 캐릭터</div>
            <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
              다른 사용자도 이 캐릭터와 대화할 수 있습니다
            </div>
          </div>
          <Switch
            checked={formData.is_public}
            onCheckedChange={(checked) => updateField("is_public", checked)}
          />
        </div>

        {/* Is NSFW */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">NSFW 콘텐츠</div>
            <div className="text-sm text-gray-600 dark:text-[#9ca3af]">
              성인 콘텐츠가 포함된 캐릭터입니다
            </div>
          </div>
          <Switch
            checked={formData.is_nsfw}
            onCheckedChange={(checked) => updateField("is_nsfw", checked)}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-[#3f3f46]" />

      {/* Character Preview */}
      <CharacterPreviewCard formData={formData} />

      {/* Final Notes */}
      <div className="rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-[#3f3f46] dark:bg-[#2a2a2a]">
        <h4 className="font-medium text-gray-900 dark:text-white">최종 확인 사항</h4>
        <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-[#9ca3af]">
          <li>• 캐릭터 생성 후에도 언제든 수정할 수 있습니다</li>
          <li>• 공개 캐릭터는 다른 사용자에게 노출됩니다</li>
          <li>• NSFW 캐릭터는 성인 인증 후 이용 가능합니다</li>
        </ul>
      </div>
    </div>
  );
}
