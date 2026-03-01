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

**Infinity Nikki Tracker** — a Next.js 16 App Router app with Supabase backend for tracking in-game Eureka outfit collection progress.

### Route Structure

- `app/layout.tsx` — Root layout with MUI `ThemeProvider` + `InitColorSchemeScript` (Roboto font, system dark mode)
- `app/(main)/` — Main app group with nav drawer layout (`NavDrawer`)
  - `page.tsx` — Home / hero
  - `eureka/page.tsx` — Grid of all Eureka Sets with overall progress
  - `eureka/[slug]/page.tsx` — Individual Eureka Set detail with realtime updates
  - `eureka/missing/page.tsx` — Missing items view (auth required)
  - `eureka/trials/page.tsx` — Trials view
  - `(admin)/dashboard/page.tsx` — Admin data management (admin role required)
  - `profile/page.tsx` — User profile management (auth required)
  - `about/page.tsx` — About page
- `app/auth/` — Auth pages (login, sign-up, forgot-password, update-password, confirm, error)

### Data Flow

Server Components fetch via `lib/data.ts` (React `cache()` wrapped), then pass to Client Components for interactivity:

1. `lib/data.ts` — All Supabase queries. Key functions: `getEurekaSets()`, `getEurekaSet(slug)`, `getTrials()`, `getObtained(user_id)`, `getProfile(user_id)`
2. `hooks/user.ts` — `getUserID()`, `getUserClaims()`, `getUserRole()` read auth claims server-side
3. `hooks/eureka-set.ts` — Pure functions `createEurekaSet()` and `updateEurekaSet()` for transforming data
4. `hooks/count.ts` — `count()` and `percent()` utilities for progress calculation
5. `app/(main)/eureka/actions.ts` — Client-side `handleObtained(slug)` toggles obtained state in Supabase

### Realtime Pattern

`components/realtime-eureka-set.tsx` is the canonical realtime pattern: server fetches initial data → passes as props → client subscribes to `postgres_changes` on the `obtained` table → local state updates trigger `updateEurekaSet()` recalculation.

Auth state is propagated as an explicit `isLoggedIn: boolean` prop from Server Components down through `RealtimeEurekaSet` → `EurekaHeader` and `EurekaButton`. The slug detail page sets this via `!!(user_id)`.

### Role-Based Access

`getUserRole()` fetches `profiles.role` server-side. Admin role is required to access the dashboard. The `isAdmin` boolean prop is passed down to `NavUser` (filters `adminOnly` nav links) and `ProfileForm` (shows admin chip or access request button).

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` middleware for session refresh

### Key Database Tables

- `eureka_sets` — Outfit set metadata (name, slug, quality, style, labels, trial)
- `eureka_variants` — Individual eureka items (eureka_set FK, color, category, image_url, default)
- `categories` — Category lookup (name, image_url)
- `colors` — Color lookup (name, image_url)
- `obtained` — User collection records (user_id, eureka_set, category, color)
- `trials` — Trial lookup
- `profiles` — User profiles (full_name, username, avatar_url, role)

### Obtained Slug Format

Eureka items are identified by a slug: `{eureka_set_with_underscores}-{category}-{color}`. The `handleObtained` action parses and reconstructs this to query the DB.

### UI Stack

- **MUI (Material UI)** — primary component library with CSS variables (`cssVariables: { colorSchemeSelector: 'class' }`) and built-in dark mode (`colorSchemes: { light, dark }`)
- **Tailwind CSS** — utility classes for layout (not MUI replacements)
- **Lucide React** — icons

### Theme

`lib/theme.ts` configures the MUI theme. Mode-specific palette shades: light uses `lime[800]`/`pink[200]`, dark uses `lime[500]`/`pink[100]`. `InitColorSchemeScript attribute="class" defaultMode="system"` in root layout prevents SSR flicker — must match `ThemeProvider defaultMode`.

### Code Style

Prettier config: no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5), `prettier-plugin-tailwindcss` for class sorting.

Path alias `@/` maps to the project root.
