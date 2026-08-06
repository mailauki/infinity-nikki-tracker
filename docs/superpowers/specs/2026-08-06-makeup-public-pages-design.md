# Makeup public pages

Date: 2026-08-06

Builds the public `/makeup` index and `/makeup/[slug]` detail pages, replacing
the `ComingSoon` stub at `app/makeup/page.tsx`.

This is the direct follow-up to `2026-08-02-makeup-tables-design.md`, which
deferred exactly three things to later work. All three land here:

- the public `app/makeup/` pages,
- a makeup data provider / context,
- rendering the outfit association on makeup pages (the `outfit_set` FK).

## Starting point

The makeup domain is already built below the UI line:

- **Tables** — `makeup_sets`, `makeup_variants`, `makeup_categories`,
  `obtained_makeup`, with RLS and the `toggle_obtained_makeup` RPC
  (`supabase/migrations/20260802120000_add_makeup_tables.sql`).
- **Types** — `lib/types/makeup.ts`.
- **Transforms** — `hooks/makeup.ts`: `createMakeupSet()`, `isBaseMakeupSet()`,
  `buildObtainedMakeupKeySet()`, `isMakeupVariantObtained()`,
  `applyObtainedMakeupKeys()`.
- **Data hooks** — `hooks/data/makeup-sets.ts`, `makeup-variants.ts`,
  `makeup-categories.ts`, `obtained-makeup.ts`.
- **Admin CRUD** — the full `app/admin/makeup/{sets,variants}/` tree.

Two `MakeupSet` fields carry comments stating they are unpopulated "until the
public makeup pages wire up" — `makeup_categories` and `outfitSet`. This spec
wires both.

## Approach

Copy the outfits public UI and adapt it to makeup types, rather than
generifying the outfits components into shared ones.

The outfits grids (`virtual-set-grid.tsx`, `virtual-variant-grid.tsx`,
`virtual-grouped-grid.tsx`) encode hard-won layout knowledge: measured row-height
constants derived from specific component paddings, and a documented
resize-settle race (`RESIZE_SETTLE_MS`, plus the known overlapping-card flash
recorded in `2026-07-30-known-issue-standard-grid-flash.md`). Generifying them
would touch shipped, working outfits pages and risk regressing behavior that is
difficult to re-derive.

Copying keeps this PR additive — no shipped route changes — and lets makeup's
real differences diverge freely. The shared abstraction is deliberately deferred
until both domains' differences are visible in code; extracting it is a
follow-up, not a prerequisite.

This is a real duplication cost, accepted knowingly.

## Architecture

All new files are colocated under `app/makeup/`, per the project's colocation
rule. The one exception is the context, which is imported from two different
route subtrees and therefore belongs in `components/`.

```text
app/makeup/
  layout.tsx                     Suspense -> SortProvider -> MakeupDataProvider
                                 -> MakeupImageModeProvider
  page.tsx                       toolbar + results bar + filtered grid
  loading.tsx                    skeleton, mirroring app/outfits/loading.tsx
  actions.ts                     handleObtainedMakeup()
  makeup-data-provider.tsx       client provider: data fetch, filters, toggles
  makeup-toolbar.tsx             ToolbarSlot: image mode, sort, filter menu
  makeup-results-bar.tsx         result count + active filter chips
  filter-makeup.tsx              filter/sort application, grid selection
  makeup-set-card.tsx            one card per set (+ evolution state)
  makeup-variant-card.tsx        one card per variant
  makeup-group-header.tsx        group header row in the grouped view
  virtual-set-grid.tsx           copied, makeup-typed
  virtual-variant-grid.tsx       copied, makeup-typed
  virtual-grouped-grid.tsx       copied, makeup-typed
  deferred-measure-ref.ts        copied verbatim (domain-agnostic)
  [slug]/
    page.tsx                     server: getMakeupSet + auth, Suspense
    makeup-set-detail.tsx        evolution selection, filtering
    makeup-set-detail-card.tsx   hero card, links to paired outfit set
    makeup-evolution-variants.tsx per-category variant grid
    makeup-toggle-bar.tsx        evolution / category toggle row

components/makeup/
  makeup-context.tsx             MakeupDataContext + DEFAULT_MAKEUP_FILTERS
  makeup-image-mode-context.tsx  image vs alt image, + resolveMakeupImage()

app/api/makeup/
  route.ts                       bootstrap payload for the provider
```

### Data flow

Follows the established client data-provider model:

1. `app/makeup/layout.tsx` reads `getUserID()` and `getUserRole()` server-side,
   rendering the provider with `isLoggedIn` / `userId` / `isAdmin`.
2. `MakeupDataProvider` fetches `/api/makeup` and `/api/preferences` on mount.
3. The provider holds collection + filter state, exposes it via
   `MakeupDataContext`, and persists display preferences through
   `savePreferences()`.

`app/api/makeup/route.ts` calls `await connection()` **before** reading cookies
and **outside** the try/catch, so the prerender-abort signal propagates to React
instead of being swallowed as a 500. It then `Promise.all`s the React-`cache()`-
deduped hooks: `getMakeupSets()`, `getMakeupCategories()`, `getStyles()`,
`getLabels()`, and — only when `getUserID()` is non-null — `getObtainedMakeup()`.

`getUserID()` returns `null` for anonymous users, so the obtained fetch is
guarded rather than called with a null user id.

### Toggling

`app/makeup/actions.ts` exports:

```ts
handleObtainedMakeup(makeup_set: string, makeup_category: string, makeup_variant: string)
```

It guards on `getUserID()`, calls the existing `toggle_obtained_makeup` RPC, and
throws on error — mirroring `handleObtainedOutfit` in `app/outfits/actions.ts`.

