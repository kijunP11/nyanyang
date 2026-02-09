/**
 * Points Screen (냥젤리 충전 페이지)
 *
 * 냥젤리 포인트 충전 메인 페이지
 * - 잔액 카드
 * - 탭: 구매하기 / 무료로 받기
 * - 최근 거래 내역
 */

import type { Route } from "./+types/points";

import { eq, desc } from "drizzle-orm";
import { Gift, Share2, Calendar } from "lucide-react";
import { useState } from "react";
import { data, Link, useLoaderData } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/core/components/ui/tabs";
import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import PointBalanceCard from "../components/point-balance-card";
import PointHistoryTable from "../components/point-history-table";
import PointPackageCard from "../components/point-package-card";
import { POINT_PACKAGES, type PointPackageId } from "../lib/packages";
import { userPoints, pointTransactions } from "../schema";

export const meta: Route.MetaFunction = () => [
  { title: `냥젤리 충전 | ${import.meta.env.VITE_APP_NAME}` },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const db = drizzle;

  // 병렬 fetch: 잔액 + 거래 내역
  const [pointBalance, transactions] = await Promise.all([
    db
      .select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1)
      .then(
        ([r]) => r || { current_balance: 0, total_earned: 0, total_spent: 0 }
      ),

    db
      .select({
        transaction_id: pointTransactions.transaction_id,
        amount: pointTransactions.amount,
        balance_after: pointTransactions.balance_after,
        type: pointTransactions.type,
        reason: pointTransactions.reason,
        created_at: pointTransactions.created_at,
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.user_id, user.id))
      .orderBy(desc(pointTransactions.created_at))
      .limit(10),
  ]);

  return data(
    { user, balance: pointBalance, recentTransactions: transactions },
    { headers }
  );
}

export default function PointsScreen() {
  const { balance, recentTransactions } = useLoaderData<typeof loader>();
  const [selectedPackage, setSelectedPackage] =
    useState<PointPackageId>("premium");
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackage || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: selectedPackage }),
      });

      const result = await response.json();

      if (result.success && result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        alert(result.error || "결제 세션 생성에 실패했습니다.");
      }
    } catch {
      alert("결제 요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111]">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          냥젤리 <span className="text-3xl">🐱</span>
        </h1>

        {/* 잔액 카드 */}
        <div className="mb-6">
          <PointBalanceCard currentBalance={balance.current_balance} />
        </div>

        {/* 탭: 구매하기 / 무료로 받기 */}
        <Tabs defaultValue="purchase" className="mb-8">
          <TabsList className="bg-[#232323] border border-[#3f3f46] w-full">
            <TabsTrigger
              value="purchase"
              className="flex-1 data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
            >
              구매하기
            </TabsTrigger>
            <TabsTrigger
              value="free"
              className="flex-1 data-[state=active]:bg-[#14b8a6] data-[state=active]:text-white"
            >
              무료로 받기
            </TabsTrigger>
          </TabsList>

          {/* 구매하기 탭 */}
          <TabsContent value="purchase" className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              냥젤리 상품 구성
            </h3>

            {/* 상품 그리드 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {POINT_PACKAGES.map((pkg) => (
                <PointPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPackage === pkg.id}
                  onSelect={() => setSelectedPackage(pkg.id)}
                />
              ))}
            </div>

            {/* 결제하기 CTA */}
            <Button
              onClick={handlePurchase}
              disabled={!selectedPackage || isLoading}
              className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white py-6 text-lg font-semibold"
            >
              {isLoading ? "처리 중..." : "결제하기"}
            </Button>

            <p className="text-xs text-[#9ca3af] text-center mt-4">
              결제 시 Stripe 결제 페이지로 이동합니다
            </p>
          </TabsContent>

          {/* 무료로 받기 탭 */}
          <TabsContent value="free" className="mt-6">
            <div className="space-y-4">
              {/* 출석체크 */}
              <Link
                to="/attendance"
                className="block bg-[#232323] border border-[#3f3f46] rounded-xl p-4 hover:border-[#52525b] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#14b8a6]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">출석체크</h4>
                    <p className="text-sm text-[#9ca3af]">
                      매일 출석하고 냥젤리 받기
                    </p>
                  </div>
                  <span className="text-[#14b8a6]">→</span>
                </div>
              </Link>

              {/* 친구 초대 */}
              <div className="bg-[#232323] border border-[#3f3f46] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-[#14b8a6]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">친구 초대</h4>
                    <p className="text-sm text-[#9ca3af]">
                      추천 코드 공유하고 보상 받기
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6] hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/join?ref=...`
                      );
                      alert("추천 링크가 복사되었습니다!");
                    }}
                  >
                    복사
                  </Button>
                </div>
              </div>

              {/* 이벤트 참여 */}
              <Link
                to="/blog"
                className="block bg-[#232323] border border-[#3f3f46] rounded-xl p-4 hover:border-[#52525b] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#14b8a6]/10 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-[#14b8a6]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">이벤트 참여</h4>
                    <p className="text-sm text-[#9ca3af]">
                      진행 중인 이벤트 확인하기
                    </p>
                  </div>
                  <span className="text-[#14b8a6]">→</span>
                </div>
              </Link>
            </div>
          </TabsContent>
        </Tabs>

        {/* 최근 거래 내역 */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            최근 거래 내역
          </h3>
          <PointHistoryTable transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}
