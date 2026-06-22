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
yarn dlx tsc --noEmit                        # Type-check (no `tsc` package script — runs via dlx)
npx npm-check-updates --format group         # Check outdated deps (Yarn 4 has no yarn outdated)
npx npm-check-updates --format group -u      # Write updates to package.json
```

Package manager: **Yarn** (not npm or pnpm). Only `dev/build/start/lint/format/lint:fix` are package scripts.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only; used by API routes / webhooks
NEXT_PUBLIC_SITE_URL=               # absolute base URL for redirects (falls back to VERCEL_URL)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

## Architecture

**Infinity Nikki Tracker** — a Next.js 16 App Router app with a Supabase backend for tracking in-game outfit collection progress. Two collection domains: **Outfits** (gacha/season outfits with Evolutions, Abilities, Seasons) and **Eureka** (craftable outfit sets with color/category Variants and Trials). Also supports user-created **Custom Looks**, per-user **Preferences**, public profiles (`/u/[username]`), and **Stripe** payments (support/coffee).

### Route Structure

Routes are **flat under `app/`** — there is no `(main)` or `(admin)` route group. The only group is `(auth)`. Admin lives at `app/admin/` (literal segment, not a group).

- `app/layout.tsx` — Root layout: `InitColorSchemeScript` → `AppRouterCacheProvider` → `ThemeClientProvider` → `NavBarToolbarProvider` → `SnackbarAlertProvider`, with `NavDrawer`, `NavBar`, `PullToRefresh`, `Footer`, and Vercel `Analytics`
- `app/page.tsx` — Home / hero
- `app/(auth)/` — Auth pages: `login`, `sign-up`, `sign-up-success`, `forgot-password`, `update-password`, `auth/confirm/route.ts` (email OTP → session), `auth/error`
- `app/outfits/` — Outfits domain (own `layout.tsx` wrapping `OutfitDataProvider`)
  - `page.tsx`, `[slug]/page.tsx`, `actions.ts` (`handleObtainedOutfit`)
  - `seasons/page.tsx`, `seasons/[slug]/page.tsx`
- `app/eureka/` — Eureka domain (own `layout.tsx` wrapping `EurekaDataProvider` + `SortProvider`)
  - `page.tsx`, `sets/page.tsx`, `[slug]/page.tsx`, `actions.ts` (`handleObtained`)
  - `trials/page.tsx`, `trials/[slug]/page.tsx`
- `app/looks/` — Custom Looks: `page.tsx`, `[slug]/page.tsx`, `new/page.tsx`, `edit/[slug]/page.tsx`, `actions.ts` (`createLook`, `updateLook`, `deleteLook`)
- `app/profile/page.tsx`, `app/u/[username]/page.tsx` — own + public profiles
- `app/settings/page.tsx` + `actions.ts`, `app/help/page.tsx`, `app/about/page.tsx`
- `app/admin/` — Admin section (own `layout.tsx` redirects non-admins). Two sub-trees, each with `page.tsx` + `new` + `edit/[slug]` + colocated `actions.ts` and `loading.tsx`:
  - `admin/eureka/{sets,variants,trials}/`
  - `admin/outfits/{sets,evolutions,abilities,seasons}/`
- `app/api/` — Route handlers:
  - `eureka/bootstrap/route.ts` — single round-trip payload for the Eureka client provider
  - `outfits/route.ts`, `obtained-outfit/route.ts` — Outfit data + toggle
  - `preferences/route.ts` — user preferences fetch
  - `stripe/checkout/route.ts`, `stripe/webhook/route.ts`
- `app/actions/preferences.ts` — shared Server Actions for all preference writes (theme, filters, group/show toggles, sort, outfit/eureka view state)

### Middleware

**`proxy.ts`** (root level) — exports `async function proxy()` + `config.matcher`. Calls `updateSession()` from `lib/supabase/proxy.ts` to refresh sessions on every request. Matcher excludes static files, images, favicon, and `manifest.webmanifest` (the PWA manifest must stay publicly fetchable). Note: `middleware.ts` is deprecated in Next.js 16 — the convention is `proxy.ts` with `export function proxy()`. Do NOT add a `middleware.ts` alongside it; Next.js 16 errors if both exist.

### Data Flow & State (key pattern)

The app moved away from MUI realtime `postgres_changes` subscriptions to a **client data-provider + context** model:

1. A domain `layout.tsx` reads `getUserID()` server-side and renders a client provider with `isLoggedIn`/`userId` props.
2. The provider (`components/eureka/eureka-data-provider.tsx`, `components/outfits/outfit-data-provider.tsx`) `fetch`es its initial payload from an API route on mount — Eureka from `/api/eureka/bootstrap`, plus `/api/preferences`. The bootstrap route runs `await connection()` first so PPR doesn't prerender it (cookies would reject at build), then `Promise.all`s the React-`cache()`-deduped data hooks.
3. The provider holds collection + filter state, exposes it via context (`eureka-context.tsx`, `outfit-context.tsx`), and calls Server Actions (`handleObtained`, `handleObtainedOutfit`, `app/actions/preferences.ts`) to persist toggles/filters. Optimistic updates use `useTransition` + `notistack` snackbars.

`hooks/data/` holds the Supabase queries (React `cache()` or `use cache`, see Code Style). `hooks/eureka.ts` / `hooks/outfit.ts` hold pure transforms (`createEurekaSet`, `updateEurekaVariants`, `createOutfitSet`, `sortVariants`, `applyObtainedKeys`, `buildObtainedKeySet`, `isVariantObtained`, `isEvolutionVisible`, etc.). `hooks/count-obtained.ts` → `countObtained()`, `percent()`.

### Component Organization

- `components/navbar/` — nav-bar, nav-drawer, nav-section, nav-styled, nav-user, nav-footer, page-title, appbar-actions, auth-appbar, coffee-button, theme-switcher, navbar-toolbar(+context)
- `components/eureka/` — eureka-data-provider, eureka-context, eureka-card(+content/+progress), eureka-set-card, eureka-color-set-card, eureka-variant-card, eureka-variant-grid, eureka-variant-color-filter, eureka-button, eureka-toolbar, eureka-set-image, category-image, category-item, filter-eureka, sets-content
- `components/outfits/` — outfit-data-provider, outfit-context, outfit-set-card, outfit-set-detail, outfit-set-section, outfit-variant-card, outfit-evolution-variants, outfit-carousel, outfit-toolbar, filter-outfits, outfit-image-mode-context
- `components/looks/` — look-builder, look-card, look-detail
- `components/filter/` — per-control filter widgets (category/color/rarity/obtained/evolution/glowup toggles, sort toggles, select menus, filter-menu, filter-content-shim, density-toggle)
- `components/admin/` — table-utils (DataGrid helpers: `LockedCell`, `useRowActions`), variant-image-cell
- `components/forms/` — image-upload, carousel-image-upload, bug-report-form, feature-request-form; `forms/eureka-set/color-select`
- `components/` (root) — grid-container, hero(+ctas), section, slug-toolbar, quick-access, pull-to-refresh, progress-chip, percent-label, rarity-stars, color-chip, color-theme-context, sort-context, theme-client-provider, snackbar-provider, lazy-image, toggle-icon, login-alert, logout-button, view-all-button, error-alert

### Admin Tables

Admin list pages use **`@mui/x-data-grid` (v9)** with inline row editing, not a custom table component. `components/admin/table-utils.tsx` provides shared helpers: `useRowActions()` (manages `GridRowModesModel` edit/save/cancel state) and `LockedCell` (links to the full edit form). Each admin list page is a Server Component that `Promise.all`s its data hooks inside a `Suspense` boundary and passes plain rows to a colocated `'use client'` `*-view.tsx` that owns the `GridColDef[]`. Full add/edit forms live under each `admin/.../{new,edit/[slug]}/` route with their own `actions.ts`.

### Role-Based Access

`getUserRole()` reads `profiles.role` server-side. `app/admin/layout.tsx` redirects non-admins. The `isAdmin` boolean prop flows down to nav (filters `adminOnly` links) and the data providers (`isAdmin` enables admin-only UI).

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` for session refresh in `proxy.ts`
- `lib/supabase/public.ts` — `createPublicClient()` cookie-free client; use inside `use cache` functions (no `cookies()` allowed there)

