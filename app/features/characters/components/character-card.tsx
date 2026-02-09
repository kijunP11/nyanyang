import { User } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/core/components/ui/badge";
import { Card, CardContent } from "~/core/components/ui/card";
import type { Database } from "database.types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  // tags가 JSON 배열일 수 있으므로 처리
  const tagsArray = Array.isArray(character.tags)
    ? character.tags
    : typeof character.tags === "string"
      ? JSON.parse(character.tags)
      : [];

  return (
    <Link to={`/chat/${character.character_id}`}>
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
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-[#6b7280]" />
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
          {tagsArray.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tagsArray.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tagsArray.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tagsArray.length - 3}
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
  );
}

