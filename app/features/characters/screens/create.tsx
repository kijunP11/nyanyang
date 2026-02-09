/**
 * Character Creation Screen
 *
 * Multi-step form for creating new AI characters.
 * Steps: 1) Basic Info, 2) Personality, 3) System Prompt, 4) Images
 */

// @ts-expect-error - Route types generated when registered in routes.ts
import type { Route } from "./+types/create";

import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { data, redirect } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Action handler for character creation
 */
export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const formData = await request.formData();

    // Extract form data
    const characterData = {
      name: formData.get("name") as string,
      display_name: formData.get("display_name") as string,
      description: formData.get("description") as string,
      personality: formData.get("personality") as string,
      system_prompt: formData.get("system_prompt") as string,
      greeting_message: formData.get("greeting_message") as string,
      category: formData.get("category") as string,
      age_rating: formData.get("age_rating") as string,
      tags: formData.get("tags") as string,
      avatar_url: formData.get("avatar_url") as string,
      banner_url: formData.get("banner_url") as string,
    };

    // Validate required fields
    if (!characterData.name || !characterData.display_name || !characterData.description) {
      return data(
        { error: "Required fields missing", fields: characterData },
        { status: 400, headers }
      );
    }

    // Parse tags
    const tags = characterData.tags
      ? characterData.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    // Call API to create character
    const url = new URL(request.url);
    const apiUrl = new URL("/api/characters/create", url.origin);

    const response = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: {
        ...Object.fromEntries(request.headers),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...characterData,
        tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return data(
        { error: errorData.error || "Failed to create character", fields: characterData },
        { status: response.status, headers }
      );
    }

    const result = await response.json();

    // Redirect to character detail page
    return redirect(`/characters/${result.character.character_id}`, { headers });
  } catch (err) {
    console.error("Error creating character:", err);
    return data({ error: "Failed to create character" }, { status: 500, headers });
  }
}

/**
 * Character Creation Screen Component
 */
