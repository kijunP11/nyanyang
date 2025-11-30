/**
 * Application Routes Configuration
 *
 * This file defines all routes for the application using React Router's
 * file-based routing system. Routes are organized by feature and access level.
 *
 * The structure uses layouts for shared UI elements and prefixes for route grouping.
 * This approach creates a hierarchical routing system that's both maintainable and scalable.
 */
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("/robots.txt", "core/screens/robots.ts"),
  route("/sitemap.xml", "core/screens/sitemap.ts"),
  ...prefix("/debug", [
    // You should delete this in production.
    route("/sentry", "debug/sentry.tsx"),
    route("/analytics", "debug/analytics.tsx"),
  ]),
  // API Routes. Routes that export actions and loaders but no UI.
  ...prefix("/api", [
    ...prefix("/settings", [
      route("/theme", "features/settings/api/set-theme.tsx"),
      route("/locale", "features/settings/api/set-locale.tsx"),
    ]),
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route(
        "/referral-code/validate",
        "features/users/api/validate-referral-code.tsx",
      ),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),
    ...prefix("/characters", [
      route("/create", "features/characters/api/create-character.tsx"),
      route("/update", "features/characters/api/update-character.tsx"),
      route("/delete", "features/characters/api/delete-character.tsx"),
      route("/keywords", "features/characters/api/manage-keywords.tsx"),
      route(
        "/safety-filter",
        "features/characters/api/manage-safety-filter.tsx",
      ),
      route("/upload-media", "features/characters/api/upload-media.tsx"),
    ]),
    ...prefix("/chat", [
      route("/send-message", "features/chat/api/send-message.tsx"),
    ]),
    ...prefix("/cron", [route("/mailer", "features/cron/api/mailer.tsx")]),
    ...prefix("/blog", [route("/og", "features/blog/api/og.tsx")]),
  ]),

  layout("core/layouts/navigation.layout.tsx", [
    route("/auth/confirm", "features/auth/screens/confirm.tsx"),
    index("features/home/screens/home.tsx"),
    route("/error", "core/screens/error.tsx"),
    layout("core/layouts/public.layout.tsx", [
      // Routes that should only be visible to unauthenticated users.
      route("/login", "features/auth/screens/login.tsx"),
      route("/join", "features/auth/screens/join.tsx"),
      ...prefix("/auth", [
        route("/api/resend", "features/auth/api/resend.tsx"),
        route("/naver", "features/auth/api/naver.tsx"),
        route("/naver/callback", "features/auth/api/naver-callback.tsx"),
        route(
          "/forgot-password/reset",
          "features/auth/screens/forgot-password.tsx",
        ),
        route("/magic-link", "features/auth/screens/magic-link.tsx"),
        ...prefix("/otp", [
          route("/start", "features/auth/screens/otp/start.tsx"),
          route("/complete", "features/auth/screens/otp/complete.tsx"),
        ]),
        ...prefix("/social", [
          route("/start/:provider", "features/auth/screens/social/start.tsx"),
          route(
            "/complete/:provider",
            "features/auth/screens/social/complete.tsx",
          ),
        ]),
      ]),
    ]),
    layout("core/layouts/private.layout.tsx", { id: "private-auth" }, [
      ...prefix("/auth", [
        route(
          "/forgot-password/create",
          "features/auth/screens/new-password.tsx",
        ),
        route("/email-verified", "features/auth/screens/email-verified.tsx"),
        route(
          "/complete-profile",
          "features/auth/screens/complete-profile.tsx",
        ),
      ]),
      // Routes that should only be visible to authenticated users.
      route("/logout", "features/auth/screens/logout.tsx"),
    ]),
    route("/contact", "features/contact/screens/contact-us.tsx"),
    ...prefix("/payments", [
      route("/checkout", "features/payments/screens/checkout.tsx"),
      layout("core/layouts/private.layout.tsx", { id: "private-payments" }, [
        route("/success", "features/payments/screens/success.tsx"),
        route("/failure", "features/payments/screens/failure.tsx"),
      ]),
    ]),
    // Points and Guide top-level routes under main navigation
    route("/points", "features/points/screens/points.tsx"),
    route("/guide", "features/guide/screens/guide.tsx"),
    route("/attendance", "features/attendance/screens/attendance.tsx"),
    // Blog routes moved under the main navigation layout so the NavigationBar persists
    ...prefix("/blog", [
      index("features/blog/screens/posts.tsx"),
      route(":slug", "features/blog/screens/post.tsx"),
    ]),
    // Chat routes
    ...prefix("/chat", [
      route("/:characterId", "features/chat/screens/chat.tsx"),
    ]),
    // Character routes
    ...prefix("/characters", [
      index("features/characters/screens/character-list.tsx"),
      layout("core/layouts/private.layout.tsx", { id: "private-characters" }, [
        route("/create", "features/characters/screens/character-create.tsx"),
        route(
          "/:characterId/edit",
          "features/characters/screens/character-edit.tsx",
        ),
      ]),
    ]),
  ]),

  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
  ]),

  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),
] satisfies RouteConfig;
