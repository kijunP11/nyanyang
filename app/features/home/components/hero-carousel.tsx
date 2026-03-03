/**
 * Hero Carousel
 *
 * 단일 슬라이드 히어로 캐러셀 (중앙 정렬 텍스트 + 자동 재생)
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

/* ── Figma Untitled UI 인라인 SVG 아이콘 ── */

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.08333 7.58333L0.583333 4.08333L4.08333 0.583333" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.25 8.16667V4.66667M7.58333 8.16667V4.66667M12.25 6.41667C12.25 9.63833 9.63833 12.25 6.41667 12.25C3.19501 12.25 0.583333 9.63833 0.583333 6.41667C0.583333 3.19501 3.19501 0.583333 6.41667 0.583333C9.63833 0.583333 12.25 3.19501 12.25 6.41667Z" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.583333 7.58333L4.08333 4.08333L0.583333 0.583333" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.66667 12.6667H2C1.64638 12.6667 1.30724 12.5262 1.05719 12.2761C0.807142 12.0261 0.666667 11.687 0.666667 11.3333V2C0.666667 1.64638 0.807142 1.30724 1.05719 1.05719C1.30724 0.807142 1.64638 0.666667 2 0.666667H4.66667M9.33333 10L12.6667 6.66667M12.6667 6.66667L9.33333 3.33333M12.6667 6.66667H4.66667" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 그라데이션 — Figma: from transparent to solid black */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      {/* 텍스트 그룹 */}
      <div className="absolute inset-x-0 bottom-[72px] flex flex-col items-center gap-[12px] px-8 text-center">
        {slide.badge && (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#14B8A6] px-[8px] py-[4px] text-[12px] leading-[16px] text-white">
            {slide.badge}
          </span>
        )}
        <div className="flex flex-col gap-[4px]">
          <h2 className="text-[28px] font-bold leading-[1.5] text-white">
            {slide.title}
          </h2>
          <p className="text-[14px] leading-[1.5] text-white">{slide.description}</p>
        </div>
      </div>
    </>
  );

  return (
    <section className="relative aspect-[2/1] overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.3)]">
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

      {/* 하단 좌측: 페이지 카운터 + 공유 버튼 */}
      <div className="absolute bottom-[19px] left-[19px] z-30 flex items-center gap-2">
        <span className="flex h-[36px] items-center justify-center rounded-[50px] bg-[rgba(83,83,83,0.6)] px-[14px] py-[8px] text-[14px] font-semibold leading-[20px] text-white backdrop-blur">
          {String(currentSlide + 1).padStart(2, "0")}/
          {String(slides.length).padStart(2, "0")}
        </span>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[rgba(83,83,83,0.6)] p-[7.73px] text-white backdrop-blur transition-colors hover:bg-[rgba(83,83,83,0.8)]"
        >
          <LogOutIcon className="h-4 w-4" />
        </button>
      </div>

      {/* 하단 우측: ◁ ⏸ ▷ 통합 필 */}
      <div className="absolute bottom-[19px] right-[19px] z-30 flex h-[36px] items-center gap-[7.73px] rounded-full bg-[rgba(83,83,83,0.6)] p-[8px] backdrop-blur">
        <button
          onClick={goToPrev}
          className="flex h-[14px] w-[14px] items-center justify-center text-white transition-opacity hover:opacity-80"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-[14px] w-[14px] items-center justify-center text-white transition-opacity hover:opacity-80"
        >
          <PauseCircleIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={goToNext}
          className="flex h-[14px] w-[14px] items-center justify-center text-white transition-opacity hover:opacity-80"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