export default function CharacterCreateScreen() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data state
  const fields = actionData && "fields" in actionData ? actionData.fields : undefined;
  const [formData, setFormData] = useState({
    name: fields?.name || "",
    display_name: fields?.display_name || "",
    description: fields?.description || "",
    category: fields?.category || "female",
    age_rating: fields?.age_rating || "general",
    tags: fields?.tags || "",
    personality: fields?.personality || "",
    system_prompt: fields?.system_prompt || "",
    greeting_message: fields?.greeting_message || "",
    avatar_url: fields?.avatar_url || "",
    banner_url: fields?.banner_url || "",
  });

  // Image upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = async (
    file: File,
    type: "avatar" | "banner"
  ): Promise<string | null> => {
    try {
      const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingBanner;
      setUploading(true);

      // Create form data for upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("bucket", "characters");
      uploadFormData.append("folder", type === "avatar" ? "avatars" : "banners");

      // TODO: Implement image upload endpoint
      // For now, we'll use a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === "avatar") {
          setAvatarPreview(result);
        } else {
          setBannerPreview(result);
        }
      };
      reader.readAsDataURL(file);

      setUploading(false);
      return null; // Return null for now, will be replaced with actual upload URL
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingBanner;
      setUploading(false);
      return null;
    }
  };

  // Handle file input change
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    const url = await handleImageUpload(file, type);
    if (url) {
      setFormData((prev) => ({
        ...prev,
        [type === "avatar" ? "avatar_url" : "banner_url"]: url,
      }));
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return !!(
          formData.name &&
          formData.display_name &&
          formData.description &&
          formData.category &&
          formData.age_rating
        );
      case 2: // Personality
        return !!formData.personality;
      case 3: // System Prompt
        return !!formData.system_prompt;
      case 4: // Images (optional)
        return true;
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">새 캐릭터 생성</h1>
        <p className="text-muted-foreground mt-2">
          당신만의 AI 캐릭터를 만들어보세요
        </p>
      </div>

      {/* Error Message */}
      {actionData?.error && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {actionData.error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step <= currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              {step < totalSteps && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep === 1 ? "text-primary font-semibold" : "text-muted-foreground"}>
            기본 정보
          </span>
          <span className={currentStep === 2 ? "text-primary font-semibold" : "text-muted-foreground"}>
            성격 설정
          </span>
          <span className={currentStep === 3 ? "text-primary font-semibold" : "text-muted-foreground"}>
            시스템 프롬프트
          </span>
          <span className={currentStep === 4 ? "text-primary font-semibold" : "text-muted-foreground"}>
            이미지 업로드
          </span>
        </div>
      </div>

      {/* Form */}
      <Form method="post" className="bg-card rounded-lg border p-6">
        {/* Hidden fields to preserve all data */}
        <input type="hidden" name="name" value={formData.name} />
        <input type="hidden" name="display_name" value={formData.display_name} />
        <input type="hidden" name="description" value={formData.description} />
        <input type="hidden" name="category" value={formData.category} />
        <input type="hidden" name="age_rating" value={formData.age_rating} />
        <input type="hidden" name="tags" value={formData.tags} />
        <input type="hidden" name="personality" value={formData.personality} />
        <input type="hidden" name="system_prompt" value={formData.system_prompt} />
        <input type="hidden" name="greeting_message" value={formData.greeting_message} />
        <input type="hidden" name="avatar_url" value={formData.avatar_url} />
        <input type="hidden" name="banner_url" value={formData.banner_url} />

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                캐릭터 이름 (영문) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="name_input"
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: nyanyang"
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                영문, 숫자, 언더스코어만 사용 가능 (최대 50자)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                표시 이름 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="display_name_input"
                value={formData.display_name}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="예: 냐냥이"
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                설명 <span className="text-destructive">*</span>
              </label>
              <textarea
                name="description_input"
                value={formData.description}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="캐릭터에 대한 간단한 설명을 입력하세요 (최소 10자)"
                rows={4}
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 (최소 10자)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리 <span className="text-destructive">*</span>
                </label>
                <select
                  name="category_input"
                  value={formData.category}
                  onChange={handleChange}
                  onBlur={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  연령 등급 <span className="text-destructive">*</span>
                </label>
                <select
                  name="age_rating_input"
                  value={formData.age_rating}
                  onChange={handleChange}
                  onBlur={(e) => setFormData((prev) => ({ ...prev, age_rating: e.target.value }))}
                  className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">전체이용가</option>
                  <option value="teen">청소년</option>
                  <option value="mature">성인</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">태그</label>
              <input
                type="text"
                name="tags_input"
                value={formData.tags}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="예: 귀여운, 친근한, 밝은 (쉼표로 구분)"
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                쉼표로 구분하여 입력하세요 (예: 귀여운, 친근한, 밝은)
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Personality */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                성격 <span className="text-destructive">*</span>
              </label>
              <textarea
                name="personality_input"
                value={formData.personality}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, personality: e.target.value }))}
                placeholder="캐릭터의 성격, 말투, 특징 등을 자세히 설명해주세요"
                rows={10}
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.personality.length}/2000
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">첫 인사</label>
              <textarea
                name="greeting_message_input"
                value={formData.greeting_message}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, greeting_message: e.target.value }))}
                placeholder="캐릭터가 처음 만났을 때 하는 인사말을 입력하세요"
                rows={3}
                className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={500}
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">💡 팁</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>구체적인 성격 특징을 나열하세요 (예: 활발함, 긍정적, 유머러스)</li>
                <li>말투와 억양을 설명하세요 (예: 존댓말 사용, 반말 사용)</li>
                <li>특별한 버릇이나 습관이 있다면 추가하세요</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: System Prompt */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                시스템 프롬프트 <span className="text-destructive">*</span>
              </label>
              <textarea
                name="system_prompt_input"
                value={formData.system_prompt}
                onChange={handleChange}
                onBlur={(e) => setFormData((prev) => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="AI가 캐릭터를 연기할 때 따라야 하는 지침을 입력하세요"
                rows={15}
                className="w-full rounded-md border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={4000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.system_prompt.length}/4000
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">💡 시스템 프롬프트 작성 가이드</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>캐릭터의 역할과 배경을 명확히 설명하세요</li>
                <li>대화 스타일과 톤을 지정하세요</li>
                <li>해야 할 것과 하지 말아야 할 것을 명시하세요</li>
                <li>예시 대화를 포함하면 더 좋습니다</li>
              </ul>
              <div className="mt-3 text-xs">
                <p className="font-semibold mb-1">예시:</p>
                <code className="block bg-background rounded p-2 whitespace-pre-wrap">
                  {`You are Nyanyang, a cheerful and friendly AI cat character.

Personality:
- Always positive and energetic
- Uses cute expressions and emojis
- Speaks in a playful tone

Guidelines:
- Be helpful and supportive
- Use Korean language
- Keep responses concise
- Never use inappropriate language`}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">아바타 이미지</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "avatar")}
                    disabled={uploadingAvatar}
                    className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    권장 크기: 512x512px, 최대 5MB
                  </p>
                </div>
                {(avatarPreview || formData.avatar_url) && (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2">
                    <img
                      src={avatarPreview || formData.avatar_url}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">배너 이미지</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "banner")}
                    disabled={uploadingBanner}
                    className="w-full rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    권장 크기: 1920x480px, 최대 5MB
                  </p>
                </div>
              </div>
              {(bannerPreview || formData.banner_url) && (
                <div className="mt-4 w-full h-32 rounded-lg overflow-hidden border-2">
                  <img
                    src={bannerPreview || formData.banner_url}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">💡 이미지 업로드 안내</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>이미지는 선택사항입니다</li>
                <li>PNG, JPG, WEBP 형식을 지원합니다</li>
                <li>저작권이 없는 이미지를 사용해주세요</li>
                <li>부적절한 이미지는 관리자에 의해 삭제될 수 있습니다</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <div className="text-sm text-muted-foreground">
            {currentStep} / {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              다음
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !validateStep(currentStep)}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : "캐릭터 생성"}
            </button>
          )}
        </div>
      </Form>
    </div>
  );
}
