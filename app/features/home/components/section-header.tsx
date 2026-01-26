/**
 * Section Header Component
 * 
 * Displays a section title (e.g., "Safe & Fun 공모전 수상작!")
 */
interface SectionHeaderProps {
  title: string;
  showMore?: boolean;
  onMoreClick?: () => void;
}

export function SectionHeader({
  title,
  showMore = false,
  onMoreClick,
}: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold leading-7">{title}</h2>
      {showMore && (
        <button
          onClick={onMoreClick}
          className="text-muted-foreground hover:text-foreground mt-1 text-sm transition-colors"
        >
          더보기 →
        </button>
      )}
    </div>
  );
}


