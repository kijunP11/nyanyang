/**
 * Vertical Character Card
 *
 * 세로형 포트레이트 캐릭터 카드 (이미지 + 이름 + 설명 + 크리에이터 + 태그)
 */

import { User } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";

/* ── Figma Untitled UI 인라인 SVG 아이콘 ── */

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8378 1.52473C11.5398 1.22665 11.1861 0.990192 10.7967 0.828864C10.4074 0.667536 9.99004 0.5845 9.56859 0.5845C9.14714 0.5845 8.72981 0.667536 8.34046 0.828864C7.95111 0.990192 7.59736 1.22665 7.29942 1.52473L6.68109 2.14306L6.06275 1.52473C5.46093 0.922911 4.64469 0.584812 3.79359 0.584812C2.94248 0.584812 2.12624 0.922911 1.52442 1.52473C0.922599 2.12655 0.5845 2.9428 0.5845 3.7939C0.5845 4.645 0.922599 5.46124 1.52442 6.06306L2.14275 6.6814L6.68109 11.2197L11.2194 6.6814L11.8378 6.06306C12.1358 5.76512 12.3723 5.41137 12.5336 5.02202C12.6949 4.63267 12.778 4.21535 12.778 3.7939C12.778 3.37245 12.6949 2.95513 12.5336 2.56577C12.3723 2.17642 12.1358 1.82267 11.8378 1.52473Z" stroke="white" strokeWidth="1.169" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GemSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4607 4.43398C11.3892 4.27262 11.2871 4.12537 11.161 4.00024L6.49807 1.25433C6.49055 1.24962 6.48302 1.24539 6.47361 1.24209C6.03987 1.0017 5.51346 1.00641 5.08302 1.25433L0.707529 3.77961C0.269557 4.03223 0 4.50078 0 5.00602V10.0585C0 10.4174 0.136896 10.7585 0.372582 11.0167L0.707059 11.2844L3.18859 12.7159L5.08255 13.8102C5.21474 13.8864 5.35634 13.9409 5.50264 13.9701C5.83712 14.0402 6.19182 13.987 6.4976 13.8102L10.8731 11.2849C11.3111 11.0323 11.5806 10.5637 11.5806 10.0585V5.00602C11.5806 4.80515 11.5378 4.61039 11.4607 4.43398Z" fill="url(#gem_sm_g0)" />
      <path d="M11.0696 2.99539C10.9858 2.91165 10.8917 2.83827 10.7868 2.77852L6.48615 0.296052C6.47862 0.291348 6.47109 0.287114 6.46215 0.284291C6.03594 0.0481344 5.51847 0.0523683 5.09555 0.296052L0.794864 2.77852C0.363948 3.02691 0.0995654 3.48746 0.0995654 3.98377V8.95012C0.0995654 9.30294 0.234109 9.63789 0.466031 9.89239L0.794864 10.1554L3.23405 11.5624L5.09602 12.6378C5.22633 12.7126 5.36511 12.7663 5.50859 12.795C5.83742 12.8636 6.18601 12.8114 6.48662 12.6378L10.7873 10.1554C11.2182 9.90698 11.4826 9.44642 11.4826 8.95012V3.98377C11.4826 3.78619 11.4407 3.59519 11.3645 3.4216C11.2944 3.26307 11.1942 3.11817 11.07 2.99539Z" fill="url(#gem_sm_g1)" />
      <path d="M10.8735 2.71454L6.49801 0.189256C6.49048 0.184551 6.48295 0.180323 6.47355 0.17703L0.000403916 4.38645V8.99292C0.000403916 9.35186 0.137299 9.69292 0.372986 9.95119L11.1609 2.9347C11.0758 2.84955 10.9798 2.77475 10.8735 2.71407V2.71454ZM11.4606 3.36891L0.823189 10.2866L3.18899 11.6513L11.5806 6.19432V3.94142C11.5806 3.74055 11.5377 3.54579 11.4606 3.36938V3.36891ZM4.56736 12.4482L5.08295 12.7451C5.21514 12.8213 5.35674 12.8759 5.50304 12.905L11.581 8.95246V7.8874L4.56783 12.4482H4.56736Z" fill="url(#gem_sm_g2)" />
      <path d="M0.997269 9.07228V3.86083C0.997269 3.76063 1.0509 3.66795 1.13746 3.61809L5.65078 1.01237C5.73734 0.9625 5.8446 0.9625 5.93116 1.01237L10.444 3.61809C10.5306 3.66842 10.5842 3.76063 10.5842 3.86083V9.07228C10.5842 9.17248 10.5306 9.26516 10.444 9.31502L5.93069 11.9207C5.84413 11.9711 5.73687 11.9711 5.65031 11.9207L1.13746 9.31502C1.0509 9.26469 0.997269 9.17248 0.997269 9.07228Z" fill="#015047" />
      <path d="M1.78531 8.61737V4.31574C1.78531 4.21554 1.83894 4.12287 1.9255 4.073L5.65085 1.92219C5.73741 1.87232 5.84467 1.87232 5.93123 1.92219L9.6561 4.073C9.74266 4.12287 9.79629 4.21554 9.79629 4.31574V8.61737C9.79629 8.71757 9.74266 8.81025 9.6561 8.86011L5.93075 11.0109C5.8442 11.0613 5.73694 11.0613 5.65038 11.0109L1.9255 8.86011C1.83894 8.80978 1.78531 8.71757 1.78531 8.61737Z" fill="#076E63" />
      <path d="M11.4607 3.36894C11.3892 3.20758 11.2871 3.06033 11.161 2.9352L6.49809 0.189284C6.49057 0.184579 6.48304 0.180351 6.47363 0.177058C6.03989 -0.063333 5.51348 -0.058634 5.08303 0.189284L0.707547 2.71456C0.269575 2.96719 1.76774e-05 3.43573 1.76774e-05 3.94098V8.99342C1.76774e-05 9.35235 0.136914 9.69342 0.3726 9.95168L0.707077 10.2194L3.1886 11.6509L5.08256 12.7451C5.21475 12.8213 5.35635 12.8759 5.50266 12.9051C5.83714 12.9752 6.19184 12.922 6.49762 12.7451L10.8731 10.2198C11.3111 9.96721 11.5806 9.49866 11.5806 8.99342V3.94098C11.5806 3.7401 11.5378 3.54535 11.4607 3.36894ZM11.4823 8.95014C11.4823 9.44644 11.2175 9.907 10.787 10.1554L6.48633 12.6379C6.18573 12.8114 5.83714 12.8637 5.5083 12.795C5.36482 12.7668 5.22557 12.7127 5.09574 12.6379L4.58861 12.3462L3.23377 11.5624L0.908422 10.2212L0.794577 10.1554C0.670383 10.0834 0.559832 9.99543 0.465745 9.89241C0.233822 9.63838 0.0992788 9.30343 0.0992788 8.95014V3.98379C0.0992788 3.48748 0.364132 3.02693 0.794577 2.77854L5.09526 0.296072C5.51865 0.0523888 6.03566 0.0476845 6.46187 0.284312L6.48586 0.296072L10.7865 2.77854C10.8915 2.83829 10.9855 2.91167 11.0693 2.99541C11.1935 3.11819 11.2937 3.26309 11.3638 3.42162C11.44 3.59521 11.4818 3.78668 11.4818 3.98379V8.95014H11.4823Z" fill="url(#gem_sm_g3)" />
      <defs>
        <linearGradient id="gem_sm_g0" x1="0" y1="7.53" x2="11.58" y2="7.53" gradientUnits="userSpaceOnUse"><stop stopColor="#00C4AF" /><stop offset="1" stopColor="#05433D" /></linearGradient>
        <linearGradient id="gem_sm_g1" x1="1.31" y1="12.19" x2="13.83" y2="4.02" gradientUnits="userSpaceOnUse"><stop stopColor="#57CFC4" /><stop offset="1" stopColor="#5BD9CE" /></linearGradient>
        <linearGradient id="gem_sm_g2" x1="0.6" y1="13.03" x2="14.51" y2="3.98" gradientUnits="userSpaceOnUse"><stop stopColor="#66EDE1" /><stop offset="1" stopColor="#B1FFF8" /></linearGradient>
        <radialGradient id="gem_sm_g3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(5.79 6.47) scale(6.14)"><stop stopColor="#6CEEE3" /><stop offset="1" stopColor="#01A795" /></radialGradient>
      </defs>
    </svg>
  );
}

