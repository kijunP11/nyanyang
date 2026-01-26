/**
 * Stamp Grid Component
 *
 * Displays a 4x3 grid of 12 stamps showing attendance progress.
 * Filled stamps indicate collected attendance days.
 */
interface StampGridProps {
  filledCount: number;
}

const SPECIAL_STAMPS = [7, 14]; // 보너스 스탬프 위치

export function StampGrid({ filledCount }: StampGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => {
        const position = i + 1;
        const isFilled = position <= filledCount;
        const isSpecial = SPECIAL_STAMPS.includes(position);

        return (
          <div
            key={i}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
              isFilled
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted bg-muted/30 text-muted-foreground"
            }`}
          >
            {isFilled ? (
              <span className="text-3xl">●</span>
            ) : (
              <span className="text-3xl">○</span>
            )}
            {isSpecial && isFilled && (
              <span className="absolute -right-1 -top-1 text-lg">🎁</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

