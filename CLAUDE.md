# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (localhost:3000)
yarn build        # Production build
yarn start        # Start production server
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
  - `layout.tsx` — Wraps content in `NavDrawer` with `Suspense`/`NavSkeleton` fallback
  - `page.tsx` — Home / hero
  - `eureka/page.tsx` — Grid of all Eureka Sets with overall progress
  - `eureka/loading.tsx` — Skeleton loading UI for the sets grid
  - `eureka/[slug]/page.tsx` — Individual Eureka Set detail with realtime updates
  - `eureka/missing/page.tsx` — Missing items view (auth required)
  - `eureka/missing/loading.tsx` — Skeleton loading UI for the missing items view
  - `eureka/trials/page.tsx` — Trials view
  - `eureka/trials/loading.tsx` — Skeleton loading UI for the trials view
  - `(admin)/layout.tsx` — Redirects non-admin users; wraps admin routes
  - `(admin)/dashboard/page.tsx` — Admin dashboard: stat cards + recent lists (admin role required)
  - `(admin)/eureka-set/page.tsx` — Full eureka sets table with edit buttons
  - `(admin)/eureka-set/new/page.tsx` — Add new eureka set
  - `(admin)/eureka-set/edit/[slug]/page.tsx` — Edit eureka set
  - `(admin)/eureka-variant/page.tsx` — Full eureka variants table with edit buttons
  - `(admin)/eureka-variant/new/page.tsx` — Add new eureka variant
  - `(admin)/eureka-variant/edit/[slug]/page.tsx` — Edit eureka variant (slug-based routing)
  - `(admin)/trial/page.tsx` — Full trials table with edit buttons
  - `(admin)/trial/new/page.tsx` — Add new trial
  - `(admin)/trial/edit/[slug]/page.tsx` — Edit trial (slug-based routing)
  - `profile/page.tsx` — User profile management (auth required)
  - `about/page.tsx` — About page
- `app/auth/` — Auth pages
  - `login/page.tsx`, `sign-up/page.tsx`, `sign-up-success/page.tsx`
  - `forgot-password/page.tsx`, `update-password/page.tsx`
  - `confirm/route.ts` — GET handler for email OTP verification (exchanges code for session)
  - `error/page.tsx`
- `app/(main)/eureka/actions.ts` — Server Action: `handleObtained(slug)` toggles obtained state

### Middleware

**`proxy.ts`** (root level, not `middleware.ts`) — exports `proxy()` and `config.matcher`. Calls `updateSession()` from `lib/supabase/proxy.ts` to refresh sessions on every request. Matches all paths except static files, images, and favicon.

### Component Organization

Components are grouped into subdirectories:

- `components/navbar/` — nav-drawer, nav-extra, nav-footer, nav-main, nav-secondary, nav-skeleton, nav-tabs, nav-user, theme-switcher
- `components/eureka/` — eureka-button, eureka-filter, eureka-header, eureka-set-card, eureka-table
- `components/admin/` — admin-table (generic paginated table), eureka-set-table, eureka-variant-table, trial-table, dashboard-list, stat-card, view-all-button
- `components/realtime/` — realtime-eureka-set, realtime-eureka-filter
- `components/forms/auth/` — login-form, sign-up-form, profile-form, forgot-password-form, update-password-form
- `components/forms/eureka-set/` — add-eureka-set-form, edit-eureka-set-form
- `components/forms/eureka-variant/` — add-eureka-variant-form, edit-eureka-variant-form
- `components/forms/trial/` — add-trial-form, edit-trial-form
- `components/` (root) — avatar-upload, avatar-preview, grid-container, hero, login-alert, logout-button, progress-chip, progress-item, progress-list, quality-stars

### Data Flow

Server Components fetch via `lib/data.ts` (React `cache()` wrapped), then pass to Client Components for interactivity:

1. `lib/data.ts` — All Supabase queries. Key functions:
   - `getEurekaSets()` — All sets with variants, categories, colors, and obtained status for authenticated user
   - `getEurekaSet(slug)` — Single set detail with obtained merging
   - `getTrials()` — All trials (name, image_url) for display
   - `getObtained(user_id)` — User's obtained items (id, eureka_set, category, color)
   - `getEurekaVariants()` — All variants for admin (includes slug, updated_at)
   - `getAdminData()` — Sets (ordered by updated_at desc), categories, colors for admin dashboard
   - `getTrialsAdmin()` — All trials with id, slug, created_at for admin
   - `getProfile(user_id)` — User profile (full_name, username, avatar_url)
2. `hooks/user.ts` — `getUserID()`, `getUserClaims()`, `getUserRole()` read auth claims server-side
3. `hooks/eureka-set.ts` — Pure functions `createEurekaSet()` and `updateEurekaSet()` / `updateEureka()` for transforming data
4. `hooks/count.ts` — `countObtained()` and `percent()` utilities for progress calculation
5. `app/(main)/eureka/actions.ts` — Server Action `handleObtained(slug)` toggles obtained state in Supabase

### Realtime Pattern

`components/realtime/realtime-eureka-set.tsx` is the canonical realtime pattern: server fetches initial data → passes as props → client subscribes to `postgres_changes` on the `obtained` table → local state updates trigger `updateEurekaSet()` recalculation.

Auth state is propagated as an explicit `isLoggedIn: boolean` prop from Server Components down through `RealtimeEurekaSet` → `EurekaHeader` and `EurekaButton`. The slug detail page sets this via `!!(user_id)`.

