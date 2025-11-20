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
import type { StoryCardData } from "../components/story-card";
import type { Route } from "./+types/home";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import i18next from "~/core/lib/i18next.server";

import { AttendanceCheck } from "../components/attendance-check";
import { NoticeBanner, type NoticeData } from "../components/notice-banner";
import {
  type GenreFilter,
  SearchFilter,
  type SortOption,
} from "../components/search-filter";
import { SectionHeader } from "../components/section-header";
import { StoryGrid } from "../components/story-grid";

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

export default function Home() {
  // Get the translation function for the current locale
  const { t } = useTranslation();

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
    </div>
  );
}
