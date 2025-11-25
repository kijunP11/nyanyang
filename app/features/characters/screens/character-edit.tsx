/**
 * Character Edit Screen
 *
 * Edit existing character with image upload, keywords, and safety filters
 */
import type { Route } from "./+types/character-edit";

import {
  Form,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";

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

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 편집 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

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
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const characterId = params.characterId;
  const formData = await request.formData();
  const actionType = formData.get("_action") as string;

  try {
    // Update basic info
    if (actionType === "update_basic") {
      const response = await fetch(
        `${process.env.SITE_URL || "http://localhost:5173"}/api/characters/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            character_id: Number(characterId),
            name: formData.get("name"),
            display_name: formData.get("display_name"),
            description: formData.get("description"),
            personality: formData.get("personality"),
            system_prompt: formData.get("system_prompt"),
            greeting_message: formData.get("greeting_message"),
            tags: (formData.get("tags") as string)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            is_public: formData.get("is_public") === "on",
            is_nsfw: formData.get("is_nsfw") === "on",
          }),
        },
      );

      const result = await response.json();
      return result.success
        ? { success: "캐릭터 정보가 업데이트되었습니다" }
        : { error: result.error };
    }

    // Add keyword
    if (actionType === "add_keyword") {
      const response = await fetch(
        `${process.env.SITE_URL || "http://localhost:5173"}/api/characters/keywords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            action: "add",
            character_id: Number(characterId),
            keyword: formData.get("keyword"),
            description: formData.get("keyword_description"),
            response_template: formData.get("response_template"),
            priority: parseInt(formData.get("priority") as string) || 0,
          }),
        },
      );

      const result = await response.json();
      return result.success
        ? { success: "키워드가 추가되었습니다" }
        : { error: result.error };
    }

    // Delete keyword
    if (actionType === "delete_keyword") {
      const keywordId = formData.get("keyword_id");
      const response = await fetch(
        `${process.env.SITE_URL || "http://localhost:5173"}/api/characters/keywords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            action: "delete",
            keyword_id: Number(keywordId),
          }),
        },
      );

      const result = await response.json();
      return result.success
        ? { success: "키워드가 삭제되었습니다" }
        : { error: result.error };
    }

    // Update safety filter
    if (actionType === "update_safety") {
      const response = await fetch(
        `${process.env.SITE_URL || "http://localhost:5173"}/api/characters/safety-filter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({
            character_id: Number(characterId),
            block_nsfw: formData.get("block_nsfw") === "on",
            block_violence: formData.get("block_violence") === "on",
            block_hate_speech: formData.get("block_hate_speech") === "on",
            block_personal_info: formData.get("block_personal_info") === "on",
            blocked_words: (formData.get("blocked_words") as string)
              .split(",")
              .map((w) => w.trim())
              .filter(Boolean),
            sensitivity_level:
              parseInt(formData.get("sensitivity_level") as string) || 5,
          }),
        },
      );

      const result = await response.json();
      return result.success
        ? { success: "안전 필터가 업데이트되었습니다" }
        : { error: result.error };
    }

    return { error: "알 수 없는 작업입니다" };
  } catch (error) {
    console.error("Character edit error:", error);
    return { error: "작업 중 오류가 발생했습니다" };
  }
}