### Key Database Tables

Outfit domain:

- `outfit_sets` — title, slug, rarity, image_url, alt_image_url, description, style, label, ability, seasons (FK), season_category (FK), glowup_evolution
- `outfit_variants`, `outfit_categories`, `outfit_set_carousel_images`
- `evolutions`, `evolution_carousel_images` — outfit evolution stages (FK → outfit_sets)
- `abilities` — outfit ability lookup
- `seasons` — title, slug, image_url, alt_image_url, description, location (FK); `season_categories`
- `obtained_outfit` — per-user outfit collection records
- `locations` — location lookup

Eureka domain:

- `eureka_sets` — title, slug, rarity, style, label; CHECK rarity BETWEEN 2 AND 5
- `eureka_variants` — eureka_set FK, eureka_category, eureka_color, image_url, alt_image_url, default, slug
- `eureka_categories`, `eureka_colors` — lookups (renamed from `categories`/`colors`)
- `eureka_set_trials` — join table eureka_sets ↔ trials
- `trials` — title, slug, image_url
- `obtained_eureka` — per-user eureka collection records (renamed from `obtained`)

Shared / user:

- `profiles` — full_name, username, avatar_url, role: 'user' | 'admin'
- `custom_looks` — user-created looks: name, slug, description, image_url, `eureka_variant_slugs` text[], `outfit_variant_slugs` text[], user_id
- `user_preferences` — per-user theme/color_theme/sort + eureka & outfit filter persistence (one row per user_id); `admin_preferences` — admin view mode
- `styles`, `labels` — lookups; UNIQUE on title; RLS public read / admin write
- DB also defines RPCs `is_admin`, `toggle_obtained`, `toggle_obtained_outfit`

