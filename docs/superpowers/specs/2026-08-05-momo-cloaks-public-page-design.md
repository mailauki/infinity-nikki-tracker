# Public Momo's Cloaks Page — Design

**Date:** 2026-08-05
**Branch:** `claude/momo-cloaks-public-page`
**Status:** Approved

## Problem

`/momo-cloaks` renders `ComingSoon`. The entire Momo's Cloaks data layer already
exists and is unused by the public site:

- `hooks/data/momo-cloaks.ts` — `getMomoCloaks()`, `getMomoCloak(slug)`
- `hooks/data/obtained-momo-cloaks.ts` — `getObtainedMomoCloaks(user_id)`
- `app/momo-cloaks/actions.ts` — `handleObtainedMomoCloak(slug)`
- `lib/types/momo.ts` — `MomoCloak`, `MomoCloakRaw`, `ObtainedMomoCloak`
- `app/admin/momo-cloaks/` — complete admin CRUD

This is wiring work, not greenfield. Users can already have cloaks recorded via
admin, but have no way to browse or track them.

## Data shape (verified against production)

119 cloaks. All have a rarity; 118 of 119 have an image.

| Field             | Populated                             |
| ----------------- | ------------------------------------- |
| `rarity`          | 119 — values 3 (×3), 4 (×48), 5 (×68) |
| `seasons`         | 11 distinct                           |
| `season_category` | 3 distinct                            |
| `location`        | 2 distinct                            |
| `outfit_set`      | 41 of 119                             |
| `style`, `label`  | **0 — entirely empty**                |

Cloaks are flat: one row per cloak, no variants, categories, or evolutions.
`obtained` is a boolean, not a count.

## Scope

**In scope**

1. `/momo-cloaks` — filterable card grid of all 119 cloaks with obtained toggles
2. `/momo-cloaks/[slug]` — detail page
3. Filters: rarity, season, season category, obtained — persisted to `user_preferences`

**Out of scope**

- Sort controls (title-ascending only, as `getMomoCloaks()` already returns)
- Any change to `/makeup` (stays `ComingSoon`)
- Style/label filters — those columns are empty across all 119 rows

## Architecture

The domain is flat and small, so it takes the **Eureka-style** shape (layout +
provider + context), **not** the Outfits-style shape. No virtualization (119 rows
does not need it), no grouping, no density or image-mode controls.

### Preference writes must not use a Server Action

`app/actions/preferences.ts` carries an explicit warning, repeated in
`lib/save-preferences.ts` and `app/api/preferences/route.ts`:

> A Server Action that sets cookies — which the Supabase SSR client does whenever
> it refreshes a session — marks its response as revalidated. That invalidates the
> client router cache, which remounts the data provider and refires its fetch on
> every single preference toggle.

Therefore all cloak filter writes go through `savePreferences()` from
`lib/save-preferences.ts` → `POST /api/preferences`. Do **not** add cloak
preference actions to `app/actions/preferences.ts`.

## Database migration

`supabase/migrations/<timestamp>_momo_cloak_filter_preferences.sql` — four
nullable text columns on `user_preferences`:

```sql
alter table user_preferences
  add column if not exists momo_rarity_filter text,
  add column if not exists momo_season_filter text,
  add column if not exists momo_season_category_filter text,
  add column if not exists momo_obtained_filter text;
```

Nullable with no default, matching every existing filter column. No RLS change —
the existing per-user policies cover new columns.

### Lockstep updates (all four, or clients silently read `undefined`)

The route file states this requirement explicitly. A new preference column is not
usable until every one of these is updated:

1. `WRITABLE_KEYS` in `app/api/preferences/route.ts` — else writes are dropped
2. `PREFERENCE_COLUMNS` in `app/api/preferences/route.ts` — else reads return `undefined`
3. `DEFAULT_PREFERENCES` in `lib/preferences.ts` — else logged-out defaults are missing
4. `UserPreferences` in `lib/types/eureka.ts` — else no type coverage

Then regenerate `lib/types/supabase.ts`.

## Files

### New — colocated under `app/momo-cloaks/`

Per the colocation rule: single-route components live beside their `page.tsx`.

| File                           | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `layout.tsx`                   | Reads `getUserID()`, wraps provider in `Suspense` |
| `momo-cloak-data-provider.tsx` | Client provider: cloaks, obtained set, filters    |
| `momo-cloak-context.tsx`       | `useMomoCloakData()` context hook                 |
| `momo-cloak-toolbar.tsx`       | Four filter controls in a `FilterMenu`            |
| `filter-momo-cloaks.tsx`       | Filter pipeline + card grid                       |
| `loading.tsx`                  | Skeleton fallback                                 |
| `page.tsx`                     | **Replaces** `ComingSoon`                         |
| `[slug]/page.tsx`              | Detail route + `generateMetadata`                 |
| `[slug]/momo-cloak-detail.tsx` | Detail body built on `SetDetailCard`              |

