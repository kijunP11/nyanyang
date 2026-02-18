import type { Route } from "./+types/likes";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";

import { CharacterInfoModal } from "~/features/characters/components/character-info-modal";
import { Button } from "~/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import CharacterGridCard from "../components/character-grid-card";
import {
  getLikedCharacters,
  getFollowingCharacters,
  paginationSchema,
} from "../lib/queries.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: `좋아요 & 팔로잉 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "likes";
  const paginationParams = paginationSchema.parse(
    Object.fromEntries(url.searchParams)
  );

  const result =
    tab === "following"
      ? await getFollowingCharacters(user.id, paginationParams)
      : await getLikedCharacters(user.id, paginationParams);

  return {
    tab,
    ...result,
    userId: user.id,
  };
}

function getPageNumbers(current: number, total: number, maxVisible = 5) {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function LikesScreen() {
  const { tab, characters, pagination } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null
  );

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    setSearchParams(params);
  };

  const handlePrevious = () => {
    const params = new URLSearchParams(searchParams);
    params.set(
      "offset",
      String(Math.max(0, pagination.offset - pagination.limit))
    );
    setSearchParams(params);
  };

  const handleNext = () => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String(pagination.offset + pagination.limit));
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String((page - 1) * pagination.limit));
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 bg-[#F5F5F5] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#181D27]">좋아요 & 팔로잉</h1>
        <Button variant="ghost" asChild className="text-[#535862] hover:text-[#181D27]">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전 페이지로 돌아가기
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-white border border-[#D5D7DA]">
          <TabsTrigger
            value="likes"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            좋아요 목록
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="data-[state=active]:bg-[#00c4af] data-[state=active]:text-white text-[#181D27]"
          >
            팔로잉 목록
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-[#181D27] mb-2">
            {tab === "likes"
              ? "좋아요한 캐릭터가 없습니다"
              : "팔로잉한 크리에이터의 캐릭터가 없습니다"}
          </p>
          <p className="text-[#535862] mb-6">캐릭터를 탐색해보세요!</p>
          <Button asChild className="bg-[#00c4af] hover:bg-[#00b39e] text-white">
            <Link to="/characters">캐릭터 탐색</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((character) => (
              <CharacterGridCard
                key={character.character_id}
                character={character}
                onClick={() => setSelectedCharacterId(character.character_id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="border-[#D5D7DA] text-[#181D27] hover:bg-[#F5F5F5]"
              >
                이전
              </Button>
              {pageNumbers.map((num) => (
                <Button
                  key={num}
                  variant={currentPage === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(num)}
                  className={
                    currentPage === num
                      ? "bg-[#00c4af] hover:bg-[#00b39e] text-white"
                      : "border-[#D5D7DA] text-[#181D27] hover:bg-[#F5F5F5]"
                  }
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="border-[#D5D7DA] text-[#181D27] hover:bg-[#F5F5F5]"
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      <CharacterInfoModal
        characterId={selectedCharacterId}
        onClose={() => setSelectedCharacterId(null)}
        showFollowButton
      />
    </div>
  );
}
