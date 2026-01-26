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
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),
    ...prefix("/cron", [route("/mailer", "features/cron/api/mailer.tsx")]),
    ...prefix("/blog", [route("/og", "features/blog/api/og.tsx")]),
    ...prefix("/characters", [
      route("/list", "features/characters/api/list.tsx"),
      route("/my", "features/characters/api/my.tsx"),
      route("/:id", "features/characters/api/detail.tsx"),
      route("/like", "features/characters/api/like.tsx"),
      route("/create", "features/characters/api/create.tsx"),
      route("/update", "features/characters/api/update.tsx"),
      route("/delete", "features/characters/api/delete.tsx"),
    ]),
    ...prefix("/points", [
      route("/balance", "features/points/api/balance.tsx"),
      route("/history", "features/points/api/history.tsx"),
      route("/usage", "features/points/api/usage.tsx"),
    ]),
    ...prefix("/chat", [
      route("/message", "features/chat/api/chat.tsx"),
      route("/branch", "features/chat/api/branch.tsx"),
      route("/memory", "features/chat/api/memory.tsx"),
    ]),
    ...prefix("/payments", [
      route("/stripe/checkout", "features/payments/api/stripe-checkout.tsx"),
      route("/stripe/webhook", "features/payments/api/stripe-webhook.tsx"),
    ]),
    ...prefix("/attendance", [
      route("/checkin", "features/attendance/api/checkin.tsx"),
    ]),
    ...prefix("/admin", [
      route("/users", "features/admin/api/users.tsx"),
      route("/characters", "features/admin/api/characters.tsx"),
      route("/stats", "features/admin/api/stats.tsx"),
    ]),
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
          // Note: provider param is not used by the complete screen, so we don't require it
          route(
            "/complete",
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
    // Blog routes moved under the main navigation layout so the NavigationBar persists
    ...prefix("/blog", [
      index("features/blog/screens/posts.tsx"),
      route(":slug", "features/blog/screens/post.tsx"),
    ]),
    // Chat routes (requires authentication via private.layout)
    layout("core/layouts/private.layout.tsx", { id: "private-chat" }, [
      route("/rooms", "features/chat/screens/rooms.tsx"),
      route("/chat/:roomId", "features/chat/screens/chat.tsx"),
    ]),
    // Character routes (requires authentication)
    layout("core/layouts/private.layout.tsx", { id: "private-characters" }, [
      route("/characters", "features/characters/screens/list.tsx"),
      route("/characters/create", "features/characters/screens/create.tsx"),
      route(
        "/characters/:characterId",
        "features/characters/screens/detail.tsx",
      ),
    ]),
    // Attendance route (requires authentication)
    layout("core/layouts/private.layout.tsx", { id: "private-attendance" }, [
      route("/attendance", "features/attendance/screens/attendance.tsx"),
    ]),
    // Admin routes (requires admin authentication)
    layout("core/layouts/private.layout.tsx", { id: "private-admin" }, [
      ...prefix("/admin", [
        index("features/admin/screens/dashboard.tsx"),
        route("/users", "features/admin/screens/users.tsx"),
        route("/characters", "features/admin/screens/characters.tsx"),
      ]),
    ]),
  ]),

  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("/my-content", "features/users/screens/my-content.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
  ]),

  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),
] satisfies RouteConfig;
