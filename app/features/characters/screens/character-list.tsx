/**
 * Character List Screen
 *
 * Displays all public characters with search, filter, and sorting
 */
import type { Route } from "./+types/character-list";

import { Link, useLoaderData } from "react-router";
import { useState } from "react";

import { getPublicCharacters } from "../queries";
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
import { Card, CardContent } from "~/core/components/ui/card";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `캐릭터 목록 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sort") || "popular";

  const characters = await getPublicCharacters({
    search,
    sortBy: sortBy as "popular" | "newest" | "most_chatted",
    limit: 50,
  });

  return {
    characters,
    search,
    sortBy,
  };
}

export default function CharacterList({ loaderData }: Route.ComponentProps) {
  const { characters, search: initialSearch, sortBy: initialSort } = loaderData;
  const [searchQuery, setSearchQuery] = useState(initialSearch);

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
          <Button size="lg">
            캐릭터 만들기
          </Button>
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
          <p className="text-muted-foreground text-lg">
            캐릭터가 없습니다
          </p>
          <Link to="/characters/create" className="mt-4 inline-block">
            <Button>첫 캐릭터 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <Link
              key={character.character_id}
              to={`/chat/${character.character_id}`}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                {/* Character Image */}
                <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5">
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎭
                    </div>
                  )}
                  {character.is_nsfw && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      NSFW
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Character Name */}
                  <h3 className="font-semibold text-lg mb-2 truncate">
                    {character.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {character.description || "설명 없음"}
                  </p>

                  {/* Tags */}
                  {character.tags && character.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {character.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {character.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{character.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      👁️ {character.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      ❤️ {character.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {character.chat_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
