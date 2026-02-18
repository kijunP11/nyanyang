# 냥젤리 페이지 리디자인 (`/points`)

## 개요
`/points` (냥젤리 충전) 페이지를 Figma F8 디자인 기반으로 전면 리디자인한다.
- 다크 테마 → 라이트(흰색) 테마
- 2열 그리드 카드 → 세로 라디오 리스트
- 결제 수단 선택 섹션 추가
- 환불 정책 텍스트 추가
- "무료로 받기" 탭: 출석체크 카드 2개 (매일/주간)

## 수정/삭제 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `features/points/screens/points.tsx` | 전면 리디자인 |
| 2 | `features/points/components/point-balance-card.tsx` | 전면 리디자인 |
| 3 | `features/points/components/point-package-card.tsx` | **삭제** |

`point-history-table.tsx`, `jelly-purchase-sheet.tsx`, `jelly-depletion-modal.tsx`, `packages.ts`는 수정하지 않음.

---

## 1. `features/points/screens/points.tsx` (전면 리디자인)

### Loader 변경

`recentTransactions` fetch를 제거하고 balance만 유지한다.

```tsx
import type { Route } from "./+types/points";

import { eq } from "drizzle-orm";
import { PawPrint } from "lucide-react";
import { useState } from "react";
import { data, useFetcher, useLoaderData } from "react-router";

import drizzle from "~/core/db/drizzle-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import PointBalanceCard from "../components/point-balance-card";
import { POINT_PACKAGES, type PointPackageId } from "../lib/packages";
import { userPoints } from "../schema";

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

  const [pointBalance] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.user_id, user.id))
    .limit(1);

  return data(
    { balance: pointBalance?.current_balance ?? 0 },
    { headers }
  );
}
```

### 결제 수단 정의

```tsx
const PAYMENT_METHODS = [
  { id: "card", label: "신용/체크카드" },
  { id: "bank", label: "계좌 이체" },
  { id: "phone", label: "휴대폰 결제" },
  { id: "gift", label: "문화상품권" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];
```

### 환불 정책 텍스트

```tsx
const REFUND_POLICY_LINES = [
  "모든 결제 상품은 결제일로부터 7일 이내 환불을 요청할 수 있습니다.",
  "7일 이내라도 구매한 냥젤리를 사용한 이력이 있을 경우 환불이 불가능합니다.",
  "사용 이력이 있는 경우, 남은 냥젤리에 대한 부분 환불은 불가합니다.",
  "답변 품질이나 개인적인 만족도에 따른 환불 요청은 불가능합니다.",
  "환불 관련 문의는 앱 결제 시 구글 플레이 또는 애플 고객센터를 통해,\n  웹 결제 시에는 나냥 고객센터를 통해 가능합니다.",
  "그 외 모든 문의는 나냥 고객센터로 연락해주세요.",
];
```

### 컴포넌트 UI 전체

