# Evolution Show-Toggles — Design

**Date:** 2026-07-14
**Status:** Approved

## Goal

Rework the outfit filter menu's Evolutions section so the category toggles and the
order-toggle work in tandem, and add the ability to show/hide **base** sets (currently
base is always shown, with no control).

## Background

Today the Evolutions section has three controls with inconsistent semantics:

- **`EvolutionOrderToggle`** — exclusive toggle group (1=base, 2-5=evolutions, ✨=glow-up);
  `selectedEvolution` picks ONE order to show exclusively, `null` = all.
- **`EvolutionToggle`** — a HIDE toggle: when on, hides all non-base evolutions.
- **`GlowupToggle`** — a HIDE toggle: when on, hides glow-ups.

`isEvolutionVisible({ stateSlug, baseSlug, isGlowupState, hideEvolutions, hideGlowups })`:
base always visible; glow-up hidden if `hideGlowups`; other evolutions hidden if
`hideEvolutions`.

Problems: the order-toggle "shows one" while the other two "hide", and **base can never
be hidden**.

Persistence today: `outfit_hide_evolutions` / `outfit_hide_glowups` boolean columns on
`user_preferences` (both default `false`), written via `updateOutfitHideEvolutions` /
`updateOutfitHideGlowups`.

## Decisions

- **Model:** three additive SHOW-toggles — **Show Base**, **Show Evolutions**,
  **Show Glow-ups** — each independently enabling a category. The **order-toggle**
  narrows WITHIN the enabled categories and only renders buttons for currently-shown
  categories.
- **Order vs category conflict:** impossible by construction — the order-toggle only
  offers orders whose category is shown. When a selected order's category is turned off,
  reset `selectedEvolution` to `null`.
- **All-off:** honored literally — the grid shows the existing "No results" empty state.
- **Persistence:** three NEW boolean columns `outfit_show_base` / `outfit_show_evolutions`
  / `outfit_show_glowups` (default `true`); DROP the two `outfit_hide_*` columns (nothing
  else reads them). Additive-then-drop migration + type regen.
- **Icons:** reuse `/icons/evolution.png` and `/icons/glowup.png` for those two toggles;
  the base toggle uses the MUI `LooksOne` icon (base = order 1, matching the order-toggle;
  no base image asset exists in `public/icons/`).
- **Default:** all three show-flags `true` (everything visible), matching today's default
  (nothing hidden).

## Scope note — seasons filter is OUT of scope (follow-up)

The seasons pages (`app/outfits/seasons/[slug]/`) have a SEPARATE, parallel filter
subsystem: `season-filter-context.tsx` holds its own `hideEvolutions`/`hideGlowups`
(local `useState`, no persistence, no order-toggle, no base control), consumed by
`season-outfit-list.tsx` + `season-progress.tsx` and rendered via `slug-toolbar.tsx`
(which imports `EvolutionToggle`/`GlowupToggle`).

**This design does NOT touch the seasons subsystem.** Consequently:

- `EvolutionToggle` and `GlowupToggle` are **NOT deleted** — the seasons path
  (`slug-toolbar.tsx`) still renders them against `useSeasonFilterOptional()`.
- `isEvolutionVisible` must keep serving BOTH the new show-based main-outfits call sites
  AND the still-hide-based seasons call sites. It is therefore given a show-based
  signature, and the two seasons call sites (`season-outfit-list.tsx` expandSet, invoked
  by `season-progress.tsx`) are adapted to pass the inverted values
  (`showEvolutions: !hideEvolutions`, `showGlowups: !hideGlowups`, `showBase: true` —
  base is always shown on the seasons pages, unchanged from today). This is a mechanical,
  behavior-preserving adaptation of the seasons callers, NOT a rework of the seasons UI.
- `outfit-toolbar.tsx` (main outfits, uses `useOutfitData`) switches to the real
  show-flags.

Bringing the seasons UI to full show-toggle + base parity is a separate follow-up.

## Semantics

`isEvolutionVisible` rewritten to show-logic:

```ts
isEvolutionVisible({
  stateSlug, baseSlug, isGlowupState, showBase, showEvolutions, showGlowups,
}): boolean {
  if (stateSlug === baseSlug) return showBase
  if (isGlowupState) return showGlowups
  return showEvolutions
}
```

