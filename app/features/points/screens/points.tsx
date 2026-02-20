/**
 * Points Screen (냥젤리 충전 페이지)
 *
 * F9 리디자인: 구매하기 탭 + 무료로 받기 탭 (일간/주간 출석 + 배지)
 */

import type { Route } from "./+types/points";

import { and, desc, eq } from "drizzle-orm";
import { ChevronRight, PawPrint } from "lucide-react";
import { useState } from "react";
import { Link, data, useFetcher, useLoaderData, useNavigate } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import {
  attendanceRecords,
  weeklyAttendanceRecords,
} from "~/features/attendance/schema";

import PointBalanceCard from "../components/point-balance-card";
import { POINT_PACKAGES, type PointPackageId } from "../lib/packages";
import { userPoints } from "../schema";

export const meta: Route.MetaFunction = () => [
  { title: `냥젤리 충전 | ${import.meta.env.VITE_APP_NAME}` },
];

const PAYMENT_METHODS = [
  { id: "card", label: "신용/체크카드" },
  { id: "bank", label: "계좌 이체" },
  { id: "phone", label: "휴대폰 결제" },
  { id: "gift", label: "문화상품권" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

const REFUND_POLICY_LINES = [
  "모든 결제 상품은 결제일로부터 7일 이내 환불을 요청할 수 있습니다.",
  "7일 이내라도 구매한 냥젤리를 사용한 이력이 있을 경우 환불이 불가능합니다.",
  "사용 이력이 있는 경우, 남은 냥젤리에 대한 부분 환불은 불가합니다.",
  "답변 품질이나 개인적인 만족도에 따른 환불 요청은 불가능합니다.",
  "환불 관련 문의는 앱 결제 시 구글 플레이 또는 애플 고객센터를 통해,\n  웹 결제 시에는 나냥 고객센터를 통해 가능합니다.",
  "그 외 모든 문의는 나냥 고객센터로 연락해주세요.",
];

export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const db = drizzle;

  const [pointBalance] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.user_id, user.id))
    .limit(1);

  // 오늘 일간 출석 여부
  const today = new Date().toISOString().split("T")[0];
  const [todayRecord] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.user_id, user.id),
        eq(attendanceRecords.attendance_date, today),
      ),
    )
    .limit(1);

  // 주간 출석 가능 여부 (마지막 기록 + 7일)
  const [lastWeekly] = await db
    .select()
    .from(weeklyAttendanceRecords)
    .where(eq(weeklyAttendanceRecords.user_id, user.id))
    .orderBy(desc(weeklyAttendanceRecords.created_at))
    .limit(1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyEligible =
    !lastWeekly || new Date(lastWeekly.created_at) <= sevenDaysAgo;

  return data(
    {
      balance: pointBalance?.current_balance ?? 0,
      dailyCheckedIn: !!todayRecord,
      weeklyEligible,
    },
    { headers },
  );
}

