import type { Route } from "./+types/likes";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import CharacterGridCard from "../components/character-grid-card";
import CharacterInfoModal from "../components/character-info-modal";
import {
  getLikedCharacters,
  getFollowingCharacters,
  paginationSchema,
} from "../lib/queries.server";
import type { CharacterCardData } from "../types";

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

export default function LikesScreen() {
  const { tab, characters, pagination, userId } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterCardData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    // offset 리셋
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

  const handleCardClick = (character: CharacterCardData) => {
    setSelectedCharacter(character);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">좋아요 & 팔로잉</h1>
        <Button
          variant="ghost"
          asChild
          className="text-[#9ca3af] hover:text-white"
        >
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전 페이지로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 탭 */}
      <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="bg-[#232323] border border-[#3f3f46]">
          <TabsTrigger
            value="likes"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            좋아요 목록
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
          >
            팔로잉 목록
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 카드 그리드 */}
      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-white mb-2">
            {tab === "likes"
              ? "좋아요한 캐릭터가 없습니다"
              : "팔로잉한 크리에이터의 캐릭터가 없습니다"}
          </p>
          <p className="text-[#9ca3af] mb-6">캐릭터를 탐색해보세요!</p>
          <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488]">
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
                onClick={handleCardClick}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
              >
                이전
              </Button>
              <span className="text-sm text-[#9ca3af]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* 캐릭터 정보 모달 */}
      <CharacterInfoModal
        character={selectedCharacter}
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentUserId={userId}
      />
    </div>
  );
}
