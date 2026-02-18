# F6 채팅방 Phase 4: 캐릭터 정보 모달 + 젤리 구매 플로우

## 개요
캐릭터 카드 클릭 시 정보 모달(4변형), 이미지 캐러셀, 젤리 잔액 표시, 소진 알림 모달, 구매 Sheet를 구현한다. Phase 1 완료 필수.

**전제조건**: Phase 1 (스키마 + 리팩토링) 완료

## 생성/수정 파일 목록

| # | 파일 | 유형 |
|---|------|------|
| 1 | `characters/components/character-info-modal.tsx` | 생성 |
| 2 | `characters/components/image-carousel.tsx` | 생성 |
| 3 | `points/components/jelly-depletion-modal.tsx` | 생성 |
| 4 | `points/components/jelly-purchase-sheet.tsx` | 생성 |
| 5 | `chat/hooks/use-jelly-balance.ts` | 생성 |
| 6 | `chat/components/jelly-display.tsx` | 생성 |
| 7 | `characters/api/detail.tsx` | 수정 |
| 8 | `chat/screens/chat.tsx` | 수정 |
| 9 | `chat/api/chat.tsx` | 수정 |
| 10 | `home/screens/home.tsx` | 수정 |
| 11 | `characters/screens/character-list.tsx` | 수정 |
| 12 | `payments/screens/success.tsx` | 수정 |

---

## 1. `characters/components/image-carousel.tsx` (생성)

순수 CSS scroll-snap 기반 이미지 캐러셀. 라이브러리 없이 구현한다.

