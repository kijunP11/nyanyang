# 냥젤리 포인트 충전 페이지 리빌드 - 구현 명세서

> 레퍼런스: Figma "6. 포인트/결제" 섹션 (crack.wrtn.ai 결제 페이지)
> 기존 checkout.tsx(Toss 데모)와 points.tsx(빈 페이지)를 냥젤리 충전 전용 페이지로 리빌드합니다.

---

## 0. 현재 상태 분석

### 이미 있는 것 (건드리지 않음)
| 파일 | 역할 | 비고 |
|------|------|------|
| `points/schema.ts` | `userPoints`, `pointTransactions` 테이블 | 그대로 사용 |
| `payments/schema.ts` | `payments` 테이블 | 그대로 사용 |
| `points/api/balance.tsx` | GET 잔액 조회 | 그대로 사용 |
| `points/api/history.tsx` | GET 거래 내역 (paginated) | 그대로 사용 |
| `points/api/usage.tsx` | POST 포인트 차감 | 그대로 사용 |
| `payments/api/stripe-checkout.tsx` | Stripe 체크아웃 세션 생성 | **수정 필요** (패키지 확장) |
| `payments/api/stripe-webhook.tsx` | Stripe 웹훅 처리 | 그대로 사용 |
| `payments/screens/success.tsx` | Toss 결제 성공 | 그대로 사용 |
| `payments/screens/failure.tsx` | Toss 결제 실패 | 그대로 사용 |
| `payments/screens/payments.tsx` | 대시보드 결제 내역 | 그대로 사용 |

### 리빌드 대상
| 파일 | 현재 | 변경 |
|------|------|------|
| `points/screens/points.tsx` | 빈 데모 페이지 | **냥젤리 충전 메인 페이지** |
| `payments/screens/checkout.tsx` | Toss NFT 데모 | **Toss 결제 전용 페이지** (냥젤리용) |

### 신규 생성
| 파일 | 역할 |
|------|------|
| `points/components/point-package-card.tsx` | 포인트 상품 카드 컴포넌트 |
| `points/components/point-balance-card.tsx` | 잔액 표시 + 내역 링크 카드 |
| `points/components/point-history-table.tsx` | 거래 내역 테이블 컴포넌트 |

---

## 1. 포인트 상품 구성

레퍼런스 기준 6개 상품 + 보너스 구조:

```typescript
// points/lib/packages.ts

export const POINT_PACKAGES = [
  {
    id: "starter",
    points: 2000,
    bonusPoints: 0,
    price: 2000,
    label: "스타터",
    recommended: false,
  },
  {
    id: "basic",
    points: 4900,
    bonusPoints: 100,       // +100 보너스
    price: 4900,
    label: "베이직",
    recommended: false,
  },
  {
    id: "standard",
    points: 9600,
    bonusPoints: 400,       // +400 보너스
    price: 9600,
    label: "스탠다드",
    recommended: false,
  },
  {
    id: "premium",
    points: 28000,
    bonusPoints: 2000,      // +2,000 보너스
    price: 28000,
    label: "프리미엄",
    recommended: true,       // 추천 뱃지
  },
  {
    id: "pro",
    points: 46000,
    bonusPoints: 4000,      // +4,000 보너스
    price: 46000,
    label: "프로",
    recommended: false,
  },
  {
    id: "mega",
    points: 90000,
    bonusPoints: 10000,     // +10,000 보너스
    price: 90000,
    label: "메가",
    recommended: false,
  },
] as const;

export type PointPackageId = (typeof POINT_PACKAGES)[number]["id"];
```

> **참고:** 기존 `stripe-checkout.tsx`의 `POINT_PACKAGES`는 4개(small/medium/large/mega)인데,
> 이 파일의 패키지 정의를 위의 6개로 교체해야 합니다.

---

## 2. 파일별 구현 명세

### 2-1. `points/lib/packages.ts` (신규)

위 Section 1의 `POINT_PACKAGES` 배열 + `PointPackageId` 타입을 export합니다.

---

