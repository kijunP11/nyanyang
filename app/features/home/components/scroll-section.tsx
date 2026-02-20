/**
 * Scroll Section
 *
 * 가로 스크롤 섹션 래퍼 (타이틀 + 전체보기 + 카드 목록)
 */

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

interface ScrollSectionProps {
  title: string;
  children: React.ReactNode;
  moreLink?: string;
}

export function ScrollSection({
  title,
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-black dark:text-white">{title}</h2>
        {moreLink && (
          <Link
            to={moreLink}
            className="flex items-center gap-0.5 text-xs text-black hover:text-[#535862] dark:text-white dark:hover:text-[#94969C]"
          >
            전체보기
            <ChevronRight className="h-3.5 w-3.5" />
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
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
