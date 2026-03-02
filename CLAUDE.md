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
- `app/auth/` — Auth pages (login, sign-up, forgot-password, update-password, confirm, error)

### Component Organization

Components are grouped into subdirectories:

- `components/navbar/` — nav-drawer, nav-extra, nav-main, nav-secondary, nav-skeleton, nav-tabs, nav-user, theme-switcher
- `components/admin/` — admin-table (generic paginated table), eureka-set-table, eureka-variant-table, trial-table, dashboard-list, stat-card, view-all-button
- `components/realtime/` — realtime-eureka-set, realtime-eureka-filter
- `components/forms/auth/` — profile-form, forgot-password-form, update-password-form
- `components/forms/eureka-set/` — add-eureka-set-form, edit-eureka-set-form
- `components/forms/eureka-variant/` — add-eureka-variant-form, edit-eureka-variant-form
- `components/forms/trial/` — add-trial-form, edit-trial-form

### Data Flow

Server Components fetch via `lib/data.ts` (React `cache()` wrapped), then pass to Client Components for interactivity:

1. `lib/data.ts` — All Supabase queries. Key functions: `getEurekaSets()`, `getEurekaSet(slug)`, `getTrials()`, `getObtained(user_id)`, `getProfile(user_id)`, `getEurekaVariants()`, `getAdminData()`
2. `hooks/user.ts` — `getUserID()`, `getUserClaims()`, `getUserRole()` read auth claims server-side
3. `hooks/eureka-set.ts` — Pure functions `createEurekaSet()` and `updateEurekaSet()` for transforming data
4. `hooks/count.ts` — `countObtained()` and `percent()` utilities for progress calculation
5. `app/(main)/eureka/actions.ts` — Client-side `handleObtained(slug)` toggles obtained state in Supabase

### Realtime Pattern

`components/realtime/realtime-eureka-set.tsx` is the canonical realtime pattern: server fetches initial data → passes as props → client subscribes to `postgres_changes` on the `obtained` table → local state updates trigger `updateEurekaSet()` recalculation.

Auth state is propagated as an explicit `isLoggedIn: boolean` prop from Server Components down through `RealtimeEurekaSet` → `EurekaHeader` and `EurekaButton`. The slug detail page sets this via `!!(user_id)`.

### Nav System

`lib/nav-links.tsx` — central nav data: `navMain`, `navSecondary`, `navExtra`. `NavSecondaryLink` in `lib/types/types.ts` supports `adminOnly`, `exclusiveItems`, and `items` fields.

- `adminOnly: true` — link is filtered out for non-admins in both the drawer and the user menu
- `exclusiveItems: true` — nav tabs show only the matching sub-item when not at the section root
- All `navSecondary` links are visible in the drawer; drawer links show a `placement="right"` tooltip when the drawer is collapsed
- `nav-user.tsx` uses a `navIcon(url)` helper to render `fontSize="small"` icons in the user menu (Dashboard → `Dashboard`, Profile → `AccountCircle`, others → `ViewList`)

### Admin Tables

`components/admin/admin-table.tsx` — generic `'use client'` `AdminTable<T>` component with MUI `TablePagination` (default 20 rows, options 10/20/50/100). Accepts a `Column<T>[]` array with `header`, `cell`, `align`, and `cellSx` fields. Entity-specific table components (`eureka-set-table.tsx`, `eureka-variant-table.tsx`, `trial-table.tsx`) own their column definitions as `'use client'` components and accept plain serializable row data from Server Components — functions in `cell` are never passed across the RSC boundary.

`components/admin/dashboard-list.tsx` — `DashboardList` component used on the admin dashboard for recent item lists. Accepts `title`, `viewHref`, and `items: DashboardListItem[]` (with optional `secondaryAction`). Uses `CardHeader` with a `ViewAllButton` action.

`components/admin/stat-card.tsx` — `StatCard` component used on the admin dashboard for entity counts with Add and View All links.

`components/admin/view-all-button.tsx` — shared "View all" button with arrow icon, used in both `DashboardList` and `StatCard`.

### Role-Based Access

`getUserRole()` fetches `profiles.role` server-side. Admin role is required to access the dashboard. The `isAdmin` boolean prop is passed down to `NavUser` (filters `adminOnly` nav links) and `ProfileForm` (shows admin chip or access request button).

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` middleware for session refresh

### Key Database Tables

- `eureka_sets` — Outfit set metadata (name, slug, quality, style, labels, trial)
- `eureka_variants` — Individual eureka items (eureka_set FK, color, category, image_url, default, slug)
- `categories` — Category lookup (name, image_url)
- `colors` — Color lookup (name, image_url)
- `obtained` — User collection records (user_id, eureka_set, category, color)
- `trials` — Trial lookup
- `profiles` — User profiles (full_name, username, avatar_url, role)

### Slug Helpers

`lib/utils.ts` exports two slug utilities:

- `toSlug(name)` — converts a name to a set slug (`spaces → _`, lowercase)
- `toSlugVariant(eurekaSet, category, color)` — builds a variant slug `{set}-{category}-{color}`

Eureka variant forms auto-generate the slug from the selected eureka set, category, and color via a `useEffect`. The slug field is read-only by default; an edit icon unlocks manual entry.

### UI Stack

- **MUI (Material UI)** — primary component library with CSS variables (`cssVariables: { colorSchemeSelector: 'class' }`) and built-in dark mode (`colorSchemes: { light, dark }`)
- **Tailwind CSS** — utility classes for layout only (not MUI replacements; no shadcn/ui)
- **MUI Icons (`@mui/icons-material`)** — icons throughout nav and admin components
- **Not used:** shadcn/ui, Radix UI, Sonner, next-themes, class-variance-authority

### Theme

`lib/theme.ts` configures the MUI theme. Mode-specific palette shades: light uses `lime[800]`/`pink[200]`, dark uses `lime[500]`/`pink[100]`. `InitColorSchemeScript attribute="class" defaultMode="system"` in root layout prevents SSR flicker — must match `ThemeProvider defaultMode`.

### Code Style

Prettier config: no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5), `prettier-plugin-tailwindcss` for class sorting.

Path alias `@/` maps to the project root.