### 2-2. `points/components/point-balance-card.tsx` (신규)

**잔액 표시 카드.** Figma 상단의 "나의 크래커 🍪 110개 / 전액 내역" 영역 대응.

```
┌─────────────────────────────────────────┐
│ 나의 냥젤리                              │
│ 🐱 12,500개                    전액 내역 →│
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface PointBalanceCardProps {
  currentBalance: number;
}
```

**구현:**
- 다크 테마: `bg-[#232323] border-[#3f3f46] rounded-xl p-6`
- 좌측: "나의 냥젤리" 라벨 + 🐱 이모지 + `currentBalance.toLocaleString()` + "개"
- 우측: "전액 내역" 링크 → `/dashboard/payments` (텍스트 버튼, `text-[#14b8a6]`)

---

### 2-3. `points/components/point-package-card.tsx` (신규)

**개별 포인트 상품 카드.** 라디오 선택 가능한 카드.

```
┌──────────────────────┐
│ ○  🐱                │
│    2,000개    2,000원 │
│                      │
└──────────────────────┘

┌──────────────────────┐  ← 선택됨 (추천 상품)
│ ◉  🐱       추천     │
│    28,000개  28,000원 │
│    +2,000             │
└──────────────────────┘
```

**Props:**
```typescript
interface PointPackageCardProps {
  package: typeof POINT_PACKAGES[number];
  selected: boolean;
  onSelect: () => void;
}
```

**구현:**
- 기본: `bg-[#232323] border-[#3f3f46] rounded-xl p-4 cursor-pointer`
- 선택됨: `border-[#14b8a6] border-2`
- 추천 뱃지: `recommended === true`일 때 우측 상단에 `bg-[#14b8a6] text-white text-xs px-2 py-0.5 rounded` "추천"
- 라디오 아이콘: 좌측 상단 원형 (선택 시 `bg-[#14b8a6]`)
- 아이콘: 🐱 (또는 냥젤리 아이콘)
- 포인트: `{points.toLocaleString()}개` (굵게)
- 보너스: `bonusPoints > 0`이면 `+{bonusPoints.toLocaleString()}` (작은 텍스트, `text-[#14b8a6]`)
- 가격: `{price.toLocaleString()}원` (우측, `text-[#14b8a6]` 강조)

**그리드:** 2열 그리드 (`grid grid-cols-2 gap-4`)

---

### 2-4. `points/components/point-history-table.tsx` (신규)

**거래 내역 테이블.** "전액 내역" 탭 아래 표시.

**Props:**
```typescript
interface PointHistoryTableProps {
  transactions: Array<{
    transaction_id: number;
    amount: number;
    balance_after: number;
    type: string;
    reason: string;
    created_at: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**구현:**
- shadcn Table 사용
- 컬럼: 일시 | 구분 | 내용 | 금액 | 잔액
- 구분 뱃지: charge → "충전" (green), usage → "사용" (red), reward → "보상" (blue)
- 금액: 양수 `+{amount}` (green), 음수 `{amount}` (red)
- 빈 상태: "거래 내역이 없습니다"
- 페이지네이션: 이전/다음 버튼

---

### 2-5. `points/screens/points.tsx` (리빌드)

**냥젤리 충전 메인 페이지.** Figma 레퍼런스의 전체 레이아웃.

**라우트:** `/points` (기존 유지)

**Loader:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const db = drizzle;

  // 병렬 fetch: 잔액 + 거래 내역
  const [pointBalance, transactions] = await Promise.all([
    db.select()
      .from(userPoints)
      .where(eq(userPoints.user_id, user.id))
      .limit(1)
      .then(([r]) => r || { current_balance: 0, total_earned: 0, total_spent: 0 }),

    db.select({
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

  return data({ user, balance: pointBalance, recentTransactions: transactions }, { headers });
}
```

