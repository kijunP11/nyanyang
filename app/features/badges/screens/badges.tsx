/**
 * 뱃지 컬렉션 페이지 (F8 리디자인)
 * 탭 제거, 플랫 도전 과제 리스트 + 진행도 바 + 보상 포인트
 */
import type { Route } from "./+types/badges";

import { useState, useEffect } from "react";
import { data } from "react-router";
import { useFetcher, useRevalidator } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

import { getAllBadgeDefinitions, getUserBadges } from "../lib/queries.server";
import {
  evaluateAllBadgesWithMetrics,
  fetchBadgeMetrics,
  fetchBadgeProgressWithMetrics,
} from "../lib/badge-checker.server";

import type { BadgeDefinition, BadgeStatus } from "../types";
import { BadgeClaimModal } from "../components/badge-claim-modal";
import { BadgeRepresentativeModal } from "../components/badge-representative-modal";
import { RepresentativeBadgeCard } from "../components/representative-badge-card";
import { BadgeCard } from "../components/badge-card";

export const meta: Route.MetaFunction = () => [
  { title: `활동 배지 | ${import.meta.env.VITE_APP_NAME}` },
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
    [...badgeStatusesMap.entries()].map(([k, v]) => [String(k), v])
  );

  const badgeProgress: Record<
    string,
    { current: number; target: number; percentage: number }
  > = Object.fromEntries(
    [...progressMap.entries()].map(([k, v]) => [String(k), v])
  );

  return data(
    {
      definitions: definitions as BadgeDefinition[],
      claimedBadges,
      badgeStatuses,
      badgeProgress,
      representativeBadge,
    },
    { headers }
  );
}

function getStatus(
  def: BadgeDefinition,
  claimedBadges: Route.ComponentProps["loaderData"]["claimedBadges"],
  representativeBadge: Route.ComponentProps["loaderData"]["representativeBadge"],
  badgeStatuses: Record<string, boolean>
): BadgeStatus {
  const claimed = claimedBadges.find((b) => b.badge_id === def.badge_id);
  if (representativeBadge?.badge_id === def.badge_id) return "representative";
  if (claimed) return "earned";
  if (badgeStatuses[String(def.badge_id)]) return "claimable";
  return "locked";
}

export default function Badges({ loaderData }: Route.ComponentProps) {
  const {
    definitions,
    claimedBadges,
    badgeStatuses,
    badgeProgress,
    representativeBadge,
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

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimModalBadge, setClaimModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalOpen, setRepresentativeModalOpen] = useState(false);
  const [representativeModalBadge, setRepresentativeModalBadge] =
    useState<BadgeDefinition | null>(null);
  const [representativeModalMode, setRepresentativeModalMode] = useState<
    "set" | "unset"
  >("set");
  const [pendingClaimBadgeId, setPendingClaimBadgeId] = useState<
    number | null
  >(null);

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

  const onClaim = (badgeId: number) => {
    setPendingClaimBadgeId(badgeId);
    claimFetcher.submit(
      { badge_id: badgeId },
      {
        method: "POST",
        action: "/api/badges/claim",
        encType: "application/json",
      }
    );
  };

  const onSetRepresentative = (badgeId: number) => {
    const def = definitions.find((d) => d.badge_id === badgeId);
    if (def) {
      setRepresentativeModalBadge(def);
      setRepresentativeModalMode("set");
      setRepresentativeModalOpen(true);
    }
  };

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
      }
    );
  };

  const representativeDef = representativeBadge
    ? definitions.find((d) => d.badge_id === representativeBadge.badge_id)
    : null;

  const visibleBadges = definitions.filter((d) => !d.is_hidden);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 py-10 flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-black">활동 배지</h1>

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

        <h2 className="text-base font-semibold text-black">도전 과제</h2>

        <div className="flex flex-col gap-3">
          {visibleBadges.map((def) => {
            const status = getStatus(
              def,
              claimedBadges,
              representativeBadge,
              badgeStatuses
            );
            const progress = badgeProgress[String(def.badge_id)] ?? {
              current: 0,
              target: 1,
              percentage: 0,
            };
            return (
              <BadgeCard
                key={def.badge_id}
                definition={def}
                status={status}
                progress={progress}
                onClaim={onClaim}
                onSetRepresentative={onSetRepresentative}
                isClaiming={
                  claimFetcher.state !== "idle" &&
                  pendingClaimBadgeId === def.badge_id
                }
              />
            );
          })}
        </div>
      </div>

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
