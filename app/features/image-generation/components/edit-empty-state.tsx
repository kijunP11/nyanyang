/**
 * F4 기존 캐릭터 수정 — 빈 상태 (캐릭터 avatar + 가이드 2개)
 */
import type { SelectedCharacter } from "./character-selector";

interface EditEmptyStateProps {
  character: SelectedCharacter;
}

export function EditEmptyState({ character }: EditEmptyStateProps) {
  return (
    <div className="mb-8 flex flex-col items-center gap-8 rounded-xl border border-[#E9EAEB] bg-[#FAFAFA] p-8 dark:border-[#333741] dark:bg-[#181D27]">
      {/* 캐릭터 현재 avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative size-32 overflow-hidden rounded-2xl bg-[#E9EAEB] dark:bg-[#333741]">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-[#A4A7AE] dark:text-[#717680]">
              ?
            </div>
          )}
        </div>
        <p className="text-sm font-semibold text-[#181D27] dark:text-white">
          {character.displayName}
        </p>
      </div>

      {/* 2열 가이드 */}
      <div className="grid w-full max-w-xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-거부.png"
            alt=""
            className="size-10 shrink-0 object-contain"
          />
          <div>
            <p className="mb-1 text-sm font-semibold text-[#181D27] dark:text-white">
              이미지를 업로드하거나 선택하세요
            </p>
            <p className="text-xs text-[#535862] dark:text-[#94969C]">
              jpg, jpeg, png, webp, gif 형식을 지원하며, 최대 5MB까지 첨부할 수
              있습니다.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-[#E9EAEB] p-4 dark:border-[#333741]">
          <img
            src="/냐냥-이모티콘-최종완성본/냐냥-기쁨.png"
            alt=""
            className="size-10 shrink-0 object-contain"
          />
          <div>
            <p className="mb-1 text-sm font-semibold text-[#181D27] dark:text-white">
              이미지 결과가 이곳에 나타나요
            </p>
            <p className="text-xs text-[#535862] dark:text-[#94969C]">
              다양한 결과를 확인하고, 마음에 드는 이미지를 선택해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