**레이아웃:**
```
┌───────────────────────────────────────────────┐
│ 냥젤리 🐱  (타이틀)                            │
├───────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐   │
│ │ 나의 냥젤리  🐱 12,500개     전액 내역 → │   │
│ └─────────────────────────────────────────┘   │
│                                               │
│ ┌─ 탭 ──────────────────────────────────────┐ │
│ │ [구매하기]  [무료로 받기]                   │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ === 구매하기 탭 ===                            │
│ 냥젤리 상품 구성                               │
│ ┌──────────┐  ┌──────────┐                    │
│ │ 2,000개  │  │ 4,900개  │                    │
│ │ 2,000원  │  │ 4,900원  │                    │
│ └──────────┘  └──────────┘                    │
│ ┌──────────┐  ┌──────────┐                    │
│ │ 9,600개  │  │ 28,000개 │  ← 추천            │
│ │ 9,600원  │  │ 28,000원 │                    │
│ └──────────┘  └──────────┘                    │
│ ┌──────────┐  ┌──────────┐                    │
│ │ 46,000개 │  │ 90,000개 │                    │
│ │ 46,000원 │  │ 90,000원 │                    │
│ └──────────┘  └──────────┘                    │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │           [결제하기] (CTA)                 │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ === 무료로 받기 탭 ===                         │
│ - 출석체크 (매일 냥젤리 획득) → /attendance    │
│ - 친구 초대 (추천 코드 공유) → 추천 코드 복사  │
│ - 이벤트 참여 → /blog                         │
│                                               │
│ 최근 거래 내역 (최근 10건)                     │
│ ┌───────────────────────────────────────────┐ │
│ │ 테이블: 일시 | 구분 | 내용 | 금액 | 잔액   │ │
│ └───────────────────────────────────────────┘ │
│ 더보기 → /dashboard/payments                  │
└───────────────────────────────────────────────┘
```

**컴포넌트 구조:**
```tsx
<div className="min-h-screen bg-[#111111]">
  <div className="container mx-auto max-w-2xl px-4 py-8">
    {/* 타이틀 */}
    <h1>냥젤리 🐱</h1>

    {/* 잔액 카드 */}
    <PointBalanceCard currentBalance={balance.current_balance} />

    {/* 탭: 구매하기 / 무료로 받기 */}
    <Tabs defaultValue="purchase">
      <TabsList>
        <TabsTrigger value="purchase">구매하기</TabsTrigger>
        <TabsTrigger value="free">무료로 받기</TabsTrigger>
      </TabsList>

      <TabsContent value="purchase">
        {/* 상품 그리드 */}
        <h3>냥젤리 상품 구성</h3>
        <div className="grid grid-cols-2 gap-4">
          {POINT_PACKAGES.map(pkg => (
            <PointPackageCard
              key={pkg.id}
              package={pkg}
              selected={selectedPackage === pkg.id}
              onSelect={() => setSelectedPackage(pkg.id)}
            />
          ))}
        </div>

        {/* 결제하기 CTA */}
        <Button onClick={handlePurchase} disabled={!selectedPackage}>
          결제하기
        </Button>
      </TabsContent>

      <TabsContent value="free">
        {/* 무료 획득 방법 카드 리스트 */}
        <FreePointMethods />
      </TabsContent>
    </Tabs>

    {/* 최근 거래 내역 */}
    <PointHistoryTable
      transactions={recentTransactions}
      pagination={...}
    />
  </div>
</div>
```

**결제 플로우 (handlePurchase):**
```typescript
const handlePurchase = async () => {
  if (!selectedPackage) return;

  // Stripe 체크아웃 세션 생성
  const response = await fetch("/api/payments/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package: selectedPackage }),
  });

  const result = await response.json();

  if (result.success && result.checkout_url) {
    // Stripe 체크아웃 페이지로 리다이렉트
    window.location.href = result.checkout_url;
  } else {
    // 에러 처리
    alert(result.error || "결제 세션 생성에 실패했습니다.");
  }
};
```

---

### 2-6. `payments/api/stripe-checkout.tsx` (수정)

**변경 사항:** `POINT_PACKAGES` 객체를 6개 패키지로 확장.