```typescript
/**
 * 이미지 캐러셀: CSS scroll-snap + 도트 인디케이터
 * 터치 스와이프는 scroll-snap이 네이티브로 처리
 */
import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className = "" }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 스크롤 이벤트로 현재 인덱스 추적
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  // 도트 클릭 시 해당 이미지로 스크롤
  const scrollTo = (index: number) => {
    scrollRef.current?.scrollTo({
      left: index * (scrollRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
  };

  // 이미지가 1장이면 캐러셀 없이 그냥 표시
  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[#F5F5F5] dark:bg-[#1F242F] ${className}`}>
        <span className="text-4xl">🐱</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className={`w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className="relative">
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`scrollbar-hide flex snap-x snap-mandatory overflow-x-auto ${className}`}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            className="w-full flex-shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {/* 도트 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex
                ? "bg-white"
                : "bg-white/50"
            }`}
            aria-label={`이미지 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 2. `characters/components/character-info-modal.tsx` (생성)

캐릭터 정보 모달. 4가지 변형을 하나의 컴포넌트에서 조건부 렌더링한다.

**변형:**
- Default: 이미지 캐러셀, 이름, 태그라인, 설명, 태그, 통계(좋아요/대화/조회), 크리에이터, [대화 시작하기]
- With existing room: + [이어서 대화하기] 버튼 (기존 room_id로 navigate)
- Liked state: 하트 아이콘 채움, 좋아요 카운트 반영
- Creator view: + [수정하기] 버튼

```typescript
/**
 * 캐릭터 정보 모달
 *
 * 홈, 캐릭터 목록에서 카드 클릭 시 열림.
 * useFetcher로 캐릭터 상세 데이터를 로드한다.
 */
import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Heart, MessageCircle, Eye, Pencil, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "~/core/components/ui/dialog";

import { ImageCarousel } from "./image-carousel";

interface CharacterInfoModalProps {
  characterId: number | null; // null이면 모달 닫힘
  onClose: () => void;
}

export function CharacterInfoModal({
  characterId,
  onClose,
}: CharacterInfoModalProps) {
  const fetcher = useFetcher();
  const likeFetcher = useFetcher();
  const navigate = useNavigate();

  // 캐릭터 상세 데이터 fetch
  useEffect(() => {
    if (characterId) {
      fetcher.load(`/api/characters/${characterId}`);
    }
  }, [characterId]);

  const character = fetcher.data?.character;
  const isLoading = fetcher.state === "loading";

  // 좋아요 로컬 상태 (optimistic)
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // character 데이터가 로드되면 좋아요 상태 동기화
  useEffect(() => {
    if (character) {
      setIsLiked(character.isLiked ?? false);
      setLikeCount(character.like_count ?? 0);
    }
  }, [character]);

  // 좋아요 토글
  const handleLike = () => {
    if (!character) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev) => prev + (newLikedState ? 1 : -1));

    likeFetcher.submit(
      { character_id: character.character_id },
      {
        method: newLikedState ? "POST" : "DELETE",
        action: "/api/characters/like",
        encType: "application/json",
      }
    );
  };

  // 대화 시작 (새 룸 생성)
  const handleStartChat = () => {
    if (!character) return;
    // character detail 페이지의 action이 룸을 생성한다
    // 직접 navigate하면 detail 페이지의 form action이 실행됨
    navigate(`/characters/${character.character_id}`, {
      state: { startChat: true },
    });
    onClose();
  };

  // 이어서 대화하기 (기존 룸으로 이동)
  const handleContinueChat = () => {
    if (!character?.existingRoomId) return;
    navigate(`/chat/${character.existingRoomId}`);
    onClose();
  };

  // 수정하기 (크리에이터 전용)
  const handleEdit = () => {
    if (!character) return;
    navigate(`/characters/${character.character_id}/edit`);
    onClose();
  };

  // 이미지 목록 구성: avatar_url + gallery_urls
  const images: string[] = [];
  if (character?.avatar_url) images.push(character.avatar_url);
  if (character?.gallery_urls && Array.isArray(character.gallery_urls)) {
    images.push(...character.gallery_urls.filter((url: string) => url));
  }
  if (character?.banner_url && !images.includes(character.banner_url)) {
    images.push(character.banner_url);
  }

  return (
    <Dialog open={!!characterId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c4af] border-t-transparent" />
          </div>
        ) : character ? (
          <div className="flex flex-col">
            {/* 이미지 캐러셀 */}
            <ImageCarousel
              images={images}
              alt={character.display_name || character.name}
              className="aspect-square rounded-t-lg"
            />

            {/* 콘텐츠 영역 */}
            <div className="flex flex-col gap-3 p-5">
              {/* 이름 + 좋아요 */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#181D27] dark:text-white">
                    {character.display_name || character.name}
                  </h2>
                  {character.tagline && (
                    <p className="mt-0.5 text-sm text-[#535862] dark:text-[#94969C]">
                      {character.tagline}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLike}
                  className="flex items-center gap-1 rounded-full p-2 transition-colors hover:bg-[#F5F5F5] dark:hover:bg-[#333741]"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-[#A4A7AE] dark:text-[#717680]"
                    }`}
                  />
                  <span className="text-xs text-[#535862] dark:text-[#94969C]">
                    {likeCount}
                  </span>
                </button>
              </div>

              {/* 설명 */}
              {character.description && (
                <p className="text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
                  {character.description}
                </p>
              )}

              {/* 태그 */}
              {character.tags && character.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {character.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[#F5F5F5] px-3 py-1 text-xs text-[#535862] dark:bg-[#333741] dark:text-[#94969C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 통계 */}
              <div className="flex items-center gap-4 text-xs text-[#717680] dark:text-[#94969C]">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {character.chat_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {character.view_count ?? 0}
                </span>
              </div>

              {/* 크리에이터 정보 (있으면) */}
              {character.creatorName && (
                <p className="text-xs text-[#717680] dark:text-[#94969C]">
                  by {character.creatorName}
                </p>
              )}

              {/* CTA 버튼 영역 */}
              <div className="mt-2 flex flex-col gap-2">
                {/* 메인 CTA: 대화 시작하기 */}
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="w-full rounded-lg bg-[#00c4af] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00b39e]"
                >
                  대화 시작하기
                </button>

                {/* 기존 룸이 있으면: 이어서 대화하기 */}
                {character.existingRoomId && (
                  <button
                    type="button"
                    onClick={handleContinueChat}
                    className="w-full rounded-lg border border-[#D5D7DA] bg-white py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
                  >
                    이어서 대화하기
                  </button>
                )}

                {/* 크리에이터 전용: 수정하기 */}
                {character.isCreator && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#D5D7DA] bg-white py-3 text-sm font-semibold text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:bg-[#1F242F] dark:text-[#D5D7DA] dark:hover:bg-[#333741]"
                  >
                    <Pencil className="h-4 w-4" />
                    수정하기
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-[#535862]">
            캐릭터를 찾을 수 없습니다
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 3. `points/components/jelly-depletion-modal.tsx` (생성)

"젤리가 모두 소진되었어요" 알림 모달. AlertDialog 사용.

```typescript
/**
 * 젤리 소진 알림 모달
 *
 * 채팅 중 포인트 부족 시 표시.
 * [취소] → 모달 닫기, [구매하기] → 구매 Sheet 열기
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/core/components/ui/alert-dialog";

interface JellyDepletionModalProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

export function JellyDepletionModal({
  open,
  onClose,
  onPurchase,
}: JellyDepletionModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg">
            젤리가 모두 소진되었어요
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            대화를 계속하려면 젤리를 충전해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 rounded-lg border-[#D5D7DA] dark:border-[#414651]"
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onPurchase}
            className="flex-1 rounded-lg bg-[#00c4af] text-white hover:bg-[#00b39e]"
          >
            구매하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## 4. `points/components/jelly-purchase-sheet.tsx` (생성)

구매 Sheet: 6개 패키지 라디오 선택 + 결제 수단 4종 + 환불 정책 + [적용하기].

```typescript
/**
 * 젤리 구매 Sheet
 *
 * 6개 패키지 라디오, 결제 수단 선택, 환불 정책, [적용하기] 버튼.
 * 기존 POINT_PACKAGES를 재사용한다.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, Smartphone, Building, Gift } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/core/components/ui/sheet";

import { POINT_PACKAGES, type PointPackageId } from "~/features/points/lib/packages";

interface JellyPurchaseSheetProps {
  open: boolean;
  onClose: () => void;
  /** 구매 완료 후 돌아올 URL (예: /chat/123) */
  returnTo?: string;
}

const PAYMENT_METHODS = [
  { id: "card", label: "신용/체크카드", icon: CreditCard },
  { id: "phone", label: "휴대폰 결제", icon: Smartphone },
  { id: "bank", label: "계좌이체", icon: Building },
  { id: "gift", label: "상품권", icon: Gift },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function JellyPurchaseSheet({
  open,
  onClose,
  returnTo,
}: JellyPurchaseSheetProps) {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<PointPackageId>("premium");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>("card");

  const selectedPkg = POINT_PACKAGES.find((p) => p.id === selectedPackage);

  const handlePurchase = () => {
    // Toss Payments checkout으로 이동
    // returnTo를 쿼리 파라미터로 전달하여 결제 완료 후 돌아올 수 있도록
    const params = new URLSearchParams({
      package: selectedPackage,
      payment: selectedPayment,
      ...(returnTo ? { returnTo } : {}),
    });
    navigate(`/payments/checkout?${params.toString()}`);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">젤리 구매</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-6">
          {/* 패키지 선택 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
              패키지 선택
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {POINT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative flex flex-col rounded-lg border p-3 text-left transition-colors ${
                    selectedPackage === pkg.id
                      ? "border-[#00c4af] bg-[#00c4af]/5"
                      : "border-[#E9EAEB] hover:border-[#D5D7DA] dark:border-[#333741] dark:hover:border-[#414651]"
                  }`}
                >
                  {pkg.recommended && (
                    <span className="absolute -top-2 right-2 rounded-full bg-[#00c4af] px-2 py-0.5 text-[10px] font-bold text-white">
                      추천
                    </span>
                  )}
                  <span className="text-sm font-bold text-[#181D27] dark:text-white">
                    {pkg.label}
                  </span>
                  <span className="text-xs text-[#535862] dark:text-[#94969C]">
                    {pkg.points.toLocaleString()}젤리
                    {pkg.bonusPoints > 0 && (
                      <span className="ml-1 text-[#00c4af]">
                        +{pkg.bonusPoints.toLocaleString()}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-[#181D27] dark:text-white">
                    {pkg.price.toLocaleString()}원
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 결제 수단 선택 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#181D27] dark:text-white">
              결제 수단
            </h3>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedPayment === method.id
                        ? "border-[#00c4af] bg-[#00c4af]/5"
                        : "border-[#E9EAEB] hover:border-[#D5D7DA] dark:border-[#333741] dark:hover:border-[#414651]"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-[#535862] dark:text-[#94969C]" />
                    <span className="text-sm font-medium text-[#181D27] dark:text-white">
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 환불 정책 */}
          <p className="text-xs leading-relaxed text-[#717680] dark:text-[#94969C]">
            구매한 젤리는 사용 전에 한해 7일 이내 환불이 가능합니다.
            사용된 젤리는 환불이 불가합니다.
            자세한 내용은{" "}
            <a href="/legal/refund-policy" className="underline">
              환불 정책
            </a>
            을 확인해주세요.
          </p>

          {/* 구매 버튼 */}
          <button
            type="button"
            onClick={handlePurchase}
            className="w-full rounded-lg bg-[#00c4af] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#00b39e]"
          >
            {selectedPkg
              ? `${selectedPkg.price.toLocaleString()}원 결제하기`
              : "결제하기"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 5. `chat/hooks/use-jelly-balance.ts` (생성)

젤리 잔액 추적 훅. useFetcher로 `/api/points/balance`를 주기적으로 조회한다.

```typescript
/**
 * 젤리 잔액 추적 훅
 *
 * balance: 현재 잔액
 * isLow: 1000 미만 경고
 * isDepleted: 0 이하 소진
 * refresh(): 수동 새로고침
 */
import { useFetcher } from "react-router";
import { useEffect, useCallback } from "react";

interface UseJellyBalanceReturn {
  balance: number;
  isLow: boolean;
  isDepleted: boolean;
  isLoading: boolean;
  refresh: () => void;
}

const LOW_THRESHOLD = 1000;

export function useJellyBalance(): UseJellyBalanceReturn {
  const fetcher = useFetcher();

  const refresh = useCallback(() => {
    fetcher.load("/api/points/balance");
  }, [fetcher]);

  // 마운트 시 한 번 조회
  useEffect(() => {
    refresh();
  }, []);

  const balance = fetcher.data?.balance ?? 0;

  return {
    balance,
    isLow: balance > 0 && balance < LOW_THRESHOLD,
    isDepleted: balance <= 0,
    isLoading: fetcher.state === "loading",
    refresh,
  };
}
```

---

## 6. `chat/components/jelly-display.tsx` (생성)

채팅 헤더에 표시되는 젤리 잔액 배지.

```typescript
/**
 * 젤리 잔액 표시 배지
 *
 * 헤더 우측에 표시. 잔액에 따라 색상이 변한다.
 * - 정상: 민트
 * - 낮음(< 1000): 주황
 * - 소진(0): 빨강
 */
interface JellyDisplayProps {
  balance: number;
  isLow: boolean;
  isDepleted: boolean;
  onClick?: () => void;
}

export function JellyDisplay({
  balance,
  isLow,
  isDepleted,
  onClick,
}: JellyDisplayProps) {
  const colorClass = isDepleted
    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    : isLow
      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-[#E0F7F5] text-[#00897B] dark:bg-[#00c4af]/10 dark:text-[#00c4af]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${colorClass}`}
    >
      <span>🍬</span>
      <span>{balance.toLocaleString()}</span>
    </button>
  );
}
```

---

## 7. `characters/api/detail.tsx` (수정)

기존 API에 `existingRoomId`와 `isCreator` 필드를 추가로 반환한다.

**수정할 부분**: `loader` 함수 안에서 character 조회 후, 기존 채팅룸 존재 여부 + 크리에이터 여부를 함께 반환.

```
변경 위치: character 데이터 반환 직전 (~line 126-140)

추가할 코드:
```

```typescript
// --- 기존 isLiked 체크 이후에 추가 ---

// Check if user has an existing chat room with this character
import { chatRooms } from "../../chat/schema";

const [existingRoom] = await db
  .select({ room_id: chatRooms.room_id })
  .from(chatRooms)
  .where(
    and(
      eq(chatRooms.user_id, user.id),
      eq(chatRooms.character_id, validParams.id)
    )
  )
  .orderBy(desc(chatRooms.updated_at))
  .limit(1);

const isCreator = character.creator_id === user.id;

// 반환 데이터에 추가
return data(
  {
    character: {
      ...character,
      isLiked,
      existingRoomId: existingRoom?.room_id ?? null,
      isCreator,
    },
  },
  { headers }
);
```

**import 추가** (파일 상단):
```typescript
import { desc } from "drizzle-orm";
import { chatRooms } from "../../chat/schema";
```

---

## 8. `chat/api/chat.tsx` (수정)

포인트 부족 에러에 `code` 필드를 추가하여 클라이언트에서 분기할 수 있도록 한다.

**변경**: 기존 포인트 부족 에러 응답에 `code` 필드 추가.

```
기존 코드 (포인트 부족 에러 부분을 찾아서):
- 에러 메시지가 "Insufficient points" 등으로 반환되는 부분

변경:
```

```typescript
// 포인트 부족 시 에러 응답 (기존 패턴에 code 필드만 추가)
return data(
  {
    error: "Insufficient points",
    code: "INSUFFICIENT_POINTS",
    balance: currentBalance,  // 현재 잔액도 함께 반환
  },
  { status: 402, headers }
);
```

---

## 9. `chat/screens/chat.tsx` (수정)

채팅 화면에 젤리 잔액 표시 + 소진 모달 + 구매 Sheet를 통합한다.

**추가할 import:**
```typescript
import { useJellyBalance } from "../hooks/use-jelly-balance";
import { JellyDisplay } from "../components/jelly-display";
import { JellyDepletionModal } from "~/features/points/components/jelly-depletion-modal";
import { JellyPurchaseSheet } from "~/features/points/components/jelly-purchase-sheet";
```

**추가할 상태:**
```typescript
const { balance, isLow, isDepleted, refresh: refreshBalance } = useJellyBalance();
const [showDepletionModal, setShowDepletionModal] = useState(false);
const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
```

**헤더에 JellyDisplay 추가:**
- 헤더 우측 영역에 `<JellyDisplay>` 배치
- onClick 시 구매 Sheet 열기

```tsx
<JellyDisplay
  balance={balance}
  isLow={isLow}
  isDepleted={isDepleted}
  onClick={() => setShowPurchaseSheet(true)}
/>
```

**스트리밍 에러 처리에 소진 모달 연동:**
- `handleSend` / `handleRegenerate`에서 SSE 에러 수신 시 `code === "INSUFFICIENT_POINTS"` 체크
- 해당 코드면 `setShowDepletionModal(true)` 호출
- 잔액 새로고침 `refreshBalance()` 호출

```typescript
// SSE 에러 처리 부분에 추가
if (errorData.code === "INSUFFICIENT_POINTS") {
  setShowDepletionModal(true);
  refreshBalance();
  return;
}
```

**JSX에 모달/Sheet 추가** (return 문 마지막에):
```tsx
<JellyDepletionModal
  open={showDepletionModal}
  onClose={() => setShowDepletionModal(false)}
  onPurchase={() => {
    setShowDepletionModal(false);
    setShowPurchaseSheet(true);
  }}
/>
<JellyPurchaseSheet
  open={showPurchaseSheet}
  onClose={() => setShowPurchaseSheet(false)}
  returnTo={`/chat/${roomId}`}
/>
```

---

## 10. `home/screens/home.tsx` (수정)

캐릭터 카드 클릭 시 상세 페이지 이동 대신 모달을 연다.

**추가할 import:**
```typescript
import { CharacterInfoModal } from "~/features/characters/components/character-info-modal";
```

**추가할 상태:**
```typescript
const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
```

**VerticalCharacterCard에 onClick 연결:**

기존 `VerticalCharacterCard` 컴포넌트에 `onClick` prop을 전달해야 한다. `VerticalCharacterCard` 내부에서 `<Link>` 대신 클릭 핸들러를 사용하도록 변경하거나, 카드를 감싸는 wrapper에 onClick을 추가.

**방법 A** (VerticalCharacterCard에 onClick prop 추가):
- `VerticalCharacterCard`에 `onClick?: (characterId: number) => void` prop 추가
- onClick이 있으면 `<Link>` 대신 `<button>` 또는 `<div onClick>` 사용

```tsx
{featuredCharacters.map((character) => (
  <VerticalCharacterCard
    key={character.character_id}
    character={character}
    creatorName={character.creator_name}
    creatorBadgeType={character.creator_badge_type}
    onClick={() => setSelectedCharacterId(character.character_id)}
  />
))}
```

**JSX 마지막에 모달 추가:**
```tsx
<CharacterInfoModal
  characterId={selectedCharacterId}
  onClose={() => setSelectedCharacterId(null)}
/>
```

---

## 11. `characters/screens/character-list.tsx` (수정)

home.tsx와 동일한 패턴으로 캐릭터 목록에도 모달을 통합한다.

**동일한 변경 사항:**
- `CharacterInfoModal` import
- `selectedCharacterId` 상태 추가
- 캐릭터 카드 클릭 시 `setSelectedCharacterId(character.character_id)` 호출
- JSX 마지막에 `<CharacterInfoModal>` 추가

---

## 12. `payments/screens/success.tsx` (수정)

결제 완료 후 `returnTo` 파라미터가 있으면 해당 경로로 리다이렉트한다.

**loader 함수에 추가:**
```typescript
// 결제 완료 후 returnTo 파라미터 확인
const returnTo = url.searchParams.get("returnTo");

// ... 기존 결제 검증 로직 ...

// returnTo가 있으면 결제 성공 후 해당 페이지로 리다이렉트
// (보안: 내부 경로만 허용)
return {
  data,
  returnTo: returnTo?.startsWith("/") ? returnTo : null,
};
```

**컴포넌트에 자동 리다이렉트 추가:**
```typescript
import { useNavigate } from "react-router";
import { useEffect } from "react";

// 컴포넌트 내부
const navigate = useNavigate();

useEffect(() => {
  if (loaderData.returnTo) {
    // 3초 후 자동 리다이렉트
    const timer = setTimeout(() => {
      navigate(loaderData.returnTo);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [loaderData.returnTo]);
```

---

## 참고 파일 (읽기 전용 - 수정하지 않음)

| 파일 | 용도 |
|------|------|
| `app/features/characters/api/like.tsx` | 좋아요 토글 패턴 (POST/DELETE, 원자적 카운트) |
| `app/features/characters/screens/detail.tsx` | 좋아요 optimistic UI 패턴 |
| `app/features/points/lib/packages.ts` | 6개 패키지 정의 (POINT_PACKAGES) |
| `app/features/payments/screens/checkout.tsx` | Toss SDK 초기화 패턴 |
| `app/features/characters/api/upload-media.tsx` | 이미지 업로드 패턴 |
| `app/features/home/components/vertical-character-card.tsx` | 기존 카드 컴포넌트 구조 |

## 검증 체크리스트

- [ ] `npm run typecheck` 통과
- [ ] 홈 페이지에서 캐릭터 카드 클릭 → 모달 열림
- [ ] 모달에서 이미지 캐러셀 스와이프 동작
- [ ] 좋아요 토글 → 카운트 즉시 반영 (optimistic)
- [ ] [대화 시작하기] → 룸 생성 후 채팅 이동
- [ ] 기존 룸이 있으면 [이어서 대화하기] 표시
- [ ] 크리에이터 본인의 캐릭터면 [수정하기] 표시
- [ ] 채팅 헤더에 젤리 잔액 배지 표시
- [ ] 잔액 상태에 따라 배지 색상 변경 (정상/경고/소진)
- [ ] 채팅 중 포인트 부족 → 소진 모달 표시
- [ ] 소진 모달 [구매하기] → 구매 Sheet 열림
- [ ] 구매 Sheet에서 패키지/결제수단 선택 → checkout 이동
- [ ] 결제 완료 후 returnTo 파라미터로 채팅 복귀
- [ ] 캐릭터 목록 페이지에서도 동일하게 모달 동작
