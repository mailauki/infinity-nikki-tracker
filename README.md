# Infinity Nikki Tracker

A collection tracker for [Infinity Nikki](https://infinitynikki.infoldgames.com/), the cozy open-world fashion game. Track your Eureka outfit progress across sets, categories, colors, and trials — with real-time updates and per-user collection state.

![Eureka page in light mode showing a grid of outfit set cards with style chip, set name, and quality stars, alongside a category progress sidebar](public/screenshot-light.png)

![Eureka page in dark mode showing the same layout with dark theme applied](public/screenshot-dark.png)

## Features

- **Eureka Set Tracking** — Browse all Eureka sets and mark individual pieces as obtained
- **Progress Visualization** — Per-category, per-color, and per-trial progress bars with percentages
- **Missing Items View** — Filterable list of Eureka pieces you haven't collected yet
- **Trials View** — Progress grouped by in-game trial
- **Filter & Sort** — Filter by category, color, rarity, obtained status, and eureka set; group by set or color
- **Realtime Updates** — Collection state updates instantly across tabs via Supabase Realtime
- **Auth-aware** — Browse as a guest (read-only) or sign in to track your own collection
- **Profile Management** — Update display name, username, and avatar
- **Admin Dashboard** — Manage Eureka sets, variants, and trials from the frontend (admin role required)
- **Dark/Light/System Theme** — Theme switcher in the footer

## Tech Stack

- **[Next.js 16](https://nextjs.org)** — App Router, Server Components, Server Actions, Partial Prerendering (`cacheComponents`)
- **[Supabase](https://supabase.com)** — Postgres database, Auth (cookie-based via `@supabase/ssr`), Realtime subscriptions, Storage (avatars and game images)
- **[MUI (Material UI)](https://mui.com)** — Component library with CSS variables and built-in dark mode
- **[Tailwind CSS](https://tailwindcss.com)** — Utility classes for layout
- **[MUI Icons](https://mui.com/material-ui/material-icons/)** — Icons (`@mui/icons-material`)

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository and install dependencies:

   ```bash
   yarn install
   ```

2. Create `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
   ```

   Both values can be found in your [Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true).

3. Start the development server:

   ```bash
   yarn dev
   ```

   The app will be running at [localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                    |
| --------------- | ------------------------------ |
| `yarn dev`      | Start the development server   |
| `yarn build`    | Build for production           |
| `yarn start`    | Start the production server    |
| `yarn lint`     | Run ESLint                     |
| `yarn lint:fix` | Run ESLint with auto-fix       |
| `yarn format`   | Format all files with Prettier |

## Project Structure

```
app/
  (main)/               # Main app (nav drawer layout)
    page.tsx              # Home / hero
    eureka/
      page.tsx            # All Eureka sets + overall progress
      loading.tsx         # Skeleton loading UI
      [slug]/             # Individual set detail with realtime updates
      missing/            # Filterable missing items (auth required)
      trials/             # Progress grouped by trial
    (admin)/              # Admin section (admin role required)
      dashboard/          # Stat cards + recent lists for sets, variants, and trials
      eureka-set/         # Eureka sets table, add, and edit pages
      eureka-variant/     # Eureka variants table, add, and edit pages
      trial/              # Trials table, add, and edit pages
    profile/              # User profile (auth required)
    about/                # About page
  auth/                   # Auth pages (login, sign-up, etc.)

components/
  navbar/                 # Nav drawer, tabs, user menu, theme switcher, filter menu
  eureka/                 # Eureka display components (button, set-card, table)
    filter/               # Decomposed filter controls (category, color, rarity, obtained, sort toggles)
  admin/                  # Generic paginated table/list, entity-specific tables, dashboard components
  realtime/               # Realtime-subscribed client components
  forms/
    auth/                 # Login, sign-up, profile, forgot-password, update-password forms
    eureka-set/           # Add and edit eureka set forms
    eureka-variant/       # Add and edit eureka variant forms
    trial/                # Add and edit trial forms

lib/
  utils.ts                # cn(), toSlug(), toSlugVariant() helpers
  theme.ts                # MUI theme configuration
  nav-links.tsx           # Navigation link definitions
  supabase/
    server.ts             # Cookie-based client for Server Components/Actions
    client.ts             # Browser client for Client Components
    public.ts             # Cookie-free client for use inside `use cache` functions
    proxy.ts              # updateSession() middleware
  types/
    eureka.ts             # Domain types derived from Supabase Tables<> (EurekaSet, EurekaVariant, Category, Color, Style, Label, Trial, etc.)
    props.ts              # UI/nav types (NavLink, CardSize, AvatarSize, CategoryType)
    dashboard.ts          # DashboardTabsProps (uses Tables<'eureka_sets'>, Tables<'eureka_variants'>, Trial)

hooks/
  user.ts                 # getUserID(), getUserClaims(), getUserRole() — server-side auth
  eureka.ts               # createEurekaSet(), updateEurekaSet(), updateEurekaVariants() — data transforms
  count-obtained.ts       # countObtained(), percent() — progress calculation
  data/
    categories.ts         # getCategories() — use cache, cacheLife('days')
    colors.ts             # getColors() — use cache, cacheLife('days')
    styles.ts             # getStyles() — use cache, cacheLife('days')
    labels.ts             # getLabels() — use cache, cacheLife('days')
    trials.ts             # getTrials() — use cache, cacheLife('hours')
    eureka-sets.ts        # getEurekaSets(), getEurekaSet() — React cache (auth-dependent)
    obtained-eureka.ts    # getObtained() — React cache (user-scoped)
    admin/                # Admin-only queries (no cache() — mutations must not be cached)
```

## Database Schema

| Table             | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `eureka_sets`     | Outfit set metadata (title, slug, rarity, style, label, trial) — FKs use slug columns          |
| `eureka_variants` | Individual Eureka items (eureka_set slug FK, color slug FK, category slug FK, image_url, slug) |
| `categories`      | Category lookup with images (slug-keyed)                                                       |
| `colors`          | Color lookup with images (slug-keyed)                                                          |
| `styles`          | Style lookup (unique titles + slugs, FK target for `eureka_sets.style`); RLS enabled           |
| `labels`          | Label lookup (unique titles + slugs, FK target for `eureka_sets.label`); RLS enabled           |
| `obtained_eureka` | Per-user collection records (user_id, eureka_set slug, category slug, color slug)              |
| `trials`          | Trial lookup with images and slug (FK target for `eureka_sets.trial`)                          |
| `profiles`        | User profiles (full_name, username, avatar_url, role: 'user' \| 'admin')                       |

## Authentication

The app uses Supabase Auth with cookie-based sessions. The middleware in `lib/supabase/proxy.ts` handles session refresh on every request. Public routes (`/`, `/eureka/**`, `/about`) are accessible without signing in — users just won't see progress tracking until they authenticate.

Roles are stored in the `profiles` table. Admin role is required to access the dashboard.
