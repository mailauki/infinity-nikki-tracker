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
yarn tsc --noEmit                            # Type-check (runs the local TypeScript binary; NOT `yarn dlx tsc`, which fetches a bogus placeholder package)
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

Routes are **flat under `app/`** — there is no `(main)` or `(admin)` route group. The only group is `(auth)`. Admin lives at `app/admin/` (literal segment, not a group). Each domain (`outfits`, `eureka`, `looks`) owns its own `layout.tsx` and colocated `actions.ts`; run `ls app/` for the current tree.

`app/actions/preferences.ts` is the one cross-cutting exception — shared Server Actions for all preference writes (theme, filters, group/show toggles, sort, outfit/eureka view state), used by every domain.

### Middleware

**`proxy.ts`** (root level) — exports `async function proxy()` + `config.matcher`. Calls `updateSession()` from `lib/supabase/proxy.ts` to refresh sessions on every request. Matcher excludes static files, images, favicon, and `manifest.webmanifest` (the PWA manifest must stay publicly fetchable). Note: `middleware.ts` is deprecated in Next.js 16 — the convention is `proxy.ts` with `export function proxy()`. Do NOT add a `middleware.ts` alongside it; Next.js 16 errors if both exist.

### Data Flow & State (key pattern)

The app moved away from MUI realtime `postgres_changes` subscriptions to a **client data-provider + context** model:

1. A domain `layout.tsx` reads `getUserID()` server-side and renders a client provider with `isLoggedIn`/`userId` props.
2. The provider (`app/eureka/eureka-data-provider.tsx`, `app/outfits/outfit-data-provider.tsx`) `fetch`es its initial payload from an API route on mount — Eureka from `/api/eureka/bootstrap`, plus `/api/preferences`. The bootstrap route runs `await connection()` first so PPR doesn't prerender it (cookies would reject at build), then `Promise.all`s the React-`cache()`-deduped data hooks.
3. The provider holds collection + filter state, exposes it via context (`eureka-context.tsx`, `outfit-context.tsx`), and calls Server Actions (`handleObtained`, `handleObtainedOutfit`, `app/actions/preferences.ts`) to persist toggles/filters. Optimistic updates use `useTransition` + `notistack` snackbars.

`hooks/data/` holds the Supabase queries (React `cache()` or `use cache`, see Code Style). `hooks/eureka.ts` / `hooks/outfit.ts` hold pure transforms (`createEurekaSet`, `updateEurekaVariants`, `createOutfitSet`, `sortVariants`, `applyObtainedKeys`, `buildObtainedKeySet`, `isVariantObtained`, `isEvolutionVisible`, etc.). `hooks/count-obtained.ts` → `countObtained()`, `percent()`.

### Component Organization

**Colocation rule:** a component whose entire (transitive) consumer set lives under one route subtree is colocated as a flat `.tsx` file beside that route's `page.tsx` — not under `components/`. (Next.js only treats `page`/`layout`/`route`/`loading`/`error` as special segments; any other `.tsx` in a route folder is a plain module.) `components/` holds only genuinely shared code: anything imported by 2+ unrelated routes, the root layout, or a global Server Action (`app/actions/preferences.ts`). When adding a component, place it next to its page if single-route; promote it to `components/` only when a second route starts importing it.

Admin sub-trees additionally colocate their `*-table.tsx` list views and `{new,edit/[slug]}/*-form.tsx` forms next to their pages, plus DataGrid helpers in `app/admin/eureka/table-utils.tsx` (`LockedCell`, `useRowActions`).

Note: `components/eureka/` still holds `eureka-button`, `eureka-variant-grid`, `category-image`, and `category-item`, which are currently unreferenced — don't assume they're live code.

### Admin Tables

Admin list pages use **`@mui/x-data-grid` (v9)** with inline row editing, not a custom table component. `app/admin/eureka/table-utils.tsx` provides shared helpers: `useRowActions()` (manages `GridRowModesModel` edit/save/cancel state) and `LockedCell` (links to the full edit form). Each admin list page is a Server Component that `Promise.all`s its data hooks inside a `Suspense` boundary and passes plain rows to a colocated `'use client'` `*-view.tsx` that owns the `GridColDef[]`. Full add/edit forms live under each `admin/.../{new,edit/[slug]}/` route with their own `actions.ts`.

