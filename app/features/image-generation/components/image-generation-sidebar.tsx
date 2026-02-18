/**
 * Image Generation Sidebar (F4-3-1 / F4-3-3)
 *
 * 헤더 "생성된 이미지" + 비로그인 시 CTA, 로그인 시 썸네일 스택 + 더 생성하기
 */
import { Mail } from "lucide-react";
import { Link } from "react-router";

import type { SelectedCharacter } from "./character-selector";

export interface ImageGenerationSidebarUser {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

interface ImageGenerationSidebarProps {
  user?: ImageGenerationSidebarUser | null;
  images?: { id: string; data: string }[];
  selectedImageId?: string | null;
  onSelectImage?: (id: string) => void;
  selectedCharacter?: SelectedCharacter | null;
}

function LoggedOutCTA() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" />
      <div className="px-4 pb-6">
        <div className="rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
          <p className="mb-4 text-sm leading-relaxed text-[#535862] dark:text-[#94969C]">
            로그인하고 개성 넘치는 캐릭터들과 더 깊은 대화를 즐겨보세요!
          </p>

          {/* Social Login Buttons */}
          <div className="mb-3 flex items-center justify-center gap-3">
            <Link
              to="/auth/social/start/kakao"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full bg-[#FEE500] transition-opacity hover:opacity-90"
              aria-label="카카오톡으로 로그인"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="#000000"
              >
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.788 5.108 4.488 6.467l-1.142 4.225a.35.35 0 0 0 .538.384l4.907-3.238c.39.037.787.062 1.209.062 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
              </svg>
            </Link>
            <Link
              to="/auth/social/start/google"
              viewTransition
              className="flex size-11 items-center justify-center rounded-full border border-[#D5D7DA] bg-white transition-opacity hover:opacity-90 dark:border-[#414651] dark:bg-[#1F242F]"
              aria-label="구글로 로그인"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </Link>
          </div>

          <Link
            to="/login"
            viewTransition
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D5D7DA] px-4 py-2.5 text-sm font-medium text-[#414651] transition-colors hover:bg-[#F5F5F5] dark:border-[#414651] dark:text-[#D5D7DA] dark:hover:bg-[#1F242F]"
          >
            <Mail className="size-4" />
            이메일로 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ImageGenerationSidebar({
  user,
  images = [],
  selectedImageId,
  onSelectImage,
  selectedCharacter,
}: ImageGenerationSidebarProps) {
  const isLoggedIn = !!user;

  const handleThumbnailClick = (id: string) => {
    onSelectImage?.(id);
    setTimeout(() => {
      document
        .getElementById(`gen-img-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#E9EAEB] bg-white dark:border-[#333741] dark:bg-[#181D27]">
      <div className="flex h-[57px] items-center px-4">
        <h2 className="text-base font-bold text-[#181D27] dark:text-white">
          생성된 이미지
        </h2>
      </div>

      {!isLoggedIn ? (
        <LoggedOutCTA />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {selectedCharacter && (
            <div className="border-b border-[#E9EAEB] p-3 dark:border-[#333741]">
              <p className="mb-2 text-xs font-semibold text-[#535862] dark:text-[#94969C]">
                수정 중
              </p>
              <div className="flex items-center gap-2">
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-[#E9EAEB] dark:bg-[#333741]">
                  {selectedCharacter.avatarUrl ? (
                    <img
                      src={selectedCharacter.avatarUrl}
                      alt={selectedCharacter.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#A4A7AE] dark:text-[#717680]">
                      ?
                    </div>
                  )}
                </div>
                <span className="truncate text-sm font-medium text-[#181D27] dark:text-white">
                  {selectedCharacter.displayName}
                </span>
              </div>
            </div>
          )}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleThumbnailClick(img.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleThumbnailClick(img.id);
                  }}
                  className={`cursor-pointer overflow-hidden rounded-lg transition-all ${
                    selectedImageId === img.id
                      ? "ring-2 ring-[#41C7BD]"
                      : "hover:opacity-80"
                  }`}
                >
                  <img
                    src={`data:image/png;base64,${img.data}`}
                    alt="생성된 이미지"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <p className="text-sm text-[#535862] dark:text-[#94969C]">
                아직 생성된 이미지가 없어요
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
