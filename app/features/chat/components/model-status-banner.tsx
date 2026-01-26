/**
 * Model Status Banner Component
 * 
 * Displays model status alerts (unstable, recommended alternatives)
 */
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "~/core/components/ui/alert";
import { Button } from "~/core/components/ui/button";

export type ModelStatus = "stable" | "unstable" | "down";

interface ModelStatusBannerProps {
  status: ModelStatus;
  currentModel: string;
  recommendedAlternatives?: string[];
  onSwitchModel?: (model: string) => void;
}

export function ModelStatusBanner({
  status,
  currentModel,
  recommendedAlternatives = [],
  onSwitchModel,
}: ModelStatusBannerProps) {
  if (status === "stable") return null;

  return (
    <Alert variant="destructive" className="mx-4 mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>모델 상태: 불안정</AlertTitle>
      <AlertDescription className="mt-2">
        현재 사용 중인 모델({currentModel})이 불안정합니다. 다른 모델 사용을
        권장합니다.
        {recommendedAlternatives.length > 0 && (
          <div className="mt-2 flex gap-2">
            {recommendedAlternatives.map((model) => (
              <Button
                key={model}
                variant="outline"
                size="sm"
                onClick={() => onSwitchModel?.(model)}
              >
                {model}로 전환
              </Button>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}