```tsx
export default function PointsScreen() {
  const { balance } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"purchase" | "free">("purchase");
  const [selectedPackage, setSelectedPackage] = useState<PointPackageId>("premium");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>("card");
  const [isLoading, setIsLoading] = useState(false);
  const attendanceFetcher = useFetcher();

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

  const handleCheckin = () => {
    attendanceFetcher.submit(null, {
      method: "POST",
      action: "/api/attendance/checkin",
    });
  };

  const checkinSuccess = attendanceFetcher.data?.success === true;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 py-10 flex flex-col gap-5">
        {/* 타이틀 */}
        <h1 className="text-xl font-semibold text-black">냥젤리</h1>

        {/* 잔액 카드 */}
        <PointBalanceCard currentBalance={balance} />

        {/* 커스텀 언더라인 탭 */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("purchase")}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <span className={`text-sm font-semibold ${activeTab === "purchase" ? "text-black" : "text-[#535862]"}`}>
              구매하기
            </span>
            <div className={`h-1 w-full ${activeTab === "purchase" ? "bg-[#414141]" : "bg-[#D9D9D9]"}`} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("free")}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <span className={`text-sm font-semibold ${activeTab === "free" ? "text-black" : "text-[#535862]"}`}>
              무료로 받기
            </span>
            <div className={`h-1 w-full ${activeTab === "free" ? "bg-[#414141]" : "bg-[#D9D9D9]"}`} />
          </button>
        </div>

        {/* 구매하기 탭 */}
        {activeTab === "purchase" && (
          <div className="flex flex-col gap-6">
            {/* 패키지 라디오 리스트 */}
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
                        : "border-[#D5D7DA]"
                    }`}
                    style={isSelected ? {
                      backgroundImage: "linear-gradient(-52deg, rgba(0,196,175,0.2) 5.5%, rgba(255,195,229,0.2) 83%)",
                    } : undefined}
                  >
                    {/* 라디오 아이콘 */}
                    <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-[#00C4AF] bg-[#00C4AF]" : "border-[#D5D7DA]"
                    }`}>
                      {isSelected && <div className="size-2.5 rounded-full bg-white" />}
                    </div>

                    {/* 발바닥 아이콘 + 포인트 + 가격 */}
                    <div className="flex flex-1 items-center">
                      <PawPrint className="size-6 text-[#F5A3C7] shrink-0" />
                      <div className="flex-1 text-right">
                        <p className="text-base font-semibold text-[#252B37]">
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

            {/* 결제 수단 */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold text-black">결제 수단</h2>
              <div className="flex flex-col">
                {PAYMENT_METHODS.map((method, idx) => (
                  <div key={method.id}>
                    {idx > 0 && <div className="h-px bg-[#E9EAEB]" />}
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex items-center gap-[9px] px-[14px] py-[13px] w-full"
                    >
                      {/* 라디오 아이콘 */}
                      <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPayment === method.id
                          ? "border-[#00C4AF] bg-[#00C4AF]"
                          : "border-[#D5D7DA]"
                      }`}>
                        {selectedPayment === method.id && (
                          <div className="size-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-base font-semibold text-[#252B37]">
                        {method.label}
                      </span>
                    </button>
                  </div>
                ))}
                {/* 마지막 구분선 */}
                <div className="h-px bg-[#E9EAEB]" />
              </div>
            </div>

            {/* 환불 정책 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-black">환불 정책</p>
              <div className="text-xs leading-[18px] text-[#717680]">
                {REFUND_POLICY_LINES.map((line, i) => (
                  <p key={i}>- {line}</p>
                ))}
              </div>
            </div>

            {/* 적용하기 CTA */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={!selectedPackage || isLoading}
              className="w-full rounded-lg bg-[#36C4B3] border border-[#36C4B3] px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {isLoading ? "처리 중..." : "적용하기"}
            </button>
          </div>
        )}

        {/* 무료로 받기 탭 */}
        {activeTab === "free" && (
          <div className="flex flex-col gap-[10px]">
            {/* 매일 출석 카드 */}
            <div className="rounded-lg border border-[#00C4AF] bg-[#FFF5FB] p-5">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <span className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862]"
                      style={{ background: "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)" }}>
                      매일 출석
                    </span>
                    <p className="text-sm text-black">매일 출석하고 젤리 받기</p>
                    <p className="text-base font-semibold text-black">냥젤리 400개 받기</p>
                  </div>
                  <PawPrint className="size-11 text-[#F5A3C7] opacity-40" />
                </div>
                <button
                  type="button"
                  onClick={handleCheckin}
                  disabled={checkinSuccess || attendanceFetcher.state !== "idle"}
                  className="w-full rounded-lg border border-white px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
                  style={{ backgroundImage: "linear-gradient(-68deg, #00C4AF 5%, #FF6DC0 98%)" }}
                >
                  {checkinSuccess ? "출석 완료!" : "일간 출석체크 하기"}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#717680]">
              * 매일 오전 12:00 ~ 오후 11:59 출석 가능/ 여러 계정 보유시 1일 1계정만 가능
            </p>

            {/* 주간 출석 카드 */}
            <div className="rounded-lg border border-[#00C4AF] bg-[#FFEEF8] p-5">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 flex-col gap-[5px]">
                    <span className="inline-flex w-fit items-center rounded px-2 py-1 text-sm text-[#535862]"
                      style={{ background: "linear-gradient(90deg, #FFC3E5 0%, #FFC3E5 100%)" }}>
                      주간 출석
                    </span>
                    <p className="text-sm text-black">매주 출석하고 젤리 받기</p>
                    <p className="text-base font-semibold text-black">냥젤리 800개 받기</p>
                  </div>
                  <PawPrint className="size-11 text-[#F5A3C7] opacity-40" />
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-lg border border-white px-[18px] py-[10px] text-base font-semibold text-white shadow-sm disabled:opacity-50"
                  style={{ backgroundImage: "linear-gradient(-68deg, #00C4AF 5%, #FF6DC0 98%)" }}
                >
                  주간 출석체크 하기
                </button>
              </div>
            </div>
            <p className="text-xs text-[#717680] pb-10">
              * 매일 오전 12:00 ~ 오후 11:59 출석 가능/ 여러 계정 보유시 1일 1계정만 가능
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 핵심 포인트

1. **커스텀 탭**: shadcn `Tabs` 사용하지 않음. 직접 `useState`로 탭 전환, 하단 4px bar로 활성 표시
2. **패키지 라디오**: `POINT_PACKAGES.map()` → 세로 리스트, 선택 시 gradient bg + teal border
3. **결제 수단 라디오**: 4개 항목, `#E9EAEB` 구분선으로 분리
4. **환불 정책**: `REFUND_POLICY_LINES` 배열로 관리
5. **CTA "적용하기"**: 기존 Stripe checkout 플로우 유지 (`POST /api/payments/stripe/checkout → redirect`)
6. **출석 CTA**: `useFetcher` → `POST /api/attendance/checkin`
7. **주간 출석체크**: 현재 API 미지원이므로 `disabled` 처리 (추후 구현)

---

## 2. `features/points/components/point-balance-card.tsx` (전면 리디자인)

```tsx
import { PawPrint } from "lucide-react";

interface PointBalanceCardProps {
  currentBalance: number;
}

export default function PointBalanceCard({
  currentBalance,
}: PointBalanceCardProps) {
  return (
    <div className="rounded-lg border border-[#D5D7DA] bg-[#F5F5F5] p-[14px]">
      <p className="text-xs text-black">내가 보유한 냥젤리</p>
      <div className="flex items-center gap-1">
        <PawPrint className="size-6 text-[#F5A3C7]" />
        <span className="text-xl font-semibold text-black">
          {currentBalance.toLocaleString()}개
        </span>
      </div>
    </div>
  );
}
```

### 변경 사항
- 다크 테마(`bg-[#232323]`, `text-white`) → 라이트 테마(`bg-[#F5F5F5]`, `text-black`)
- cat emoji(🐱) → `PawPrint` lucide 아이콘
- "나의 냥젤리" → "내가 보유한 냥젤리"
- Link 제거 (이 페이지에서 전액 내역 링크 불필요)

---

## 3. `features/points/components/point-package-card.tsx` (삭제)

이 파일은 `points.tsx`에서만 import되고 있다. 리디자인 후 인라인 라디오 리스트로 대체되므로 안전하게 삭제.

```
rm app/features/points/components/point-package-card.tsx
```

---

## 컬러 시스템

| 용도 | 컬러 |
|------|------|
| 페이지 배경 | `bg-white` |
| 잔액 카드 bg | `bg-[#F5F5F5]` |
| 테두리 (기본) | `border-[#D5D7DA]` |
| 테두리 (선택) | `border-[#00C4AF]` |
| 선택 bg gradient | `linear-gradient(-52deg, rgba(0,196,175,0.2) 5.5%, rgba(255,195,229,0.2) 83%)` |
| 가격 텍스트 | `text-[#28A393]` |
| 보너스 텍스트 | `text-[#36C4B3]` |
| CTA 버튼 | `bg-[#36C4B3]` |
| 출석 CTA gradient | `linear-gradient(-68deg, #00C4AF 5%, #FF6DC0 98%)` |
| 매일 출석 카드 bg | `bg-[#FFF5FB]` |
| 주간 출석 카드 bg | `bg-[#FFEEF8]` |
| 라벨 배지 bg | `#FFC3E5` |
| 활성 탭 | `text-black` + `bg-[#414141]` bar |
| 비활성 탭 | `text-[#535862]` + `bg-[#D9D9D9]` bar |
| 구분선 | `bg-[#E9EAEB]` |
| 보조 텍스트 | `text-[#717680]` |

---

## 검증

1. `npm run typecheck` 통과 확인
2. `/points` 접속 → 라이트 테마, 잔액 카드 + 커스텀 탭 렌더링
3. "구매하기" 탭:
   - 6개 패키지 세로 리스트, 라디오 선택 동작
   - 선택된 패키지: gradient bg + teal border
   - 보너스 있는 패키지: "+N개" teal 텍스트
   - 결제 수단 4개 라디오 + 구분선
   - 환불 정책 텍스트 7줄
   - "적용하기" 버튼 → Stripe checkout redirect
4. "무료로 받기" 탭:
   - 매일 출석 카드: 핑크 bg, gradient CTA, 클릭 시 출석 처리
   - 주간 출석 카드: 핑크 bg, gradient CTA (disabled)
   - 출석 성공 시 버튼 텍스트 "출석 완료!"로 변경
5. `point-package-card.tsx` 삭제 후 빌드 에러 없는지 확인