### Nav System

`lib/nav-links.tsx` — exports `navLinksData` object with `home`, `navMain`, `navSecondary`, and `navExtra` properties. `NavSecondaryLink` in `lib/types/types.ts` supports `adminOnly`, `exclusiveItems`, and `items` fields.

- `adminOnly: true` — link is filtered out for non-admins in both the drawer and the user menu
- `exclusiveItems: true` — nav tabs show only the matching sub-item when not at the section root (used by Eureka Sets, Eureka Variants)
- All `navSecondary` links are visible in the drawer; drawer links show a `placement="right"` tooltip when collapsed
- `nav-user.tsx` uses a `navIcon(url)` helper to render `fontSize="small"` icons in the user menu (Dashboard → `Dashboard`, Profile → `AccountCircle`, others → `ViewList`)

### Admin Tables

`components/admin/admin-table.tsx` — generic `'use client'` `AdminTable<T>` component with MUI `TablePagination` (default 20 rows, options 10/20/50/100). Accepts a `Column<T>[]` array with `header`, `cell`, `align`, and `cellSx` fields. Entity-specific table components (`eureka-set-table.tsx`, `eureka-variant-table.tsx`, `trial-table.tsx`) own their column definitions as `'use client'` components and accept plain serializable row data from Server Components — functions in `cell` are never passed across the RSC boundary.

`components/admin/dashboard-list.tsx` — `DashboardList` component used on the admin dashboard for recent item lists. Accepts `title`, `viewHref`, and `items: DashboardListItem[]` (with optional `secondaryAction`). Uses `CardHeader` with a `ViewAllButton` action.

`components/admin/stat-card.tsx` — `StatCard` component used on the admin dashboard for entity counts with Add and View All links.

`components/admin/view-all-button.tsx` — shared "View all" button with arrow icon, used in both `DashboardList` and `StatCard`.

### Role-Based Access

`getUserRole()` fetches `profiles.role` server-side. Admin role is required to access the admin layout (redirects otherwise). The `isAdmin` boolean prop is passed down to `NavUser` (filters `adminOnly` nav links) and `ProfileForm` (shows admin chip or access request button).

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` middleware for session refresh

### Key Database Tables

- `eureka_sets` — Outfit set metadata (name, slug, quality, style, labels, trial, updated_at)
- `eureka_variants` — Individual eureka items (eureka_set FK, color, category, image_url, default, slug, updated_at)
- `categories` — Category lookup (name, image_url)
- `colors` — Color lookup (name, image_url)
- `obtained` — User collection records (user_id, eureka_set, category, color)
- `trials` — Trial lookup (name, image_url, slug, created_at)
- `profiles` — User profiles (full_name, username, avatar_url, role: 'user' | 'admin')

### Slug Helpers

`lib/utils.ts` exports slug utilities and the `cn()` helper:

- `cn(...inputs)` — `clsx` + `tailwind-merge` class name helper
- `toSlug(name)` — converts a name to a set slug (spaces → `_`, lowercase, trimmed)
- `toSlugVariant(eurekaSet, category, color)` — builds a variant slug `{set}-{category}-{color}`

Eureka variant forms auto-generate the slug from the selected eureka set, category, and color via a `useEffect`. The slug field is read-only by default; an edit icon unlocks manual entry.

### UI Stack

- **MUI (Material UI) v7** — primary component library with CSS variables (`cssVariables: { colorSchemeSelector: 'class' }`) and built-in dark mode (`colorSchemes: { light, dark }`). `MuiCard` has `borderRadius: 12` override.
- **Tailwind CSS** — utility classes for layout only (not MUI replacements; no shadcn/ui)
- **MUI Icons (`@mui/icons-material`)** — icons throughout nav and admin components
- **Lucide React** — additional icons in forms and UI components
- **Not used:** shadcn/ui, Radix UI, Sonner, next-themes, class-variance-authority

### Theme

`lib/theme.ts` configures the MUI theme with `responsiveFontSizes`. Mode-specific palette: light uses `lime[900]` (primary) / `pink[400]` (secondary), dark uses `lime[500]` (primary) / `pink[100]` (secondary). `InitColorSchemeScript attribute="class" defaultMode="system"` in root layout prevents SSR flicker — must match `ThemeProvider defaultMode`.

### Next.js Config

`next.config.ts` enables:
- `cacheComponents: true` — component-level caching
- `turbopack.root` — set to parent directory for monorepo-style Turbopack resolution
- `images.remotePatterns` — allows images from `static.wikia.nocookie.net/infinity-nikki/**`

### Hooks

- `hooks/user.ts` — `getUserClaims()`, `getUserID()`, `getUserRole()` (all server-side, cached)
- `hooks/eureka-set.ts` — `createEurekaSet()`, `updateEurekaSet()`, `updateEureka()` (pure data transforms)
- `hooks/count.ts` — `countObtained(array)` → `{obtained, total}`, `percent(obtained, total)` → percentage string
- `hooks/use-mobile.ts` — `useIsMobile()` hook (768px breakpoint)
- `hooks/use-as-ref.ts` — `useAsRef()` for stable prop refs
- `hooks/use-lazy-ref.ts` — lazy ref initialization utility
- `hooks/use-isomorphic-layout-effect.ts` — SSR-safe `useLayoutEffect`

### Code Style

Prettier config: no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5), `prettier-plugin-tailwindcss` for class sorting.

Path alias `@/` maps to the project root.
