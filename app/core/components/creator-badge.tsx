/**
 * Creator Badge Icon
 *
 * 크리에이터 뱃지 타입에 따라 인라인 아이콘을 렌더링한다.
 * - popular: 별(star) 아이콘
 * - official: 체크마크 뱃지 아이콘
 * - none: 렌더링하지 않음
 */

type BadgeType = "none" | "popular" | "official";

interface CreatorBadgeProps {
  badgeType?: BadgeType | null;
  className?: string;
}

export function CreatorBadge({ badgeType, className }: CreatorBadgeProps) {
  if (!badgeType || badgeType === "none") return null;

  if (badgeType === "popular") {
    return (
      <svg
        className={className ?? "size-3.5 shrink-0"}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="인기 크리에이터"
      >
        <circle cx="8" cy="8" r="8" fill="#41C7BD" />
        <path
          d="M8 4l1.1 2.2 2.4.4-1.7 1.7.4 2.4L8 9.6l-2.2 1.1.4-2.4L4.5 6.6l2.4-.4L8 4z"
          fill="white"
        />
      </svg>
    );
  }

  if (badgeType === "official") {
    return (
      <svg
        className={className ?? "size-3.5 shrink-0"}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="공식 크리에이터"
      >
        <path
          d="M8 0l2.2 1.5H13l.5 2.8L15.3 6.5 14 8.8l.3 2.9-2.7 1.1L9.8 15 8 13.2 6.2 15l-1.8-2.2-2.7-1.1.3-2.9L.7 6.5 2.5 4.3 3 1.5h2.8L8 0z"
          fill="#41C7BD"
        />
        <path
          d="M6.5 8.5l1 1 2.5-2.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  return null;
}
