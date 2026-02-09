/**
 * Authentication Login Buttons Module
 *
 * This module provides reusable components for rendering various authentication options
 * in a consistent and styled manner. It supports multiple authentication methods including:
 * - Social logins (Google, GitHub, Apple, Kakao)
 * - Passwordless options (OTP, Magic Link)
 *
 * The components are designed to be used in both sign-in and sign-up flows, with
 * appropriate visual separation and consistent styling. Each button includes the
 * provider's logo and descriptive text to enhance usability.
 *
 * This modular approach allows for easy addition or removal of authentication methods
 * without modifying the main authentication screens.
 */
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";

import { AppleLogo } from "./logos/apple";
import { GoogleLogo } from "./logos/google";
import { KakaoLogo } from "./logos/kakao";
import { NaverLogo } from "./logos/naver";

/**
 * Generic authentication button component
 *
 * This component renders a consistent button for any authentication provider.
 * It includes the provider's logo and a standardized text.
 * The button uses custom styling per provider brand guidelines.
 *
 * @param logo - React node representing the provider's logo
 * @param label - Provider name (e.g., "Google", "Apple")
 * @param href - URL path to the authentication flow for this provider
 * @param className - Additional CSS classes for custom styling
 */
function AuthLoginButton({
  logo,
  label,
  href,
  className = "",
}: {
  logo: React.ReactNode;
  label: string;
  href: string;
  className?: string;
}) {
  return (
    <Button
      className={`inline-flex h-11 items-center justify-center gap-2 ${className}`}
      asChild
    >
      <Link to={href}>
        <span>{logo}</span>
        <span>{label} 계정으로 로그인</span>
      </Link>
    </Button>
  );
}


/**
 * Social login authentication options
 *
 * This component renders buttons for social authentication providers:
 * - Google
 * - Apple
 * - Naver
 * - Kakao
 *
 * Each button uses the provider's official logo and brand colors.
 */
function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-3">
      <AuthLoginButton
        logo={<GoogleLogo className="size-4" />}
        label="구글"
        href="/auth/social/start/google"
        className="border-0 bg-[#3f3f46] text-white hover:bg-[#52525b]"
      />
      <AuthLoginButton
        logo={<AppleLogo className="size-4 scale-150 text-white" />}
        label="애플"
        href="/auth/social/start/apple"
        className="border-0 bg-[#3f3f46] text-white hover:bg-[#52525b]"
      />
      <AuthLoginButton
        logo={<NaverLogo className="size-4" />}
        label="네이버"
        href="/auth/naver"
        className="border-0 bg-[#03C75A] text-white hover:bg-[#02b351]"
      />
      <AuthLoginButton
        logo={<KakaoLogo className="size-4 scale-125" />}
        label="카카오"
        href="/auth/social/start/kakao"
        className="border-0 bg-[#FEE500] text-[#191919] hover:bg-[#fdd800]"
      />
    </div>
  );
}

/**
 * Complete set of sign-in authentication options
 *
 * This exported component provides social login options for the sign-in flow.
 *
 * Usage:
 * ```tsx
 * <SignInButtons />
 * ```
 */
export function SignInButtons() {
  return <SocialLoginButtons />;
}

/**
 * Authentication options for the sign-up flow
 *
 * This exported component provides social login options for the sign-up flow.
 *
 * Usage:
 * ```tsx
 * <SignUpButtons />
 * ```
 */
export function SignUpButtons() {
  return <SocialLoginButtons />;
}