export default function CharacterEdit({ loaderData }: Route.ComponentProps) {
  const { character } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // tags가 JSON 배열일 수 있으므로 처리
  const tagsArray = Array.isArray(character.tags)
    ? character.tags
    : typeof character.tags === "string"
      ? JSON.parse(character.tags)
      : [];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{character.name} 편집</h1>
          <p className="text-muted-foreground mt-2">
            캐릭터 정보를 수정하고 관리하세요
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          돌아가기
        </Button>
      </div>

      {actionData?.success && (
        <Alert className="mb-6">
          <AlertDescription>{actionData.success}</AlertDescription>
        </Alert>
      )}

      {actionData?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="keywords">키워드북</TabsTrigger>
          <TabsTrigger value="safety">안전 필터</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Form method="post">
            <input type="hidden" name="_action" value="update_basic" />
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">캐릭터 이름</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={character.name}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="display_name">표시 이름</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      defaultValue={character.display_name || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={character.description || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="greeting_message">인사말</Label>
                    <Textarea
                      id="greeting_message"
                      name="greeting_message"
                      rows={2}
                      defaultValue={character.greeting_message || ""}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>성격 및 AI 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="personality">성격</Label>
                    <Textarea
                      id="personality"
                      name="personality"
                      rows={3}
                      defaultValue={character.personality || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="system_prompt">시스템 프롬프트</Label>
                    <Textarea
                      id="system_prompt"
                      name="system_prompt"
                      rows={5}
                      defaultValue={character.system_prompt || ""}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>태그 및 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tags">태그</Label>
                    <Input
                      id="tags"
                      name="tags"
                      defaultValue={tagsArray.join(", ")}
                      placeholder="쉼표로 구분"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      name="is_public"
                      defaultChecked={character.is_public}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_public" className="cursor-pointer">
                      공개 캐릭터
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_nsfw"
                      name="is_nsfw"
                      defaultChecked={character.is_nsfw}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_nsfw" className="cursor-pointer">
                      NSFW 콘텐츠
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </Form>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <div className="space-y-6">
            {/* Existing Keywords */}
            {character.keywords && character.keywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>등록된 키워드</CardTitle>
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
                        className="flex items-start justify-between p-3 border rounded"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge>{kw.keyword}</Badge>
                            <span className="text-xs text-muted-foreground">
                              우선순위: {kw.priority}
                            </span>
                          </div>
                          {kw.description && (
                            <p className="text-sm text-muted-foreground">
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
                          >
                            삭제
                          </Button>
                        </Form>
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add Keyword Form */}
            <Card>
              <CardHeader>
                <CardTitle>새 키워드 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="add_keyword" />

                  <div>
                    <Label htmlFor="keyword">키워드</Label>
                    <Input
                      id="keyword"
                      name="keyword"
                      required
                      placeholder="예: 밥"
                    />
                  </div>

                  <div>
                    <Label htmlFor="keyword_description">설명</Label>
                    <Input
                      id="keyword_description"
                      name="keyword_description"
                      placeholder="이 키워드에 대한 설명"
                    />
                  </div>

                  <div>
                    <Label htmlFor="response_template">
                      응답 템플릿 (선택)
                    </Label>
                    <Textarea
                      id="response_template"
                      name="response_template"
                      rows={2}
                      placeholder='예: *배고픈 듯 쳐다본다* "밥 먹고 싶어..."'
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">우선순위</Label>
                    <Input
                      id="priority"
                      name="priority"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={100}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      높을수록 우선 적용됩니다
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
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
            <Card>
              <CardHeader>
                <CardTitle>안전 필터 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="block_nsfw"
                      name="block_nsfw"
                      defaultChecked={character.safetyFilter?.block_nsfw ?? true}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="block_nsfw" className="cursor-pointer">
                      NSFW 콘텐츠 차단
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="block_violence"
                      name="block_violence"
                      defaultChecked={
                        character.safetyFilter?.block_violence ?? true
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="block_violence" className="cursor-pointer">
                      폭력적 콘텐츠 차단
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="block_hate_speech"
                      name="block_hate_speech"
                      defaultChecked={
                        character.safetyFilter?.block_hate_speech ?? true
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="block_hate_speech"
                      className="cursor-pointer"
                    >
                      혐오 발언 차단
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="block_personal_info"
                      name="block_personal_info"
                      defaultChecked={
                        character.safetyFilter?.block_personal_info ?? true
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="block_personal_info"
                      className="cursor-pointer"
                    >
                      개인정보 차단
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="blocked_words">차단 단어</Label>
                  <Input
                    id="blocked_words"
                    name="blocked_words"
                    defaultValue={
                      character.safetyFilter?.blocked_words?.join(", ") || ""
                    }
                    placeholder="쉼표로 구분"
                  />
                </div>

                <div>
                  <Label htmlFor="sensitivity_level">민감도 레벨 (1-10)</Label>
                  <Input
                    id="sensitivity_level"
                    name="sensitivity_level"
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={
                      character.safetyFilter?.sensitivity_level || 5
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    높을수록 더 엄격하게 필터링합니다
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
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