### Role-Based Access

`getUserRole()` reads `profiles.role` server-side. `app/admin/layout.tsx` redirects non-admins. The `isAdmin` boolean prop flows down to nav (filters `adminOnly` links) and the data providers (`isAdmin` enables admin-only UI).

### Supabase Clients

- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser)
- `lib/supabase/proxy.ts` — `updateSession()` for session refresh in `proxy.ts`
- `lib/supabase/public.ts` — `createPublicClient()` cookie-free client; use inside `use cache` functions (no `cookies()` allowed there)

### Key Database Tables

Column-level schema lives in `lib/types/supabase.ts` (generated — the source of truth). Non-obvious constraints and things the generated types don't show:

- `eureka_sets` — CHECK rarity BETWEEN 2 AND 5
- `eureka_categories` / `eureka_colors` / `obtained_eureka` — renamed from `categories` / `colors` / `obtained`; older migrations and code comments may use the old names
- `user_preferences` — exactly one row per user_id; `admin_preferences` is separate (admin view mode)
- `styles`, `labels` — UNIQUE on title; RLS public read / admin write
- RPCs (not in the generated table types): `is_admin`, `toggle_obtained`, `toggle_obtained_outfit`

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

### Card Animations

`CardShell` mounts its MUI `Grow` **only** when `animateExit` is true. The transition exists for exactly one moment: completing a card while the "missing" obtained filter is active, so it leaves the filtered view smoothly. Every other time the obtained toggle just swaps its own icon and the card stays put, so `in` is pinned true and the transition can never run. The card wrappers pass `animateExit={isMissingFilter}` — the same condition that gates their `exiting` state. Cards with no missing-filter path at all (`eureka-color-set-card`, `momo-cloaks`, `makeup-set-item`) pass a bare `in` and never mount a transition.

The obtained toggle is optimistic, so a completed card is culled by the filter memo in the **same commit** that starts its exit animation — the parent unmounts it before a frame paints. `hooks/use-exit-hold.ts` (`useExitHold`, held in each data provider, exposed as `exitingKeys` / `onHoldExit`) fixes that: the card registers its variant keys when it sets `exiting`, and the three filter pipelines keep any variant in `exitingKeys` regardless of the obtained filter. Only the disappearance waits — the toggle icon, progress chips, and the DB write are all still instant. Expiry is on a **timer** (`CARD_EXIT_HOLD_MS`), never `onExited`: the grids are virtualized, so a row can be unmounted mid-animation and `onExited` would strand the key, leaving an obtained card in the "missing" list. Whatever starts the animation must register the hold — the grouped compact grid deliberately doesn't pass `isMissingFilter`, so its cards neither animate nor hold.

Do **not** reintroduce a mount-**in** animation (the `const [grown, setGrown] = useState(false)` + `useEffect(() => setGrown(true))` pattern). It was removed from the outfit cards because rows mount and unmount constantly under virtualization — see `docs/superpowers/specs/2026-07-30-known-issue-standard-grid-flash.md` — and it costs an extra render plus a 300ms transition per card everywhere else.

### Images

Every remote image goes through **`components/lazy-image.tsx`** (`LazyImage`) over **`hooks/use-lazy-image.ts`**. Three render states, never a broken-image glyph: skeleton while pending, the `<img>` once decoded, an icon placeholder when there is no src or every retry failed. The hook retries a broken URL `MAX_ATTEMPTS` (3) times on an exponential backoff with a `?retry=N` cache-buster, then gives up; module-level caches remember per-URL outcomes for the session so a virtualized row remounting skips the skeleton on a known-good URL and skips the retry ladder entirely on a known-dead one (failures expire after 30s and are cleared on `online`).

Do **not** pass a remote `src` to MUI `Avatar` directly — its internal `useLoaded` constructs a detached `new Image()` per src, which both duplicates the request and ignores `loading="lazy"`, so off-screen overscan rows fetch eagerly. `LazyImage` renders its own `<img>` as an Avatar _child_ instead; `components/__tests__/lazy-image.test.tsx` guards this.

