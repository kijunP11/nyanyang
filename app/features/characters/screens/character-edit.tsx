/**
 * Character Edit Screen
 *
 * Hybrid mode: Wizard for character info + Tabs for keywords/safety filters
 */
import type { Route } from "./+types/character-edit";

import { useCallback, useState } from "react";
import {
  data,
  redirect,
  useActionData,
  useNavigation,
  useNavigate,
  Form,
} from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Alert, AlertDescription } from "~/core/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/core/components/ui/tabs";
import { Badge } from "~/core/components/ui/badge";
import { WizardProvider, useWizard } from "../lib/wizard-context";
import type { CharacterFormData, ExampleDialogue } from "../lib/wizard-types";
import { CharacterWizard } from "../components/wizard";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 편집 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

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
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return null;

    const [, mimeType, dataContent] = matches;
    const buffer = Buffer.from(dataContent, "base64");

    if (buffer.length > MAX_FILE_SIZE) {
      console.warn(`File size exceeds limit for ${mediaType}`);
      return null;
    }

    const extension = mimeType.split("/")[1] || "png";
    const uniqueFileName = `${characterId}/${mediaType}/${Date.now()}.${extension}`;

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
 * Validation Schema for wizard update
 */
const updateWizardSchema = z.object({
  _action: z.literal("update_wizard"),
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

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const characterId = params.characterId;

  if (!characterId) {
    throw new Response("Character ID required", { status: 400 });
  }

  // 캐릭터 정보 조회
  const { data: character, error } = await client
    .from("characters")
    .select("*")
    .eq("character_id", Number(characterId))
    .single();

  if (error || !character) {
    throw new Response("Character not found", { status: 404 });
  }

  if (character.creator_id !== user.id) {
    throw new Response("Unauthorized", { status: 403 });
  }

  // 키워드 조회
  const { data: keywords } = await client
    .from("character_keywords")
    .select("*")
    .eq("character_id", Number(characterId))
    .order("priority", { ascending: false });

  // 안전 필터 조회
  const { data: safetyFilter } = await client
    .from("character_safety_filters")
    .select("*")
    .eq("character_id", Number(characterId))
    .single();

  return {
    character: {
      ...character,
      keywords: keywords || [],
      safetyFilter: safetyFilter || null,
    },
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login", { headers });
  }

  const characterId = params.characterId;
  if (!characterId) {
    return { error: "Character ID required" };
  }

  // Check if JSON or FormData
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  try {
    if (isJson) {
      // Wizard update (JSON)
      const formData = await request.json();
      const actionType = formData._action;

      if (actionType !== "update_wizard") {
        // JSON인데 update_wizard가 아닌 경우 에러 (body 이중 소비 방지)
        return data({ error: "알 수 없는 JSON 작업입니다" }, { headers });
      }

      const result = updateWizardSchema.safeParse(formData);

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

      // Handle base64 images
      const avatarBase64 = isBase64DataUrl(validData.avatar_url)
        ? validData.avatar_url
        : null;
      const bannerBase64 = isBase64DataUrl(validData.banner_url)
        ? validData.banner_url
        : null;

      // Upload new images if base64
      let finalAvatarUrl = avatarBase64 ? null : validData.avatar_url;
      let finalBannerUrl = bannerBase64 ? null : validData.banner_url;

      if (avatarBase64) {
        const uploadedUrl = await uploadImageToStorage(
          client,
          Number(characterId),
          "avatar",
          avatarBase64
        );
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      if (bannerBase64) {
        const uploadedUrl = await uploadImageToStorage(
          client,
          Number(characterId),
          "banner",
          bannerBase64
        );
        if (uploadedUrl) finalBannerUrl = uploadedUrl;
      }

      const { error } = await client
        .from("characters")
        .update({
          name: validData.name,
          display_name: validData.display_name || validData.name,
          tagline: validData.tagline,
          description: validData.description,
          role: validData.role,
          appearance: validData.appearance,
          personality: validData.personality,
          speech_style: validData.speech_style,
          system_prompt: validData.system_prompt,
          greeting_message: validData.greeting_message,
          relationship: validData.relationship,
          world_setting: validData.world_setting,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl,
          tags: validData.tags,
          category: validData.category,
          gender: validData.gender,
          age_rating: validData.age_rating,
          is_public: validData.is_public,
          is_nsfw: validData.is_nsfw,
          enable_memory: validData.enable_memory,
          example_dialogues: validData.example_dialogues,
          updated_at: new Date().toISOString(),
        })
        .eq("character_id", Number(characterId))
        .eq("creator_id", user.id);

      if (error) throw error;

      return data({ success: "캐릭터 정보가 업데이트되었습니다" }, { headers });
    }

    // Form-based actions (keywords, safety filters)
    const formData = await request.formData();
    const actionType = formData.get("_action") as string;

    // Add keyword
    if (actionType === "add_keyword") {
      const keyword = formData.get("keyword") as string;
      const description = formData.get("keyword_description") as string;
      const response_template = formData.get("response_template") as string;
      const priority = parseInt(formData.get("priority") as string) || 0;

      const { error } = await client.from("character_keywords").insert({
        character_id: Number(characterId),
        keyword,
        description: description || null,
        response_template: response_template || null,
        priority,
      });

      if (error) throw error;

      return data({ success: "키워드가 추가되었습니다" }, { headers });
    }

    // Delete keyword
    if (actionType === "delete_keyword") {
      const keywordId = formData.get("keyword_id");

      const { error } = await client
        .from("character_keywords")
        .delete()
        .eq("keyword_id", Number(keywordId))
        .eq("character_id", Number(characterId));

      if (error) throw error;

      return data({ success: "키워드가 삭제되었습니다" }, { headers });
    }

    // Update safety filter
    if (actionType === "update_safety") {
      const block_nsfw = formData.get("block_nsfw") === "on";
      const block_violence = formData.get("block_violence") === "on";
      const block_hate_speech = formData.get("block_hate_speech") === "on";
      const block_personal_info = formData.get("block_personal_info") === "on";
      const sensitivity_level =
        parseInt(formData.get("sensitivity_level") as string) || 5;

      const blocked_words = (formData.get("blocked_words") as string)
        ? (formData.get("blocked_words") as string)
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean)
        : [];

      const { data: existing } = await client
        .from("character_safety_filters")
        .select("filter_id")
        .eq("character_id", Number(characterId))
        .single();

      let error;
      if (existing) {
        const { error: updateError } = await client
          .from("character_safety_filters")
          .update({
            block_nsfw,
            block_violence,
            block_hate_speech,
            block_personal_info,
            blocked_words,
            sensitivity_level,
          })
          .eq("character_id", Number(characterId));
        error = updateError;
      } else {
        const { error: insertError } = await client
          .from("character_safety_filters")
          .insert({
            character_id: Number(characterId),
            block_nsfw,
            block_violence,
            block_hate_speech,
            block_personal_info,
            blocked_words,
            sensitivity_level,
          });
        error = insertError;
      }

      if (error) throw error;

      return data({ success: "안전 필터가 업데이트되었습니다" }, { headers });
    }

    return data({ error: "알 수 없는 작업입니다" }, { headers });
  } catch (error: unknown) {
    console.error("Character edit error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return data(
      { error: `작업 중 오류가 발생했습니다: ${errorMessage}` },
      { headers }
    );
  }
}

/**
 * Convert loader character data to wizard form data
 */
function characterToFormData(character: Record<string, unknown>): Partial<CharacterFormData> {
  const exampleDialogues: ExampleDialogue[] = [];

  // Parse example_dialogues if it exists
  if (character.example_dialogues) {
    const dialogues = Array.isArray(character.example_dialogues)
      ? character.example_dialogues
      : [];
    dialogues.forEach(
      (d: { user?: string; character?: string }, index: number) => {
        exampleDialogues.push({
          id: `loaded-${index}`,
          user: d.user || "",
          character: d.character || "",
        });
      }
    );
  }

  return {
    name: (character.name as string) || "",
    display_name: (character.display_name as string) || "",
    tagline: (character.tagline as string) || "",
    description: (character.description as string) || "",
    avatar_url: (character.avatar_url as string) || null,
    banner_url: (character.banner_url as string) || null,
    role: (character.role as string) || "",
    appearance: (character.appearance as string) || "",
    personality: (character.personality as string) || "",
    speech_style: (character.speech_style as string) || "",
    example_dialogues: exampleDialogues,
    greeting_message: (character.greeting_message as string) || "",
    relationship: (character.relationship as string) || "",
    world_setting: (character.world_setting as string) || "",
    system_prompt: (character.system_prompt as string) || "",
    enable_memory: (character.enable_memory as boolean) ?? true,
    gender: (character.gender as string) || "",
    age_rating: (character.age_rating as string) || "everyone",
    tags: Array.isArray(character.tags) ? character.tags : [],
    category: (character.category as string) || "",
    is_public: (character.is_public as boolean) ?? false,
    is_nsfw: (character.is_nsfw as boolean) ?? false,
  };
}

/**
 * Wizard Tab Inner Component
 */
function WizardTabContent({ characterId }: { characterId: number }) {
  const { state } = useWizard();
  const { formData } = state;
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/characters/${characterId}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _action: "update_wizard",
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
      });

      const result = await response.json();

      if (result.success) {
        navigate(`/characters/${characterId}`);
      } else {
        setError(result.error || "업데이트에 실패했습니다");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("업데이트 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, characterId, navigate]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6 border-red-500 bg-red-500/10">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}
      <CharacterWizard
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
}

