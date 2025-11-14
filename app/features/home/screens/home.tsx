/**
 * Home Page Component
 * 
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 * 
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 * - Story grid sections with cards
 */

import type { Route } from "./+types/home";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AttendanceCheck } from "../components/attendance-check";
import { NoticeBanner, type NoticeData } from "../components/notice-banner";
import {
  SearchFilter,
  type GenreFilter,
  type SortOption,
} from "../components/search-filter";
import { SectionHeader } from "../components/section-header";
import { StoryGrid } from "../components/story-grid";
import type { StoryCardData } from "../components/story-card";
import i18next from "~/core/lib/i18next.server";

/**
 * Meta function for setting page metadata
 * 
 * This function generates SEO-friendly metadata for the home page using data from the loader.
 * It sets:
 * - Page title from translated "home.title" key
 * - Meta description from translated "home.subtitle" key
 * 
 * The metadata is language-specific based on the user's locale preference.
 * 
 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 * 
 * This function is executed on the server before rendering the component.
 * It:
 * 1. Extracts the user's locale from the request (via cookies or Accept-Language header)
 * 2. Creates a translation function for that specific locale
 * 3. Returns translated strings for the page title and subtitle
 * 
 * This approach ensures that even on first load, users see content in their preferred language,
 * which improves both user experience and SEO (search engines see localized content).
 * 
 * @param request - The incoming HTTP request containing locale information
 * @returns Object with translated title and subtitle strings
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get a translation function for the user's locale from the request
  const t = await i18next.getFixedT(request);
  
  // Return translated strings for use in both the component and meta function
  return {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
  };
}

/**
 * Home page component
 * 
 * This is the main landing page component of the application. It displays a simple,
 * centered layout with a headline and subtitle, both internationalized using i18next.
 * 
 * Features:
 * - Uses the useTranslation hook for client-side translation
 * - Implements responsive design with Tailwind CSS
 * - Maintains consistent translations between server and client
 * 
 * The component is intentionally simple to serve as a starting point for customization.
 * It demonstrates the core patterns used throughout the application:
 * - Internationalization
 * - Responsive design
 * - Clean, semantic HTML structure
 * 
 * @returns JSX element representing the home page
 */
// Mock data based on Figma design
const mockStories: StoryCardData[] = [
  {
    id: "1",
    title: "조금 이상한 머핀가게",
    description: "머핀 가게를 찾다가 마피아 아지트에 눌러살게 되었다.",
    thumbnailUrl: "/nft.jpg",
    views: 89,
    likes: 3700,
    comments: 70,
    author: { username: "Kingcrab" },
    tags: ["로맨스"],
    slug: "muffin-shop",
  },
  {
    id: "2",
    title: "해럴드",
    description: "15년전 헤어진 소꿉친구와 재회가 잘못됬다.",
    thumbnailUrl: "/nft-2.jpg",
    views: 170,
    likes: 5800,
    comments: 28,
    author: { username: "HANZA" },
    tags: ["로맨스"],
    slug: "harold",
  },
  {
    id: "3",
    title: "세담, 세강",
    description: "떠돌이 형제 강도단",
    thumbnailUrl: "/nft.jpg",
    views: 44,
    likes: 3000,
    comments: 35,
    author: { username: "simsul" },
    tags: ["액션"],
    slug: "sedam-segang",
  },
  {
    id: "4",
    title: "속삭이는 랜턴",
    description: "어둠 속 속삭이는 모험의 안내자",
    thumbnailUrl: "/nft-2.jpg",
    views: 16,
    likes: 494,
    comments: 84,
    author: { username: "quack_vyuxspaxza" },
    tags: ["판타지", "모험"],
    slug: "whispering-lantern",
  },
  {
    id: "5",
    title: "허영의 주인",
    description: "나를 증오해? 아니면――― 애처롭게 매달려 볼래?",
    thumbnailUrl: "/nft.jpg",
    views: 75,
    likes: 3600,
    comments: 19,
    author: { username: "39p" },
    tags: ["로맨스", "드라마"],
    slug: "vanity-master",
  },
  {
    id: "6",
    title: "천사 육성 계획",
    description: "천사 육성 계획",
    thumbnailUrl: "/nft-2.jpg",
    views: 54,
    likes: 3100,
    comments: 47,
    author: { username: "yairi" },
    tags: ["판타지", "육성", "로맨스"],
    slug: "angel-raising",
  },
  {
    id: "7",
    title: "프로젝트: 덕업일치!",
    description: "그저 아이돌오타쿠일 뿐인 내가, 아이돌 프로듀서?",
    thumbnailUrl: "/nft.jpg",
    views: 47,
    likes: 4400,
    comments: 403,
    author: { username: "L_L_L" },
    tags: ["일상"],
    slug: "idol-project",
  },
  {
    id: "8",
    title: "하이럽보이즈",
    description: "청춘 남고딩 연애 프로그램 '하이럽보이즈'에서 7일간 내 운명 찾기!",
    thumbnailUrl: "/nft-2.jpg",
    views: 160,
    likes: 17000,
    comments: 145,
    author: { username: "S2S2" },
    tags: ["로맨스"],
    slug: "high-love-boys",
  },
];

