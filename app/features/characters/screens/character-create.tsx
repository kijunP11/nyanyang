/**
 * Character Create Screen
 *
 * Multi-step wizard form for creating a new character.
 * Uses WizardContext for state management across steps.
 */
import type { Route } from "./+types/character-create";

import { useCallback, useState } from "react";
import { data, redirect, useActionData, useNavigate, useNavigation } from "react-router";
import { z } from "zod";

import { Alert, AlertDescription } from "~/core/components/ui/alert";
import makeServerClient from "~/core/lib/supa-client.server";
import { WizardProvider, useWizard } from "../lib/wizard-context";
import type { CharacterFormData } from "../lib/wizard-types";
import { CharacterWizard } from "../components/wizard";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 만들기 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Validation Schema for full character creation
 */
const createCharacterSchema = z.object({
  _action: z.enum(["create", "save_draft"]).optional(),
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(50),
  display_name: z.string().max(50).optional().nullable(),
  tagline: z.string().max(50).optional().nullable(),
  description: z.string().min(1, "설명은 필수입니다"),
  role: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().min(1, "성격 설명은 필수입니다"),
  speech_style: z.string().optional().nullable(),
  system_prompt: z.string().min(1, "시스템 프롬프트는 필수입니다"),
  greeting_message: z.string().min(1, "첫 인사말은 필수입니다"),
  relationship: z.string().optional().nullable(),
  world_setting: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  age_rating: z.string().default("everyone"),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
  enable_memory: z.boolean().default(true),
  example_dialogues: z.any().optional().nullable(),
});

/**
 * Validation Schema for draft save (relaxed)
 */
const saveDraftSchema = z.object({
  _action: z.literal("save_draft"),
  name: z.string().min(1, "캐릭터 이름은 필수입니다").max(50),
  display_name: z.string().max(50).optional().nullable(),
  tagline: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.string().optional().nullable(),
  speech_style: z.string().optional().nullable(),
  system_prompt: z.string().optional().nullable(),
  greeting_message: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  world_setting: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  age_rating: z.string().default("everyone"),
  is_public: z.boolean().default(false),
  is_nsfw: z.boolean().default(false),
  enable_memory: z.boolean().default(true),
  example_dialogues: z.any().optional().nullable(),
});

const STORAGE_BUCKET = "character-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Helper: Check if string is base64 data URL
 */
function isBase64DataUrl(str: string | null | undefined): boolean {
  return !!str && str.startsWith("data:");
}

/**
 * Helper: Upload base64 image to Storage
 */
async function uploadImageToStorage(
  client: ReturnType<typeof makeServerClient>[0],
  characterId: number,
  mediaType: "avatar" | "banner",
  base64Data: string
): Promise<string | null> {
  try {
    // Extract base64 content
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    const [, mimeType, data] = matches;
    const buffer = Buffer.from(data, "base64");

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      console.warn(`File size exceeds limit for ${mediaType}`);
      return null;
    }

    // Generate unique file path
    const extension = mimeType.split("/")[1] || "png";
    const uniqueFileName = `${characterId}/${mediaType}/${Date.now()}.${extension}`;

    // Upload to Storage
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(uniqueFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = client.storage.from(STORAGE_BUCKET).getPublicUrl(uniqueFileName);

    return publicUrl;
  } catch (error) {
    console.error("Upload image error:", error);
    return null;
  }
}

/**
 * Loader - Check authentication
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return {};
}

/**
 * Action - Create character or save draft
 */