export default function CharacterEdit({ loaderData }: Route.ComponentProps) {
  const { character } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const initialFormData = characterToFormData(character);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{character.name} 편집</h1>
          <p className="mt-2 text-gray-500 dark:text-[#9ca3af]">
            캐릭터 정보를 수정하고 관리하세요
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-[#3f3f46] dark:text-white dark:hover:bg-[#3f3f46]"
        >
          돌아가기
        </Button>
      </div>

      {actionData && "success" in actionData && actionData.success && (
        <Alert className="mb-6 border-green-500 bg-green-500/10">
          <AlertDescription className="text-green-400">
            {actionData.success}
          </AlertDescription>
        </Alert>
      )}

      {actionData && "error" in actionData && actionData.error && (
        <Alert variant="destructive" className="mb-6 border-red-500 bg-red-500/10">
          <AlertDescription className="text-red-400">
            {actionData.error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-[#232323]">
          <TabsTrigger
            value="info"
            className="text-gray-700 data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white dark:text-gray-300"
          >
            캐릭터 정보
          </TabsTrigger>
          <TabsTrigger
            value="keywords"
            className="text-gray-700 data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white dark:text-gray-300"
          >
            키워드북
          </TabsTrigger>
          <TabsTrigger
            value="safety"
            className="text-gray-700 data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white dark:text-gray-300"
          >
            안전 필터
          </TabsTrigger>
        </TabsList>

        {/* Character Info Tab - Wizard Mode */}
        <TabsContent value="info">
          <WizardProvider
            initialData={initialFormData}
            characterId={character.character_id}
          >
            <WizardTabContent characterId={character.character_id} />
          </WizardProvider>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <div className="space-y-6">
            {/* Existing Keywords */}
            {character.keywords && character.keywords.length > 0 && (
              <Card className="border-gray-200 bg-gray-50 dark:border-[#3f3f46] dark:bg-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">등록된 키워드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {character.keywords.map(
                    (kw: {
                      keyword_id: number;
                      keyword: string;
                      priority: number;
                      description: string | null;
                    }) => (
                      <div
                        key={kw.keyword_id}
                        className="flex items-start justify-between rounded border border-gray-200 bg-white p-3 dark:border-[#3f3f46] dark:bg-[#232323]"
                      >
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge className="bg-[#14b8a6]/20 text-[#14b8a6]">
                              {kw.keyword}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-[#6b7280]">
                              우선순위: {kw.priority}
                            </span>
                          </div>
                          {kw.description && (
                            <p className="text-sm text-gray-500 dark:text-[#9ca3af]">
                              {kw.description}
                            </p>
                          )}
                        </div>
                        <Form method="post">
                          <input
                            type="hidden"
                            name="_action"
                            value="delete_keyword"
                          />
                          <input
                            type="hidden"
                            name="keyword_id"
                            value={kw.keyword_id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            className="text-gray-600 hover:bg-gray-200 hover:text-red-500 dark:text-[#9ca3af] dark:hover:bg-[#3f3f46] dark:hover:text-red-400"
                          >
                            삭제
                          </Button>
                        </Form>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add Keyword Form */}
            <Card className="border-gray-200 bg-gray-50 dark:border-[#3f3f46] dark:bg-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">새 키워드 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_keyword" />

                  <div>
                    <Label htmlFor="keyword" className="text-gray-900 dark:text-white">
                      키워드
                    </Label>
                    <Input
                      id="keyword"
                      name="keyword"
                      required
                      placeholder="예: 밥"
                      className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:border-[#14b8a6]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="keyword_description" className="text-gray-900 dark:text-white">
                      설명
                    </Label>
                    <Input
                      id="keyword_description"
                      name="keyword_description"
                      placeholder="이 키워드에 대한 설명"
                      className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:border-[#14b8a6]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="response_template" className="text-gray-900 dark:text-white">
                      응답 템플릿 (선택)
                    </Label>
                    <Textarea
                      id="response_template"
                      name="response_template"
                      rows={2}
                      placeholder='예: *배고픈 듯 쳐다본다* "밥 먹고 싶어..."'
                      className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:border-[#14b8a6]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-gray-900 dark:text-white">
                      우선순위
                    </Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={100}
                      className="border-gray-300 bg-white text-gray-900 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:focus:border-[#14b8a6]"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-[#6b7280]">
                      높을수록 우선 적용됩니다
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                  >
                    {isSubmitting ? "추가 중..." : "키워드 추가"}
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Safety Filter Tab */}
        <TabsContent value="safety">
          <Form method="post">
            <input type="hidden" name="_action" value="update_safety" />
            <Card className="border-gray-200 bg-gray-50 dark:border-[#3f3f46] dark:bg-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">안전 필터 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
                    <input
                      type="checkbox"
                      id="block_nsfw"
                      name="block_nsfw"
                      defaultChecked={character.safetyFilter?.block_nsfw ?? true}
                      className="h-4 w-4 accent-[#14b8a6]"
                    />
                    <span className="text-gray-900 dark:text-white">NSFW 콘텐츠 차단</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
                    <input
                      type="checkbox"
                      id="block_violence"
                      name="block_violence"
                      defaultChecked={
                        character.safetyFilter?.block_violence ?? true
                      }
                      className="h-4 w-4 accent-[#14b8a6]"
                    />
                    <span className="text-gray-900 dark:text-white">폭력적 콘텐츠 차단</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
                    <input
                      type="checkbox"
                      id="block_hate_speech"
                      name="block_hate_speech"
                      defaultChecked={
                        character.safetyFilter?.block_hate_speech ?? true
                      }
                      className="h-4 w-4 accent-[#14b8a6]"
                    />
                    <span className="text-gray-900 dark:text-white">혐오 발언 차단</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#232323]">
                    <input
                      type="checkbox"
                      id="block_personal_info"
                      name="block_personal_info"
                      defaultChecked={
                        character.safetyFilter?.block_personal_info ?? true
                      }
                      className="h-4 w-4 accent-[#14b8a6]"
                    />
                    <span className="text-gray-900 dark:text-white">개인정보 차단</span>
                  </label>
                </div>

                <div>
                  <Label htmlFor="blocked_words" className="text-gray-900 dark:text-white">
                    차단 단어
                  </Label>
                  <Input
                    id="blocked_words"
                    name="blocked_words"
                    defaultValue={
                      character.safetyFilter?.blocked_words?.join(", ") || ""
                    }
                    placeholder="쉼표로 구분"
                    className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:border-[#14b8a6]"
                  />
                </div>

                <div>
                  <Label htmlFor="sensitivity_level" className="text-gray-900 dark:text-white">
                    민감도 레벨 (1-10)
                  </Label>
                  <Input
                    id="sensitivity_level"
                    name="sensitivity_level"
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={character.safetyFilter?.sensitivity_level || 5}
                    className="border-gray-300 bg-white text-gray-900 focus:border-[#14b8a6] dark:border-[#3f3f46] dark:bg-[#232323] dark:text-white dark:focus:border-[#14b8a6]"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-[#6b7280]">
                    높을수록 더 엄격하게 필터링합니다
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-[#14b8a6] text-white hover:bg-[#0d9488]"
                >
                  {isSubmitting ? "저장 중..." : "필터 설정 저장"}
                </Button>
              </CardContent>
            </Card>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