All FOUR call sites must be updated to the new signature:

1. `app/outfits/filter-outfits.tsx` — `scopedVariants` filter (~line 142)
2. `app/outfits/filter-outfits.tsx` — standard-density `OutfitSetCard` `shouldHide` (~line 274)
3. `app/outfits/outfit-toolbar.tsx` — `scoped` filter (~line 50); source the real show-flags from `useOutfitData()`
4. `app/outfits/seasons/[slug]/season-outfit-list.tsx` — `expandSet` (~line 31); pass `showBase: true, showEvolutions: !hideEvolutions, showGlowups: !hideGlowups` (behavior-preserving; seasons keeps its hide-based context untouched)

Order-toggle `availableOrders` is filtered by the show-flags before being passed in:

- order `1` (base) offered only when `showBase`
- orders `2..5` (evolutions) offered only when `showEvolutions`
- order `0` (glow-up) offered only when `showGlowups`

When `selectedEvolution` refers to an order no longer offered, reset it to `null`
(mirrors the existing density→category reconciliation effect in `filter-menu.tsx`).

## Components / Changes

### 1. New `EvolutionShowToggle` — `components/filter/evolution-show-toggle.tsx`

Replaces `EvolutionToggle` + `GlowupToggle` with one control: a row of three
`ToggleButton`s (not exclusive — each is an independent on/off), each `selected` when its
category is shown:

- Base — `LooksOne` MUI icon, tooltip "Show Base"
- Evolutions — `ToggleIcon image="/icons/evolution.png"`, tooltip "Show Evolutions"
- Glow-ups — `ToggleIcon image="/icons/glowup.png"`, tooltip "Show Glow-ups"

Props: `{ showBase, showEvolutions, showGlowups, onShowBaseChange, onShowEvolutionsChange,
onShowGlowupsChange }` (each `boolean` / `() => void`).

`ToggleIcon`'s `isSelected` should reflect the SHOWN (selected) state — note this inverts
the old usage, where `isSelected={hideEvolutions}` meant "hidden". Now
`isSelected={showEvolutions}`.

`EvolutionToggle` and `GlowupToggle` are **kept** (the seasons `slug-toolbar.tsx` still
renders them). `EvolutionShowToggle` is used only by `filter-menu.tsx`.

### 2. `EvolutionOrderToggle` — `components/filter/evolution-order-toggle.tsx`

No prop-shape change. It already filters `EVOLUTION_ORDERS` by `availableOrders` and shows
glow-up (0) only when present. Caller now passes an `availableOrders` already narrowed by
the show-flags. The `disabled` prop (currently `hideEvolutions && hideGlowups`) becomes
`!showBase && !showEvolutions && !showGlowups` (nothing shown → order-toggle disabled).

### 3. `isEvolutionVisible` — `hooks/outfit.ts`

Rewrite signature + body per **Semantics** above. Update ALL FOUR call sites listed in the
Semantics section (2× filter-outfits, outfit-toolbar, season-outfit-list — the last passes
inverted seasons values).

### 4. Context — `components/outfits/outfit-context.tsx`

`OutfitDataContextValue`: replace

```ts
hideEvolutions: boolean
hideGlowups: boolean
onHideEvolutionsChange: () => void
onHideGlowupsChange: () => void
```

with

```ts
showBase: boolean
showEvolutions: boolean
showGlowups: boolean
onShowBaseChange: () => void
onShowEvolutionsChange: () => void
onShowGlowupsChange: () => void
```

(defaults in `createContext`: all `true`, handlers no-op).

### 5. Provider — `app/outfits/outfit-data-provider.tsx`

- State: replace `hideEvolutions`/`hideGlowups` with `showBase`/`showEvolutions`/
  `showGlowups` (init from `DEFAULT_PREFERENCES`).
- Hydrate: read `prefs.outfit_show_base` / `outfit_show_evolutions` / `outfit_show_glowups`.
- Handlers: `handleShowBaseChange` / `…Evolutions` / `…Glowups` toggle + persist via new
  actions.
- `onClearFilters`: reset the three to `DEFAULT_PREFERENCES.outfit_show_*` (all `true`) and
  persist.