export default function PointsScreen() {
  const { balance, dailyCheckedIn, weeklyEligible } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"purchase" | "free">("purchase");
  const [selectedPackage, setSelectedPackage] =
    useState<PointPackageId>("premium");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethodId>("card");
  const attendanceFetcher = useFetcher();
  const weeklyFetcher = useFetcher();

  const handlePurchase = () => {
    if (!selectedPackage) return;
    const params = new URLSearchParams({
      package: selectedPackage,
      payment: selectedPayment,
    });
    navigate(`/payments/checkout?${params.toString()}`);
  };

  const handleCheckin = () => {
    attendanceFetcher.submit(null, {
      method: "POST",
      action: "/api/attendance/checkin",
    });
  };

  const handleWeeklyCheckin = () => {
    weeklyFetcher.submit(null, {
      method: "POST",
      action: "/api/attendance/weekly-checkin",
    });
  };

  const checkinSuccess =
    attendanceFetcher.data?.success === true || dailyCheckedIn;
  const weeklyCheckinSuccess =
    weeklyFetcher.data?.success === true || !weeklyEligible;

  return (
    <div className="min-h-screen bg-white dark:bg-[#181D27]">
      <div className="mx-auto max-w-md px-4 py-10 flex flex-col gap-5">
        <h1 className="text-xl font-semibold text-black dark:text-white">냥젤리</h1>

        <PointBalanceCard currentBalance={balance} />

        {/* 커스텀 언더라인 탭 */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("purchase")}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <span
              className={`text-sm font-semibold ${
                activeTab === "purchase" ? "text-black dark:text-white" : "text-[#535862] dark:text-[#94969C]"
              }`}
            >
              구매하기
            </span>
            <div
              className={`h-1 w-full ${
                activeTab === "purchase" ? "bg-[#414141] dark:bg-white" : "bg-[#D9D9D9] dark:bg-[#3f3f46]"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("free")}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <span
              className={`text-sm font-semibold ${
                activeTab === "free" ? "text-black dark:text-white" : "text-[#535862] dark:text-[#94969C]"
              }`}
            >
              무료로 받기
            </span>
            <div
              className={`h-1 w-full ${
                activeTab === "free" ? "bg-[#414141] dark:bg-white" : "bg-[#D9D9D9] dark:bg-[#3f3f46]"
              }`}
            />
          </button>
        </div>

        {activeTab === "purchase" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-[14px]">
              {POINT_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`flex items-center gap-[38px] rounded-lg border p-[14px] transition-colors ${
                      isSelected
                        ? "border-[#00C4AF]"
                        : "border-[#D5D7DA] dark:border-[#3f3f46]"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundImage:
                              "linear-gradient(-52deg, rgba(0,196,175,0.2) 5.5%, rgba(255,195,229,0.2) 83%)",
                          }
                        : undefined
                    }
                  >
                    <div
                      className={`size-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-[#00C4AF] bg-[#00C4AF]"
                          : "border-[#D5D7DA] dark:border-[#3f3f46]"
                      }`}
                    >
                      {isSelected && (
                        <div className="size-2.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="flex flex-1 items-center">
                      <PawPrint className="size-6 text-[#F5A3C7] shrink-0" />
                      <div className="flex-1 text-right">
                        <p className="text-base font-semibold text-[#252B37] dark:text-white">
                          {pkg.points.toLocaleString()}개
                        </p>
                        {pkg.bonusPoints > 0 && (
                          <p className="text-xs font-bold text-[#36C4B3]">
                            +{pkg.bonusPoints.toLocaleString()}개
                          </p>
                        )}
                      </div>
                      <p className="flex-1 text-right text-base font-semibold text-[#28A393]">
                        {pkg.price.toLocaleString()}원
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold text-black dark:text-white">결제 수단</h2>
              <div className="flex flex-col">
                {PAYMENT_METHODS.map((method, idx) => (
                  <div key={method.id}>
                    {idx > 0 && <div className="h-px bg-[#E9EAEB] dark:bg-[#3f3f46]" />}
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex items-center gap-[9px] px-[14px] py-[13px] w-full"
                    >
                      <div
                        className={`size-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPayment === method.id
                            ? "border-[#00C4AF] bg-[#00C4AF]"
                            : "border-[#D5D7DA] dark:border-[#3f3f46]"
                        }`}
                      >
                        {selectedPayment === method.id && (
                          <div className="size-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-base font-semibold text-[#252B37] dark:text-white">
                        {method.label}
                      </span>
                    </button>
                  </div>
                ))}
                <div className="h-px bg-[#E9EAEB] dark:bg-[#3f3f46]" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-black dark:text-white">환불 정책</p>
              <div className="text-xs leading-[18px] text-[#717680] dark:text-[#9ca3af]">
                {REFUND_POLICY_LINES.map((line, i) => (
                  <p key={i}>- {line}</p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurchase}
              disabled={!selectedPackage}
              className="w-full rounded-lg bg-[#36C4B3] border border-[#36C4B3] px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {POINT_PACKAGES.find((p) => p.id === selectedPackage)?.price.toLocaleString() ?? ""}원 결제하기
            </button>
          </div>
        )}

        {activeTab === "free" && (
          <div className="flex flex-col gap-[10px] pb-10">
            {/* 일간 출석체크 카드 */}
            <div className="rounded-lg border border-[#00C4AF] bg-[#FFF5FB] p-5 dark:bg-[#1F242F]">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <span
                      className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862] dark:text-[#94969C]"
                      style={{
                        background:
                          "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)",
                      }}
                    >
                      매일 출석
                    </span>
                    <p className="text-sm text-black dark:text-white">
                      매일 출석하고 젤리 받기
                    </p>
                    <p className="text-base font-semibold text-black dark:text-white">
                      냥젤리 400개 받기
                    </p>
                  </div>
                  <PawPrint className="size-11 text-[#F5A3C7] opacity-40" />
                </div>
                <button
                  type="button"
                  onClick={handleCheckin}
                  disabled={
                    checkinSuccess || attendanceFetcher.state !== "idle"
                  }
                  className="w-full rounded-lg border border-white px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(-68deg, #00C4AF 5%, #FF6DC0 98%)",
                  }}
                >
                  {checkinSuccess ? "출석 완료!" : "일간 출석체크 하기"}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#717680] dark:text-[#9ca3af]">
              * 매일 오전 12:00 ~ 오후 11:59 출석 가능/ 여러 계정 보유시 1일
              1계정만 가능
            </p>

            {/* 주간 출석체크 카드 */}
            <div className="rounded-lg border border-[#00C4AF] bg-[#FFF5FB] p-5 dark:bg-[#1F242F]">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <span
                      className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862] dark:text-[#94969C]"
                      style={{
                        background:
                          "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)",
                      }}
                    >
                      주간 출석
                    </span>
                    <p className="text-sm text-black dark:text-white">
                      매주 출석하고 젤리 받기
                    </p>
                    <p className="text-base font-semibold text-black dark:text-white">
                      냥젤리 800개 받기
                    </p>
                  </div>
                  <PawPrint className="size-11 text-[#F5A3C7] opacity-40" />
                </div>
                <button
                  type="button"
                  onClick={handleWeeklyCheckin}
                  disabled={
                    weeklyCheckinSuccess ||
                    weeklyFetcher.state !== "idle"
                  }
                  className="w-full rounded-lg border border-white px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(-68deg, #00C4AF 5%, #FF6DC0 98%)",
                  }}
                >
                  {weeklyCheckinSuccess
                    ? "출석 완료!"
                    : "주간 출석체크 하기"}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#717680] dark:text-[#9ca3af]">
              * 매일 오전 12:00 ~ 오후 11:59 출석 가능/ 여러 계정 보유시 1일
              1계정만 가능
            </p>

            {/* 달성 배지 링크 */}
            <Link
              to="/badges"
              className="flex items-center justify-between rounded-lg border border-[#00C4AF] bg-[#FFF5FB] p-5 dark:bg-[#1F242F]"
            >
              <div className="flex flex-col gap-[5px]">
                <span
                  className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862] dark:text-[#94969C]"
                  style={{
                    background:
                      "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)",
                  }}
                >
                  달성 뱃지
                </span>
                <p className="text-sm text-black dark:text-white">
                  달성 뱃지 획득하고 냥젤리 받기
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-[#717680] dark:text-[#9ca3af]" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
