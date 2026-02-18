import type { Route } from "./+types/dashboard";

import { Edit, Trash2 } from "lucide-react";
import { Link, useFetcher, useLoaderData, useOutletContext, useSearchParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/core/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getMyCharacters,
  myCharactersQuerySchema,
} from "../../characters/lib/queries.server";
import MypageSidebarCard from "../components/mypage-sidebar-card";
import type { DashboardLayoutContext } from "../types";

export const meta: Route.MetaFunction = () => {
  return [{ title: `마이페이지 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);
  const { data: params } = myCharactersQuerySchema.safeParse(searchParams);

  const charactersResult = await getMyCharacters(user.id, params || { limit: 20, offset: 0 });

  return charactersResult;
}

export default function Dashboard() {
  const { characters, pagination } = useLoaderData<typeof loader>();
  const { user, profile, attendanceData, points } =
    useOutletContext<DashboardLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteFetcher = useFetcher();

  const limit = pagination.limit || 20;
  const currentPage = Math.floor((pagination.offset || 0) / limit) + 1;
  const totalPages = Math.ceil((pagination.total || 0) / limit);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String((page - 1) * limit));
    setSearchParams(params);
  };

  const handleDelete = (characterId: number) => {
    deleteFetcher.submit(null, {
      method: "DELETE",
      action: `/api/characters/${characterId}`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* 프로필 헤더 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#E9EAEB] text-[#414651]">
                    {profile?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-[#181D27]">
                    {profile?.name || user?.user_metadata?.name || "사용자"}
                  </h2>
                  <div className="mt-1 flex items-center gap-4 text-sm text-[#535862]">
                    <span>팔로워 {profile?.follower_count || 0}</span>
                    <span>·</span>
                    <span>팔로잉 {profile?.following_count || 0}</span>
                  </div>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-[#D5D7DA] text-[#414651] hover:bg-[#F5F5F5]"
              >
                <Link to="/account/edit">회원정보 수정</Link>
              </Button>
            </div>
          </div>

          {/* 전체 작품 테이블 */}
          <div className="rounded-xl border border-[#E9EAEB] bg-white">
            <div className="flex items-center justify-between border-b border-[#E9EAEB] p-6">
              <h3 className="text-lg font-semibold text-[#181D27]">
                전체 작품
              </h3>
            </div>

            {characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16">
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-[#F5F5F5]">
                  <svg
                    className="h-16 w-16 text-[#A4A7AE]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="mb-2 text-lg font-medium text-[#181D27]">
                  내 캐릭터가 없습니다
                </p>
                <p className="mb-6 text-center text-[#535862]">
                  첫 번째 캐릭터를 만들어보세요!
                </p>
                <Button
                  asChild
                  className="bg-[#00C4AF] text-white hover:bg-[#00b39e]"
                >
                  <Link to="/characters/create">캐릭터 생성하기</Link>
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E9EAEB] hover:bg-transparent">
                      <TableHead className="text-[#535862]">
                        작품명
                      </TableHead>
                      <TableHead className="text-[#535862]">
                        캐릭터명
                      </TableHead>
                      <TableHead className="text-[#535862]">
                        상태
                      </TableHead>
                      <TableHead className="text-[#535862]">
                        만든 일자
                      </TableHead>
                      <TableHead className="text-right text-[#535862]">
                        관리
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character) => (
                      <TableRow
                        key={character.character_id}
                        className="border-[#E9EAEB] hover:bg-[#F9FAFB]"
                      >
                        <TableCell className="font-medium text-[#181D27]">
                          {character.display_name || character.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={character.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-[#E9EAEB] text-xs text-[#414651]">
                                {(character.display_name || "C")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[#181D27]">
                              {character.display_name || character.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={character.status} />
                        </TableCell>
                        <TableCell className="text-[#535862]">
                          {formatDate(
                            character.created_at instanceof Date
                              ? character.created_at.toISOString()
                              : String(character.created_at)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="text-[#535862] hover:text-[#181D27] dark:hover:text-white"
                            >
                              <Link
                                to={`/characters/${character.character_id}/edit`}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={deleteFetcher.state !== "idle"}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-[#E9EAEB] bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-[#181D27]">
                                    캐릭터 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-[#535862]">
                                    "{character.display_name || character.name}"
                                    캐릭터를 삭제하시겠습니까? 이 작업은 되돌릴 수
                                    없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-[#D5D7DA] text-[#414651]">
                                    취소
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDelete(character.character_id)
                                    }
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-[#E9EAEB] p-4">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="text-sm font-medium text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA]"
                  >
                    이전
                  </button>
                  <span className="text-sm text-[#535862]">
                    Page {currentPage} of {Math.max(totalPages, 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="text-sm font-medium text-[#535862] hover:text-[#181D27] disabled:text-[#D5D7DA]"
                  >
                    다음
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <MypageSidebarCard
            user={{
              name:
                profile?.name || user?.user_metadata?.name || "사용자",
              avatarUrl:
                profile?.avatar_url ||
                user?.user_metadata?.avatar_url ||
                null,
              email: user?.email || "",
            }}
            profile={{
              follower_count: profile?.follower_count || 0,
              following_count: profile?.following_count || 0,
            }}
            points={{
              current_balance: points?.current_balance ?? 0,
            }}
            attendance={attendanceData || { checkedInToday: false, currentStreak: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; className: string; dot: string }
  > = {
    approved: {
      label: "공개",
      className:
        "bg-green-50 text-green-700 border-green-200",
      dot: "bg-green-500",
    },
    pending: {
      label: "심사중",
      className:
        "bg-orange-50 text-orange-700 border-orange-200",
      dot: "bg-orange-500",
    },
    pending_review: {
      label: "심사중",
      className:
        "bg-orange-50 text-orange-700 border-orange-200",
      dot: "bg-orange-500",
    },
    rejected: {
      label: "심사불가",
      className:
        "bg-red-50 text-red-700 border-red-200 ",
      dot: "bg-red-500",
    },
    draft: {
      label: "임시저장",
      className:
        "bg-gray-50 text-gray-700 border-gray-200",
      dot: "bg-gray-500",
    },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`mr-2 h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
