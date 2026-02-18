/**
 * Model Status Banner Component
 * 
 * Displays model status alerts (unstable, recommended alternatives)
 * Dark theme styled for chat interface
 */
import { AlertTriangle } from "lucide-react";

export type ModelStatus = "stable" | "unstable" | "down";

interface ModelStatusBannerProps {
  status: ModelStatus;
  currentModel: string;
  recommendedAlternatives?: string[];
  onSwitchModel?: (model: string) => void;
  onClick?: () => void;
}

export function ModelStatusBanner({
  status,
  currentModel,
  recommendedAlternatives = [],
  onSwitchModel,
  onClick,
}: ModelStatusBannerProps) {
  if (status === "stable") return null;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`mx-4 mt-2 flex items-center gap-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 ${onClick ? "cursor-pointer transition-opacity hover:opacity-90" : ""}`}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#f59e0b]" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#f59e0b]">
          모델 상태: {status === "unstable" ? "불안정" : "중단"}
        </p>
        <p className="text-xs text-[#9ca3af]">
          현재 모델({currentModel})이 불안정합니다. 다른 모델을 권장합니다.
        </p>
      </div>
      {recommendedAlternatives.length > 0 && (
        <div className="flex gap-2">
          {recommendedAlternatives.map((model) => (
            <button
              key={model}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchModel?.(model);
              }}
              className="rounded-md bg-[#f59e0b] px-3 py-1 text-xs font-medium text-white hover:bg-[#d97706]"
            >
              {model}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