Note the RPC deletes by `makeup_variant` alone, so the variant slug is the
identity key; `buildObtainedMakeupKeySet()` already keys on it.

Toggles are optimistic: `useTransition` in the provider, with a notistack
snackbar on failure and a state rollback.

## Divergences from outfits

These are the two places where makeup is genuinely not outfits. Everything else
is a mechanical type substitution.

### 1. Standalone pieces have no container row

Outfits stores a synthetic `standalone_pieces` set row in the database, so its
standalone bucket is just another set. Makeup has no such row — a standalone
piece is a variant with `makeup_set IS NULL`, carrying its own
title/rarity/style/label (per the table migration and
`app/admin/makeup/variants/actions.ts`).

`createMakeupSet()` gains a step: fold every set-less variant into a single
client-side pseudo-set.

- Slug: `standalone-pieces`. This slug never exists in `makeup_sets`.
- It is appended only when at least one set-less variant exists.
- It is pinned **last** in the grid regardless of sort axis or direction,
  matching the outfits treatment.
- Its card is **not navigable**. Pieces are toggled inline from the index.
  Because nothing links to `/makeup/standalone-pieces`, the `[slug]` route needs
  no special case — `getMakeupSet('standalone-pieces')` returns `null` and the
  route 404s, which is correct.
- Rarity filtering treats it as a mixed bag: keep the bucket when any piece
  matches, and within it show only matching pieces.

Because the pseudo-set is assembled inside `createMakeupSet()`, every consumer
(index grid, results bar, counts) sees it consistently without special-casing.

### 2. Every set has all five categories

Per commit `caf8edb8`, a makeup set always has all five categories; only
set-less variants differ. Consequences:

- The category filter is a **fixed five-way axis** read from
  `makeup_categories` (Base Makeup, Eyebrows, Eyelashes, Contact Lenses, Lips),
  not derived per-set from the variants present.
- `createMakeupSet()` populates the currently-always-`[]` `makeup_categories`
  field from the lookup table, removing that TODO.

### Outfit association

`makeup_sets.outfit_set` is an FK to `outfit_sets.slug`. `createMakeupSet()`
populates the currently-always-`null` `outfitSet` field, and
`makeup-set-detail-card.tsx` renders a link back to the paired outfit set. This
removes the second TODO and closes the third deferred item from the prior spec.

The reverse direction — showing the makeup association on outfit set detail
pages — stays out of scope here.

## Preferences

Filter axes are **session-only**: they live in provider state and reset on
reload. Only three cross-cutting display preferences persist:

| Column              | Default      |
| ------------------- | ------------ |
| `makeup_sort_axis`  | `'date'`     |
| `makeup_density`    | `'standard'` |
| `makeup_image_mode` | `'image'`    |

Adding a `user_preferences` column requires **five** lockstep code changes plus
the migration. All five are required for each of the three columns:

1. `supabase/migrations/<timestamp>_add_makeup_preferences.sql`
2. `DEFAULT_PREFERENCES` in `lib/preferences.ts`
3. The `UserPreferences` type in `lib/types/eureka.ts` — a `Pick<>` over
   `Tables<'user_preferences'>`, so the three slugs are added to the `Pick`
   union. This only compiles **after** `lib/types/supabase.ts` is regenerated
   from the pushed migration; regenerating is not optional here.
4. `hooks/data/preferences.ts` — the column list (the commonly missed one)
5. The save path (`lib/save-preferences.ts` / `app/actions/preferences.ts`)
   and the provider's read of it

Writes go through `savePreferences()` with the existing 500ms debounce. They
must **not** go through a cookie-setting Server Action, which would remount the
provider on every toggle.

New migration files only — never rewrite an existing migration timestamp once a
PR is open, or the Supabase preview branch check goes stale.

## Build sequence

1. Branch from `main` (not from the current outfits branch).
2. Migration for the three `makeup_*` preference columns; `supabase db push
--include-all`; regenerate `lib/types/supabase.ts`.
3. The five lockstep preference changes.
4. `components/makeup/makeup-context.tsx` and `makeup-image-mode-context.tsx`.
5. `hooks/makeup.ts` — extend `createMakeupSet()` for the standalone bucket,
   `makeup_categories`, and `outfitSet`.
6. `app/api/makeup/route.ts`.
7. `app/makeup/` — layout, provider, actions, loading.
8. Grids and cards (copy-adapt from `app/outfits/`).
9. `filter-makeup.tsx`, toolbar, results bar, `page.tsx`.
10. `[slug]/` detail page and its components.
11. `yarn tsc --noEmit`, `yarn lint`, `yarn build`.

## Verification

The repo has no test suite, so verification is:

- `yarn tsc --noEmit` passes with no errors.
- `yarn lint` passes.
- `yarn build` succeeds — this is the real check that no `use cache` /
  `cookies()` boundary was violated and that PPR does not try to prerender
  `/api/makeup`.
- Manual pass:
  - Logged out: `/makeup` renders read-only, no toggles, no console errors.
  - Logged in: toggling a variant persists across a hard reload.
  - The standalone bucket sorts last under every sort axis and direction, and
    disappears entirely when no set-less variants exist.
  - A set with evolutions deep-links correctly via `?evolution=`, with `base`
    resolving to the bare set slug.
  - The five-category filter matches the `makeup_categories` lookup.
  - A set with `outfit_set` set renders a working link to that outfit.
  - Sort axis, density, and image mode survive a reload; filter axes reset.

No claim of coverage beyond the above.

## Out of scope

- Extracting shared generic grid components from the outfits and makeup copies.
  Deliberately deferred until both domains' differences are visible in code.
- Persisting makeup filter axes.
- Rendering the makeup association on outfit set detail pages.
- `/momo-cloaks`, which remains a `ComingSoon` stub.
