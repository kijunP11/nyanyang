/**
 * 뱃지 컬렉션 페이지 — Figma 픽셀 퍼펙트
 *
 * 레이아웃: 좌측 사이드바(260px) + 탭바 + 3섹션(대표 뱃지, 최근 달성, 수집한 뱃지)
 */
import type { BadgeDefinition, BadgeStatus } from "../types";
import type { Route } from "./+types/badges";

import { Fragment, useCallback, useEffect, useState } from "react";
import { data, useFetcher, useRevalidator } from "react-router";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { BadgeClaimModal } from "../components/badge-claim-modal";
import { BadgeRepresentativeModal } from "../components/badge-representative-modal";
import {
  BadgeCategoryGroup,
  type BadgeWithStatus,
} from "../components/badge-category-group";
import { ChatSidebar } from "~/core/components/chat-sidebar";
import { BadgesTabs } from "../components/badges-tabs";
import { RecentBadgeCards } from "../components/recent-badge-cards";
import { RepresentativeBadgeCard } from "../components/representative-badge-card";
import {
  evaluateAllBadgesWithMetrics,
  fetchBadgeMetrics,
  fetchBadgeProgressWithMetrics,
} from "../lib/badge-checker.server";
import { getAllBadgeDefinitions, getUserBadges } from "../lib/queries.server";

