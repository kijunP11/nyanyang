import type { Route } from "./+types/dashboard";

import { eq } from "drizzle-orm";
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
import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  getMyCharacters,
  myCharactersQuerySchema,
} from "../../characters/lib/queries.server";
import { userPoints } from "../../points/schema";
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

  const db = drizzle;

  // 병렬 fetch
  const [charactersResult, pointsData] = await Promise.all([
    getMyCharacters(user.id, params || { limit: 20, offset: 0 }),
    db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1)
      .then(
        ([result]) =>
          result || { current_balance: 0, total_earned: 0, total_spent: 0 }
      )
      .catch(() => ({ current_balance: 0, total_earned: 0, total_spent: 0 })),
  ]);

  return {
    ...charactersResult,
    points: pointsData,
  };
}

export default function Dashboard() {
  const { characters, pagination, points } = useLoaderData<typeof loader>();
  const { user, profile, attendanceData } =
    useOutletContext<DashboardLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteFetcher = useFetcher();

  const currentPage =
    Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1;
  const totalPages = Math.ceil(
    (pagination.total || 0) / (pagination.limit || 20)
  );

  const handlePrevious = () => {
    const params = new URLSearchParams(searchParams);
    params.set(
      "offset",
      String(Math.max(0, (pagination.offset || 0) - (pagination.limit || 20)))
    );
    setSearchParams(params);
  };

  const handleNext = () => {
    const params = new URLSearchParams(searchParams);
    params.set(
      "offset",
      String((pagination.offset || 0) + (pagination.limit || 20))
    );
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* 좌측: 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 프로필 헤더 */}
          <div className="bg-[#232323] rounded-xl border border-[#3f3f46] p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-[#3f3f46] text-white">
                  {profile?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.name || user?.user_metadata?.name || "사용자"}
                </h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#9ca3af]">
                  <span>팔로워 {profile?.follower_count || 0}명</span>
                  <span>팔로잉 {profile?.following_count || 0}명</span>
                </div>
              </div>
            </div>
          </div>

          {/* 전체 작품 테이블 */}
          <div className="bg-[#232323] rounded-xl border border-[#3f3f46]">
            <div className="flex items-center justify-between p-6 border-b border-[#3f3f46]">
              <h3 className="text-lg font-semibold text-white">전체 작품</h3>
            </div>

            {characters.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <p className="text-lg font-medium text-white mb-2">
                  내 캐릭터가 없습니다
                </p>
                <p className="text-[#9ca3af] text-center mb-6">
                  첫 번째 캐릭터를 만들어보세요!
                </p>
                <Button asChild className="bg-[#14b8a6] hover:bg-[#0d9488]">
                  <Link to="/characters/create">캐릭터 만들기</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* 테이블 */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#3f3f46] hover:bg-transparent">
                      <TableHead className="text-[#9ca3af]">작품명</TableHead>
                      <TableHead className="text-[#9ca3af]">캐릭터명</TableHead>
                      <TableHead className="text-[#9ca3af]">상태</TableHead>
                      <TableHead className="text-[#9ca3af]">만든 일자</TableHead>
                      <TableHead className="text-right text-[#9ca3af]">
                        관리
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character: any) => (
                      <TableRow
                        key={character.character_id}
                        className="border-[#3f3f46] hover:bg-[#2f3032]"
                      >
                        <TableCell className="font-medium text-white">
                          {character.display_name || character.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={character.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-[#3f3f46] text-white text-xs">
                                {(character.display_name || "C")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white">
                              {character.display_name || character.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={character.status} />
                        </TableCell>
                        <TableCell className="text-[#9ca3af]">
                          {formatDate(character.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="text-[#9ca3af] hover:text-white"
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
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#232323] border-[#3f3f46]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    캐릭터 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-[#9ca3af]">
                                    "{character.display_name || character.name}"
                                    캐릭터를 삭제하시겠습니까? 이 작업은 되돌릴 수
                                    없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-[#3f3f46] text-[#9ca3af]">
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

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-[#3f3f46]">
                    <div className="text-sm text-[#9ca3af]">
                      페이지 {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
                      >
                        이전
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="border-[#3f3f46] text-[#9ca3af] hover:bg-[#3f3f46] hover:text-white"
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

        {/* 우측: 사이드바 카드 (lg 이상에서만 표시) */}
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
              current_balance: points.current_balance || 0,
            }}
            attendance={attendanceData || { checkedInToday: false, currentStreak: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

// StatusBadge 컴포넌트
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; className: string; dot: string }
  > = {
    approved: {
      label: "공개",
      className: "bg-green-500/10 text-green-400 border-green-500/20",
      dot: "bg-green-500",
    },
    pending: {
      label: "심사중",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      dot: "bg-orange-500",
    },
    pending_review: {
      label: "심사중",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      dot: "bg-orange-500",
    },
    rejected: {
      label: "심사불가",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-500",
    },
    draft: {
      label: "임시저장",
      className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      dot: "bg-gray-500",
    },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
