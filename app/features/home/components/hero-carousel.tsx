/**
 * Hero Carousel
 *
 * 3장이 동시에 보이는 peek 캐러셀 (좌/우 작은 이미지 + 중앙 큰 이미지)
 */

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

  // 자동 슬라이드
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const getSlideStyle = (index: number) => {
    const total = slides.length;
    const diff = ((index - currentSlide) % total + total) % total;
    const normalizedDiff = diff > total / 2 ? diff - total : diff;

    if (normalizedDiff === 0) {
      // 중앙 (현재 슬라이드)
      return "translate-x-0 scale-100 opacity-100 z-20";
    } else if (normalizedDiff === -1 || normalizedDiff === total - 1) {
      // 왼쪽
      return "-translate-x-[70%] scale-[0.85] opacity-50 z-10";
    } else if (normalizedDiff === 1 || normalizedDiff === -(total - 1)) {
      // 오른쪽
      return "translate-x-[70%] scale-[0.85] opacity-50 z-10";
    }
    return "opacity-0 scale-75 z-0";
  };

  const renderSlideContent = (slide: HeroSlide, index: number) => {
    const isCurrent = index === currentSlide;
    const content = (
      <>
        <img
          src={slide.image}
          alt={slide.title}
          className="h-full w-full object-cover"
        />
        {/* 그라데이션 + 텍스트 (중앙 슬라이드만) */}
        {isCurrent && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              {slide.badge && (
                <span className="mb-2 inline-block rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-medium text-white">
                  {slide.badge}
                </span>
              )}
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-base text-white/80">{slide.description}</p>
            </div>
          </>
        )}
      </>
    );

    if (slide.link && isCurrent) {
      return (
        <Link to={slide.link} className="block h-full w-full">
          {content}
        </Link>
      );
    }

    return content;
  };

  if (slides.length === 0) return null;

  return (
    <section className="relative h-[240px] overflow-hidden sm:h-[300px] lg:h-[360px]">
      {/* 슬라이드들 */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 mx-auto w-[85%] overflow-hidden rounded-2xl transition-all duration-500 ${getSlideStyle(index)}`}
            style={{ transformOrigin: "center center" }}
          >
            {renderSlideContent(slide, index)}
          </div>
        ))}
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? "w-6 bg-[#14b8a6]"
                : "w-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