`LazyImage` is `memo`'d for the virtualized grids, so call sites must pass **hoisted** `sx` objects and fallback elements (see `components/variant-card.tsx`, `components/set-card.tsx`) — an inline object literal silently defeats it.

**Small avatars only** (`xs`/`sm`, including the theme's default size) request an edge-resized thumbnail: `lib/image-transform.ts` rewrites `/storage/v1/object/public/` to Storage's `/storage/v1/render/image/public/` with `width`/`height`/`resize`/`quality`. It rewrites nothing else — local `/icons`, `blob:`/`data:`, and any URL already carrying query params (signed URLs) pass through. Transformations are a paid Storage feature, so `useLazyImage(preferred, fallback)` keeps the original URL as an immediate no-backoff fallback, and the first thumbnail that fails where the original succeeds calls `reportTransformFailure()`, switching the rewrite off for the rest of the session. **If transformations are disabled on the project this degrades silently to today's behavior** — one wasted request on the first small avatar, then nothing.

### Typography

The type scale is **M3, keyed on two props**: `variant` is the role (`display`, `headline`, `title`, `body`, `label`) and `size` is the step (`large`, `medium`, `small`, defaulting to `medium`). Write `<Typography variant="body">` for body/medium and add `size` only when you need a different step.

MUI's built-in variants are **removed** — `h1`-`h6`, `subtitle1/2`, `body1/2`, `caption`, `overline` are typed `false` in `TypographyPropsVariantOverrides`, so a leftover `variant="h6"` is a build error rather than an unstyled element. The same override is applied to `Link`, which forwards `variant` to Typography. (`theme.typography.button` stays — MuiButton/Tab/Chip read it internally — but is not a Typography variant.)

The scale itself lives in `M3_TYPE_SCALE` and is applied through **style variants** on `MuiTypography`, not `theme.typography` keys, because one theme key can't be selected by two props. Consequence: `sx={{ fontSize: 'body1.fontSize' }}`-style token lookups no longer resolve — use a literal size.

**Every variant renders a `<span>`** via `variantMapping`, so the type scale never creates document structure on its own. Headings are opted into explicitly per call site with `component="h2"`, which overrides the mapping while keeping the variant's styling. When adding a heading, pass `component` — picking a big `variant` alone gives you a styled span and no outline.

`lib/__tests__/theme-typography.test.tsx` guards all of this: every variant/size pair's font size, the medium default, span-by-default, `component` override, and that `size` never leaks to the DOM.

### Theme

`lib/theme.ts` configures the MUI theme. Palette colors do NOT come from MUI's color imports — they are hex M3 token sets in `lib/theme-presets.ts` (`COLOR_THEME_PRESETS`: `default`/Terracotta, `moonlight`, `blossom`, `forest`). Each preset holds a full light + dark `M3ColorScheme`: `primary`/`secondary`/`tertiary`/`error`/`success` as `{ main, on, container, onContainer }`, a 13-key `surface` object (the 8-step ladder plus `on`/`onVariant`/`variant`/`inverse`/`inverseOn`), `outline`, `outlineVariant`, and `inversePrimary`. `buildColorSchemes(preset)` turns one into MUI `colorSchemes`, deriving `background`, `text.primary`/`text.secondary` and `divider` from the surface and outline tokens and mapping each role's `on` onto MUI's `contrastText` — a preset never states the same color twice, so don't add `background`/`text`/`divider` keys back to it.

The tone values were generated by holding each key color's hue and chroma and moving L\* to the M3 tone (tone N == L\* N), clipping chroma to the sRGB gamut; `moonlight` reproduces the M3 baseline scheme, which is the check that the other three sit in the same system. `lib/__tests__/theme-surfaces.test.tsx` asserts every content pair clears WCAG AA (and `outline` clears 3:1), so regenerated tones have to keep doing so.

There are **no `*Hover` palette tokens**. Translucency comes from `color-mix` over the live CSS variable instead — `withOpacity()` inside the theme, and the exported `TRANSLUCENT_SURFACE` for the four blurred results bars. This matters: under `cssVariables` one class swaps both schemes, so `alpha(theme.palette.x)` inside a `styleOverride` or `sx` callback freezes the value to light mode. Use the `paletteToken(theme, p => p.x.y)` helper (returns `theme.vars` when available) rather than reading `theme.palette` directly.

**Filled surfaces are selected by `surface` + `level`, never `elevation`** — the same role/step split as the type scale. `surface` is the M3 role (`base` | `dim` | `bright` | `container`) and `level` the step within it (`lowest` | `low` | `medium` | `high` | `highest`, defaulting to `medium`). Only `container` has steps in M3, so `level` is inert on the other three. `<Card level="high">` → `surface.containerHigh`; `MuiCard` defaults to `surface="container" level="low"`. `elevation` stays a plain MUI shadow number for `variant="elevation"` papers and has no effect on a filled one. Every rule requires `surface`: `variant="filled"` on its own picks no tone. That is deliberate scoping — `MuiPaper.styleOverrides` reach every Paper-derived component, and some (Alert, and anything MUI adds later) already mean something else by `filled`. Naming a role is what opts a paper into the ladder, so those are left alone; a bare filled Paper just keeps `background.paper`, which is the same token as `surface.main`. The role rules are registered before the role + level rules so the more specific one wins. Note `surface`/`level` do reach the DOM as inert attributes — MUI gives no theme-level `shouldForwardProp` hook.

`InitColorSchemeScript attribute="class" defaultMode="system"` (root layout) must match the `ThemeProvider defaultMode` to prevent SSR flicker. A user color-theme override is wired through `ThemeClientProvider` + `color-theme-context.tsx`. Client Components checking dark mode must use `useColorScheme()` (not `useTheme().palette.mode`) — CSS variables mode doesn't re-render via `useTheme`. Pattern: `const { mode, systemMode } = useColorScheme(); const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'`. Requires `'use client'`.

### Next.js Config

`next.config.ts`: `cacheComponents: true` (component-level caching / PPR), `turbopack.root` set to the parent dir, `images.remotePatterns` allows the Supabase storage host (`ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/**`). `images.unoptimized: true` bypasses Vercel's `/_next/image` optimizer — it returns `402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED` in production once the plan's image-optimization quota is exhausted, which broke every optimized thumbnail while the source files served fine (200) from Supabase; `next/image` now emits a plain `<img>` and the `optimized` prop on the eureka cards is a no-op.

## Claude Automations

Configured in `.claude/settings.json`:

- **PostToolUse hooks** — after every Edit/Write: `prettier --write` + `eslint --fix` on **just the edited file** (~1.1s, blocking; skips non-source extensions), plus a project-wide `yarn tsc --noEmit` marked `"async": true` so the typecheck reports without blocking the loop. Don't revert these to the whole-repo `yarn format && yarn lint:fix` — that ran `prettier --write .` over 488 files on every single edit (~13s each).
- **PreToolUse hook** — blocks edits to any `.env` file
- **`/new-data-hook` skill** — scaffolds `hooks/data/` files with the correct `use cache` vs React `cache()` pattern
- **`/format-fix` skill** — runs format/lint/tsc and fixes remaining issues
- **`/git-workflow` skill** — branch/PR/merge workflow plus Vercel & Supabase CLI gotchas
- **`a11y-reviewer` subagent** — audits MUI components for WCAG 2.1 AA violations
- Stripe skills (`stripe-best-practices`, `upgrade-stripe`) and `ui-ux-pro-max` are installed
- Enabled plugins: frontend-design, commit-commands, typescript-lsp, supabase, vercel

## Git & Deployment

**Never push directly to `main`** — it's protected (PR + 1 approving review + Vercel status check; force push and deletion blocked). Always branch before committing.

**Never push to a branch whose PR is already merged.** A squash-merge captures only the commits that existed at merge time, so a later push silently strands that work outside `main`. Branch from `main` and cherry-pick instead. The `.githooks/pre-push` hook enforces this.

Full workflow details — the merge-race guard, `/merge-pr` and PR locking, `git cleanup-merged`, per-clone hook setup, and the Vercel/Supabase CLI gotchas (including the benign red "Supabase Preview" check) — are in the **`git-workflow` skill**. Load it before any commit, push, PR, merge, branch cleanup, deploy, or `supabase`/`vercel` CLI work.

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