```typescript
// 기존 4개 → 6개로 교체
const POINT_PACKAGES = {
  starter:  { points: 2000,  price: 2000,  name: "스타터 패키지" },
  basic:    { points: 4900,  price: 4900,  name: "베이직 패키지" },
  standard: { points: 9600,  price: 9600,  name: "스탠다드 패키지" },
  premium:  { points: 28000, price: 28000, name: "프리미엄 패키지" },
  pro:      { points: 46000, price: 46000, name: "프로 패키지" },
  mega:     { points: 90000, price: 90000, name: "메가 패키지" },
} as const;

// bodySchema도 업데이트
const bodySchema = z.object({
  package: z.enum(["starter", "basic", "standard", "premium", "pro", "mega"]),
});
```

**나머지 로직은 변경 없음** (Stripe 세션 생성, 웹훅 처리 등 동일).

> **주의:** `stripe-webhook.tsx`는 `metadata.points` 값을 그대로 사용하므로 수정 불필요.

---

### 2-7. `payments/screens/checkout.tsx` (리빌드)

**현재:** Toss Payments NFT 데모 (하드코딩 10,000원)
**변경:** 냥젤리 Toss 결제 전용 페이지

> **참고:** 현재 프로젝트는 Stripe와 Toss 두 가지 결제를 모두 지원합니다.
> - Stripe: `points.tsx`에서 호출 → Stripe 호스팅 결제 페이지로 리다이렉트
> - Toss: `checkout.tsx`에서 위젯 렌더링 → 인앱 결제

> 이번 리빌드에서는 **Stripe 결제 플로우를 메인으로 사용**합니다.
> Toss checkout은 향후 필요 시 별도 개선합니다.
> 따라서 `checkout.tsx`는 **건드리지 않아도 됩니다.**

---

## 3. 라우트 변경

`app/routes.ts`에 변경 사항 **없음**.

기존 라우트 그대로 사용:
```
/points              → points/screens/points.tsx     (리빌드)
/payments/checkout   → payments/screens/checkout.tsx  (기존 유지)
```

---

## 4. 다크 테마 토큰

마이페이지와 동일한 토큰 사용:
```
페이지: bg-[#111111]
카드: bg-[#232323]
보더: border-[#3f3f46]
텍스트: text-white / text-[#9ca3af]
액센트: bg-[#14b8a6] / text-[#14b8a6]
CTA 버튼: bg-[#14b8a6] hover:bg-[#0d9488] text-white
선택 보더: border-[#14b8a6]
뱃지(추천): bg-[#14b8a6] text-white
```

---

## 5. 구현 순서

```
1. points/lib/packages.ts 생성 (상품 정의)
2. payments/api/stripe-checkout.tsx 수정 (패키지 6개로 확장)
3. points/components/ 3개 컴포넌트 생성
   - point-balance-card.tsx
   - point-package-card.tsx
   - point-history-table.tsx
4. points/screens/points.tsx 리빌드
5. npm run typecheck 확인
```

---

## 6. 참조 파일

| 파일 | 참조 내용 |
|------|----------|
| `points/schema.ts` | `userPoints`, `pointTransactions` 테이블 구조 |
| `payments/api/stripe-checkout.tsx` | Stripe 세션 생성 패턴, 패키지 정의 |
| `payments/api/stripe-webhook.tsx` | 웹훅 처리 (수정 불필요, 참고용) |
| `points/api/balance.tsx` | 잔액 조회 패턴 |
| `points/api/history.tsx` | 거래 내역 조회 패턴 |
| `users/screens/dashboard.tsx` | 다크 테마 레이아웃 참조 |
| `users/components/mypage-sidebar-card.tsx` | 다크 테마 카드 컴포넌트 참조 |

---

## 7. 검증

1. `npm run typecheck` — 타입 에러 0건
2. `/points` — 잔액 카드 + 상품 그리드 + 탭 전환 렌더링
3. 상품 선택 → "결제하기" 클릭 → Stripe 체크아웃 리다이렉트
4. 구매하기/무료로 받기 탭 전환 동작
5. 최근 거래 내역 테이블 렌더링