### Modified

| File                           | Change                                               |
| ------------------------------ | ---------------------------------------------------- |
| `app/api/preferences/route.ts` | Add 4 keys to `WRITABLE_KEYS` + `PREFERENCE_COLUMNS` |
| `lib/preferences.ts`           | Add 4 defaults (all `null`)                          |
| `lib/types/eureka.ts`          | Add 4 fields to `UserPreferences`                    |
| `lib/types/supabase.ts`        | Regenerated                                          |
| `hooks/data/momo-cloaks.ts`    | Extend `getMomoCloak` to resolve `outfitSet`         |

### Reused unchanged

`SetCard`, `SetDetailCard`, `CardGrid`, `PageShell`, `RarityToggle`,
`ObtainedToggle`, `FilterMenu`, `ProgressChip`, `RarityStars`, `LoginAlert`,
`LazyImage`.

## Data flow

### Grid

1. `layout.tsx` reads `getUserID()` server-side, renders provider with `isLoggedIn`/`userId`
2. Provider fetches cloaks + obtained + preferences, holds them in state
3. Obtained state is a `Set<string>` of cloak slugs
4. `filter-momo-cloaks.tsx` applies the filter pipeline and renders `CardGrid`
5. Toggling a card optimistically mutates the `Set`, calls `handleObtainedMomoCloak`,
   and rolls back with a notistack error on failure (matching the eureka/outfit pattern)
6. Filter changes call `savePreferences({ momo_*: value })`

### Filter options

Season, season-category, and location option lists are derived from the distinct
values present on the already-loaded 119 rows — no additional lookup query.

Rarity options are `[3, 4, 5]`, passed explicitly. `RarityToggle` currently
hardcodes `[2, 3, 4, 5]`; since no cloak has rarity 2, that button would be
permanently dead. Add an optional `options` prop to `RarityToggle` defaulting to
the current `[2, 3, 4, 5]`, so existing callers are unaffected.

### Cards

`SetCard` is reused with `total={1}` and `obtained={0 | 1}`. Its internal check is
`obtained === total`, so a boolean maps cleanly with no card changes. Cards link
to `/momo-cloaks/[slug]`.

### Detail page

`getMomoCloak(slug)` exists but currently selects no join. `MomoCloak.outfitSet`
is typed and deliberately left unpopulated — `lib/types/momo.ts` notes it is
"not yet populated by the momo data hooks — optional so a future consumer gets a
compile-time signal instead of a silent null." This page is that consumer, so
`getMomoCloak` gains the `outfit_set` join resolving `{ slug, title, image_url }`.

`getMomoCloaks()` (the list) is left alone — the grid does not need the join, and
adding it there would cost a join across all 119 rows for no benefit.

Detail renders through `SetDetailCard`:

- `media` — cloak image via `LazyImage`
- `title`, `rarity`, `description` — direct from the row
- `obtained={0 | 1}`, `total={1}` — same boolean mapping as the card
- `extraRows` — season, season category, location, and (for the 41 that have one)
  a link to the associated outfit set
- `style`/`labels` omitted — those columns are empty for every cloak

Not found: `getMomoCloak` returns `null` for an unknown slug, so the page calls
`notFound()`.

## Logged-out behavior

Grid and detail render fully. No obtained toggles, no progress chip; a `LoginAlert`
is shown, matching Eureka and Outfits. Preference reads fall back to
`DEFAULT_PREFERENCES`; writes are skipped (`savePreferences` treats 401 as an
expected no-op).

## Error handling

- Cloak fetch failure → `ErrorAlert`, consistent with the other domains
- Obtained fetch failure → grid still renders, toggles disabled
- Toggle failure → optimistic state rolls back, notistack error
- Preference write failure → non-blocking; filters still apply in-session

## Testing

The repo has no test framework. Verification is:

1. `yarn tsc --noEmit`
2. `yarn lint`
3. `yarn build`
4. Manual `yarn dev` pass:
   - Logged out: grid renders, no toggles, `LoginAlert` shown, detail page works
   - Logged in: toggle persists across reload; each filter narrows correctly;
     filters survive a full page reload (confirms persistence);
     combined filters intersect; empty result state renders
   - Unknown slug → 404
   - Confirm no provider-remount refetch storm on filter toggle (the bug the
     `savePreferences` path exists to avoid) — watch the network tab

The migration is applied to a Supabase PR branch DB, never straight to production.

## Risks

| Risk                                                                  | Mitigation                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Missing one of the 4 lockstep preference updates → silent `undefined` | Enumerated above; verify by reloading with filters set                              |
| Cloak preference write added as a Server Action → refetch storm       | Documented; use `savePreferences()` only                                            |
| `RarityToggle` change breaking existing callers                       | New `options` prop defaults to current `[2, 3, 4, 5]`                               |
| Supabase preview check goes red on rebase                             | Known and benign per CLAUDE.md; add new migrations rather than rewriting timestamps |