interface VerticalCharacterCardProps {
  character: {
    character_id: number;
    name: string;
    avatar_url: string | null;
    tagline?: string | null;
    description?: string | null;
    is_nsfw?: boolean;
    like_count?: number;
    tags?: string[] | null;
  };
  creatorName?: string | null;
  badge?: string;
  /** 클릭 시 모달 열기 (있으면 Link 대신 사용) */
  onClick?: (characterId: number) => void;
}

export function VerticalCharacterCard({
  character,
  creatorName,
  badge,
  onClick,
}: VerticalCharacterCardProps) {
  const className = "group flex-shrink-0 w-[156px] cursor-pointer";
  const shortDesc = character.tagline || character.description || null;
  const content = (
    <>
      {/* 이미지 */}
      <div className="relative h-[208px] w-full overflow-hidden rounded-[8px] border border-[#A4A7AE] bg-[#F5F5F5] dark:border-[#535862] dark:bg-[#1F242F]">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-[#A4A7AE] dark:text-[#717680]" />
          </div>
        )}
        {/* NSFW 배지 */}
        {character.is_nsfw && (
          <Badge
            variant="destructive"
            className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px]"
          >
            NSFW
          </Badge>
        )}
        {/* 섹션 배지 (HOT 등) — 좌상단 */}
        {badge && !character.is_nsfw && (
          <span className="absolute left-0 top-0 rounded-br-[8px] rounded-tl-[8px] bg-[#00C4AF] px-2 py-1 text-[12px] font-bold leading-[18px] text-white">
            {badge}
          </span>
        )}
        {/* 좋아요 수 — 좌하단 오버레이 */}
        {character.like_count != null && character.like_count > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-[2px] rounded-[6px] bg-black/80 px-2 py-1 text-[12px] font-semibold leading-[18px] text-white">
            <HeartIcon className="h-3.5 w-3.5" />
            <span>{character.like_count.toLocaleString()}</span>
          </div>
        )}
      </div>
      {/* 이름 — mt-[14px] */}
      <h3 className="mt-[14px] truncate text-[16px] font-semibold leading-[24px] text-[#1A1918] group-hover:text-[#41C7BD] dark:text-white">
        {character.name}
      </h3>
      {/* 설명 — mt-[6px], 2줄 고정 h-[42px] */}
      {shortDesc && (
        <p className="mt-[6px] h-[42px] overflow-hidden text-[14px] leading-[20px] text-[#717680] dark:text-[#94969C]">
          {shortDesc}
        </p>
      )}
      {/* 크리에이터 필 — mt-[10px] */}
      {creatorName && (
        <div className="mt-[10px] inline-flex items-center gap-0.5 rounded-[6px] border border-[#D5D7DA] bg-[#F5F5F5] px-2 py-1 dark:border-[#333741] dark:bg-[#1F242F]">
          <span className="truncate text-[12px] leading-[16px] text-[#9CA3AF] dark:text-[#717680]">
            @{creatorName}
          </span>
          <GemSmallIcon className="size-3.5 shrink-0" />
        </div>
      )}
      {/* 태그 필 (크리에이터가 없을 때만) */}
      {!creatorName && character.tags && character.tags.length > 0 && (
        <div className="mt-[10px] flex flex-wrap gap-1">
          {character.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-[6px] border border-[#D5D7DA] bg-[#F5F5F5] px-2 py-1 text-[12px] leading-[16px] text-[#9CA3AF] dark:border-[#333741] dark:bg-[#1F242F] dark:text-[#717680]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(character.character_id)}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={`/chat/${character.character_id}`} className={className}>
      {content}
    </Link>
  );
}