### Slug Helpers

`lib/utils.ts` exports `cn()` (clsx + tailwind-merge), `toSlug(name)` (spaces→`_`, lowercase), `toSlugVariant(set, category, color)` → `{set}-{category}-{color}`, and `toTitle(slug)`. Variant forms auto-generate the slug from set/category/color via `useEffect`; the slug field is read-only until an edit icon unlocks it.

### UI Stack

- **MUI (Material UI) v9** — primary component library, CSS variables (`cssVariables: { colorSchemeSelector: 'class' }`) + built-in dark mode (`colorSchemes: { light, dark }`)
- **`@mui/x-data-grid` v9** — admin tables; **`@mui/x-charts` v9** — collection-stat charts
- **notistack** — snackbar/toast notifications (`SnackbarAlertProvider`, `enqueueSnackbar`)
- **Stripe** (`stripe` v22) — support payments via Checkout + webhook
- **Tailwind CSS** — layout utilities only (not MUI replacements)
- **MUI Icons** + **Lucide React** — icons
- **Not used:** shadcn/ui, Radix UI, next-themes, class-variance-authority

### Theme

`lib/theme.ts` configures the MUI theme with `responsiveFontSizes`. Light uses `lime[900]`/`pink[400]`, dark uses `lime[500]`/`pink[100]`. `InitColorSchemeScript attribute="class" defaultMode="system"` (root layout) must match the `ThemeProvider defaultMode` to prevent SSR flicker. A user color-theme override is wired through `ThemeClientProvider` + `color-theme-context.tsx`. Client Components checking dark mode must use `useColorScheme()` (not `useTheme().palette.mode`) — CSS variables mode doesn't re-render via `useTheme`. Pattern: `const { mode, systemMode } = useColorScheme(); const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'`. Requires `'use client'`.

### Next.js Config

`next.config.ts`: `cacheComponents: true` (component-level caching / PPR), `turbopack.root` set to the parent dir, `images.remotePatterns` allows `static.wikia.nocookie.net/infinity-nikki/**` and the Supabase storage host.

## Claude Automations

Configured in `.claude/settings.json`:

- **PostToolUse hooks** — `yarn format && yarn lint:fix`, then `yarn tsc --noEmit` (head -20) run after every Edit/Write
- **PreToolUse hook** — blocks edits to any `.env` file
- **`/new-data-hook` skill** — scaffolds `hooks/data/` files with the correct `use cache` vs React `cache()` pattern
- **`/format-fix` skill** — runs format/lint/tsc and fixes remaining issues
- **`a11y-reviewer` subagent** — audits MUI components for WCAG 2.1 AA violations
- Stripe skills (`stripe-best-practices`, `upgrade-stripe`) and `ui-ux-pro-max` are installed
- Enabled plugins: frontend-design, github, commit-commands, typescript-lsp, claude-md-management, supabase, vercel

## Git & Deployment

**Branch protection:** `main` requires a PR with 1 approving review + Vercel status check. Force push and deletion are blocked.

**Merge-race guard (do not strand commits):** A squash-merge captures only the commits that existed on the branch _at merge time_. Pushing more commits to a branch after its PR is merged silently strands that work outside `main`. Therefore: **before a PR is merged, confirm all intended commits are already pushed; never push to a branch whose PR is already merged** — branch from `main` and cherry-pick instead. A tracked `pre-push` hook (`.githooks/pre-push`, enabled via `core.hooksPath .githooks`) blocks pushes to any branch whose PR is `MERGED` (override with `git push --no-verify`). The repo also has "automatically delete head branch on merge" enabled so a late push reopens the PR visibly rather than riding a stale branch.

**Cleaning up merged local branches:** Run `git cleanup-merged` (alias → `.githooks/cleanup-merged-branches.sh`) to delete local branches whose PR is `MERGED` **and** whose commits are all in `origin/main`. It deletes only when `git cherry origin/main <branch>` confirms nothing is stranded — a branch with a post-squash commit is kept with a warning, never deleted. Flags: `--dry-run`, `--yes`. Don't `git branch -D` a merged branch by hand without this check.

**Lock PRs after merge:** Merge via the project `/merge-pr` command, which squash-merges, verifies the PR is `MERGED`, then runs `gh pr lock <n> --reason resolved` and finally `git cleanup-merged`. GitHub has no native auto-lock, so the lock lives in the merge flow; if you merge via the web UI, lock manually with `gh pr lock <n> --reason resolved`. Locking marks the PR done and stops the thread reopening (it does not by itself prevent pushes to the head branch — that's the pre-push hook's job).

**Per-clone setup (local git config, not auto-applied on clone):** after a fresh clone, run `git config core.hooksPath .githooks` (enables the pre-push hook) and `git config alias.cleanup-merged '!bash "$(git rev-parse --show-toplevel)/.githooks/cleanup-merged-branches.sh"'` (registers the cleanup command).

**Claude branches:** Auto-generated branches use pattern `claude/<feature>-<id>` — check for unmerged remote branches and create PRs as needed.

**Vercel CLI:**

- `vercel ls --yes` — list deployments (`--yes` skips interactive confirmation)
- `vercel inspect <url>` — check deployment status and build output
- `vercel logs <url>` — stream runtime logs (fails for errored deployments; use Vercel dashboard instead)

**Supabase CLI:**

- `supabase db push --include-all` — use when local migrations predate the latest remote migration
- `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts` — regenerate types after schema changes
- `supabase db dump` requires Docker Desktop to be running; `supabase db execute --sql` does not exist
- FK on a non-PK column requires a UNIQUE constraint on the referenced column first
- Use `ON UPDATE CASCADE` on string FKs so renaming a referenced title cascades automatically
- RLS `WITH CHECK` sub-selects on the same table risk infinite recursion — use `current_setting('request.jwt.claims', true)::jsonb` for role comparisons instead of a sub-select

### Code Style

Prettier config: no semicolons, single quotes, 2-space indent, 100 char print width, trailing commas (ES5), `prettier-plugin-tailwindcss` for class sorting.

Path alias `@/` maps to the project root.

Types live in `lib/types/`:

- `supabase.ts` — generated DB types (`Tables<>`, `TablesInsert<>`, etc.) — the source of truth; regenerate, don't hand-edit
- `eureka.ts` — Eureka domain types derived from `Tables<>` (`EurekaSet`, `EurekaVariant`, `EurekaCategory`, `EurekaColor`, `Trial`, `ObtainedEureka`, `UserPreferences`, …)
- `outfit.ts` — Outfit domain types; `looks.ts` — Custom Looks types
- `props.ts` — UI/nav types (`NavLink`, `CardSize`, `AvatarSize`, `CategoryFilter`, `ObtainedFilter`, sort enums)

Note: some `hooks/data/` files and `lib/theme.ts` use relative imports rather than `@/` — grep both patterns when searching for type usages.

React `cache()` is for reads only — wrapping a mutation in `cache()` makes it silently no-op on repeated calls with the same args. Mutations (in route `actions.ts` and `hooks/data/admin/`) must NOT use `cache()`.

`use cache` vs React `cache()`: public lookup hooks (e.g. `getEurekaCategories`, `getEurekaColors`, `getStyles`, `getLabels`, `getTrials`, `getSeasons`) use `use cache` + `cacheLife` for cross-request caching via `createPublicClient()`. Auth-dependent hooks (`getEurekaSets`, `getObtainedEureka`, `getUserID`, `getPreferences`, …) must use React `cache()` — they call `cookies()`, which is blocked inside `use cache`.

API routes that read auth (e.g. `/api/eureka/bootstrap`) must call `await connection()` before reading cookies so PPR doesn't try to prerender them — keep it outside the try/catch so the prerender-abort signal propagates to React instead of being swallowed as a 500.

`getUserID()` returns `null` for unauthenticated users — always guard before passing to user-scoped queries: `if (!user_id) return data`.

`git add` with paths containing `[slug]` brackets fails in zsh due to glob expansion — always quote: `git add 'app/admin/eureka/sets/edit/[slug]/page.tsx'`.

Avoid `useState` + `useEffect` for derived data — compute directly during render: `const derived = source.filter(...)`.

Prefer CSS grid `Box` over MUI `Grid` for responsive layouts: `<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>`. Avoids the `Grid size` API.

`GridContainer`'s `sideContent` prop accepts falsy values — pass `isLoggedIn && <Component />` to conditionally hide the sidebar.

MUI `Stack` does not accept layout shorthands (`justifyContent`, `alignItems`, etc.) as direct props — always put them in `sx`. Causes a TypeScript build error otherwise.

Hardcoded color strings derived from `useColorScheme()` (e.g. chart segment colors) need a `mounted` guard to avoid SSR/client hydration mismatches: `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'`.

MUI X Charts `PieChart.onItemClick` receives `{ seriesId, dataIndex }` — add an `id` to each series object and match on `seriesId` to distinguish series. `seriesIndex` does not exist on the event params.

`NavBarToolbarContext` (`components/navbar/navbar-toolbar-context.tsx`) carries `toolbarSlot`, `drawerOpen`, and `setDrawerOpen`. `NavDrawer` writes `drawerOpen` on mount and on toggle; `NavBar` reads it to apply `ml`/`width` that match the drawer's open/closed widths with matching transition easing.

Outfit base evolution is stored as `{set}-base` in the DB but must be `null` for client code — resolve via `createOutfitSet()`, never inline.
