/**
 * Blog Post Screen Component
 * 
 * This component handles the rendering of individual blog posts using MDX.
 * It demonstrates:
 * - MDX bundling and rendering with custom components
 * - Frontmatter extraction for metadata
 * - Dynamic routing with React Router
 * - SEO optimization with meta tags
 * - Error handling for missing or invalid posts
 */
import type { Route } from "./+types/post";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import path from "node:path";
import { data } from "react-router";

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography";
import { Badge } from "~/core/components/ui/badge";

/**
 * Meta function for the blog post page
 * 
 * This function generates meta tags for SEO optimization and social sharing.
 * It handles two scenarios:
 * 1. When the post is found: Sets title, description, and Open Graph tags
 * 2. When the post is not found: Sets a 404 title
 * 
 * The Open Graph tags enable rich previews when the post is shared on
 * social media platforms like Twitter, Facebook, and LinkedIn.
 * 
 * @param data - The data returned from the loader function
 * @returns An array of meta tag objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  // Handle case where post is not found
  if (!data) {
    return [
      {
        title: `404 Page Not Found | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }
  
  // Generate meta tags for found posts
  return [
    // Page title with post title and app name
    {
      title: `${data.frontmatter.title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    // Meta description for search engines
    {
      name: "description",
      content: data.frontmatter.description,
    },
    // Open Graph image for social media previews
    {
      name: "og:image",
      content: `http://localhost:5173/api/blog/og?slug=${data.frontmatter.slug}`,
    },
    // Open Graph title for social media previews
    {
      name: "og:title",
      content: data.frontmatter.title,
    },
    // Open Graph description for social media previews
    {
      name: "og:description",
      content: data.frontmatter.description,
    },
  ];
};

/**
 * Server loader function for fetching and processing blog post content
 * 
 * This function is responsible for:
 * 1. Finding the MDX file based on the URL slug parameter
 * 2. Bundling and processing the MDX content
 * 3. Extracting frontmatter metadata
 * 4. Handling errors for missing or invalid posts
 * 
 * The MDX bundler compiles the markdown content into executable React components
 * while extracting the frontmatter metadata (title, date, author, etc.)
 * 
 * @param params - Route parameters containing the post slug
 * @returns The processed MDX code and frontmatter metadata
 * @throws 404 error if the post is not found, 500 error for other issues
 */
export async function loader({ params }: Route.LoaderArgs) {
  // Construct the full path to the MDX file based on the slug parameter
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "blog",
    "docs",
    `${params.slug}.mdx`,
  );
  
  try {
    // Process the MDX file to extract code and frontmatter
    const { code, frontmatter } = await bundleMDX({
      file: filePath,
    });

    // Return both the compiled MDX code and the frontmatter metadata
    return {
      frontmatter,
      code,
    };
  } catch (error) {
    // Handle file not found errors with a 404 response
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // Handle all other errors with a 500 response
    throw data(null, { status: 500 });
  }
}

/**
 * Blog Post Component
 * 
 * This component renders a complete blog post with:
 * - Header with title, category, author, and date
 * - Featured image
 * - MDX content with custom styled typography components
 * 
 * The MDX content is rendered using custom components for consistent styling
 * across all blog posts. This approach allows writing content in Markdown
 * while maintaining the design system's typography and styling.
 * 
 * @param loaderData - Data from the loader containing frontmatter and compiled MDX code
 */
export default function Post({
  loaderData: { frontmatter, code },
}: Route.ComponentProps) {
  // Convert the compiled MDX code into a React component
  const MDXContent = getMDXComponent(code);
  
  return (
    <div className="mx-auto w-full space-y-10">
      {/* Post header with category, title, author and date */}
      <header className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary">{frontmatter.category}</Badge>
          <h1 className="text-3xl font-bold md:text-5xl lg:text-7xl">
            {frontmatter.title}
          </h1>
        </div>
        <span className="text-muted-foreground">
          {frontmatter.author} on{" "}
          {new Date(frontmatter.date).toLocaleDateString("ko-KR")}
        </span>
      </header>
      
      {/* Featured image for the post */}
      <img
        src={`/blog/${frontmatter.slug}.jpg`}
        alt={frontmatter.title}
        className="aspect-square w-full rounded-xl object-cover object-center"
      />
      
      {/* Render the MDX content with custom typography components */}
      <MDXContent
        components={{
          // Map HTML elements to custom styled components
          h1: TypographyH1,
          h2: TypographyH2,
          h3: TypographyH3,
          h4: TypographyH4,
          p: TypographyP,
          blockquote: TypographyBlockquote,
          ul: TypographyList,
          ol: TypographyOrderedList,
          code: TypographyInlineCode,
        }}
      />
    </div>
  );
}
