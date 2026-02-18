/**
 * Room Settings API
 * GET: 룸 설정 로드 (없으면 기본값)
 * POST: 설정 upsert, 선택 시 세션명(title) 업데이트
 */
import { data } from "react-router";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import drizzle from "~/core/db/drizzle-client.server";
import { chatRooms, chatRoomSettings } from "../schema";

const DEFAULT_SETTINGS = {
  font_size: 16,
  background_image_url: null as string | null,
  background_enabled: true,
  character_nickname: null as string | null,
  multi_image: false,
  response_length: 2000,
  positivity_bias: false,
  anti_impersonation: true,
  realtime_output: true,
};

export async function loader({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const roomId = parseInt(url.searchParams.get("room_id") || "0", 10);
  if (!roomId) {
    return data({ error: "room_id required" }, { status: 400, headers });
  }

  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(
      and(eq(chatRooms.room_id, roomId), eq(chatRooms.user_id, user.id))
    )
    .limit(1);

  if (!room) {
    return data({ error: "Room not found" }, { status: 404, headers });
  }

  const [settings] = await drizzle
    .select()
    .from(chatRoomSettings)
    .where(
      and(
        eq(chatRoomSettings.room_id, roomId),
        eq(chatRoomSettings.user_id, user.id)
      )
    )
    .limit(1);

  const payload = settings
    ? {
        font_size: settings.font_size,
        background_image_url: settings.background_image_url,
        background_enabled: settings.background_enabled,
        character_nickname: settings.character_nickname,
        multi_image: settings.multi_image,
        response_length: settings.response_length,
        positivity_bias: settings.positivity_bias,
        anti_impersonation: settings.anti_impersonation,
        realtime_output: settings.realtime_output,
      }
    : { ...DEFAULT_SETTINGS, room_id: roomId };

  return data({ settings: payload }, { headers });
}

const updateSchema = z.object({
  room_id: z.number(),
  title: z.string().min(1).max(500).optional(),
  font_size: z.number().min(12).max(24).optional(),
  background_image_url: z.string().nullable().optional(),
  background_enabled: z.union([z.boolean(), z.number().min(0).max(1)]).optional(),
  character_nickname: z.string().nullable().optional(),
  multi_image: z.union([z.boolean(), z.number().min(0).max(1)]).optional(),
  response_length: z.number().min(500).max(8000).optional(),
  positivity_bias: z.union([z.boolean(), z.number().min(0).max(1)]).optional(),
  anti_impersonation: z
    .union([z.boolean(), z.number().min(0).max(1)])
    .optional(),
  realtime_output: z.union([z.boolean(), z.number().min(0).max(1)]).optional(),
});

function toBool(v: boolean | number): boolean {
  return typeof v === "number" ? v === 1 : v;
}

export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await request.json());
  } catch {
    return data({ error: "Invalid body" }, { status: 400, headers });
  }

  const [room] = await drizzle
    .select({ room_id: chatRooms.room_id })
    .from(chatRooms)
    .where(
      and(
        eq(chatRooms.room_id, body.room_id),
        eq(chatRooms.user_id, user.id)
      )
    )
    .limit(1);

  if (!room) {
    return data({ error: "Room not found" }, { status: 404, headers });
  }

  if (body.title !== undefined) {
    await drizzle
      .update(chatRooms)
      .set({ title: body.title, updated_at: new Date() })
      .where(
        and(
          eq(chatRooms.room_id, body.room_id),
          eq(chatRooms.user_id, user.id)
        )
      );
  }

  const {
    room_id,
    title: _title,
    ...rest
  } = body;

  const updateFields: Record<string, unknown> = {};
  if (rest.font_size !== undefined) updateFields.font_size = rest.font_size;
  if (rest.background_image_url !== undefined)
    updateFields.background_image_url = rest.background_image_url;
  if (rest.background_enabled !== undefined)
    updateFields.background_enabled = toBool(rest.background_enabled);
  if (rest.character_nickname !== undefined)
    updateFields.character_nickname = rest.character_nickname;
  if (rest.multi_image !== undefined)
    updateFields.multi_image = toBool(rest.multi_image);
  if (rest.response_length !== undefined)
    updateFields.response_length = rest.response_length;
  if (rest.positivity_bias !== undefined)
    updateFields.positivity_bias = toBool(rest.positivity_bias);
  if (rest.anti_impersonation !== undefined)
    updateFields.anti_impersonation = toBool(rest.anti_impersonation);
  if (rest.realtime_output !== undefined)
    updateFields.realtime_output = toBool(rest.realtime_output);

  if (Object.keys(updateFields).length > 0) {
    const [existing] = await drizzle
      .select({ setting_id: chatRoomSettings.setting_id })
      .from(chatRoomSettings)
      .where(
        and(
          eq(chatRoomSettings.room_id, room_id),
          eq(chatRoomSettings.user_id, user.id)
        )
      )
      .limit(1);

    updateFields.updated_at = new Date();

    if (existing) {
      await drizzle
        .update(chatRoomSettings)
        .set(updateFields as Record<string, unknown>)
        .where(eq(chatRoomSettings.setting_id, existing.setting_id));
    } else {
      await drizzle.insert(chatRoomSettings).values({
        room_id,
        user_id: user.id,
        ...(updateFields as Record<string, unknown>),
      });
    }
  }

  return data({ success: true }, { headers });
}
