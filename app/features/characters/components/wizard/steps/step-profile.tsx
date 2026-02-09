/**
 * Step 1: Profile
 *
 * Character basic profile - name, tagline, description, images.
 */
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import { useWizard } from "../../../lib/wizard-context";
import type { CharacterFormData } from "../../../lib/wizard-types";
import { ImageUploadField } from "../image-upload-field";

export function StepProfile() {
  const { state, dispatch } = useWizard();
  const { formData, errors } = state;

  const updateField = (field: keyof CharacterFormData, value: unknown) => {
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });
  };

  return (
    <div className="space-y-6">
      {/* Image Uploads */}
      <div className="flex flex-wrap gap-6">
        <ImageUploadField
          label="프로필 이미지"
          value={formData.avatar_url}
          onChange={(dataUrl) => updateField("avatar_url", dataUrl)}
          onRemove={() => updateField("avatar_url", null)}
          aspectRatio="square"
        />
        <div className="flex-1 min-w-[200px]">
          <ImageUploadField
            label="배너 이미지"
            value={formData.banner_url}
            onChange={(dataUrl) => updateField("banner_url", dataUrl)}
            onRemove={() => updateField("banner_url", null)}
            aspectRatio="banner"
          />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          캐릭터 이름 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="예: 냐냥이"
          maxLength={50}
          className={`border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
            errors.name ? "border-red-500" : ""
          }`}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-white">
          표시 이름
        </Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => updateField("display_name", e.target.value)}
          placeholder="화면에 표시될 이름 (비워두면 캐릭터 이름 사용)"
          maxLength={50}
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <Label htmlFor="tagline" className="text-white">
          한 줄 소개
        </Label>
        <Input
          id="tagline"
          value={formData.tagline}
          onChange={(e) => updateField("tagline", e.target.value)}
          placeholder="예: 친근한 대학 선배"
          maxLength={50}
          className="border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6]"
        />
        <p className="text-sm text-[#6b7280]">캐릭터를 한 문장으로 표현해주세요</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          설명 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="캐릭터에 대한 간단한 설명을 작성해주세요"
          rows={3}
          className={`border-[#3f3f46] bg-[#232323] text-white placeholder:text-[#6b7280] focus:border-[#14b8a6] ${
            errors.description ? "border-red-500" : ""
          }`}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
