/**
 * Create Chat Room API
 * POST: character_id로 새 채팅방 생성, room_id 반환
 */
import { data } from "react-router";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { characters } from "../../characters/schema";
import { chatRooms } from "../schema";

const bodySchema = z.object({
  character_id: z.coerce.number().int().positive(),
});

export async function action({ request }: { request: Request }) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401, headers });
  }

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405, headers });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return data({ error: "Invalid body" }, { status: 400, headers });
  }

  const [character] = await drizzle
    .select({ character_id: characters.character_id })
    .from(characters)
    .where(
      and(
        eq(characters.character_id, body.character_id),
        eq(characters.is_public, true),
        eq(characters.status, "approved")
      )
    )
    .limit(1);

  if (!character) {
    return data({ error: "Character not found" }, { status: 404, headers });
  }

  const [room] = await drizzle
    .insert(chatRooms)
    .values({
      user_id: user.id,
      character_id: body.character_id,
      title: "New Chat",
      message_count: 0,
    })
    .returning({ room_id: chatRooms.room_id });

  return data({ room_id: room.room_id }, { headers });
}
