/**
 * Character Grid Section
 *
 * 5장 그리드 섹션 (가로 스크롤 없음, Figma 픽셀 퍼펙트)
 */

import type { ReactNode } from "react";
import { Link } from "react-router";

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 5 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.583333 7.58333L4.08333 4.08333L0.583333 0.583333"
        stroke="#535862"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CharacterGridSectionProps {
  title: string;
  titleIcon?: ReactNode;
  moreLink?: string;
  children: ReactNode;
}

export function CharacterGridSection({
  title,
  titleIcon,
  moreLink,
  children,
}: CharacterGridSectionProps) {
  return (
    <section>
      {/* 헤더 */}
      <div className="mb-[14px] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-[20px] font-bold leading-[30px] text-black dark:text-white">
            {title}
          </h2>
          {titleIcon}
        </div>
        {moreLink && (
          <Link
            to={moreLink}
            className="flex items-center gap-px text-[12px] leading-[18px] text-black hover:text-[#535862] dark:text-white dark:hover:text-[#94969C]"
          >
            전체보기
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* 5장 그리드 */}
      <div className="flex flex-wrap gap-[8px]">{children}</div>
    </section>
  );
}
