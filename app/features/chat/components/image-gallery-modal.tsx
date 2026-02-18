/**
 * 이미지 갤러리 모달
 *
 * 채팅 메시지 내 이미지 클릭 시 전체화면 뷰어.
 * CSS scroll-snap 기반 스와이프.
 * 배경 클릭 또는 X 버튼으로 닫기.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryModalProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageGalleryModal({
  images,
  initialIndex,
  open,
  onClose,
}: ImageGalleryModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: initialIndex * scrollRef.current.clientWidth,
        behavior: "instant",
      });
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) goTo(activeIndex - 1);
      if (e.key === "ArrowRight" && activeIndex < images.length - 1)
        goTo(activeIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, activeIndex, images.length, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-sm">
        {activeIndex + 1} / {images.length}
      </div>

      {activeIndex > 0 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-4 z-10 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {activeIndex < images.length - 1 && (
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-4 z-10 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 배경 클릭으로 닫기: 패딩 영역만 pointer-events-none으로 통과시켜 배경 클릭 시 닫기 */}
      <div className="absolute inset-0 z-0" onClick={onClose} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide pointer-events-auto flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center p-4"
            >
              <img
                src={src}
                alt={`이미지 ${i + 1}`}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
