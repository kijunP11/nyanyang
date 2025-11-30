/**
 * Character Create Screen
 *
 * Form for creating a new character
 */
import type { Route } from "./+types/character-create";

import { useState } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router";

import { Alert, AlertDescription } from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
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
import makeServerClient from "~/core/lib/supa-client.server";

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
  const display_name = (formData.get("display_name") as string) || name;
  const tagline = (formData.get("tagline") as string) || null;
  const description = formData.get("description") as string;
  const role = (formData.get("role") as string) || null;
  const appearance = (formData.get("appearance") as string) || null;
  const personality = formData.get("personality") as string;
  const speech_style = (formData.get("speech_style") as string) || null;
  const system_prompt = formData.get("system_prompt") as string;
  const greeting_message = formData.get("greeting_message") as string;
  const relationship = (formData.get("relationship") as string) || null;
  const world_setting = (formData.get("world_setting") as string) || null;
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
          tagline,
          description,
          role,
          appearance,
          personality,
          speech_style,
          system_prompt,
          greeting_message,
          relationship,
          world_setting,
          tags,
          is_public,
          is_nsfw,
          category: null,
          age_rating: "everyone",
          enable_memory: true,
          example_dialogues: null,
          avatar_url: null,
          banner_url: null,
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
  const [role, setRole] = useState<string>("");

  return (
    <div className="container mx-auto max-w-3xl py-8">
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
                <Label htmlFor="tagline">한 줄 소개</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  maxLength={50}
                  placeholder="예: 친근한 대학 선배"
                />
                <p className="text-muted-foreground mt-1 text-sm">
                  캐릭터를 한 문장으로 표현해주세요
                </p>
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
                <Label htmlFor="greeting_message">첫 인사말 *</Label>
                <Textarea
                  id="greeting_message"
                  name="greeting_message"
                  required
                  rows={2}
                  placeholder="예: 안녕! 만나서 반가워!"
                />
              </div>

              <div>
                <Label htmlFor="relationship">나와의 관계 (선택)</Label>
                <Input
                  id="relationship"
                  name="relationship"
                  placeholder="예: 10년지기 친구, 처음 만난 선배"
                />
              </div>

              <div>
                <Label htmlFor="world_setting">세계관 (선택)</Label>
                <Textarea
                  id="world_setting"
                  name="world_setting"
                  rows={2}
                  placeholder="예: 현대 도시, 대학 캠퍼스"
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
                <Label htmlFor="role">역할</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friend">친구</SelectItem>
                    <SelectItem value="teacher">선생님</SelectItem>
                    <SelectItem value="lover">연인</SelectItem>
                    <SelectItem value="mentor">멘토</SelectItem>
                    <SelectItem value="companion">동반자</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="role" value={role} />
              </div>

              <div>
                <Label htmlFor="appearance">외모 (선택)</Label>
                <Textarea
                  id="appearance"
                  name="appearance"
                  rows={2}
                  placeholder="예: 짧은 머리, 안경, 캐주얼한 복장"
                />
              </div>

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
                <Label htmlFor="speech_style">말투 (선택)</Label>
                <Input
                  id="speech_style"
                  name="speech_style"
                  placeholder="예: 반말, 친근한 톤"
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
                <p className="text-muted-foreground mt-1 text-sm">
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
                <p className="text-muted-foreground mt-1 text-sm">
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
