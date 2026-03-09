/**
 * 모델 상태 모달 — Figma 픽셀 퍼펙트 (580:1097)
 * 다크 오버레이 + 센터 카드 (w-[400px], rounded-[12px])
 * alert-triangle 아이콘(48px) + "닫기"/"변경하기" 버튼
 */

export type ModelStatus = "stable" | "unstable" | "down";

/* ── Figma 인라인 SVG (Untitled UI alert-triangle) ── */

function AlertTriangleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 17.172 15.0771" fill="none">
      <path
        d="M8.58601 5.32706V8.32706M8.58601 11.3271H8.59351M7.30351 1.47206L0.951014 12.0771C0.82004 12.3039 0.750739 12.561 0.750006 12.8229C0.749273 13.0849 0.817132 13.3424 0.946834 13.57C1.07654 13.7975 1.26356 13.9871 1.4893 14.1199C1.71503 14.2528 1.97161 14.3242 2.23351 14.3271H14.9385C15.2004 14.3242 15.457 14.2528 15.6827 14.1199C15.9085 13.9871 16.0955 13.7975 16.2252 13.57C16.3549 13.3424 16.4228 13.0849 16.422 12.8229C16.4213 12.561 16.352 12.3039 16.221 12.0771L9.86851 1.47206C9.73481 1.25164 9.54656 1.0694 9.32191 0.942921C9.09727 0.816444 8.84382 0.75 8.58601 0.75C8.32821 0.75 8.07476 0.816444 7.85012 0.942921C7.62547 1.0694 7.43722 1.25164 7.30351 1.47206Z"
        stroke="#DC6803"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ModelStatusBannerProps {
  status: ModelStatus;
  currentModel: string;
  recommendedAlternatives?: string[];
  onSwitchModel?: (model: string) => void;
  onClick?: () => void;
  onDismiss?: () => void;
}

export function ModelStatusBanner({
  status,
  onClick,
  onDismiss,
}: ModelStatusBannerProps) {
  if (status === "stable") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,40,0.7)]">
      <div className="flex w-[400px] flex-col gap-[32px] overflow-hidden rounded-[12px] bg-white p-[24px] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)]">
        {/* Content */}
        <div className="flex flex-col gap-[20px]">
          {/* Featured Icon */}
          <div className="flex size-[48px] items-center justify-center rounded-[28px] border-8 border-[#fffaeb] bg-[#fef0c7]">
            <AlertTriangleIcon />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-[8px]">
            <p className="text-[18px] font-semibold leading-[28px] text-[#181d27]">
              모델 상태: 불안정
            </p>
            <div className="text-[14px] leading-[20px] text-[#535862]">
              <p>답변 지연 및 오류가 발생할 수 있어요.</p>
              <p>원활한 사용을 위해 다른 모델 선택을 권장합니다.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-[12px]">
          <button
            type="button"
            onClick={() => onDismiss?.()}
            className="flex flex-1 items-center justify-center rounded-[8px] border border-[#d5d7da] bg-white px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-[#414651] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#f5f5f5]"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => onClick?.()}
            className="flex flex-1 items-center justify-center rounded-[8px] border border-[#36c4b3] bg-[#36c4b3] px-[18px] py-[10px] text-[16px] font-semibold leading-[24px] text-white shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] transition-colors hover:bg-[#2db3a2]"
          >
            변경하기
          </button>
        </div>
      </div>
    </div>
  );
}
