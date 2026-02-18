/**
 * F4-3-2 이미지 생성 API
 * OpenAI DALL-E 3 호출 + 젤리(포인트) 차감
 */
import type { Route } from "./+types/generate";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { userPoints, pointTransactions } from "~/features/points/schema";

import {
  JELLY_COST_PER_IMAGE,
  ASPECT_RATIOS,
  GENRES,
} from "../lib/constants";

const bodySchema = z.object({
  prompt: z.string().min(1, "프롬프트를 입력해주세요"),
  genre: z.string().nullable().optional(),
  aspectRatio: z.string().optional().default("1:1"),
  imageCount: z.number().int().min(1).max(4).optional().default(1),
  // 기존 캐릭터 수정 탭
  characterId: z.number().int().positive().optional(),
  characterAppearance: z.string().nullable().optional(),
  characterName: z.string().optional(),
});

/** DALL-E 3 지원 크기만 사용 */
const DALL_E_3_SIZES = ["1024x1024", "1792x1024", "1024x1792"] as const;

function toDallESize(
  width: number,
  height: number
): (typeof DALL_E_3_SIZES)[number] {
  if (width === 1024 && height === 1024) return "1024x1024";
  if (width >= height) return "1792x1024";
  return "1024x1792";
}

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const body = await request.json();
    parsed = bodySchema.parse(body);
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.errors[0]?.message ?? "Invalid request"
        : "Invalid request";
    return data({ error: msg }, { status: 400, headers });
  }

  const {
    prompt,
    genre,
    aspectRatio,
    imageCount,
    characterId,
    characterAppearance,
    characterName,
  } = parsed;
  const totalCost = imageCount * JELLY_COST_PER_IMAGE;

  const db = drizzle;

  const [pointRecord] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.user_id, user.id));

  if (!pointRecord) {
    return data(
      { error: "포인트 정보를 찾을 수 없습니다" },
      { status: 400, headers }
    );
  }

  if (pointRecord.current_balance < totalCost) {
    return data(
      {
        error: "젤리가 부족합니다",
        required: totalCost,
        balance: pointRecord.current_balance,
      },
      { status: 400, headers }
    );
  }

  const ratioConfig =
    ASPECT_RATIOS.find((r) => r.id === aspectRatio) ?? ASPECT_RATIOS[0];
  const size = toDallESize(ratioConfig.width, ratioConfig.height);

  const genreLabel = genre
    ? GENRES.find((g) => g.id === genre)?.label ?? genre
    : "";
  const fullPrompt =
    characterId != null && (characterName ?? characterAppearance)
      ? `Anime character "${characterName ?? "character"}". Appearance: ${characterAppearance ?? "not specified"}. Modify as requested: ${prompt}. Keep the same character design, only apply the requested change.`
      : genreLabel.length > 0
        ? `${genreLabel} genre anime character: ${prompt}`
        : `anime character: ${prompt}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return data(
      { error: "이미지 생성 서비스가 설정되지 않았습니다" },
      { status: 503, headers }
    );
  }

  const images: string[] = [];

  try {
    for (let i = 0; i < imageCount; i++) {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: fullPrompt,
          n: 1,
          size,
          response_format: "b64_json",
          quality: "standard",
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("OpenAI image API error:", res.status, errBody);
        return data(
          { error: "이미지 생성에 실패했습니다. 다시 시도해주세요." },
          { status: 500, headers }
        );
      }

      const json = (await res.json()) as {
        data?: Array<{ b64_json?: string }>;
      };
      const b64 = json.data?.[0]?.b64_json;
      if (b64) images.push(b64);
    }
  } catch (err) {
    console.error("Image generation error:", err);
    return data(
      { error: "이미지 생성에 실패했습니다. 다시 시도해주세요." },
      { status: 500, headers }
    );
  }

  const newBalance = pointRecord.current_balance - totalCost;
  const newTotalSpent = pointRecord.total_spent + totalCost;

  await db
    .update(userPoints)
    .set({
      current_balance: newBalance,
      total_spent: newTotalSpent,
      updated_at: new Date(),
    })
    .where(eq(userPoints.user_id, user.id));

  await db.insert(pointTransactions).values({
    user_id: user.id,
    amount: -totalCost,
    balance_after: newBalance,
    type: "usage",
    reason: `이미지 생성 (${imageCount}장)`,
    reference_id: `img_gen_${Date.now()}`,
  });

  return data(
    {
      images,
      cost: totalCost,
      remainingBalance: newBalance,
    },
    { headers }
  );
}
