# Season slug page: toolbar, contents sidebar, and filter menu

Date: 2026-09-02
Status: proposed

## Problem

The season detail page (`/seasons/[slug]`) has a thinner toolbar than the pages
around it. It carries a back button, a visibility dropdown, and nothing else.

Three gaps:

1. **No alt-image or sort toggle**, although the seasons index has both and the
   season page renders the same image-mode-aware cards.
2. **No way to reach a category** without scrolling. A season holds up to 16
   category sections and several hundred cards.
3. **Visibility is a bespoke dropdown**, not the sidebar filter menu every other
   collection page uses, and it offers no density, obtained, rarity, or style
   axes.

## Goals

- Add alt-image and sort buttons, reusing the existing components.
- Add a contents sidebar acting as a clickable table of contents.
- Replace the visibility dropdown with a seasons branch of the shared
  `FilterMenu`, adding density plus obtained / rarity / style.
- Persist the new filter state per user.

## Non-goals

- Changing what the season page counts or renders. The recent counting work
  (PR #346) stands; this is presentation and filtering only.
- Touching `/outfits` behaviour. Season filter state is season-scoped
  throughout (see Decisions).
- A filter on the seasons **index**. Only the slug page.

## Decisions

### Season-scoped preference columns, not shared with outfits

The evolution and glow-up toggles could have reused `outfit_hide_evolutions` /
`outfit_hide_glowups`, which already exist and already have UI. They are not
reused, deliberately.

Those columns default to `false` (shown). The season page defaults evolutions
and glow-ups to **hidden** — shipped in `3b29bfe`, because an evolution is
another state of a set the season already lists rather than another thing to
collect. Reusing the shared columns would silently revert that, and flipping the
shared default to fix it would change `/outfits` too.

So the season page gets its own five hide-columns with its own defaults —
including `season_hide_base_sets`, which the current provider already has as
session state and which has no outfit equivalent. The cost is three extra
columns over the reuse option; the benefit is that the two pages can disagree
about defaults, which they already do.

### One boolean column per flag

Matching the existing `outfit_hide_glowups` format, as requested, rather than a
single `season_hidden_kinds text[]`. More columns, but consistent with the
established shape and directly greppable.

### Filtering is applied after grouping

`groupSeasonEntries` currently takes only hide-flags, which gate whole kinds.
Obtained / rarity / style select _within_ a kind, so they are applied as a
predicate over the grouped entries rather than threaded into the expansion
functions. One predicate covers outfit sets, outfit pieces, and makeup pieces
uniformly, and every count downstream follows because the counts already derive
from the same entry list.

Empty categories are dropped after filtering, so a category whose every card is
filtered out does not render an empty grid.

### The seasons branch lives in its own file

`components/filter/filter-menu.tsx` is 696 lines with two large branches. The
seasons branch goes in `components/filter/season-filter-body.tsx`, with
`FilterMenu` delegating to it. This keeps the change from making an
already-oversized file worse.

## Schema

One migration, nine columns:

```sql
ALTER TABLE user_preferences
  ADD COLUMN season_hide_evolutions  boolean NOT NULL DEFAULT true,
  ADD COLUMN season_hide_glowups     boolean NOT NULL DEFAULT true,
  ADD COLUMN season_hide_pieces      boolean NOT NULL DEFAULT false,
  ADD COLUMN season_hide_makeup      boolean NOT NULL DEFAULT false,
  ADD COLUMN season_hide_base_sets   boolean NOT NULL DEFAULT false,
  ADD COLUMN season_density          text,
  ADD COLUMN season_obtained_filter  text,
  ADD COLUMN season_rarity_filter    text,
  ADD COLUMN season_style_filter     text;
```

The two `true` defaults preserve today's behaviour. `season_style_filter` is
comma-joined text, matching `outfit_style_filter`.

### Five lockstep updates per column

Adding a `user_preferences` column requires five changes. Miss one and clients
read `undefined` with no error:

1. `WRITABLE_KEYS` in `app/api/preferences/route.ts`
2. `PREFERENCE_COLUMNS` in the same file
3. `DEFAULT_PREFERENCES` in `lib/preferences.ts`
4. The `UserPreferences` type in `lib/types/eureka.ts`
5. The select string in `hooks/data/preferences.ts` — a separate server-side
   read path, and the one that gets skipped

## Components

### `SeasonFilterProvider` (rewritten)

Currently five `useState` booleans, session-only. Becomes the season equivalent
of `OutfitDataProvider`'s filter half:

- Hydrates from `getPreferences()` on mount.
- Persists through `savePreferences()` with a debounce and a `persistFailed`
  handler — **not** a Server Action. A cookie-setting action remounts the
  provider on every toggle.
- Holds the five hide-flags plus density, obtained, rarity, style.
- Exposes `onClearFilters()` and `hasActiveFilters`, matching the outfit shape.

### `season-filter-body.tsx` (new)

The sidebar panel body: `DensityToggle`, the five visibility toggles moved out
of the dropdown, `ObtainedToggle`, `RarityToggle`, `StyleLabelSelect`, plus
Clear all / Reset. All five widgets already exist.

### `season-contents.tsx` (new, colocated)

A `SidebarBody` rendering the season's categories as a clickable list. Derives
from the same `groupSeasonEntries` output `SeasonOutfitList` uses, so it stays
consistent with the visible sections under every toggle, and reuses
`CompositionCounts` for the per-row outfit/piece numbers — the same readout the
index cards show.

Each category section gets a stable `id`; a row scrolls to it with
`scrollIntoView({ behavior: 'smooth' })`.

### `SlugToolBar` (extended)

The existing `useSeasonFilterOptional()` guard gains a contents button and a
filter button; `showImageSwap` gains `/seasons/`, so `ImageModeButton` and
`SortButton` render from components that already exist. `SeasonVisibilityMenu`
is deleted.

Both panels share one sidebar: each button opens its own content, and opening
one replaces the other. `hasBody` is a count, so both can register.

## Data flow

```
user_preferences ──► getPreferences() ──► SeasonFilterProvider
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                 season-filter-body     SeasonOutfitList      season-contents
                   (writes prefs)      (groups + filters)      (same groups)
```

Both readers call `groupSeasonEntries` with identical inputs, so the sidebar
list and the rendered sections can never disagree.

## Testing

- `groupSeasonEntries` with each filter axis: obtained, rarity, style, and the
  combination — including that a category emptied by filtering is dropped.
- The preference round-trip: a hydrated provider reflects stored values, and a
  toggle writes the expected payload.
- Existing `season-entries` tests must keep passing unchanged — the filter
  parameters are optional, and omitting them preserves current behaviour.
- Browser check: both sidebar panels, the TOC scroll, and each toolbar button.

## Risks

- **The migration touches production `user_preferences`.** Apply to a Supabase
  preview branch and verify before promoting; do not apply straight to
  production.
- **Nine columns is a lot of lockstep surface.** Forty-five edit points across
  five files. A single missed entry fails silently, so each column is verified by
  reading a written value back.
- **Defaults change nothing today.** `season_hide_evolutions` and
  `season_hide_glowups` default `true` precisely so an existing user's first
  load matches what they see now.

## Order of work

1. Migration on a preview branch, plus the five lockstep updates per column.
2. `SeasonFilterProvider` state, hydration, persistence.
3. Filter predicate in `season-entries.ts`, with tests.
4. `season-filter-body.tsx` and the `FilterMenu` branch; delete
   `SeasonVisibilityMenu`.
5. `season-contents.tsx` and section ids.
6. Toolbar buttons.
