/**
 * MDX Typography Components
 *
 * A collection of typography components designed specifically for MDX content.
 * These components provide consistent styling for MDX blog posts and documentation,
 * following the application's design system.
 *
 * Each component wraps a standard HTML element with appropriate styling classes
 * and passes through any additional props. This allows MDX content to maintain
 * consistent styling while still being customizable when needed.
 *
 * Used throughout the application for:
 * - Blog posts
 * - Documentation pages
 * - Content-rich pages with structured typography
 */

/**
 * H1 Typography Component
 * 
 * Renders a top-level heading with appropriate styling for MDX content.
 * 
 * @param children - The content to be rendered within the heading
 * @param props - Additional HTML attributes to be passed to the heading element
 * @returns A styled h1 element
 */
export function TypographyH1({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLHeadingElement>;
}) {
  return (
    <h1
      className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
      {...props}
    >
      {children}
    </h1>
  );
}

/**
 * H2 Typography Component
 * 
 * Renders a second-level heading with appropriate styling for MDX content.
 * Includes a bottom border and special styling for the first H2 in a section.
 * 
 * @param children - The content to be rendered within the heading
 * @param props - Additional HTML attributes to be passed to the heading element
 * @returns A styled h2 element
 */
export function TypographyH2({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLHeadingElement>;
}) {
  return (
    <h2
      className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * H3 Typography Component
 * 
 * Renders a third-level heading with appropriate styling for MDX content.
 * Used for subsections within H2 sections.
 * 
 * @param children - The content to be rendered within the heading
 * @param props - Additional HTML attributes to be passed to the heading element
 * @returns A styled h3 element
 */
export function TypographyH3({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLHeadingElement>;
}) {
  return (
    <h3
      className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * H4 Typography Component
 * 
 * Renders a fourth-level heading with appropriate styling for MDX content.
 * Used for detailed subsections within H3 sections.
 * 
 * @param children - The content to be rendered within the heading
 * @param props - Additional HTML attributes to be passed to the heading element
 * @returns A styled h4 element
 */
export function TypographyH4({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLHeadingElement>;
}) {
  return (
    <h4
      className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h4>
  );
}

/**
 * Paragraph Typography Component
 * 
 * Renders a paragraph with appropriate styling for MDX content.
 * Includes special spacing for non-first paragraphs to create proper content rhythm.
 * 
 * @param children - The content to be rendered within the paragraph
 * @param props - Additional HTML attributes to be passed to the paragraph element
 * @returns A styled p element
 */
export function TypographyP({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLParagraphElement>;
}) {
  return (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
      {children}
    </p>
  );
}

/**
 * Blockquote Typography Component
 * 
 * Renders a blockquote with appropriate styling for MDX content.
 * Includes a left border and italic styling to distinguish quoted content.
 * 
 * @param children - The content to be rendered within the blockquote
 * @param props - Additional HTML attributes to be passed to the blockquote element
 * @returns A styled blockquote element
 */
export function TypographyBlockquote({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLQuoteElement>;
}) {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
      {children}
    </blockquote>
  );
}

/**
 * Unordered List Typography Component
 * 
 * Renders an unordered list with appropriate styling for MDX content.
 * Includes disc-style bullets and proper spacing between list items.
 * 
 * @param children - The content to be rendered within the list
 * @param props - Additional HTML attributes to be passed to the ul element
 * @returns A styled unordered list element
 */
export function TypographyList({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLUListElement>;
}) {
  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  );
}

/**
 * Ordered List Typography Component
 * 
 * Renders an ordered list with appropriate styling for MDX content.
 * Includes decimal numbering and proper spacing between list items.
 * 
 * @param children - The content to be rendered within the list
 * @param props - Additional HTML attributes to be passed to the ol element
 * @returns A styled ordered list element
 */
export function TypographyOrderedList({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLUListElement>;
}) {
  return (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  );
}

/**
 * Inline Code Typography Component
 * 
 * Renders inline code with appropriate styling for MDX content.
 * Includes background color, rounded corners, and monospace font to distinguish code snippets.
 * 
 * @param children - The content to be rendered within the code element
 * @param props - Additional HTML attributes to be passed to the code element
 * @returns A styled inline code element
 */
export function TypographyInlineCode({
  children,
  props,
}: {
  children: React.ReactNode;
  props: React.HTMLAttributes<HTMLSpanElement>;
}) {
  return (
    <code
      className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
      {...props}
    >
      {children}
    </code>
  );
}
