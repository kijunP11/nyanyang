/**
 * Character Create Screen
 *
 * Form for creating a new character
 */
import type { Route } from "./+types/character-create";

import { Form, redirect, useActionData, useNavigation } from "react-router";

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

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 만들기 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

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

export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();

  const name = formData.get("name") as string;
  const display_name = formData.get("display_name") as string || name;
  const description = formData.get("description") as string;
  const personality = formData.get("personality") as string;
  const system_prompt = formData.get("system_prompt") as string;
  const greeting_message = formData.get("greeting_message") as string;
  const tags = (formData.get("tags") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const is_public = formData.get("is_public") === "on";
  const is_nsfw = formData.get("is_nsfw") === "on";

  try {
    const response = await fetch(
      `${process.env.SITE_URL || "http://localhost:5173"}/api/characters/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("Cookie") || "",
        },
        body: JSON.stringify({
          name,
          display_name,
          description,
          personality,
          system_prompt,
          greeting_message,
          tags,
          is_public,
          is_nsfw,
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      return redirect(`/characters/${result.character.character_id}/edit`);
    }

    return { error: result.error || "캐릭터 생성에 실패했습니다" };
  } catch (error) {
    console.error("Character create error:", error);
    return { error: "캐릭터 생성 중 오류가 발생했습니다" };
  }
}

export default function CharacterCreate() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">캐릭터 만들기</h1>
        <p className="text-muted-foreground mt-2">
          새로운 캐릭터를 만들어보세요
        </p>
      </div>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      <Form method="post">
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">캐릭터 이름 *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={50}
                  placeholder="예: 냐냥이"
                />
              </div>

              <div>
                <Label htmlFor="display_name">표시 이름</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  maxLength={50}
                  placeholder="화면에 표시될 이름 (비워두면 캐릭터 이름 사용)"
                />
              </div>

              <div>
                <Label htmlFor="description">설명 *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  placeholder="캐릭터에 대한 간단한 설명을 작성해주세요"
                />
              </div>

              <div>
                <Label htmlFor="greeting_message">인사말 *</Label>
                <Textarea
                  id="greeting_message"
                  name="greeting_message"
                  required
                  rows={2}
                  placeholder="예: 안녕! 만나서 반가워!"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personality */}
          <Card>
            <CardHeader>
              <CardTitle>성격 및 AI 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="personality">성격 *</Label>
                <Textarea
                  id="personality"
                  name="personality"
                  required
                  rows={3}
                  placeholder="캐릭터의 성격을 자세히 설명해주세요"
                />
              </div>

              <div>
                <Label htmlFor="system_prompt">시스템 프롬프트 *</Label>
                <Textarea
                  id="system_prompt"
                  name="system_prompt"
                  required
                  rows={5}
                  placeholder="AI가 이 캐릭터를 연기할 때 따를 지침을 작성해주세요"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  캐릭터의 말투, 행동 방식, 배경 설정 등을 상세히 작성해주세요
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags and Settings */}
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
                  placeholder="예: 고양이, 귀여움, 판타지 (쉼표로 구분)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  쉼표(,)로 구분하여 여러 개 입력
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  className="h-4 w-4"
                />
                <Label htmlFor="is_public" className="cursor-pointer">
                  공개 캐릭터 (다른 사용자도 볼 수 있습니다)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_nsfw"
                  name="is_nsfw"
                  className="h-4 w-4"
                />
                <Label htmlFor="is_nsfw" className="cursor-pointer">
                  NSFW (성인 콘텐츠 포함)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "생성 중..." : "캐릭터 만들기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
            >
              취소
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
