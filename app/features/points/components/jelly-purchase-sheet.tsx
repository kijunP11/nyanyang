/**
 * 젤리 구매 Sheet
 *
 * 6개 패키지 라디오, 결제 수단 선택, 환불 정책, [적용하기] 버튼.
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
import {
  POINT_PACKAGES,
  type PointPackageId,
} from "~/features/points/lib/packages";

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
  const [selectedPackage, setSelectedPackage] =
    useState<PointPackageId>("premium");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethodId>("card");

  const selectedPkg = POINT_PACKAGES.find((p) => p.id === selectedPackage);

  const handlePurchase = () => {
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
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">젤리 구매</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-6">
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

          <p className="text-xs leading-relaxed text-[#717680] dark:text-[#94969C]">
            구매한 젤리는 사용 전에 한해 7일 이내 환불이 가능합니다. 사용된
            젤리는 환불이 불가합니다. 자세한 내용은{" "}
            <a href="/legal/refund-policy" className="underline">
              환불 정책
            </a>
            을 확인해주세요.
          </p>

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