// Mock notices/events data
const mockNotices: NoticeData[] = [
  {
    id: "1",
    type: "event",
    title: "🎁 추석 맞이 캐릭터 무료 공개",
    content:
      "마음까지 풍요롭게! 추석 맞이 캐릭터 무료 공개 이벤트가 시작되었습니다.",
    date: "2025-09-17",
    link: "/events/chuseok",
  },
  {
    id: "2",
    type: "notice",
    title: "새로운 캐릭터 기능 출시 안내",
    content:
      "기존의 '스토리'가 하나의 거대한 세계관을 탐험하는 재미에 집중했다면, '캐릭터'는 매력적인 인물과 짧은 대화를 실시간 티키타카처럼 주고받는 즐거움에 초점을 맞춘 대화 중심의 콘텐츠입니다.",
    date: "2025-09-17",
  },
];

export default function Home() {
  // Get the translation function for the current locale
  const { t } = useTranslation();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [genre, setGenre] = useState<GenreFilter>("all");

  // Filter and sort stories
  const filteredStories = useMemo(() => {
    let filtered = [...mockStories];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.description.toLowerCase().includes(query) ||
          story.author.username.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (genre !== "all") {
      const genreMap: Record<string, string> = {
        romance: "로맨스",
        fantasy: "판타지",
        action: "액션",
        daily: "일상",
      };
      filtered = filtered.filter((story) =>
        story.tags?.includes(genreMap[genre])
      );
    }

    // Sort
    if (sortBy === "popular") {
      filtered.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "newest") {
      // For demo, we'll use ID as a proxy for newest
      filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    } else if (sortBy === "tags") {
      filtered.sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0));
    }

    return filtered;
  }, [searchQuery, sortBy, genre]);

  const handleCheckIn = () => {
    // TODO: Implement actual check-in API call
    console.log("Checked in!");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center gap-2.5 py-8">
        {/* Main headline with responsive typography */}
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
          {t("home.title")}
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl">{t("home.subtitle")}</h2>
      </div>

      {/* Notice/Event Banner */}
      <NoticeBanner notices={mockNotices} />

      {/* Attendance Check */}
      <div className="mx-auto w-full max-w-md">
        <AttendanceCheck
          dailyReward={100}
          cumulativeDays={3}
          cumulativeReward={500}
          onCheckIn={handleCheckIn}
        />
      </div>

      {/* Search and Filter */}
      <div className="w-full">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          genre={genre}
          onGenreChange={setGenre}
        />
      </div>

      {/* Story Sections */}
      <div className="space-y-12">
        {/* Safe & Fun 공모전 수상작 Section */}
        <section>
          <SectionHeader title="Safe & Fun 공모전 수상작!" />
          <StoryGrid stories={filteredStories} />
        </section>
      </div>
    </div>
  );
}
