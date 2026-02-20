/**
 * Hero Carousel
 *
 * 단일 슬라이드 히어로 캐러셀 (중앙 정렬 텍스트 + 자동 재생)
 */

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export interface HeroSlide {
  image: string;
  title: string;
  description: string;
  badge?: string;
  link?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({
  slides,
  autoPlayInterval = 5000,
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 자동 슬라이드
  useEffect(() => {
    if (slides.length <= 1 || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval, isPlaying]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  const content = (
    <>
      <img
        src={slide.image}
        alt={slide.title}
        className="h-full w-full object-cover"
      />
      {/* 그라데이션 + 텍스트 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-12 flex flex-col items-center px-8 text-center">
        {slide.badge && (
          <span className="mb-2 inline-block rounded-[4px] bg-[#14B8A6] px-3 py-1 text-xs font-medium text-white">
            {slide.badge}
          </span>
        )}
        <h2 className="text-[28px] font-bold leading-tight text-white">
          {slide.title}
        </h2>
        <p className="mt-2 text-sm text-white/80">{slide.description}</p>
      </div>
    </>
  );

  return (
    <section className="relative h-[240px] overflow-hidden rounded-[12px] sm:h-[300px] lg:h-[360px]">
      {/* 현재 슬라이드 */}
      <div className="relative h-full w-full">
        {slide.link ? (
          <Link to={slide.link} className="block h-full w-full">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      {/* 하단 좌측: 페이지 카운터 + 재생/일시정지 */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {String(currentSlide + 1).padStart(2, "0")}/
          {String(slides.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* 하단 우측: 좌우 화살표 */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1">
        <button
          onClick={goToPrev}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goToNext}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
