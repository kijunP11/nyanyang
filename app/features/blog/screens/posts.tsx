/**
 * Blog Posts Screen
 *
 * This component displays a list of blog posts from MDX files in the docs directory.
 * It uses mdx-bundler to extract frontmatter from MDX files and renders a grid of
 * blog post cards with images, titles, descriptions, and metadata.
 *
 * The blog implementation demonstrates:
 * 1. MDX content handling with frontmatter extraction
 * 2. File system operations for reading blog content
 * 3. Responsive grid layout for different screen sizes
 * 4. View transitions for smooth navigation between pages
 */
import type { Route } from "./+types/posts";

import { bundleMDX } from "mdx-bundler";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";

/**
 * Meta function for the blog posts page
 *
 * Sets the page title using the application name from environment variables
 * and adds a meta description for SEO purposes
 */
export const meta: Route.MetaFunction = () => {
  return [
    { title: `Supablog | ${import.meta.env.VITE_APP_NAME}` },
    { name: "description", content: "Follow our development journey!" },
  ];
};

/**
 * Interface defining the structure of MDX frontmatter
 *
 * Each MDX blog post file must include these metadata fields in its frontmatter:
 * - title: The title of the blog post
 * - description: A brief summary of the post content
 * - date: Publication date (used for sorting)
 * - category: The post category for filtering/grouping
 * - author: The name of the post author
 * - slug: URL-friendly identifier for the post
 */
interface Frontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
}

/**
 * Loader function for the blog posts page
 *
 * This function reads all MDX files from the docs directory and extracts their frontmatter:
 * 1. Determines the path to the docs directory containing MDX blog posts
 * 2. Reads all files in the directory and filters for .mdx files
 * 3. Processes each MDX file to extract its frontmatter metadata
 * 4. Sorts the posts by date (newest first)
 * 5. Returns the frontmatter data to be used by the component
 *
 * @returns Object containing an array of blog post frontmatter data
 */
export async function loader() {
  // Get the path to the docs directory containing MDX files
  const docsPath = path.join(process.cwd(), "app", "features", "blog", "docs");

  // Read all files in the docs directory
  const files = await readdir(docsPath);

  // Filter for MDX files only
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  // Extract frontmatter from each MDX file
  const frontmatters = await Promise.all(
    mdxFiles.map(async (file) => {
      const filePath = path.join(docsPath, file);
      const { frontmatter } = await bundleMDX({ file: filePath });
      return frontmatter;
    }),
  );

  // Sort posts by date, newest first
  frontmatters.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Return the frontmatter data
  return {
    frontmatters: frontmatters as Frontmatter[],
  };
}

/**
 * Blog Posts Component
 *
 * This component renders the blog posts page with a header and a grid of blog post cards.
 * Each card displays:
 * - Featured image (matching the post slug)
 * - Category badge
 * - Post title
 * - Post description
 * - Author and date information
 *
 * The component uses responsive design with different layouts for mobile and desktop:
 * - Single column on mobile devices
 * - Three-column grid on desktop devices
 *
 * It also implements view transitions for smooth navigation between the posts list
 * and individual post pages.
 *
 * @param loaderData - Data from the loader containing blog post frontmatter
 */
export default function Posts({
  loaderData: { frontmatters },
}: Route.ComponentProps) {
  // 섹션별로 나누기 (데모용 - 실제로는 더 복잡한 로직 가능)
  const section1 = frontmatters.slice(0, 4); // 1차 챌린지 당선작
  const section2 = frontmatters.slice(4, 8); // 실시간 인기
  const section3 = frontmatters.slice(8, 12); // 크리에이터 신작

  const StoryCard = ({ frontmatter }: { frontmatter: Frontmatter }) => (
    <Link
      to={`/blog/${frontmatter.slug}`}
      key={frontmatter.slug}
      className="group flex cursor-pointer flex-col gap-2.5"
      viewTransition
    >
      {/* 스토리 카드 이미지 - 세로형, 더 둥근 모서리 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 group-hover:shadow-md">
        <img
          src={`/blog/${frontmatter.slug}.jpg`}
          alt={frontmatter.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {/* 제목 - 더 간결하고 읽기 쉬운 스타일 */}
      <h3 className="text-foreground line-clamp-2 text-sm leading-snug font-medium transition-colors group-hover:text-[#41C7BD]">
        {frontmatter.title}
      </h3>
    </Link>
  );

  const StorySection = ({
    title,
    items,
  }: {
    title: string;
    items: Frontmatter[];
  }) => (
    <section className="space-y-5">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <span className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors">
          더보기 →
        </span>
      </div>
      {/* 그리드 레이아웃 - 초안처럼 4-5개씩 가로로, 간격 조정 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((frontmatter) => (
          <StoryCard key={frontmatter.slug} frontmatter={frontmatter} />
        ))}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 1단계: 상단 배너 섹션 - 이벤트/콘테스트 */}
      <section className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-pink-900/80">
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Badge className="bg-[#41C7BD] text-white">이벤트</Badge>
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              총 상금 5억! 캐릭터 콘테스트
            </h2>
            <p className="text-sm text-white/90 md:text-base">
              역대급 상금의 주인공에 도전하세요
            </p>
            <p className="text-xs text-white/80 md:text-sm">
              12월 10일까지 총 상금 5억의 캐릭터 콘테스트를 시작합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 2단계: 출석 체크 섹션 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">매일매일 출석체크</h3>
            <p className="text-muted-foreground text-sm">
              일일 누적보상 한번에 수령하세요!
            </p>
          </div>
        </div>
        <div className="flex h-16 items-center justify-center rounded-lg bg-[#41C7BD] px-6">
          <div className="flex items-center gap-3">
            <img src="/logo3.png" alt="NYANYANG" className="h-8 w-auto" />
            <span className="text-lg font-bold text-white">NYANYANG</span>
          </div>
        </div>
      </section>

      {/* 3단계: 검색 바 섹션 */}
      <section className="flex gap-2">
        <Input
          type="text"
          placeholder="캐릭터 검색 (앞에 @를 붙이면 크리에이터 검색)"
          className="flex-1"
        />
        <Button className="bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90">
          검색
        </Button>
      </section>

      {/* 4단계: 필터 버튼들 섹션 */}
      <section className="flex flex-wrap gap-2">
        {[
          "전체",
          "추천",
          "남성",
          "여성",
          "로맨스",
          "구원",
          "순위",
          "구현",
          "주회",
          "집착",
          "피폐",
          "소꿉친구",
          "가족",
          "유명인",
          "츤데레",
          "#태그 더보기",
        ].map((tag) => (
          <Button
            key={tag}
            variant={tag === "전체" ? "default" : "outline"}
            className={
              tag === "전체"
                ? "bg-[#41C7BD] text-white hover:bg-[#41C7BD]/90"
                : ""
            }
          >
            {tag}
          </Button>
        ))}
      </section>

      {/* 여러 섹션으로 나누기 */}
      <div className="flex flex-col gap-12">
        {section1.length > 0 && (
          <StorySection title="1차 챌린지 당선작!" items={section1} />
        )}
        {section2.length > 0 && (
          <StorySection title="실시간 인기" items={section2} />
        )}
        {section3.length > 0 && (
          <StorySection title="크리에이터 신작!" items={section3} />
        )}
      </div>
    </div>
  );
}
