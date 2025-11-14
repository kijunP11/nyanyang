/**
 * Footer Component
 *
 * A responsive footer that displays copyright information and legal links.
 * This component appears at the bottom of every page in the application and
 * provides essential legal information and copyright notice.
 *
 * Features:
 * - Responsive design that adapts to different screen sizes
 * - Dynamic copyright year that automatically updates
 * - Links to legal pages (Privacy Policy, Terms of Service)
 * - View transitions for smooth navigation to legal pages
 */
import { Link } from "react-router";

/**
 * Footer component for displaying copyright information and legal links
 * 
 * This component renders a responsive footer that adapts to different screen sizes.
 * On mobile, it displays the legal links above the copyright notice, while on desktop,
 * it displays them side by side with the copyright on the left and links on the right.
 * 
 * @returns A footer component with copyright information and legal links
 */
export default function Footer() {
  return (
    <footer className="text-muted-foreground mt-auto flex items-center justify-between border-t py-3 text-sm md:py-5">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col items-center justify-between gap-2.5 md:order-none md:flex-row md:gap-0">
        {/* Copyright notice - appears second on mobile, first on desktop */}
        <div className="order-2 md:order-none">
          <p>
            &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}.
            All rights reserved.
          </p>
        </div>
        
        {/* Legal links - appears first on mobile, second on desktop */}
        <div className="order-1 flex gap-10 *:underline md:order-none">
          <Link to="/legal/privacy-policy" viewTransition>
            Privacy Policy
          </Link>
          <Link to="/legal/terms-of-service" viewTransition>
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
