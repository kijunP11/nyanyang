/**
 * Chat Rooms List Screen
 *
 * Displays a list of user's chat rooms with characters.
 * Shows room preview, last message, and character info.
 */

import type { Route } from "./+types/rooms";

import { Link, useLoaderData } from "react-router";

import { eq, desc } from "drizzle-orm";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { characters } from "../../characters/schema";
import { chatRooms } from "../schema";

/**
 * Loader function for fetching user's chat rooms
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const db = drizzle;

  // Fetch user's rooms with character info
  const rooms = await db
    .select({
      room_id: chatRooms.room_id,
      title: chatRooms.title,
      last_message: chatRooms.last_message,
      last_message_at: chatRooms.last_message_at,
      message_count: chatRooms.message_count,
      created_at: chatRooms.created_at,
      character: {
        character_id: characters.character_id,
        display_name: characters.display_name,
        avatar_url: characters.avatar_url,
      },
    })
    .from(chatRooms)
    .innerJoin(characters, eq(chatRooms.character_id, characters.character_id))
    .where(eq(chatRooms.user_id, user.id))
    .orderBy(desc(chatRooms.last_message_at));

  return { rooms };
}

/**
 * Chat Rooms Screen Component
 */
export default function ChatRoomsScreen() {
  const { rooms } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">내 채팅방</h1>
        <p className="text-muted-foreground mt-2">
          캐릭터와의 대화 목록
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            아직 채팅방이 없습니다.
          </p>
          <Link
            to="/characters"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            캐릭터 찾아보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Link
              key={room.room_id}
              to={`/chat/${room.room_id}`}
              className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Character Avatar */}
                <div className="flex-shrink-0">
                  {room.character.avatar_url ? (
                    <img
                      src={room.character.avatar_url}
                      alt={room.character.display_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {room.character.display_name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">
                      {room.character.display_name}
                    </h3>
                    {room.last_message_at && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(room.last_message_at).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {room.title}
                  </p>
                  {room.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {room.last_message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{room.message_count}개 메시지</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
