/**
 * Scroll Section
 *
 * 가로 스크롤 섹션 래퍼 (타이틀 + 전체보기 + 카드 목록)
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/* ── Figma Untitled UI chevron-right 아이콘 ── */

function ChevronRightGrayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.583333 7.58333L4.08333 4.08333L0.583333 0.583333" stroke="#535862" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightWhiteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.583333 7.58333L4.08333 4.08333L0.583333 0.583333" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ScrollSectionProps {
  title: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  moreLink?: string;
}

export function ScrollSection({
  title,
  titleIcon,
  children,
  moreLink,
}: ScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);

  // 마운트 시 오버플로우 체크
  useEffect(() => {
    const checkOverflow = () => {
      if (!scrollRef.current) return;
      const { scrollWidth, clientWidth } = scrollRef.current;
      setShowArrow(scrollWidth > clientWidth + 10);
    };

    checkOverflow();

    // ResizeObserver로 리사이즈 감지
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: scrollRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <section>
      {/* 헤더 */}
      <div className="mb-[14px] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-[20px] font-bold leading-[30px] text-black dark:text-white">{title}</h2>
          {titleIcon}
        </div>
        {moreLink && (
          <Link
            to={moreLink}
            className="flex items-center gap-px text-[12px] leading-[18px] text-black hover:text-[#535862] dark:text-white dark:hover:text-[#94969C]"
          >
            전체보기
            <ChevronRightGrayIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* 스크롤 컨테이너 */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
        >
          {children}
        </div>

        {/* 우측 화살표 */}
        {showArrow && (
          <button
            onClick={scrollRight}
            className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E9EAEB] bg-white/90 text-[#535862] shadow-sm backdrop-blur transition-colors hover:border-[#41C7BD] hover:text-[#41C7BD] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#94969C]"
          >
            <ChevronRightWhiteIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