export const meta: Route.MetaFunction = () => [
  { title: `수집한 뱃지 | ${import.meta.env.VITE_APP_NAME}` },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [definitions, claimedBadges, metrics] = await Promise.all([
    getAllBadgeDefinitions(),
    getUserBadges(user.id),
    fetchBadgeMetrics(user.id),
  ]);

  const badgeStatusesMap = evaluateAllBadgesWithMetrics(definitions, metrics);
  const progressMap = fetchBadgeProgressWithMetrics(definitions, metrics);

  const representativeBadge =
    claimedBadges.find((b) => b.is_representative) ?? null;

  const badgeStatuses: Record<string, boolean> = Object.fromEntries(
    [...badgeStatusesMap.entries()].map(([k, v]) => [String(k), v]),
  );

  const badgeProgress: Record<
    string,
    { current: number; target: number; percentage: number }
  > = Object.fromEntries(
    [...progressMap.entries()].map(([k, v]) => [String(k), v]),
  );

  // Recent badges — claimed, sorted by newest first (already sorted from query)
  const recentBadges = claimedBadges
    .filter((cb) => !cb.is_representative)
    .slice(0, 10)
    .map((cb) => ({
      definition: definitions.find(
        (d) => d.badge_id === cb.badge_id,
      ) as BadgeDefinition,
      claimed_at: String(cb.claimed_at),
    }))
    .filter((b) => b.definition);

  return data(
    {
      definitions: definitions as BadgeDefinition[],
      claimedBadges,
      badgeStatuses,
      badgeProgress,
      representativeBadge,
      recentBadges,
      user: {
        name:
          user.user_metadata?.nickname ||
          user.user_metadata?.name ||
          "Anonymous",
        email: user.email,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    },
    { headers },
  );
}

function getStatus(
  def: BadgeDefinition,
  claimedBadges: Route.ComponentProps["loaderData"]["claimedBadges"],
  representativeBadge: Route.ComponentProps["loaderData"]["representativeBadge"],
  badgeStatuses: Record<string, boolean>,
): BadgeStatus {
  const claimed = claimedBadges.find((b) => b.badge_id === def.badge_id);
  if (representativeBadge?.badge_id === def.badge_id) return "representative";
  if (claimed) return "earned";
  if (badgeStatuses[String(def.badge_id)]) return "claimable";
  return "locked";
}

/** Figma에 표시되는 카테고리 순서 */
const VISIBLE_CATEGORIES = ["followers", "likes", "conversations"] as const;

export default function Badges({ loaderData }: Route.ComponentProps) {
  const {
    definitions,
    claimedBadges,
    badgeStatuses,
    representativeBadge,
    recentBadges,
    user,
  } = loaderData;

  const revalidator = useRevalidator();
  const claimFetcher = useFetcher<{
    success?: boolean;
    error?: string;
    reward_points?: number;
  }>();
  const representativeFetcher = useFetcher<{
    success?: boolean;
    error?: string;
  }>();

  const [activeTab, setActiveTab] = useState<"missions" | "badges">("badges");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimModalBadge, setClaimModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalOpen, setRepresentativeModalOpen] = useState(false);
  const [representativeModalBadge, setRepresentativeModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalMode, setRepresentativeModalMode] = useState<
    "set" | "unset"
  >("set");
  const [pendingClaimBadgeId, setPendingClaimBadgeId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (claimFetcher.state !== "idle" || !claimFetcher.data) return;
    if (claimFetcher.data.success && pendingClaimBadgeId != null) {
      const def = definitions.find((d) => d.badge_id === pendingClaimBadgeId);
      if (def) {
        setClaimModalBadge(def);
        setClaimModalOpen(true);
      }
      revalidator.revalidate();
    } else if (claimFetcher.data?.error) {
      alert(claimFetcher.data.error);
    }
    setPendingClaimBadgeId(null);
  }, [
    claimFetcher.state,
    claimFetcher.data,
    pendingClaimBadgeId,
    definitions,
    revalidator,
  ]);

  useEffect(() => {
    if (
      representativeFetcher.state === "idle" &&
      representativeFetcher.data?.success
    ) {
      setRepresentativeModalOpen(false);
      setRepresentativeModalBadge(null);
      revalidator.revalidate();
    }
  }, [representativeFetcher.state, representativeFetcher.data, revalidator]);

  const onClaim = useCallback(
    (badgeId: number) => {
      setPendingClaimBadgeId(badgeId);
      claimFetcher.submit(
        { badge_id: badgeId },
        {
          method: "POST",
          action: "/api/badges/claim",
          encType: "application/json",
        },
      );
    },
    [claimFetcher],
  );

  const onSetRepresentative = useCallback(
    (badgeId: number) => {
      const def = definitions.find((d) => d.badge_id === badgeId);
      if (def) {
        setRepresentativeModalBadge(def);
        setRepresentativeModalMode("set");
        setRepresentativeModalOpen(true);
      }
    },
    [definitions],
  );

  const onRepresentativeModalConfirm = () => {
    if (!representativeModalBadge) return;
    representativeFetcher.submit(
      {
        badge_id: representativeModalBadge.badge_id,
        action: representativeModalMode,
      },
      {
        method: "POST",
        action: "/api/badges/representative",
        encType: "application/json",
      },
    );
  };

  const representativeDef = representativeBadge
    ? definitions.find((d) => d.badge_id === representativeBadge.badge_id)
    : null;

  // Group visible badges by category
  const categoryGroups = VISIBLE_CATEGORIES.map((catKey) => {
    const catBadges: BadgeWithStatus[] = definitions
      .filter((d) => d.category === catKey && !d.is_hidden)
      .map((def) => ({
        definition: def,
        status: getStatus(def, claimedBadges, representativeBadge, badgeStatuses),
      }));
    return { key: catKey, badges: catBadges };
  }).filter((g) => g.badges.length > 0);

  return (
    <div className="-mx-5 -my-16 flex min-h-[calc(100vh-57px)] bg-white dark:bg-[#0C111D] md:-my-32">
      {/* Left sidebar */}
      <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] md:block">
        <ChatSidebar user={user} chats={[]} />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <BadgesTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mx-auto max-w-[769px] px-[20px] pt-[40px] pb-[35px] md:px-0">
          {activeTab === "badges" && (
            <div className="flex flex-col gap-[30px]">
              {/* 대표 뱃지 */}
              <RepresentativeBadgeCard
                representativeBadge={
                  representativeDef
                    ? { definition: representativeDef }
                    : null
                }
                onUnsetClick={() => {
                  if (representativeDef) {
                    setRepresentativeModalBadge(representativeDef);
                    setRepresentativeModalMode("unset");
                    setRepresentativeModalOpen(true);
                  }
                }}
              />

              {/* 최근 달성 뱃지 */}
              <RecentBadgeCards recentBadges={recentBadges} />

              {/* 수집한 뱃지 */}
              <section>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="text-[20px] font-bold leading-[30px] text-[#414651] dark:text-white">
                    수집한 뱃지
                  </h2>
                  <p className="text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
                    수집 가능한 모든 뱃지를 확인해보세요.
                  </p>
                </div>

                <div className="mt-[20px] flex flex-col gap-[40px]">
                  {categoryGroups.map((group, idx) => (
                    <Fragment key={group.key}>
                      {idx > 0 && (
                        <div className="h-px w-full bg-[#d5d7da] dark:bg-[#333741]" />
                      )}
                      <BadgeCategoryGroup
                        categoryKey={group.key}
                        badges={group.badges}
                        onClaim={onClaim}
                        onSetRepresentative={onSetRepresentative}
                        claimingBadgeId={
                          claimFetcher.state !== "idle"
                            ? pendingClaimBadgeId
                            : null
                        }
                      />
                    </Fragment>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "missions" && (
            <div className="flex h-[400px] flex-col items-center justify-center">
              <p className="text-[16px] font-semibold text-[#717680] dark:text-[#94969C]">
                리워드 미션 (준비 중)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BadgeClaimModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        badge={claimModalBadge}
      />

      <BadgeRepresentativeModal
        open={representativeModalOpen}
        onOpenChange={setRepresentativeModalOpen}
        badge={representativeModalBadge}
        mode={representativeModalMode}
        onConfirm={onRepresentativeModalConfirm}
        isSubmitting={representativeFetcher.state !== "idle"}
      />
    </div>
  );
}
