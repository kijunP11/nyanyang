/**
 * 이미지 캐러셀: CSS scroll-snap + 도트 인디케이터
 * 터치 스와이프는 scroll-snap이 네이티브로 처리
 */
import { useState, useRef, useCallback } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({
  images,
  alt,
  className = "",
}: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  const scrollTo = (index: number) => {
    scrollRef.current?.scrollTo({
      left: index * (scrollRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
  };

  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-[#F5F5F5] dark:bg-[#1F242F] ${className}`}
      >
        <span className="text-4xl">🐱</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className={`w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`scrollbar-hide flex snap-x snap-mandatory overflow-x-auto ${className}`}
      >
        {images.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${alt} ${i + 1}`}
            className="w-full flex-shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`이미지 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