export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login", { headers });
  }

  try {
    const formData = await request.json();
    const actionType = formData._action || "create";
    const isDraft = actionType === "save_draft";

    // Use appropriate schema based on action type
    const schema = isDraft ? saveDraftSchema : createCharacterSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      return data(
        {
          error: "유효성 검사 실패",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { headers }
      );
    }

    const validData = result.data;

    // Extract base64 images (will upload after INSERT)
    const avatarBase64 = isBase64DataUrl(validData.avatar_url)
      ? validData.avatar_url
      : null;
    const bannerBase64 = isBase64DataUrl(validData.banner_url)
      ? validData.banner_url
      : null;

    // Create character in database (without base64 images initially)
    const { data: newCharacter, error } = await client
      .from("characters")
      .insert({
        creator_id: user.id,
        name: validData.name,
        display_name: validData.display_name || validData.name,
        tagline: validData.tagline || null,
        description: validData.description || "",
        role: validData.role || null,
        appearance: validData.appearance || null,
        personality: validData.personality || "",
        speech_style: validData.speech_style || null,
        system_prompt: validData.system_prompt || "",
        greeting_message: validData.greeting_message || "",
        relationship: validData.relationship || null,
        world_setting: validData.world_setting || null,
        avatar_url: avatarBase64 ? null : validData.avatar_url, // Skip base64, keep existing URL
        banner_url: bannerBase64 ? null : validData.banner_url,
        tags: validData.tags,
        category: validData.category || null,
        gender: validData.gender || null,
        age_rating: validData.age_rating,
        is_public: isDraft ? false : validData.is_public, // Draft is always private
        is_nsfw: validData.is_nsfw,
        enable_memory: validData.enable_memory,
        example_dialogues: validData.example_dialogues || null,
        status: isDraft ? "draft" : "approved",
      })
      .select()
      .single();

    if (error) {
      console.error("Create character error:", error);
      return data({ error: error.message }, { headers });
    }

    const characterId = newCharacter.character_id;

    // Upload base64 images to Storage
    const updateData: Record<string, string> = {};

    if (avatarBase64) {
      const avatarUrl = await uploadImageToStorage(
        client,
        characterId,
        "avatar",
        avatarBase64
      );
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
    }

    if (bannerBase64) {
      const bannerUrl = await uploadImageToStorage(
        client,
        characterId,
        "banner",
        bannerBase64
      );
      if (bannerUrl) {
        updateData.banner_url = bannerUrl;
      }
    }

    // Update character with Storage URLs if any images were uploaded
    if (Object.keys(updateData).length > 0) {
      await client
        .from("characters")
        .update(updateData)
        .eq("character_id", characterId);
    }

    // Create default safety filter (only for non-draft)
    if (!isDraft) {
      await client.from("character_safety_filters").insert({
        character_id: characterId,
        block_nsfw: true,
        block_violence: true,
        block_hate_speech: true,
        block_personal_info: true,
        sensitivity_level: 5,
      });
    }

    return data(
      {
        success: true,
        characterId,
        isDraft,
        message: isDraft ? "임시저장되었습니다" : "캐릭터가 생성되었습니다",
      },
      { headers }
    );
  } catch (error: unknown) {
    console.error("Character create error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return data(
      {
        error: `캐릭터 생성 중 오류가 발생했습니다: ${errorMessage}`,
      },
      { headers }
    );
  }
}

/**
 * Inner component that uses WizardContext
 */
function CharacterCreateInner() {
  const { state, dispatch } = useWizard();
  const { formData } = state;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // Prepare submit data
  const prepareSubmitData = useCallback(
    (isDraft: boolean) => ({
      _action: isDraft ? "save_draft" : "create",
      ...formData,
      display_name: formData.display_name || formData.name,
      example_dialogues:
        formData.example_dialogues.length > 0
          ? formData.example_dialogues.map((d) => ({
              user: d.user,
              character: d.character,
            }))
          : null,
    }),
    [formData]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/characters/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prepareSubmitData(false)),
      });

      const result = await response.json();

      if (result.success) {
        navigate(`/characters/${result.characterId}`);
      } else {
        setError(result.error || "캐릭터 생성에 실패했습니다");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("캐릭터 생성 중 오류가 발생했습니다");
    }
  }, [prepareSubmitData, navigate]);

  // Handle save draft
  const handleSaveDraft = useCallback(async () => {
    // Validate minimum requirement (name)
    if (!formData.name.trim()) {
      setError("임시저장하려면 캐릭터 이름이 필요합니다");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    dispatch({ type: "SET_SAVING_DRAFT", payload: true });

    try {
      const response = await fetch("/characters/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prepareSubmitData(true)),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(result.message || "임시저장되었습니다");
        dispatch({ type: "SET_CHARACTER_ID", payload: result.characterId });
        // Optionally navigate to edit page
        // navigate(`/characters/${result.characterId}/edit`);
      } else {
        setError(result.error || "임시저장에 실패했습니다");
      }
    } catch (err) {
      console.error("Save draft error:", err);
      setError("임시저장 중 오류가 발생했습니다");
    } finally {
      dispatch({ type: "SET_SAVING_DRAFT", payload: false });
    }
  }, [formData.name, prepareSubmitData, dispatch]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      if (confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [state.isDirty, navigate]);

  const displayError =
    error || (actionData && "error" in actionData ? actionData.error : null);

  return (
    <>
      {displayError && (
        <div className="fixed left-0 right-0 top-4 z-50 mx-auto max-w-md px-4">
          <Alert variant="destructive" className="border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-400">
              {displayError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {successMessage && (
        <div className="fixed left-0 right-0 top-4 z-50 mx-auto max-w-md px-4">
          <Alert className="border-green-500 bg-green-500/10">
            <AlertDescription className="text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <CharacterWizard
        isSubmitting={isSubmitting || state.isSavingDraft}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={handleCancel}
      />
    </>
  );
}

/**
 * Main Component
 */
export default function CharacterCreate() {
  return (
    <WizardProvider>
      <CharacterCreateInner />
    </WizardProvider>
  );
}
