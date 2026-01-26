# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack React Router (v7) application built on the Supaplate template. It uses Supabase for authentication and storage, Drizzle ORM with PostgreSQL for database operations, and follows a feature-based architecture.

**Tech Stack:**
- React Router v7 (SSR enabled)
- Supabase (authentication & backend)
- Drizzle ORM with PostgreSQL
- Tailwind CSS v4 with shadcn/ui components
- i18next for internationalization (en, es, ko)
- Toss Payments integration
- Sentry for error tracking
- Playwright for E2E testing

## Common Commands

### Development
```bash
npm run dev                 # Start development server with Sentry instrumentation
npm run build               # Build production bundle (runs typegen first)
npm start                   # Start production server
npm run typecheck           # Run TypeScript type checking with route type generation
```

### Database Operations
```bash
npm run db:generate         # Generate Drizzle migrations from schema files
npm run db:migrate          # Apply migrations to database
npm run db:typegen          # Generate TypeScript types from Supabase (project ID: mvsrdxkebswndflrgtod)
```

The `db:migrate` command automatically runs `db:typegen` after migrations via the `postdb:migrate` hook.

### Testing & Quality
```bash
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # Run Playwright tests in UI mode
npm run format              # Format app directory with Prettier
```

## Architecture

### Feature-Based Structure

The codebase uses a feature-based organization under `app/features/`. Each feature is self-contained:

```
app/features/{feature-name}/
├── screens/          # Route components (pages)
├── api/              # API route handlers (actions/loaders without UI)
├── components/       # Feature-specific components
├── lib/              # Feature utilities
└── schema.ts         # Drizzle database schema (if needed)
```

**Available Features:** auth, blog, contact, cron, guide, home, legal, payments, points, settings, users

### Core Structure

```
app/core/
├── components/       # Shared UI components (shadcn/ui in core/components/ui/)
├── db/               # Database client and helpers
│   ├── drizzle-client.server.ts    # Drizzle client instance
│   └── helpers.server.ts           # Shared schema helpers (timestamps, etc.)
├── layouts/          # Layout components with authentication guards
│   ├── navigation.layout.tsx       # Main navigation wrapper
│   ├── private.layout.tsx          # Authenticated routes (redirects to /login if not authenticated)
│   └── public.layout.tsx           # Public routes
├── lib/              # Core utilities and clients
│   ├── guards.server.ts            # Authentication & HTTP method guards
│   ├── supa-client.server.ts       # Supabase client factory with cookie handling
│   ├── supa-admin-client.server.ts # Supabase admin client
│   └── i18next.server.ts           # Server-side i18n configuration
└── screens/          # Core screens (404, error, sitemap, robots)
```

### Database Schema Pattern

- Each feature defines its own schema in `schema.ts`
- Drizzle config (`drizzle.config.ts`) automatically discovers all schema files: `./app/features/**/schema.ts`
- Schemas use Supabase RLS policies defined directly in Drizzle:
  ```typescript
  pgPolicy("policy-name", {
    for: "select" | "insert" | "update" | "delete",
    to: authenticatedRole,
    using: sql`${authUid} = ${table.user_id}`,
  })
  ```
- Use `timestamps` helper from `~/core/db/helpers.server` for created_at/updated_at columns
- Migrations are generated to `./sql/migrations/`

### Routing System

Routes are defined in `app/routes.ts` using React Router's route config API:

- **Layouts:** Three-tier layout system (navigation → public/private → feature)
- **API Routes:** Prefix `/api` for routes that export actions/loaders but no UI
- **Authentication Guards:** Private routes use `private.layout.tsx` which redirects unauthenticated users
- **Prerendering:** Legal pages, blog posts, and static pages are prerendered (see `react-router.config.ts`)

### Authentication Pattern

**Server-side:**
```typescript
// In loaders/actions
const [client, headers] = makeServerClient(request);
await requireAuthentication(client);  // Throws 401 if not authenticated
// ... use client for queries
return json({ data }, { headers });   // Always return headers for cookie updates
```

**Layout-based guards:**
- `private.layout.tsx` - Redirects to `/login` if not authenticated
- `public.layout.tsx` - For unauthenticated-only routes (login, join)

### Internationalization

- Supported languages: `en`, `es`, `ko` (defined in `app/i18n.ts`)
- Locale files: `app/locales/{lang}.ts`
- Server detection via `remix-i18next`
- User can switch languages via API route: `/api/settings/locale`

### Theme Management

- Light/dark mode via `remix-themes`
- Theme persisted in session
- Switch via API route: `/api/settings/theme`
- Components use `next-themes` for client-side theme access

### Payment Integration

- Toss Payments SDK (`@tosspayments/tosspayments-sdk`)
- Checkout flow: `/payments/checkout` → success/failure handlers
- Requires authentication (private layout)

## Important Patterns

### Creating a New Feature

1. Create directory: `app/features/{feature-name}/`
2. Add screens to `screens/` directory
3. If needed, create `schema.ts` for database tables
4. Run `npm run db:generate` to create migrations
5. Add routes in `app/routes.ts` with appropriate layout wrapper
6. Import types with `~/` alias (via tsconfig paths)

### Working with Supabase

- **Never** use the service role key in client-accessible code
- Always return headers from `makeServerClient` in responses
- Use `makeServerAdminClient()` only for administrative operations
- Database types are in `database.types.ts` (auto-generated)

### Component Development

- UI components from shadcn/ui are in `app/core/components/ui/`
- Follow existing patterns for new components
- Use `cn()` utility from `~/core/lib/utils` for className merging
- Tailwind v4 is used (note configuration differences from v3)

### Testing

- E2E tests in `e2e/` directory using Playwright
- Test configuration in `playwright.config.ts`
- Run tests locally before committing significant features

## Environment Variables

Required variables (see `.env` for actual values):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `DATABASE_URL` - PostgreSQL connection string for Drizzle
- `VITE_SUPABASE_URL` - Client-side Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Client-side Supabase anonymous key

Optional:
- Sentry: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`
- Various AI API keys (Anthropic, OpenAI, etc.) for AI features

## Deployment

- Configured for Vercel deployment via `@vercel/react-router`
- Vercel preset is applied in production (`react-router.config.ts`)
- Source maps are enabled when `SENTRY_DSN` is set
