/**
 * My Content Screen
 *
 * Displays and manages characters/works created by the authenticated user.
 * Shows profile area, character list in table format, and pagination.
 */

import type { Route } from "./+types/my-content";

import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Badge } from "~/core/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getMyCharacters, myCharactersQuerySchema } from "../../characters/lib/queries.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: `내 콘텐츠 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Character type for the my-content screen
 */
type Character = {
  character_id: number;
  name: string;
  display_name: string;
  description: string;
  avatar_url: string | null;
  status: "pending" | "approved" | "rejected";
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Parse and validate query parameters
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { success, data: params, error } = myCharactersQuerySchema.safeParse(searchParams);

  if (!success) {
    throw new Response("Invalid query parameters", { status: 400 });
  }

  try {
    const result = await getMyCharacters(user.id, params);
    return result;
  } catch (err) {
    console.error("Error fetching user characters:", err);
    throw new Response("Failed to fetch characters", { status: 500 });
  }
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    approved: {
      label: "공개",
      className: "bg-green-500/10 text-green-700 dark:text-green-400",
      dot: "bg-green-500",
    },
    pending: {
      label: "심사중",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      dot: "bg-orange-500",
    },
    rejected: {
      label: "심사불가",
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Badge variant="outline" className={config.className}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {config.label}
    </Badge>
  );
}

/**
 * My Content Screen Component
 */
export default function MyContentScreen() {
  const { characters, latestCharacter, pagination } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentPage = Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 20));
  const maxPages = 5;

  // Handle pagination
  const handlePrevious = () => {
    if (currentPage > 1) {
      const params = new URLSearchParams(searchParams);
      const newOffset = Math.max(0, pagination.offset - pagination.limit);
      params.set("offset", String(newOffset));
      setSearchParams(params);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      const params = new URLSearchParams(searchParams);
      const newOffset = pagination.offset + pagination.limit;
      params.set("offset", String(newOffset));
      setSearchParams(params);
    }
  };

  // Handle delete
  const handleDelete = async (characterId: number, displayName: string) => {
    if (!confirm(`"${displayName}" 캐릭터를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeletingId(characterId);
    try {
      const response = await fetch("/api/characters/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId }),
      });

      if (response.ok) {
        // Reload the page to refresh the list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch (err) {
      alert("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Profile Area */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={latestCharacter?.avatar_url || undefined}
                alt={latestCharacter?.display_name || "프로필"}
              />
              <AvatarFallback>
                {latestCharacter?.display_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">
                {latestCharacter?.display_name || "사용자"}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>팔로워 0명</span>
                <span>•</span>
                <span>팔로잉 0명</span>
              </div>
            </div>
          </div>
          {latestCharacter && (
            <Button asChild variant="outline">
              <Link to={`/characters/${latestCharacter.character_id}`}>
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Works List */}
      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">전체 작품</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>정렬 옵션</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {characters.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-16 h-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">내 캐릭터가 없습니다</p>
            <p className="text-muted-foreground text-center mb-6">
              첫 번째 캐릭터를 만들어보세요!
            </p>
            <Button asChild>
              <Link to="/characters/create">캐릭터 만들기</Link>
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작품명</TableHead>
                  <TableHead>캐릭터명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>만든 일자</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters.map((character) => (
                  <TableRow key={character.character_id}>
                    <TableCell className="font-medium">
                      {character.display_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={character.avatar_url ?? undefined}
                            alt={character.display_name ?? undefined}
                          />
                          <AvatarFallback>
                            {(character.display_name ?? "C")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{character.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={character.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(character.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          disabled={deletingId === character.character_id}
                        >
                          <Link to={`/characters/${character.character_id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(character.character_id, character.display_name ?? "캐릭터")
                          }
                          disabled={deletingId === character.character_id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  페이지 {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

