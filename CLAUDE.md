# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (localhost:3000)
yarn build        # Production build
yarn lint         # Run ESLint
yarn lint:fix     # Run ESLint with auto-fix
yarn format       # Format with Prettier
```

Package manager: **Yarn** (not npm or pnpm).

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Architecture

**Infinity Nikki Tracker** — a Next.js 15 App Router app with Supabase backend for tracking in-game Eureka outfit collection progress.

### Route Structure

- `app/layout.tsx` — Root layout with `ThemeProvider` (next-themes, Geist font)
- `app/(main)/` — Main app group with sidebar layout (`AppSidebar` + `SiteHeader`)
  - `page.tsx` — Dashboard/home
  - `eureka/page.tsx` — Grid of all Eureka Sets with overall progress
  - `eureka/[slug]/page.tsx` — Individual Eureka Set detail with realtime updates
  - `eureka/missing/page.tsx` — Missing items view
  - `eureka/trials/page.tsx` — Trials view
  - `account/page.tsx` — User account management
  - `protected/` — Auth-gated pages
- `app/auth/` — Auth pages (login, sign-up, forgot-password, update-password, confirm, error)

### Data Flow

Server Components fetch via `lib/data.ts` (React `cache()` wrapped), then pass to Client Components for interactivity:

1. `lib/data.ts` — All Supabase queries. Key functions: `getEurekaSets()`, `getEurekaSet(slug)`, `getTrials()`, `getObtained(user_id)`
2. `hooks/user.ts` — `getUserID()` reads auth claims server-side
3. `hooks/eureka-set.ts` — Pure functions `createEurekaSet()` and `updateEurekaSet()` for transforming data
4. `hooks/count.ts` — `count()` and `percent()` utilities for progress calculation
5. `app/(main)/eureka/actions.ts` — Client-side `handleObtained(slug)` toggles obtained state in Supabase

### Realtime Pattern

`components/realtime-eureka-set.tsx` is the canonical realtime pattern: server fetches initial data → passes as props → client subscribes to `postgres_changes` on the `obtained` table → local state updates trigger `updateEurekaSet()` recalculation.

Auth state is propagated as an explicit `user: boolean` prop from Server Components down through `RealtimeEurekaSet` → `EurekaHeader`, `EurekaTable`, and `EurekaButton`. The slug detail page sets this via `!!(user_id)`.

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` middleware for session refresh

### Key Database Tables

- `eureka_sets` — Outfit set metadata (name, slug, quality, style, labels, trial)
- `eureka` — Individual eureka items (eureka_set FK, color, category, image_url, default)
- `categories` — Category lookup (name, image_url)
- `colors` — Color lookup (name, image_url)
- `obtained` — User collection records (user_id, eureka_set, category, color)
- `trials` — Trial lookup

### Obtained Slug Format

Eureka items are identified by a slug: `{eureka_set_with_underscores}-{category}-{color}`. The `handleObtained` action parses and reconstructs this to query the DB.

### UI Stack

- **shadcn/ui** components in `components/ui/` (managed via `shadcn` CLI, config in `components.json`)
- **Tailwind CSS** with `tailwindcss-animate`
- **Radix UI** primitives
- **TanStack Table** for data tables (`components/data-table.tsx`, `components/eureka-table.tsx`)
- **Recharts** for charts (`components/chart-area-interactive.tsx`)
- **dnd-kit** for drag-and-drop
- **Lucide React** for icons
- **Sonner** for toasts

### Code Style

Prettier config: no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5), `prettier-plugin-tailwindcss` for class sorting.

Path alias `@/` maps to the project root.