- Context value: supply the new fields/handlers.

### 6. Filter menu — `components/filter/filter-menu.tsx`

- Read the three show-flags + handlers from `useOutfitData()`.
- **Restore the dynamic `availableOrders` computation** (currently hardcoded to
  `[2, 3, 4, 0]` on this branch as a WIP edit, with the original commented out). The
  restored version derives orders from the data AND includes base:
  ```ts
  const availableOrders = [
    1, // base is always a possible order
    ...new Set(outfitSets.flatMap((s) => s.evolutions).map((e) => e.order)),
  ]
  ```
  Then filter by the show-flags: keep `1` only if `showBase`, keep `2..5` only if
  `showEvolutions`, keep `0` only if `showGlowups`. Pass the filtered result to
  `EvolutionOrderToggle`. (The order-toggle already renders base=1 when `availableOrders`
  includes it, and glow-up=0 only when present.)
- Render `EvolutionShowToggle` in place of the `EvolutionToggle` + `GlowupToggle` pair.
- Pass the filtered `availableOrders` and the new `disabled` expression to
  `EvolutionOrderToggle`.
- Add a reconciliation `useEffect` (mirroring the existing density→category one): when
  `selectedEvolution` is not in the filtered `availableOrders`, call
  `onOutfitFiltersChange({ selectedEvolution: null })`.
- `hasActiveFilters`: replace `hideEvolutions || hideGlowups` with
  `!showBase || !showEvolutions || !showGlowups` (any category hidden = active).

### 7. Filter application — `app/outfits/filter-outfits.tsx`

- Destructure `showBase`/`showEvolutions`/`showGlowups` from `useOutfitData()`.
- Pass them into both `isEvolutionVisible(...)` call sites.

### 8. Persistence — DB migration

`supabase/migrations/<timestamp>_evolution_show_toggles.sql`:

```sql
alter table public.user_preferences
  add column if not exists outfit_show_base boolean not null default true,
  add column if not exists outfit_show_evolutions boolean not null default true,
  add column if not exists outfit_show_glowups boolean not null default true;

alter table public.user_preferences
  drop column if exists outfit_hide_evolutions,
  drop column if exists outfit_hide_glowups;
```

Wire-up:

- `lib/preferences.ts` `DEFAULT_PREFERENCES`: remove `outfit_hide_evolutions` /
  `outfit_hide_glowups`; add `outfit_show_base: true`, `outfit_show_evolutions: true`,
  `outfit_show_glowups: true`.
- `lib/types/eureka.ts` `UserPreferences` Pick: swap the two hide keys for the three show
  keys.
- `hooks/data/preferences.ts` `.select()`: swap the columns.
- `app/actions/preferences.ts`: remove `updateOutfitHideEvolutions` /
  `updateOutfitHideGlowups`; add `updateOutfitShowBase` / `updateOutfitShowEvolutions` /
  `updateOutfitShowGlowups` (each `upsertUserPreference({ outfit_show_*: value })`).
- Regenerate `lib/types/supabase.ts`.

## Out of Scope (YAGNI)

- No "hide only base" quick-action beyond the toggle itself.
- No auto-enabling a category from the order-toggle (rejected — order only drills within
  shown categories).
- No animation/transition changes.

## Backward Compatibility

The two dropped `outfit_hide_*` columns default `false` today (= nothing hidden = show
all). The new columns default `true` (= show all). So existing users' effective behavior
is unchanged (everything visible) after migration — their old hide-values are discarded,
which is acceptable since `false`/`false` maps exactly to the new all-`true` default.

## Testing / Verification

- `yarn tsc --noEmit` clean; `yarn lint` clean.
- Drive the app (outfits page): the Evolutions section shows three show-toggles + the
  order-toggle. Verify:
  - Toggling Show Evolutions off hides orders 2-5 in BOTH the grid and the order-toggle;
    same for Show Glow-ups (✨) and Show Base (1).
  - Selecting an order then hiding its category resets the order selection to "all".
  - All three off → "No results" empty state.
  - "Clear all" restores all three to on.
  - Selections persist across reload (logged in).
- Confirm both density modes (standard card view + compact) honor the show-flags.
