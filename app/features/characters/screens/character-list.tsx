/**
 * Character List Screen
 *
 * Displays all public characters with search, filter, and sorting
 */
import type { Route } from "./+types/character-list";

import { Link } from "react-router";
import { useState } from "react";

import makeServerClient from "~/core/lib/supa-client.server";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Badge } from "~/core/components/ui/badge";
import { CharacterCard } from "~/features/characters/components/character-card";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 목록 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sort") || "popular";

  // 공개 캐릭터 조회
  let query = client
    .from("characters")
    .select("*")
    .eq("is_public", true)
    .eq("status", "approved");

  // 검색어 필터
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 정렬
  if (sortBy === "popular") {
    query = query.order("like_count", { ascending: false });
  } else if (sortBy === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sortBy === "most_chatted") {
    query = query.order("chat_count", { ascending: false });
  }

  const { data: characters } = await query.limit(50);

  return {
    characters: characters || [],
    search,
    sortBy,
  };
}

export default function CharacterList({ loaderData }: Route.ComponentProps) {
  const {
    characters,
    search: initialSearch,
    sortBy: initialSort,
  } = loaderData;
  const [searchQuery] = useState(initialSearch);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">캐릭터</h1>
          <p className="text-muted-foreground mt-2">
            다양한 캐릭터와 대화해보세요
          </p>
        </div>
        <Link to="/characters/create">
          <Button size="lg">캐릭터 만들기</Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <form method="get" className="flex-1 flex gap-2">
          <Input
            type="search"
            name="search"
            placeholder="캐릭터 검색..."
            defaultValue={searchQuery}
            className="flex-1"
          />
          <Select name="sort" defaultValue={initialSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">인기순</SelectItem>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="most_chatted">대화 많은순</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">검색</Button>
        </form>
      </div>

      {/* Character Grid */}
      {characters.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">캐릭터가 없습니다</p>
          <Link to="/characters/create" className="mt-4 inline-block">
            <Button>첫 캐릭터 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard key={character.character_id} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}
