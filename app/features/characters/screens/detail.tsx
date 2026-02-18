/**
 * Character Detail Screen
 *
 * Displays detailed information about a character and allows starting a chat.
 */

// @ts-expect-error - Route types generated when registered in routes.ts
import type { Route } from "./+types/detail";

import { useLoaderData, useFetcher, Form } from "react-router";
import { useState } from "react";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { CommentSection } from "~/features/comments/components/comment-section";
import { chatRooms } from "../../chat/schema";

/**
 * Loader function for fetching character details
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const characterId = parseInt(params.characterId);
  if (isNaN(characterId)) {
    throw new Response("Invalid character ID", { status: 400 });
  }

  // Fetch character details from API
  const url = new URL(request.url);
  const apiUrl = new URL(`/api/characters/${characterId}`, url.origin);

  const response = await fetch(apiUrl.toString(), {
    headers: request.headers,
  });

  if (!response.ok) {
    throw new Response("Failed to fetch character", { status: response.status });
  }

  const data = await response.json();
  return data;
}

/**
 * Action handler for creating a chat room
 */
export async function action({ request, params }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const characterId = parseInt(params.characterId);
  const db = drizzle;

  // Create new chat room
  const [room] = await db
    .insert(chatRooms)
    .values({
      user_id: user.id,
      character_id: characterId,
      title: `New Chat`,
      message_count: 0,
    })
    .returning();

  // Redirect to chat room
  return Response.redirect(`/chat/${room.room_id}`);
}

/**
 * Character Detail Screen Component
 */
export default function CharacterDetailScreen() {
  const { character } = useLoaderData<typeof loader>();
  const likeFetcher = useFetcher();
  const [isLiked, setIsLiked] = useState(character.isLiked);
  const [likeCount, setLikeCount] = useState(character.like_count);

  // Handle like/unlike
  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev: number) => prev + (newLikedState ? 1 : -1));

    likeFetcher.submit(
      { character_id: character.character_id },
      {
        method: newLikedState ? "POST" : "DELETE",
        action: "/api/characters/like",
        encType: "application/json",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-b from-[#14b8a6]/20 to-[#1a1a1a]">
        <div className="absolute inset-0 flex items-center justify-center">
          {character.banner_url ? (
            <img
              src={character.banner_url}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 -mt-24 relative z-10">
        <div className="rounded-lg border border-[#3f3f46] bg-[#232323] p-6 shadow-lg">
          {/* Character Header */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            {character.avatar_url ? (
              <img
                src={character.avatar_url}
                alt={character.display_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-[#1a1a1a] shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#14b8a6]/10 flex items-center justify-center border-4 border-[#1a1a1a] shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {character.display_name[0]}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {character.display_name}
              </h1>
              <p className="text-[#9ca3af] mb-4">
                {character.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-[#9ca3af] mb-4">
                <span>❤️ {likeCount} 좋아요</span>
                <span>💬 {character.chat_count} 대화</span>
                <span>👁️ {character.view_count} 조회</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Form method="post">
                  <button
                    type="submit"
                    className="rounded-md bg-[#14b8a6] px-6 py-2 text-sm font-medium text-white hover:bg-[#0d9488]"
                  >
                    💬 대화 시작하기
                  </button>
                </Form>
                <button
                  onClick={handleLike}
                  className={`rounded-md px-6 py-2 text-sm font-medium border ${
                    isLiked
                      ? "bg-[#14b8a6] text-white border-[#14b8a6]"
                      : "border-[#3f3f46] bg-[#232323] text-white hover:bg-[#3f3f46]"
                  }`}
                >
                  {isLiked ? "❤️ 좋아요" : "🤍 좋아요"}
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          {character.tags && character.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 text-sm rounded-md bg-[#14b8a6]/10 text-[#14b8a6]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personality */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">성격</h3>
            <p className="text-sm text-[#9ca3af] whitespace-pre-wrap">
              {character.personality}
            </p>
          </div>

          {/* Greeting */}
          {character.greeting_message && (
            <div className="rounded-lg bg-[#2f3032] p-4">
              <h3 className="text-sm font-semibold text-white mb-2">첫 인사</h3>
              <p className="text-sm italic text-[#9ca3af]">
                "{character.greeting_message}"
              </p>
            </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-6 rounded-lg border border-[#3f3f46] bg-[#232323] p-6">
          <CommentSection characterId={character.character_id} />
        </div>
      </div>
    </div>
  );
}
