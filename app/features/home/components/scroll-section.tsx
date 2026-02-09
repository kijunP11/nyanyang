/**
 * Scroll Section
 *
 * 가로 스크롤 섹션 래퍼 (타이틀 + 우측 화살표 버튼)
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
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {moreLink && (
          <Link
            to={moreLink}
            className="text-sm text-[#9ca3af] hover:text-white"
          >
            전체보기
          </Link>
        )}
      </div>

      {/* 스크롤 컨테이너 */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
        >
          {children}
        </div>

        {/* 우측 화살표 */}
        {showArrow && (
          <button
            onClick={scrollRight}
            className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#3f3f46] bg-[#232323]/80 text-white backdrop-blur transition-colors hover:border-[#14b8a6] hover:text-[#14b8a6]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}
